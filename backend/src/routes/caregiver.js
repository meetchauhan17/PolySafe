'use strict';

/**
 * /caregiver — Caregiver-accessible patient data (permission-restricted)
 *
 * Permission Matrix (Caregiver):
 *   ✅ Risk status: SAFE / CAUTION / CRITICAL
 *   ✅ Today's medicine schedule (time + generic dosage label, NO full drug name)
 *   ❌ Full medicine names or details
 *   ❌ Symptom logs
 *   ❌ Full Risk Explanation Detail (clinical/plain explanations)
 *   ❌ Interaction flag history
 *
 * GET /caregiver/patient-summary/:patientId
 */

const express = require('express');
const prisma  = require('../lib/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Deterministic time slots (mirrors patient route)
const TIME_SLOTS = ['08:00 AM', '12:00 PM', '06:00 PM', '09:00 PM'];

// ─── Helper: verify approved caregiver connection ─────────────────────────────
async function verifyApprovedCaregiverConnection(caregiverUserId, patientId) {
  return prisma.connection.findFirst({
    where: {
      connectedUserId: caregiverUserId,
      patientId,
      role:   'CAREGIVER',
      status: 'APPROVED',
    },
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /caregiver/patient-summary/:patientId
//
// Returns ONLY:
//   • status:       "SAFE" | "CAUTION" | "CRITICAL"
//   • flagCount:    number of active interaction flags (no details)
//   • schedule:     today's medicine schedule — time, dosage label, and
//                   a generic type label ONLY ("Prescription · 5mg" not "Warfarin 5mg")
//                   Per the permission matrix caregivers do NOT see full medicine names.
//   • burdenLevel:  "Normal" | "Moderate" | "Critical" (aggregate only)
//   • medicineCount: total number of medicines
// ═════════════════════════════════════════════════════════════════════════════
router.get('/patient-summary/:patientId', auth, async (req, res) => {
  const { userId }    = req.user;
  const { patientId } = req.params;

  try {
    // 1. Verify an approved caregiver connection exists
    const connection = await verifyApprovedCaregiverConnection(userId, patientId);
    if (!connection) {
      return res.status(403).json({
        error: 'No approved caregiver connection to this patient. Ask the patient to invite you.',
      });
    }

    // 2. Load patient data — only what we're permitted to return
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicines: {
          where: { removedAt: null },
          orderBy: { dateAdded: 'asc' },
          select: {
            id:       true,
            type:     true,   // PRESCRIPTION | OTC | HERBAL — shown as generic label
            dosage:   true,   // dosage label (e.g. "5mg") — shown without drug name
            // NOTE: name is intentionally NOT selected per permission matrix
          },
        },
        interactionFlags: {
          select: { id: true, severity: true }, // count + worst severity ONLY — no explanations
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const { medicines, interactionFlags } = patient;

    // 3. Derive status
    const hasCritical = interactionFlags.some((f) =>
      ['Contraindicated', 'Major'].includes(f.severity)
    );
    const hasCaution  = interactionFlags.length > 0;
    const status      = hasCritical ? 'CRITICAL' : hasCaution ? 'CAUTION' : 'SAFE';

    // 4. Build today's schedule — GENERIC labels only, no medicine names
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    const schedule = medicines.map((med, idx) => {
      // Generic type label per permission matrix
      const typeLabel = med.type === 'PRESCRIPTION'
        ? 'Prescription medicine'
        : med.type === 'OTC'
        ? 'Over-the-counter medicine'
        : 'Herbal supplement';

      return {
        scheduleIndex: idx + 1,
        typeLabel,
        dosage: med.dosage ?? 'As prescribed',
        time:   TIME_SLOTS[idx % TIME_SLOTS.length],
        date:   today,
        // name is deliberately absent
      };
    });

    // 5. Worst severity for the status card
    const severityOrder = ['Contraindicated', 'Major', 'Moderate', 'Minor'];
    const worstSeverity = severityOrder.find((s) =>
      interactionFlags.some((f) => f.severity === s)
    ) ?? null;

    return res.status(200).json({
      status,
      medicineCount:  medicines.length,
      flagCount:      interactionFlags.length,
      worstSeverity,
      schedule,
      // Explicit omissions per permission matrix:
      // - No medicine names
      // - No symptom logs
      // - No clinical/plain explanations
      // - No full flag details
    });
  } catch (err) {
    console.error('[GET /caregiver/patient-summary]', err);
    return res.status(500).json({ error: 'Failed to load patient summary.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /caregiver/my-patients
// Returns all APPROVED patient connections for this caregiver
// (just enough to list them and pick one to view)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/my-patients', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const connections = await prisma.connection.findMany({
      where: {
        connectedUserId: userId,
        role:            'CAREGIVER',
        status:          'APPROVED',
      },
      include: {
        patient: {
          select: {
            id: true,
            age: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      patients: connections.map((c) => {
        const u = c.patient?.user;
        let patientName = u?.name;
        if (!patientName || patientName === 'PolySafe User') {
          if (u?.email) {
            const raw = u.email.split('@')[0];
            patientName = raw.replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          } else if (u?.phone) {
            patientName = `Patient ···${u.phone.slice(-4)}`;
          } else {
            patientName = c.patient?.age ? `Patient (Age ${c.patient.age})` : 'Family Member';
          }
        }
        return {
          connectionId: c.id,
          patientId:    c.patient.id,
          patientName,
          patientAge:   c.patient.age,
          connectedAt:  c.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error('[GET /caregiver/my-patients]', err);
    return res.status(500).json({ error: 'Failed to load patients.' });
  }
});

module.exports = router;
