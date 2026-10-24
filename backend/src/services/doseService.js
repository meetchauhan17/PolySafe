'use strict';

/**
 * backend/src/services/doseService.js
 *
 * Core Dose Tracking & Medication Adherence Service
 * ─────────────────────────────────────────────────────────────────────────────
 * • Logs doses (TAKEN | SKIPPED | MISSED)
 * • Computes daily schedule with status resolution
 * • Calculates rolling adherence percentage and streak
 * • Emits real-time Socket.IO `dose_logged` events to patient & caregiver rooms
 * • Background job to detect and mark overdue doses as MISSED
 */

const prisma = require('../lib/prisma');

const DEFAULT_SLOTS = [
  { key: 'morning', label: 'Morning', time: '08:00 AM', hour: 8, minute: 0 },
  { key: 'afternoon', label: 'Midday', time: '12:00 PM', hour: 12, minute: 0 },
  { key: 'evening', label: 'Evening', time: '06:00 PM', hour: 18, minute: 0 },
  { key: 'bedtime', label: 'Bedtime', time: '09:00 PM', hour: 21, minute: 0 },
];

/**
 * Helper: Emits `dose_logged` event to patient room and all approved caregiver rooms.
 */
async function emitDoseLogged(io, patientId, payload) {
  if (!io) return;
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, userId: true },
    });

    const rooms = new Set();
    if (patient) {
      rooms.add(`patient-${patient.id}`);
      if (patient.userId) rooms.add(`patient-${patient.userId}`);
    }

    // Approved caregivers
    const connections = await prisma.connection.findMany({
      where: {
        patientId,
        role: 'CAREGIVER',
        status: 'APPROVED',
      },
      select: { connectedUserId: true },
    });

    connections.forEach((c) => {
      if (c.connectedUserId) {
        rooms.add(`caregiver-${c.connectedUserId}`);
      }
      rooms.add(`caregiver-patient-${patientId}`);
    });

    let emitter = io;
    rooms.forEach((r) => {
      emitter = emitter.to(r);
    });

    emitter.emit('dose_logged', {
      patientId,
      ...payload,
      timestamp: new Date().toISOString(),
    });

    console.log(`[doseService] Emitted dose_logged to rooms:`, Array.from(rooms));
  } catch (err) {
    console.warn('[doseService] emitDoseLogged error:', err.message);
  }
}

/**
 * Log or update a dose (TAKEN | SKIPPED | MISSED)
 */
