const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  age: z
    .number({ required_error: 'Age is required.' })
    .int()
    .min(1, 'Age must be at least 1.')
    .max(120, 'Please enter a valid age.'),
  conditions: z
    .array(z.string().trim())
    .optional()
    .default([]),
  allergies: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),
});

// ─── Helper: validate body ────────────────────────────────────────────────────
function validate(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues ?? result.error.errors ?? [];
    res.status(400).json({ error: issues[0]?.message ?? 'Validation error.' });
    return null;
  }
  return result.data;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /patient/profile
// Protected — requires valid JWT (req.user.userId)
// Creates or updates the Patient row linked to the authenticated user.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/profile', auth, async (req, res) => {
  // Coerce age to number if sent as string from form
  const rawBody = {
    ...req.body,
    age: req.body.age !== undefined ? Number(req.body.age) : undefined,
    // Normalise allergies: accept either an array or a comma-separated string
    allergies: Array.isArray(req.body.allergies)
      ? req.body.allergies
      : typeof req.body.allergies === 'string' && req.body.allergies.trim()
      ? req.body.allergies
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : [],
  };

  const data = validate(profileSchema, rawBody, res);
  if (!data) return;

  const { userId } = req.user;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Upsert Patient — create if new, update if onboarding again (e.g., editing profile)
    const patient = await prisma.patient.upsert({
      where: { userId },
      create: {
        userId,
        age: data.age,
        conditions: data.conditions,
        allergies: data.allergies,
      },
      update: {
        age: data.age,
        conditions: data.conditions,
        allergies: data.allergies,
      },
    });

    return res.status(200).json({
      message: 'Patient profile saved.',
      patient: {
        id: patient.id,
        userId: patient.userId,
        age: patient.age,
        conditions: patient.conditions,
        allergies: patient.allergies,
      },
    });
  } catch (err) {
    console.error('[patient/profile]', err);
    res.status(500).json({ error: 'Failed to save patient profile. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /patient/profile
// Returns the authenticated patient's profile (used on page load to pre-fill).
// ═════════════════════════════════════════════════════════════════════════════
router.get('/profile', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: 'No patient profile found.' });
    }
    return res.status(200).json({ patient });
  } catch (err) {
    console.error('[patient/profile GET]', err);
    res.status(500).json({ error: 'Failed to fetch patient profile.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /patient/home-summary
// Returns:
//   • medicines  — full active medicine list
//   • schedule   — today's per-medicine schedule (derived, not stored)
//   • flags      — unresolved InteractionFlags
//   • status     — 'SAFE' | 'CAUTION'
// ═════════════════════════════════════════════════════════════════════════════

// Deterministic time-of-day slots derived from the medicine's dateAdded index.
// In a real v2 we would store a dosage schedule; for now this keeps the schema
// simple while still letting the UI show a meaningful "Today" section.
const TIME_SLOTS = ['08:00 AM', '12:00 PM', '06:00 PM', '09:00 PM'];

router.get('/home-summary', auth, async (req, res) => {
  const { userId } = req.user;

  try {
    // 1. Find the patient row
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        medicines: {
          where: { removedAt: null },
          orderBy: { dateAdded: 'asc' },
        },
        interactionFlags: {
          where: {
            medicineA: { removedAt: null },
            medicineB: { removedAt: null },
          },
          include: {
            medicineA: { select: { id: true, name: true, type: true, dosage: true } },
            medicineB: { select: { id: true, name: true, type: true, dosage: true } },
          },
          orderBy: { dateFlagged: 'desc' },
        },
      },
    });

    if (!patient) {
      // Patient has an account but hasn't completed onboarding yet — treat as
      // empty-state rather than an error.
      return res.status(200).json({
        status: 'SAFE',
        medicines: [],
        schedule: [],
        flags: [],
        patientId: null,
      });
    }

    const { medicines, interactionFlags } = patient;

    // 2. Derive "today's schedule" from the active medicine list
    //    Rule: cycle through TIME_SLOTS using the medicine's index in the list.
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const schedule = medicines.map((med, idx) => ({
      medicineId: med.id,
      name: med.name,
      dosage: med.dosage ?? 'As prescribed',
      type: med.type,
      time: TIME_SLOTS[idx % TIME_SLOTS.length],
      date: today,
    }));

    // 3. Determine overall status
    const status = interactionFlags.length > 0 ? 'CAUTION' : 'SAFE';

    return res.status(200).json({
      status,
      patientId: patient.id,
      patientAge: patient.age,
      medicines: medicines.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        dosage: m.dosage,
        standardizedCode: m.standardizedCode,
        dateAdded: m.dateAdded,
      })),
      schedule,
      flags: interactionFlags.map((f) => ({
        id: f.id,
        severity: f.severity,
        plainExplanation: f.plainExplanation,
        clinicalExplanation: f.clinicalExplanation,
        medicineA: f.medicineA,
        medicineB: f.medicineB,
        dateFlagged: f.dateFlagged,
      })),
    });
  } catch (err) {
    console.error('[patient/home-summary]', err);
    res.status(500).json({ error: 'Failed to load home summary.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /patient/timeline
// Returns all medicines for the authenticated patient in descending date order,
// each enriched with:
//   - source:        human-readable label (e.g. "Self-logged · Herbal" or "Connected Doctor")
//   - sourceRole:    "self" | "doctor" | "caregiver" | "pharmacist"
//   - discontinued:  boolean (true if soft-deleted)
//   - removedAt:     ISO timestamp if discontinued
//   - flags:         any InteractionFlags involving this medicine (id, severity, counterpartName)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/timeline', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(200).json({ medicines: [], total: 0 });
    }

    // Fetch all medicines (including discontinued for historical tracking) with addedByUser
    const medicines = await prisma.medicine.findMany({
      where:   { patientId: patient.id },
      orderBy: { dateAdded: 'desc' },
      include: {
        addedByUser: {
          select: { id: true, role: true, email: true, phone: true },
        },
        interactionFlagsAsA: {
          select: {
            id: true,
            severity: true,
            medicineB: { select: { id: true, name: true } },
          },
        },
        interactionFlagsAsB: {
          select: {
            id: true,
            severity: true,
            medicineA: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Build a lookup of accepted connections to resolve doctor labels
    // Connection.connectedUserId = doctor/caregiver userId
    const connections = await prisma.connection.findMany({
      where:  { patientId: patient.id, status: 'APPROVED' },
      select: { connectedUserId: true, role: true },
    });
    const connectedUserIds = new Set(connections.map((c) => c.connectedUserId));

    const payload = medicines.map((med) => {
      const adder = med.addedByUser;
      const isSelf = adder.id === userId;

      // Determine source label
      let sourceRole  = 'self';
      let sourceLabel = 'Self-logged';

      if (!isSelf) {
        const role = adder.role;
        if (role === 'DOCTOR') {
          sourceRole  = 'doctor';
          const identifier = adder.email
            ? `Dr. ${adder.email.split('@')[0]}`
            : adder.phone
            ? `Dr. ···${adder.phone.slice(-4)}`
            : 'Connected Doctor';
          sourceLabel = identifier;
        } else if (role === 'CAREGIVER') {
          sourceRole  = 'caregiver';
          sourceLabel = 'Caregiver';
        } else if (role === 'PHARMACIST') {
          sourceRole  = 'pharmacist';
          sourceLabel = 'Pharmacist';
        } else if (connectedUserIds.has(adder.id)) {
          sourceRole  = 'connected';
          sourceLabel = 'Connected User';
        }
      }

      // Attach the medicine type to source label for self-logged herbal/OTC
      if (isSelf && med.type !== 'PRESCRIPTION') {
        const typeLabel = med.type === 'HERBAL' ? 'Herbal / Supplement' : 'OTC';
        sourceLabel = `Self-logged · ${typeLabel}`;
      } else if (isSelf) {
        sourceLabel = 'Self-logged · Prescription';
      }

      // Collect all interaction flags for this medicine
      const flagsA = (med.interactionFlagsAsA || []).map((f) => ({
        flagId:         f.id,
        severity:       f.severity,
        counterpartId:  f.medicineB?.id,
        counterpartName: f.medicineB?.name,
      }));
      const flagsB = (med.interactionFlagsAsB || []).map((f) => ({
        flagId:         f.id,
        severity:       f.severity,
        counterpartId:  f.medicineA?.id,
        counterpartName: f.medicineA?.name,
      }));
      const allFlags = [...flagsA, ...flagsB];

      return {
        id:               med.id,
        name:             med.name,
        type:             med.type,
        dosage:           med.dosage,
        standardizedCode: med.standardizedCode,
        dateAdded:        med.dateAdded,
        removedAt:        med.removedAt,
        discontinued:     !!med.removedAt,
        sourceLabel,
        sourceRole,
        flagged:          !med.removedAt && allFlags.length > 0,
        flags:            allFlags,
      };
    });

    return res.status(200).json({
      medicines: payload,
      total:     payload.length,
    });
  } catch (err) {
    console.error('[GET /patient/timeline]', err);
    res.status(500).json({ error: 'Failed to load medication timeline.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /patient/insights
// Returns historical interaction flag trends and cumulative burden evolution over time.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/insights', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        medicines: {
          orderBy: { dateAdded: 'asc' },
        },
        interactionFlags: {
          include: {
            medicineA: { select: { id: true, name: true, type: true } },
            medicineB: { select: { id: true, name: true, type: true } },
          },
          orderBy: { dateFlagged: 'asc' },
        },
      },
    });

    if (!patient) {
      return res.status(200).json({
        flagHistory: [],
        burdenHistory: [],
        summary: { totalMedicines: 0, totalFlags: 0, currentBurdenScore: 0, currentBurdenLevel: 'Normal', highRiskFlags: 0 },
      });
    }

    const { medicines, interactionFlags } = patient;
    const allBurdenScores = await prisma.burdenScore.findMany();

    // 1. Group flags by month
    const monthMap = {};
    interactionFlags.forEach((flag) => {
      const d = new Date(flag.dateFlagged);
      const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          period: monthKey,
          monthIndex: d.getFullYear() * 12 + d.getMonth(),
          totalFlags: 0,
          critical: 0,
          moderate: 0,
          minor: 0,
        };
      }
      monthMap[monthKey].totalFlags += 1;
      const sev = (flag.severity || '').toUpperCase();
      if (sev === 'CONTRAINDICATED' || sev === 'MAJOR') {
        monthMap[monthKey].critical += 1;
      } else if (sev === 'MODERATE') {
        monthMap[monthKey].moderate += 1;
      } else {
        monthMap[monthKey].minor += 1;
      }
    });

    const flagHistory = Object.values(monthMap).sort((a, b) => a.monthIndex - b.monthIndex);

    // 2. Compute progressive burden history as each medicine was added
    let runningScore = 0;
    const burdenHistory = [];

    medicines.forEach((med, idx) => {
      const normalized = (med.name || '').toLowerCase();
      let matchScore = 0;
      for (const bs of allBurdenScores) {
        const drug = (bs.drugName || '').toLowerCase();
        if (drug && (normalized.includes(drug) || (drug.length >= 4 && drug.includes(normalized)))) {
          matchScore = bs.score;
          break;
        }
      }

      runningScore += matchScore;
      let level = 'Normal';
      if (runningScore >= 3) level = 'Critical';
      else if (runningScore >= 1) level = 'Moderate';

      const d = new Date(med.dateAdded);
      burdenHistory.push({
        step: idx + 1,
        date: med.dateAdded,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        medicine: med.name,
        type: med.type,
        addedScore: matchScore,
        cumulativeScore: runningScore,
        level,
      });
    });

    const currentScore = runningScore;
    const currentLevel = currentScore >= 3 ? 'Critical' : currentScore >= 1 ? 'Moderate' : 'Normal';

    return res.status(200).json({
      flagHistory,
      burdenHistory,
      summary: {
        totalMedicines: medicines.length,
        totalFlags: interactionFlags.length,
        currentBurdenScore: currentScore,
        currentBurdenLevel: currentLevel,
        highRiskFlags: interactionFlags.filter(f => ['CONTRAINDICATED', 'MAJOR'].includes((f.severity || '').toUpperCase())).length,
      },
    });
  } catch (err) {
    console.error('[GET /patient/insights]', err);
    res.status(500).json({ error: 'Failed to load insights.' });
  }
});

module.exports = router;
