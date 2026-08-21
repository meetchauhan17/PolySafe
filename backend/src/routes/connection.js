'use strict';

/**
 * /connection — Doctor ↔ Patient connection management
 *
 * POST /connection/generate-code   Patient generates a 6-digit invite code + QR image
 * POST /connection/claim-code      Doctor claims a code (sets connectedUserId)
 * GET  /connection/pending         Patient lists connections awaiting their approval
 * GET  /connection/mine            Doctor lists their approved patient connections
 * POST /connection/:id/approve     Patient approves a pending claim
 * POST /connection/:id/revoke      Patient revokes any connection
 */

const express = require('express');
const QRCode  = require('qrcode');
const crypto  = require('crypto');
const prisma  = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { lookupInteraction } = require('../services/interactionLookup');

const router = express.Router();

// ─── Helper: generate unique 6-digit numeric code ────────────────────────────
async function generateUniqueCode() {
  let code;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 20) {
    code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    // Also invalidate any still-extant (unexpired, PENDING, unclaimed) matching codes
    const clash = await prisma.connection.findUnique({ where: { shareCode: code } });
    exists = !!clash;
    attempts++;
  }
  if (exists) throw new Error('Could not generate a unique code — please try again.');
  return code;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/generate-code
// Patient-auth: generates a new invite code + QR, creates a PENDING Connection
// record with no connectedUserId yet (doctor hasn't claimed it yet).
// ═════════════════════════════════════════════════════════════════════════════
router.post('/generate-code', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found. Complete onboarding first.' });
    }

    // Delete any existing unclaimed codes for this patient to avoid stale codes
    await prisma.connection.deleteMany({
      where: {
        patientId:       patient.id,
        connectedUserId: null,         // not yet claimed
        status:          'PENDING',
      },
    });

    const code = await generateUniqueCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours

    const connection = await prisma.connection.create({
      data: {
        patientId:       patient.id,
        connectedUserId: null,          // filled when doctor claims
        role:            'DOCTOR',
        status:          'PENDING',
        shareCode:       code,
        expiresAt,
      },
    });

    // Generate QR code as base64 PNG data URL
    // The QR encodes the raw 6-digit code — the doctor app scans it to pre-fill the field
    const qrDataUrl = await QRCode.toDataURL(code, {
      width:   300,
      margin:  2,
      color:   { dark: '#2B6E5E', light: '#FFFFFF' },
    });

    return res.status(201).json({
      connectionId: connection.id,
      shareCode:    code,
      qrCode:       qrDataUrl,   // data:image/png;base64,...
      expiresAt,
      expiresInMinutes: 1440,
    });
  } catch (err) {
    console.error('[POST /connection/generate-code]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate code.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/claim-code
// Doctor-auth: provide a 6-digit code, claim the Connection (sets connectedUserId).
// Status stays PENDING until the patient approves.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/claim-code', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const rawCode = req.body.code || req.body.shareCode;
  const code = rawCode ? String(rawCode).trim() : '';

  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Please provide a valid 6-digit code.' });
  }

  try {
    const connection = await prisma.connection.findUnique({
      where: { shareCode: String(code).trim() },
      include: { patient: { select: { id: true, age: true, conditions: true } } },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Code not found. Check the code and try again.' });
    }
    if (connection.connectedUserId) {
      return res.status(409).json({ error: 'This code has already been claimed.' });
    }
    if (connection.expiresAt && new Date() > connection.expiresAt) {
      return res.status(410).json({ error: 'This code has expired. Ask the patient to generate a new one.' });
    }

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data:  { connectedUserId: userId },
      include: {
        patient: {
          select: { id: true, age: true, conditions: true },
        },
      },
    });

    console.log(`[connection] Doctor ${userId} claimed code ${code} → Connection ${connection.id}`);

    return res.status(200).json({
      connectionId: updated.id,
      status:       updated.status,   // still PENDING — awaiting patient approval
      message:      'Code claimed successfully. Waiting for patient approval.',
      patientId:    updated.patient.id,
    });
  } catch (err) {
    console.error('[POST /connection/claim-code]', err);
    return res.status(500).json({ error: 'Failed to claim code.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/pending
// Patient-auth: returns connections where a doctor has claimed the code
// (connectedUserId is set) but the patient hasn't approved yet.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/pending', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(200).json({ pending: [] });

    const pending = await prisma.connection.findMany({
      where: {
        patientId:            patient.id,
        status:               'PENDING',
        connectedUserId:      { not: null }, // claimed but not yet approved
      },
      include: {
        connectedUser: {
          select: { id: true, role: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = pending.map((c) => ({
      connectionId:  c.id,
      doctorId:      c.connectedUserId,
      doctorLabel:   c.connectedUser?.email
        ? `Dr. ${c.connectedUser.email.split('@')[0]}`
        : c.connectedUser?.phone
        ? `Dr. ···${c.connectedUser.phone.slice(-4)}`
        : 'Connected Doctor',
      doctorRole:    c.connectedUser?.role,
      role:          c.role,
      createdAt:     c.createdAt,
    }));

    return res.status(200).json({ pending: payload });
  } catch (err) {
    console.error('[GET /connection/pending]', err);
    return res.status(500).json({ error: 'Failed to load pending connections.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/mine
// Doctor-auth: returns all approved patient connections for this doctor.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/mine', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  try {
    const connections = await prisma.connection.findMany({
      where: {
        connectedUserId: userId,
        status:          'APPROVED',
      },
      include: {
        patient: {
          select: {
            id: true,
            age: true,
            conditions: true,
            medicines: {
              where: { removedAt: null },
              orderBy: { dateAdded: 'desc' },
              take: 5,
              select: { id: true, name: true, type: true, dateAdded: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = connections.map((c) => ({
      connectionId: c.id,
      patientId:    c.patient.id,
      patientAge:   c.patient.age,
      conditions:   c.patient.conditions,
      recentMeds:   c.patient.medicines,
      connectedAt:  c.createdAt,
    }));

    return res.status(200).json({ connections: payload });
  } catch (err) {
    console.error('[GET /connection/mine]', err);
    return res.status(500).json({ error: 'Failed to load connections.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/:id/approve
// Patient-auth: approve a pending connection (doctor has already claimed it)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/approve', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { id }    = req.params;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const connection = await prisma.connection.findFirst({
      where: { id, patientId: patient.id },
    });
    if (!connection) return res.status(404).json({ error: 'Connection not found.' });
    if (connection.status === 'APPROVED') return res.status(200).json({ message: 'Already approved.' });
    if (connection.status === 'REVOKED')  return res.status(409).json({ error: 'Connection has been revoked.' });
    if (!connection.connectedUserId) return res.status(409).json({ error: 'No doctor has claimed this connection yet.' });

    await prisma.connection.update({
      where: { id },
      data:  { status: 'APPROVED' },
    });

    console.log(`[connection] Patient ${userId} approved connection ${id}`);
    return res.status(200).json({ connectionId: id, status: 'APPROVED', message: 'Connection approved.' });
  } catch (err) {
    console.error('[POST /connection/:id/approve]', err);
    return res.status(500).json({ error: 'Failed to approve connection.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/:id/revoke
// Patient-auth: revoke a connection (PENDING or APPROVED)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/revoke', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { id }    = req.params;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const connection = await prisma.connection.findFirst({
      where: { id, patientId: patient.id },
    });
    if (!connection) return res.status(404).json({ error: 'Connection not found.' });

    await prisma.connection.update({
      where: { id },
      data:  { status: 'REVOKED' },
    });

    console.log(`[connection] Patient ${userId} revoked connection ${id}`);
    return res.status(200).json({ connectionId: id, status: 'REVOKED', message: 'Access revoked.' });
  } catch (err) {
    console.error('[POST /connection/:id/revoke]', err);
    return res.status(500).json({ error: 'Failed to revoke connection.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/doctor-patient/:patientId/timeline
// Doctor-auth + must be APPROVED connection holder for this patient
// Returns the patient's timeline (reused from patient route logic)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/doctor-patient/:patientId/timeline', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId }    = req.user;
  const { patientId } = req.params;
  try {
    // Verify approved connection
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const medicines = await prisma.medicine.findMany({
      where:   { patientId },
      orderBy: { dateAdded: 'desc' },
      include: {
        addedByUser: { select: { id: true, role: true, email: true, phone: true } },
        interactionFlagsAsA: {
          select: { id: true, severity: true, medicineB: { select: { id: true, name: true } } },
        },
        interactionFlagsAsB: {
          select: { id: true, severity: true, medicineA: { select: { id: true, name: true } } },
        },
      },
    });

    const payload = medicines.map((med) => {
      const flagsA = (med.interactionFlagsAsA || []).map((f) => ({
        flagId: f.id, severity: f.severity, counterpartId: f.medicineB?.id, counterpartName: f.medicineB?.name,
      }));
      const flagsB = (med.interactionFlagsAsB || []).map((f) => ({
        flagId: f.id, severity: f.severity, counterpartId: f.medicineA?.id, counterpartName: f.medicineA?.name,
      }));
      const allFlags = [...flagsA, ...flagsB];
      return {
        id: med.id, name: med.name, type: med.type, dosage: med.dosage,
        standardizedCode: med.standardizedCode, dateAdded: med.dateAdded,
        discontinued: !!med.removedAt, removedAt: med.removedAt,
        flagged: allFlags.length > 0, flags: allFlags,
      };
    });

    const flags = await prisma.interactionFlag.findMany({
      where:   { patientId },
      orderBy: { dateFlagged: 'desc' },
      include: {
        medicineA: { select: { id: true, name: true } },
        medicineB: { select: { id: true, name: true } },
      },
    });

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { age: true, conditions: true, allergies: true },
    });

    return res.status(200).json({ medicines: payload, flags, patient });
  } catch (err) {
    console.error('[doctor-patient timeline]', err);
    return res.status(500).json({ error: 'Failed to load patient data.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/doctor-safety-check & POST /connection/doctor/prescribe-safety-check
// Doctor-auth: test a proposed drug against patient's active regimen before prescribing.
// Uses Indian formulary resolver, interaction database, and projected 5-tier regimen risk.
// ═════════════════════════════════════════════════════════════════════════════
const handleDoctorSafetyCheck = async (req, res) => {
  const { userId } = req.user;
  const { patientId, proposedDrug, proposedMedicineName, dosage } = req.body;

  const rawDrug = (proposedDrug || proposedMedicineName || '').trim();

  if (!patientId || !rawDrug) {
    return res.status(400).json({ error: 'patientId and proposedDrug are required.' });
  }

  try {
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const { resolveDrugWithAI } = require('../services/aiDrugResolver');
    const { getDrugHarmLevel } = require('../services/regimenRisk');

    // 1. Resolve proposed drug through Indian formulary resolver
    const resolved = await resolveDrugWithAI(rawDrug);
    const resolvedName = resolved.resolvedName || rawDrug;
    const genericName = resolved.genericName || rawDrug;
    const proposedHarmLevel = resolved.harmLevel || getDrugHarmLevel(resolvedName, resolved.class);

    // 2. Fetch patient's active medicines and existing flags
    const activeMeds = await prisma.medicine.findMany({
      where: { patientId, removedAt: null },
      select: { id: true, name: true, type: true, dosage: true, harmLevel: true },
    });

    const existingFlags = await prisma.interactionFlag.findMany({
      where: {
        patientId,
        medicineA: { removedAt: null },
        medicineB: { removedAt: null },
      },
      select: { severity: true },
    });

    // 3. Test proposed drug (and all constituent generic salts) against active regimen
    const detectedFlags = [];
    const constituents = resolved.genericSalts || [resolvedName];

    for (const med of activeMeds) {
      // Check brand/generic match
      let match = await lookupInteraction(resolvedName, med.name);
      if (!match.found) {
        // Test individual constituents
        for (const salt of constituents) {
          const saltMatch = await lookupInteraction(salt, med.name);
          if (saltMatch.found) {
            match = saltMatch;
            break;
          }
        }
      }

      if (match.found) {
        detectedFlags.push({
          counterpart: med.name,
          interactingDrug: med.name,
          severity: match.severity || 'Moderate',
          plainExplanation: match.note || `Potential ${match.severity || 'Moderate'} pharmacological interaction between ${resolvedName} and ${med.name}.`,
          note: match.note,
        });
      }
    }

    // 4. Calculate projected 5-tier regimen risk if this drug were added
    const existingHarmLevels = activeMeds.map(m => m.harmLevel || getDrugHarmLevel(m.name));
    const projectedHarmLevels = [...existingHarmLevels, proposedHarmLevel];
    const projectedAverage = projectedHarmLevels.reduce((a, b) => a + b, 0) / projectedHarmLevels.length;

    const totalActiveFlags = existingFlags.length + detectedFlags.length;
    const existingMajorCount = existingFlags.filter(f => f.severity === 'Major' || f.severity === 'Contraindicated').length;
    const detectedMajorCount = detectedFlags.filter(f => f.severity === 'Major' || f.severity === 'Contraindicated').length;
    const totalMajorFlags = existingMajorCount + detectedMajorCount;

    const maxHarm = Math.max(...projectedHarmLevels);

    let projectedRegimenRisk = 'LOW';
    if (maxHarm === 5 || totalActiveFlags >= 3) {
      projectedRegimenRisk = 'CRITICAL';
    } else if (projectedAverage >= 3.5 || totalMajorFlags >= 1) {
      projectedRegimenRisk = 'HIGH';
    } else if (projectedAverage >= 2.5) {
      projectedRegimenRisk = 'MODERATE';
    } else if (projectedAverage >= 1.5) {
      projectedRegimenRisk = 'MILD';
    } else {
      projectedRegimenRisk = 'LOW';
    }

    // 5. Determine overall pre-prescribing decision for THIS proposed drug
    const hasCriticalFlag = detectedFlags.some(f => f.severity === 'Contraindicated' || f.severity === 'Major');
    const hasModerateFlag = detectedFlags.some(f => f.severity === 'Moderate' || f.severity === 'Minor');

    let decision = 'SAFE';
    if (hasCriticalFlag || proposedHarmLevel === 5) {
      decision = 'CRITICAL';
    } else if (hasModerateFlag || proposedHarmLevel === 4) {
      decision = 'CAUTION';
    } else {
      decision = 'SAFE';
    }

    return res.status(200).json({
      decision,
      proposedDrug: {
        name: resolvedName,
        genericName,
        harmLevel: proposedHarmLevel,
        class: resolved.class || 'Prescription Medicine',
        foodInstruction: resolved.foodInstruction || 'after_food',
        dosage: dosage || resolved.dosageOptions?.[0] || 'Standard dose',
      },
      flags: detectedFlags,
      currentRegimenCount: activeMeds.length,
      projectedRegimenRisk,
      projectedAverageScore: parseFloat(projectedAverage.toFixed(1)),
      framing: 'Pre-prescribing safety check — does not modify the patient\'s medicine list.',
      disclaimer: 'This is an informational safety evaluation, not a prescription or clinical diagnosis.',
    });
  } catch (err) {
    console.error('[doctor-safety-check]', err);
    return res.status(500).json({ error: 'Failed to run doctor safety check.' });
  }
};

router.post('/doctor-safety-check', auth, requireRole(['DOCTOR']), handleDoctorSafetyCheck);
router.post('/doctor/prescribe-safety-check', auth, requireRole(['DOCTOR']), handleDoctorSafetyCheck);


// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/add-caregiver
// Patient-auth: invite a caregiver by their phone number.
// Looks up or creates a User record for that phone (role CAREGIVER).
// Creates a Connection with role=CAREGIVER, status=PENDING, no shareCode.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/add-caregiver', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { phone }  = req.body;

  if (!phone || !/^\+?[1-9]\d{7,14}$/.test(String(phone).trim())) {
    return res.status(400).json({ error: 'Please provide a valid phone number (E.164 format, e.g. +919876543210).' });
  }

  const normalizedPhone = String(phone).trim();

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found. Complete onboarding first.' });
    }

    // Look up or create a User for the caregiver's phone
    let caregiverUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!caregiverUser) {
      caregiverUser = await prisma.user.create({
        data: { phone: normalizedPhone, role: 'CAREGIVER' },
      });
    } else if (caregiverUser.role !== 'CAREGIVER') {
      // If they already have a different role (e.g. PATIENT), still allow — the
      // connection logic only checks APPROVED connections, not the user's role.
      // But flag it for the caller.
    }

    // Prevent duplicate active connections
    const existing = await prisma.connection.findFirst({
      where: {
        patientId:       patient.id,
        connectedUserId: caregiverUser.id,
        status:          { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing) {
      return res.status(409).json({
        error: existing.status === 'APPROVED'
          ? 'This caregiver is already connected to your account.'
          : 'An invite for this caregiver is already pending their acceptance.',
        connectionId: existing.id,
        status:       existing.status,
      });
    }

    const connection = await prisma.connection.create({
      data: {
        patientId:       patient.id,
        connectedUserId: caregiverUser.id,
        role:            'CAREGIVER',
        status:          'PENDING',
        shareCode:       null,
        expiresAt:       null,  // no expiry for caregiver invites — revocable anytime
      },
    });

    console.log(`[connection] Patient ${userId} invited caregiver ${caregiverUser.id} (phone ${normalizedPhone})`);

    return res.status(201).json({
      connectionId:    connection.id,
      caregiverId:     caregiverUser.id,
      caregiverPhone:  normalizedPhone,
      status:          'PENDING',
      message:         'Caregiver invite sent. They can log in with this phone number to accept.',
    });
  } catch (err) {
    console.error('[POST /connection/add-caregiver]', err);
    return res.status(500).json({ error: 'Failed to send caregiver invite.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/caregiver-invites
// Caregiver-auth: returns all PENDING Connection records where the caregiver
// is connectedUserId and role=CAREGIVER — i.e. invites awaiting their acceptance.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/caregiver-invites', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const invites = await prisma.connection.findMany({
      where: {
        connectedUserId: userId,
        role:            'CAREGIVER',
        status:          'PENDING',
      },
      include: {
        patient: {
          select: {
            id:         true,
            age:        true,
            conditions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      invites: invites.map((c) => ({
        connectionId:  c.id,
        patientId:     c.patient.id,
        patientAge:    c.patient.age,
        conditions:    c.patient.conditions,
        createdAt:     c.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /connection/caregiver-invites]', err);
    return res.status(500).json({ error: 'Failed to load caregiver invites.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/:id/accept
// Caregiver-auth: accept a pending invite (must be the connectedUserId).
// Sets status to APPROVED.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/:id/accept', auth, async (req, res) => {
  const { userId } = req.user;
  const { id }    = req.params;
  try {
    const connection = await prisma.connection.findFirst({
      where: { id, connectedUserId: userId },
    });
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found or not yours to accept.' });
    }
    if (connection.status === 'APPROVED') {
      return res.status(200).json({ message: 'Already accepted.', connectionId: id, status: 'APPROVED' });
    }
    if (connection.status === 'REVOKED') {
      return res.status(409).json({ error: 'This invite has been revoked by the patient.' });
    }

    await prisma.connection.update({ where: { id }, data: { status: 'APPROVED' } });
    console.log(`[connection] Caregiver ${userId} accepted connection ${id}`);
    return res.status(200).json({ connectionId: id, status: 'APPROVED', message: 'Connection accepted.' });
  } catch (err) {
    console.error('[POST /connection/:id/accept]', err);
    return res.status(500).json({ error: 'Failed to accept connection.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/my-connections
// Patient-auth: returns ALL connections for this patient (doctors + caregivers),
// any status, used by the Connected People settings screen.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/my-connections', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(200).json({ connections: [] });

    const connections = await prisma.connection.findMany({
      where:   { patientId: patient.id },
      include: {
        connectedUser: {
          select: { id: true, role: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = connections.map((c) => {
      const u = c.connectedUser;
      const label = !u
        ? 'Unclaimed invite'
        : u.role === 'DOCTOR'
        ? (u.email ? `Dr. ${u.email.split('@')[0]}` : u.phone ? `Dr. ···${u.phone.slice(-4)}` : 'Connected Doctor')
        : u.phone
        ? `Caregiver ···${u.phone.slice(-4)}`
        : 'Caregiver';

      return {
        connectionId:    c.id,
        role:            c.role,
        status:          c.status,
        label,
        connectedUserId: c.connectedUserId,
        shareCode:       c.role === 'DOCTOR' ? c.shareCode : undefined,
        expiresAt:       c.expiresAt,
        createdAt:       c.createdAt,
      };
    });

    return res.status(200).json({ connections: payload });
  } catch (err) {
    console.error('[GET /connection/my-connections]', err);
    return res.status(500).json({ error: 'Failed to load connections.' });
  }
});

module.exports = router;