async function logDose({ patientId, medicineId, scheduledFor, status, takenAt, io }) {
  if (!['TAKEN', 'SKIPPED', 'MISSED'].includes(status)) {
    throw new Error('Invalid status. Must be TAKEN, SKIPPED, or MISSED.');
  }

  const schedDate = scheduledFor ? new Date(scheduledFor) : new Date();

  // Find existing log within 30 minutes of scheduledFor for this medicine
  const windowStart = new Date(schedDate.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(schedDate.getTime() + 30 * 60 * 1000);

  const existing = await prisma.doseLog.findFirst({
    where: {
      patientId,
      medicineId,
      scheduledFor: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
  });

  const takenTime = status === 'TAKEN' ? (takenAt ? new Date(takenAt) : new Date()) : null;

  let doseLog;
  if (existing) {
    doseLog = await prisma.doseLog.update({
      where: { id: existing.id },
      data: {
        status,
        takenAt: takenTime,
        scheduledFor: schedDate,
      },
      include: { medicine: { select: { id: true, name: true, dosage: true, type: true } } },
    });
  } else {
    doseLog = await prisma.doseLog.create({
      data: {
        patientId,
        medicineId,
        scheduledFor: schedDate,
        status,
        takenAt: takenTime,
      },
      include: { medicine: { select: { id: true, name: true, dosage: true, type: true } } },
    });
  }

  // Real-time broadcast
  await emitDoseLogged(io, patientId, {
    doseLogId: doseLog.id,
    medicineId: doseLog.medicineId,
    status: doseLog.status,
    scheduledFor: doseLog.scheduledFor,
    takenAt: doseLog.takenAt,
    dosage: doseLog.medicine?.dosage,
  });

  return doseLog;
}

/**
 * Get all doses for a specific date (scheduled and logged)
 */
async function getDosesForDate({ patientId, dateStr }) {
  // Parse date string YYYY-MM-DD or default to today
  let y, m, d;
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    [y, m, d] = dateStr.split('-').map(Number);
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
    d = now.getDate();
  }

  const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

  // 1. Fetch active medicines
  const medicines = await prisma.medicine.findMany({
    where: { patientId, removedAt: null },
    orderBy: { dateAdded: 'asc' },
  });

  // 2. Fetch all dose logs on this date
  const logs = await prisma.doseLog.findMany({
    where: {
      patientId,
      scheduledFor: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: { medicine: true },
  });

  const now = new Date();
  const isFast = process.env.DEMO_DOSE_TIMING === 'fast';
  const overdueMs = isFast ? 60 * 1000 : 60 * 60 * 1000; // 1 min in demo, 60 min normal

  // 3. Map schedule slots
  const doses = medicines.map((med, idx) => {
    const slot = DEFAULT_SLOTS[idx % DEFAULT_SLOTS.length];
    const scheduledDateTime = new Date(Date.UTC(y, m - 1, d, slot.hour, slot.minute, 0, 0));

    // Match with any logged DoseLog for this medicine and slot
    const matchedLog = logs.find(
      (l) =>
        l.medicineId === med.id &&
        Math.abs(new Date(l.scheduledFor).getTime() - scheduledDateTime.getTime()) < 60 * 60 * 1000
    );

    let status = 'SCHEDULED';
    let takenAt = null;
    let logId = null;

    if (matchedLog) {
      status = matchedLog.status;
      takenAt = matchedLog.takenAt;
      logId = matchedLog.id;
    } else if (now.getTime() - scheduledDateTime.getTime() > overdueMs) {
      status = 'MISSED';
    }

    return {
      id: logId || `sched-${med.id}-${slot.key}`,
      doseLogId: logId,
      medicineId: med.id,
      name: med.name,
      dosage: med.dosage || 'Prescribed dose',
      type: med.type,
      harmLevel: med.harmLevel || 3,
      foodInstruction: med.foodInstruction || 'With water',
      slotKey: slot.key,
      slotLabel: slot.label,
      time: slot.time,
      scheduledFor: scheduledDateTime.toISOString(),
      takenAt: takenAt ? takenAt.toISOString() : null,
      status, // TAKEN | SKIPPED | MISSED | SCHEDULED
    };
  });

  const totalDoses = doses.length;
  const takenCount = doses.filter((d) => d.status === 'TAKEN').length;
  const skippedCount = doses.filter((d) => d.status === 'SKIPPED').length;
  const missedCount = doses.filter((d) => d.status === 'MISSED').length;
  const pendingCount = doses.filter((d) => d.status === 'SCHEDULED').length;

  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    doses,
    summary: {
      total: totalDoses,
      taken: takenCount,
      skipped: skippedCount,
      missed: missedCount,
      pending: pendingCount,
      adherencePercentage: totalDoses > 0 ? Math.round((takenCount / Math.max(1, takenCount + missedCount)) * 100) : 100,
    },
  };
}

/**
 * Get rolling adherence percentage and streak over the past N days (e.g. 7 or 56 days)
 */
async function getAdherence({ patientId, days = 7 }) {
  const numDays = Math.max(1, Math.min(Number(days) || 7, 60)); // limit between 1 and 60 days
  const now = new Date();

  const dailyHistory = [];
  let totalTaken = 0;
  let totalMissed = 0;
  let totalSkipped = 0;
  let totalScheduled = 0;

  // Compute for each day in range (from oldest to newest)
  for (let i = numDays - 1; i >= 0; i--) {
    const target = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = target.toISOString().slice(0, 10);
    const daySummary = await getDosesForDate({ patientId, dateStr });

    totalTaken += daySummary.summary.taken;
    totalMissed += daySummary.summary.missed;
    totalSkipped += daySummary.summary.skipped;
    totalScheduled += daySummary.summary.total;

    dailyHistory.push({
      date: daySummary.date,
      total: daySummary.summary.total,
      taken: daySummary.summary.taken,
      skipped: daySummary.summary.skipped,
      missed: daySummary.summary.missed,
      adherencePercentage: daySummary.summary.adherencePercentage,
    });
  }

  // Overall Adherence %: taken / (taken + missed) or taken / total
  const relevantDoses = totalTaken + totalMissed;
  const adherencePercentage =
    relevantDoses > 0
      ? Math.round((totalTaken / relevantDoses) * 100)
      : totalScheduled > 0
      ? Math.round((totalTaken / totalScheduled) * 100)
      : 100;

  // Streak: Count consecutive days ending today where missedCount === 0 and taken > 0
  let streakDays = 0;
  for (let i = dailyHistory.length - 1; i >= 0; i--) {
    const day = dailyHistory[i];
    if (day.missed === 0 && day.taken > 0) {
      streakDays++;
    } else if (i === dailyHistory.length - 1 && day.missed === 0) {
      // today has no missed doses yet, continue checking previous days
      continue;
    } else {
      break;
    }
  }

  return {
    days: numDays,
    adherencePercentage,
    streakDays,
    totalScheduled,
    takenCount: totalTaken,
    skippedCount: totalSkipped,
    missedCount: totalMissed,
    dailyHistory,
  };
}

/**
 * Background Overdue Dose Sweeper:
 * Scans active patients and creates `status: 'MISSED'` DoseLog records for any
 * scheduled dose that is past due by >60 minutes (or >1 minute in DEMO_DOSE_TIMING=fast).
 */
async function checkOverdueDoses(io) {
  try {
    const isFast = process.env.DEMO_DOSE_TIMING === 'fast';
    const overdueMs = isFast ? 60 * 1000 : 60 * 60 * 1000;
    const now = new Date();

    const activePatients = await prisma.patient.findMany({
      include: {
        medicines: { where: { removedAt: null }, orderBy: { dateAdded: 'asc' } },
      },
    });

    const todayStr = now.toISOString().slice(0, 10);
    const [y, m, d] = todayStr.split('-').map(Number);

    for (const patient of activePatients) {
      if (!patient.medicines || patient.medicines.length === 0) continue;

      for (let idx = 0; idx < patient.medicines.length; idx++) {
        const med = patient.medicines[idx];
        const slot = DEFAULT_SLOTS[idx % DEFAULT_SLOTS.length];
        const scheduledTime = new Date(Date.UTC(y, m - 1, d, slot.hour, slot.minute, 0, 0));

        // Check if overdue
        if (now.getTime() - scheduledTime.getTime() > overdueMs) {
          // Check if already logged
          const existing = await prisma.doseLog.findFirst({
            where: {
              patientId: patient.id,
              medicineId: med.id,
              scheduledFor: {
                gte: new Date(scheduledTime.getTime() - 30 * 60 * 1000),
                lte: new Date(scheduledTime.getTime() + 30 * 60 * 1000),
              },
            },
          });

          if (!existing) {
            const created = await prisma.doseLog.create({
              data: {
                patientId: patient.id,
                medicineId: med.id,
                scheduledFor: scheduledTime,
                status: 'MISSED',
                takenAt: null,
              },
            });

            console.log(`[doseScheduler] Auto-marked dose as MISSED for patient ${patient.id}, medicine ${med.id}`);

            // Emit to patient and caregiver
            await emitDoseLogged(io, patient.id, {
              doseLogId: created.id,
              medicineId: med.id,
              status: 'MISSED',
              scheduledFor: scheduledTime,
              dosage: med.dosage,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[doseScheduler] checkOverdueDoses error:', err.message);
  }
}

module.exports = {
  logDose,
  getDosesForDate,
  getAdherence,
  checkOverdueDoses,
  emitDoseLogged,
  DEFAULT_SLOTS,
};
