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
// record with no connectedUserId yet (doctor or caregiver hasn't claimed it yet).
// ═════════════════════════════════════════════════════════════════════════════
router.post('/generate-code', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const targetRole = req.body.role === 'CAREGIVER' ? 'CAREGIVER' : 'DOCTOR';

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found. Complete onboarding first.' });
    }

    // Delete any existing unclaimed codes for this patient and role to avoid stale codes
    await prisma.connection.deleteMany({
      where: {
        patientId:       patient.id,
        role:            targetRole,
        connectedUserId: null,         // not yet claimed
        status:          'PENDING',
      },
    });

    const code = await generateUniqueCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours

    const connection = await prisma.connection.create({
      data: {
        patientId:       patient.id,
        connectedUserId: null,          // filled when claimed
        role:            targetRole,
        status:          'PENDING',
        shareCode:       code,
        expiresAt,
      },
    });

    // Generate QR code as base64 PNG data URL
    const qrColor = targetRole === 'CAREGIVER' ? '#0D9488' : '#2B6E5E';
    const qrDataUrl = await QRCode.toDataURL(code, {
      width:   300,
      margin:  2,
      color:   { dark: qrColor, light: '#FFFFFF' },
    });

    return res.status(201).json({
      connectionId:     connection.id,
      shareCode:        code,
      role:             targetRole,
      qrCode:           qrDataUrl,   // data:image/png;base64,...
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
// Doctor or Caregiver auth: provide a 6-digit code, claim the Connection.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/claim-code', auth, requireRole(['DOCTOR', 'CAREGIVER']), async (req, res) => {
  const { userId, role } = req.user;
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

    // If a caregiver claims a caregiver code, auto-approve for instant setup
    const newStatus = connection.role === 'CAREGIVER' ? 'APPROVED' : connection.status;

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data:  { connectedUserId: userId, status: newStatus },
      include: {
        patient: {
          select: { id: true, age: true, conditions: true },
        },
      },
    });

    console.log(`[connection] ${role} ${userId} claimed code ${code} → Connection ${connection.id}`);

    return res.status(200).json({
      connectionId: updated.id,
      role:         updated.role,
      status:       updated.status,
      message:      updated.status === 'APPROVED' ? 'Caregiver connection activated!' : 'Code claimed successfully. Waiting for patient approval.',
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
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
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

    const payload = connections.map((c) => {
      const patientUser = c.patient?.user;
      let patientName = patientUser?.name;
      if (!patientName || patientName === 'PolySafe User') {
        if (patientUser?.email) {
          const raw = patientUser.email.split('@')[0];
          patientName = raw.replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        } else if (patientUser?.phone) {
          patientName = `Patient ···${patientUser.phone.slice(-4)}`;
        } else {
          patientName = c.patient?.age ? `Patient (Age ${c.patient.age})` : 'Connected Patient';
        }
      }

      return {
        connectionId: c.id,
        patientId:    c.patient.id,
        patientName,
        patientEmail: patientUser?.email || null,
        patientPhone: patientUser?.phone || null,
        patientAge:   c.patient.age,
        conditions:   c.patient.conditions,
        recentMeds:   c.patient.medicines,
        connectedAt:  c.createdAt,
      };
    });

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

    if (connection.status === 'PENDING' && !connection.connectedUserId) {
      await prisma.connection.delete({ where: { id } });
      console.log(`[connection] Patient ${userId} cancelled unclaimed invite ${id}`);
      return res.status(200).json({ connectionId: id, status: 'REVOKED', message: 'Invitation cancelled.' });
    }

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
          select: { id: true, severity: true, medicineB: { select: { id: true, name: true, removedAt: true } } },
        },
        interactionFlagsAsB: {
          select: { id: true, severity: true, medicineA: { select: { id: true, name: true, removedAt: true } } },
        },
      },
    });

    const payload = medicines.map((med) => {
      const isDiscontinued = !!med.removedAt;
      const flagsA = isDiscontinued ? [] : (med.interactionFlagsAsA || [])
        .filter((f) => !f.medicineB?.removedAt)
        .map((f) => ({
          flagId: f.id, severity: f.severity, counterpartId: f.medicineB?.id, counterpartName: f.medicineB?.name,
        }));
      const flagsB = isDiscontinued ? [] : (med.interactionFlagsAsB || [])
        .filter((f) => !f.medicineA?.removedAt)
        .map((f) => ({
          flagId: f.id, severity: f.severity, counterpartId: f.medicineA?.id, counterpartName: f.medicineA?.name,
        }));
      const allFlags = [...flagsA, ...flagsB];
      return {
        id: med.id, name: med.name, type: med.type, dosage: med.dosage,
        standardizedCode: med.standardizedCode, dateAdded: med.dateAdded,
        discontinued: isDiscontinued, removedAt: med.removedAt,
        flagged: allFlags.length > 0, flags: allFlags,
      };
    });

    const flags = await prisma.interactionFlag.findMany({
      where: {
        patientId,
        medicineA: { removedAt: null },
        medicineB: { removedAt: null },
      },
      orderBy: { dateFlagged: 'desc' },
      include: {
        medicineA: { select: { id: true, name: true } },
        medicineB: { select: { id: true, name: true } },
      },
    });

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        age: true,
        conditions: true,
        allergies: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    let patientDisplayName = patient?.user?.name;
    if (!patientDisplayName || patientDisplayName === 'PolySafe User') {
      if (patient?.user?.email) {
        const raw = patient.user.email.split('@')[0];
        patientDisplayName = raw.replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      } else if (patient?.user?.phone) {
        patientDisplayName = `Patient ···${patient.user.phone.slice(-4)}`;
      } else {
        patientDisplayName = patient?.age ? `Patient (Age ${patient.age})` : 'Connected Patient';
      }
    }

    const patientPayload = patient ? {
      id: patient.id,
      age: patient.age,
      conditions: patient.conditions,
      allergies: patient.allergies,
      name: patientDisplayName,
      email: patient.user?.email || null,
      phone: patient.user?.phone || null,
    } : {};

    return res.status(200).json({ medicines: payload, flags, patient: patientPayload });
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
// Patient-auth: invite a caregiver by phone number or email.
// Looks up or creates a User record for that contact (role CAREGIVER).
// Creates a Connection with role=CAREGIVER, status=PENDING.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/add-caregiver', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { phone, email, name, relation } = req.body;

  let normalizedPhone = null;
  let normalizedEmail = null;

  if (phone && String(phone).trim()) {
    let rawPhone = String(phone).trim().replace(/[\s\-\(\)\.]/g, '');
    if (/^\d{10}$/.test(rawPhone)) {
      rawPhone = `+91${rawPhone}`;
    } else if (/^\d{11,14}$/.test(rawPhone) && !rawPhone.startsWith('+')) {
      rawPhone = `+${rawPhone}`;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(rawPhone)) {
      return res.status(400).json({
        error: 'Please provide a valid 10-digit mobile number or international format (e.g. +91 98765 43210).',
      });
    }
    normalizedPhone = rawPhone;
  } else if (email && String(email).trim()) {
    const rawEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    normalizedEmail = rawEmail;
  } else {
    return res.status(400).json({ error: 'Please provide either a mobile number or an email address.' });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found. Complete onboarding first.' });
    }

    // Look up or create a User for the caregiver
    let caregiverUser = null;
    if (normalizedPhone) {
      caregiverUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
      if (!caregiverUser) {
        caregiverUser = await prisma.user.create({
          data: {
            phone: normalizedPhone,
            role:  'CAREGIVER',
            name:  name && String(name).trim() ? String(name).trim() : 'Family Caregiver',
          },
        });
      }
    } else if (normalizedEmail) {
      caregiverUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!caregiverUser) {
        caregiverUser = await prisma.user.create({
          data: {
            email: normalizedEmail,
            role:  'CAREGIVER',
            name:  name && String(name).trim() ? String(name).trim() : 'Family Caregiver',
          },
        });
      }
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
          : 'An invite for this caregiver is already pending their login.',
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
        expiresAt:       null, // no expiry for caregiver invites — revocable anytime
      },
    });

    const patientDisplayName = patient.user?.name || 'Your family member';
    const contactIdentifier = normalizedPhone || normalizedEmail;
    const inviteMessage = `Hi, ${patientDisplayName} has invited you as a family caregiver on PolySafe. Log in with your ${normalizedPhone ? 'mobile number' : 'email'} (${contactIdentifier}) to view medication safety updates & daily reminder schedules.`;

    console.log(`[connection] Patient ${userId} invited caregiver ${caregiverUser.id} (${contactIdentifier})`);

    return res.status(201).json({
      connectionId:    connection.id,
      caregiverId:     caregiverUser.id,
      caregiverPhone:  normalizedPhone,
      caregiverEmail:  normalizedEmail,
      caregiverName:   name || caregiverUser.name || null,
      relation:        relation || null,
      status:          'PENDING',
      inviteMessage,
      message:         `Caregiver invite created for ${contactIdentifier}. They can log in to view updates.`,
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
        ? (c.role === 'DOCTOR' ? 'Doctor Access Code' : 'Caregiver Invite Code')
        : u.role === 'DOCTOR'
        ? (u.name || (u.email ? `Dr. ${u.email.split('@')[0]}` : u.phone ? `Dr. ···${u.phone.slice(-4)}` : 'Connected Doctor'))
        : (u.name || (u.phone ? `Caregiver ···${u.phone.slice(-4)}` : u.email ? `Caregiver (${u.email})` : 'Caregiver'));

      return {
        connectionId:    c.id,
        role:            c.role,
        status:          c.status,
        label,
        name:            u?.name || null,
        doctorLabel:     u?.role === 'DOCTOR' ? (u.name || (u.email ? `Dr. ${u.email.split('@')[0]}` : 'Physician')) : null,
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

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/doctor-prescribe
// Doctor-auth: Prescribes and directly adds a medicine to a connected patient's
// active medication list with clinical provenance ("Prescribed by Dr. ...").
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor-prescribe', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const { patientId, name, dosage, type = 'PRESCRIPTION', foodInstruction, notes } = req.body;

  if (!patientId || !name || !name.trim()) {
    return res.status(400).json({ error: 'patientId and medication name are required.' });
  }

  try {
    // 1. Verify approved connection
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    // 2. Fetch doctor info
    const doctorUser = await prisma.user.findUnique({ where: { id: userId } });
    const doctorLabel = doctorUser?.email ? `Dr. ${doctorUser.email.split('@')[0]}` : 'Connected Doctor';

    // 3. Resolve drug via 5-layer AI / Indian formulary resolver
    const { resolveDrugWithAI } = require('../services/aiDrugResolver');
    const { getDrugHarmLevel, calculateRegimenRisk } = require('../services/regimenRisk');
    const { calculateCumulativeBurden } = require('../services/burdenIndex');

    const resolved = await resolveDrugWithAI(name.trim());
    const standardizedCode = resolved.standardizedCode || null;
    const resolvedName = resolved.resolvedName || name.trim();
    const harmLevel = resolved.harmLevel || getDrugHarmLevel(resolvedName, resolved.class);

    // 4. Check for duplicate in patient's active medicines
    const existing = await prisma.medicine.findFirst({
      where: {
        patientId,
        removedAt: null,
        OR: [
          ...(standardizedCode ? [{ standardizedCode }] : []),
          { name: { equals: name.trim(), mode: 'insensitive' } },
          { name: { equals: resolvedName, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      const updated = await prisma.medicine.update({
        where: { id: existing.id },
        data: {
          dosage: dosage?.trim() || existing.dosage,
          type: type || existing.type,
          harmLevel,
          addedBy: userId,
        },
      });
      return res.status(200).json({
        message: `Updated existing medication "${existing.name}".`,
        medicine: updated,
        doctorLabel,
      });
    }

    // 5. Create new medicine record
    const medicine = await prisma.medicine.create({
      data: {
        patientId,
        name: resolvedName,
        standardizedCode,
        type: type || 'PRESCRIPTION',
        dosage: dosage?.trim() || (resolved.dosageOptions?.[0] || 'Standard dose'),
        harmLevel,
        addedBy: userId,
        dateAdded: new Date(),
      },
    });

    // 6. Check interactions with existing active medications
    const otherMeds = await prisma.medicine.findMany({
      where: { patientId, id: { not: medicine.id }, removedAt: null },
    });

    const newFlags = [];
    for (const other of otherMeds) {
      let match = await lookupInteraction(medicine.name, other.name);
      if (!match.found && resolved.genericSalts?.length) {
        for (const salt of resolved.genericSalts) {
          const saltMatch = await lookupInteraction(salt, other.name);
          if (saltMatch.found) {
            match = saltMatch;
            break;
          }
        }
      }

      if (match.found) {
        const flag = await prisma.interactionFlag.create({
          data: {
            patientId,
            medicineAId: medicine.id,
            medicineBId: other.id,
            severity: match.severity || 'Moderate',
            clinicalExplanation: match.note || `Potential ${match.severity || 'Moderate'} interaction between ${medicine.name} and ${other.name}.`,
          },
        });
        newFlags.push(flag);
      }
    }

    // 7. Calculate updated burden & risk
    const cumulativeBurden = await calculateCumulativeBurden(patientId);
    const regimenRisk = await calculateRegimenRisk(patientId);

    // 8. Emit real-time Socket notification to patient room
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patient.userId}`).emit('patient-regimen-updated', {
        action: 'DOCTOR_PRESCRIBED',
        medicine,
        doctorLabel,
        newFlagsCount: newFlags.length,
        regimenRisk,
        cumulativeBurden,
      });
    }

    return res.status(201).json({
      message: `Successfully prescribed ${medicine.name} for patient.`,
      medicine,
      doctorLabel,
      newFlags,
      regimenRisk,
      cumulativeBurden,
    });
  } catch (err) {
    console.error('[POST /connection/doctor-prescribe]', err);
    return res.status(500).json({ error: 'Failed to prescribe medication.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/doctor-deprescribe
// Doctor-auth: Soft-discontinues a high-risk or redundant medication with clinical
// deprescribing rationale & taper guidance.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor-deprescribe', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const { patientId, medicineId, rationale, taperPlan } = req.body;

  if (!patientId || !medicineId) {
    return res.status(400).json({ error: 'patientId and medicineId are required.' });
  }

  try {
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const med = await prisma.medicine.findFirst({
      where: { id: medicineId, patientId, removedAt: null },
    });
    if (!med) return res.status(404).json({ error: 'Active medicine not found.' });

    // Soft delete
    const discontinued = await prisma.medicine.update({
      where: { id: medicineId },
      data: { removedAt: new Date() },
    });

    // Delete associated interaction flags
    await prisma.interactionFlag.deleteMany({
      where: {
        OR: [{ medicineAId: medicineId }, { medicineBId: medicineId }],
      },
    });

    const { calculateRegimenRisk } = require('../services/regimenRisk');
    const { calculateCumulativeBurden } = require('../services/burdenIndex');

    const updatedBurden = await calculateCumulativeBurden(patientId);
    const updatedRisk = await calculateRegimenRisk(patientId);

    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patient.userId}`).emit('patient-regimen-updated', {
        action: 'DOCTOR_DEPRESCRIBED',
        medicineId,
        medicineName: med.name,
        rationale: rationale || 'Discontinued by physician to optimize regimen safety.',
        taperPlan,
      });
    }

    return res.status(200).json({
      message: `Successfully deprescribed ${med.name}.`,
      discontinued,
      updatedBurden,
      updatedRisk,
    });
  } catch (err) {
    console.error('[POST /connection/doctor-deprescribe]', err);
    return res.status(500).json({ error: 'Failed to deprescribe medication.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/doctor-patient/:patientId/clinical-summary
// Doctor-auth: Comprehensive clinical assessment report for consultation & review.
// ═════════════════════════════════════════════════════════════════════════════
router.get('/doctor-patient/:patientId/clinical-summary', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const { patientId } = req.params;

  try {
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { email: true, phone: true } },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });

    // Active medicines
    const activeMeds = await prisma.medicine.findMany({
      where: { patientId, removedAt: null },
      orderBy: { dateAdded: 'desc' },
      include: {
        addedByUser: { select: { role: true, email: true } },
      },
    });

    // Discontinued medicines
    const discontinuedMeds = await prisma.medicine.findMany({
      where: { patientId, removedAt: { not: null } },
      orderBy: { removedAt: 'desc' },
      take: 10,
    });

    // Active flags
    const flags = await prisma.interactionFlag.findMany({
      where: {
        patientId,
        medicineA: { removedAt: null },
        medicineB: { removedAt: null },
      },
      include: {
        medicineA: { select: { id: true, name: true, harmLevel: true } },
        medicineB: { select: { id: true, name: true, harmLevel: true } },
      },
    });

    // Recent patient logged symptoms (to detect prescribing cascades)
    const symptoms = await prisma.symptom.findMany({
      where: { patientId },
      orderBy: { dateLogged: 'desc' },
      take: 10,
    });

    const { calculateRegimenRisk } = require('../services/regimenRisk');
    const { calculateCumulativeBurden } = require('../services/burdenIndex');

    const burden = await calculateCumulativeBurden(patientId);
    const risk = await calculateRegimenRisk(patientId);

    // Identify Beers Criteria / High-Risk Deprescribing Candidates
    const deprescribingCandidates = [];
    const HIGH_ACB_DRUGS = new Set(['hydroxyzine', 'amitriptyline', 'diphenhydramine', 'chlorpheniramine', 'oxybutynin', 'promethazine']);
    const HIGH_FALL_RISK = new Set(['zolpidem', 'alprazolam', 'clonazepam', 'lorazepam', 'diazepam']);

    for (const med of activeMeds) {
      const lower = med.name.toLowerCase();
      let isCandidate = false;
      let reason = '';
      let recommendation = '';

      if (med.harmLevel >= 4) {
        isCandidate = true;
        reason = `Level ${med.harmLevel} high-risk medication with significant polypharmacy burden.`;
        recommendation = 'Assess clinical indication and consider dose reduction or safer alternative.';
      }

      for (const acb of HIGH_ACB_DRUGS) {
        if (lower.includes(acb)) {
          isCandidate = true;
          reason = `High Anticholinergic Cognitive Burden (+3 ACB score) — elevated risk of confusion, urinary retention, and falls in elderly.`;
          recommendation = 'Consider non-anticholinergic substitute (e.g. Cetirizine/Fexofenadine for allergies).';
        }
      }

      for (const sedative of HIGH_FALL_RISK) {
        if (lower.includes(sedative)) {
          isCandidate = true;
          reason = 'Sedative-hypnotic / Benzodiazepine — Beers Criteria high fall and fracture risk.';
          recommendation = 'Consider gradual taper and non-pharmacological sleep hygiene or CBT-I.';
        }
      }

      if (isCandidate) {
        deprescribingCandidates.push({
          medicineId: med.id,
          name: med.name,
          dosage: med.dosage,
          harmLevel: med.harmLevel,
          reason,
          recommendation,
        });
      }
    }

    return res.status(200).json({
      patient: {
        id: patient.id,
        age: patient.age,
        conditions: patient.conditions || [],
        allergies: patient.allergies || [],
        contact: patient.user?.email || patient.user?.phone || 'Anonymous Patient',
      },
      activeMedicines: activeMeds.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        type: m.type,
        harmLevel: m.harmLevel,
        dateAdded: m.dateAdded,
        prescribedBy: m.addedByUser?.role === 'DOCTOR' ? 'Physician' : 'Self-logged',
      })),
      discontinuedMedicines: discontinuedMeds.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        removedAt: m.removedAt,
      })),
      flags: flags.map(f => ({
        id: f.id,
        drugA: f.medicineA?.name || 'Medication A',
        drugB: f.medicineB?.name || 'Medication B',
        severity: f.severity,
        explanation: f.clinicalExplanation,
      })),
      symptoms: symptoms.map(s => ({
        id: s.id,
        description: s.description,
        date: s.dateLogged,
      })),
      anticholinergicBurden: burden,
      regimenRisk: risk,
      deprescribingCandidates,
      organToxicity: {
        renal: calculateOrganRisk(activeMeds, 'renal'),
        hepatic: calculateOrganRisk(activeMeds, 'hepatic'),
        cardiovascular: calculateOrganRisk(activeMeds, 'cardiovascular'),
        cnsCognitive: {
          score: Math.min(100, burden.totalScore * 33),
          level: burden.level,
          explanation: burden.explanation,
        },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /connection/doctor-patient/:patientId/clinical-summary]', err);
    return res.status(500).json({ error: 'Failed to generate clinical summary.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/doctor-substitute
// Doctor-auth: 1-click seamless drug substitution (discontinue high risk + prescribe alternative)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor-substitute', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const { patientId, oldMedicineId, substituteDrugName, substituteDosage, rationale } = req.body;

  if (!patientId || !oldMedicineId || !substituteDrugName?.trim()) {
    return res.status(400).json({ error: 'patientId, oldMedicineId, and substituteDrugName are required.' });
  }

  try {
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const oldMed = await prisma.medicine.findFirst({
      where: { id: oldMedicineId, patientId, removedAt: null },
    });
    if (!oldMed) {
      return res.status(404).json({ error: 'Original active medicine not found.' });
    }

    // 1. Soft-delete old medicine
    await prisma.medicine.update({
      where: { id: oldMedicineId },
      data: { removedAt: new Date() },
    });

    // 2. Remove obsolete interaction flags for old medicine
    await prisma.interactionFlag.deleteMany({
      where: {
        OR: [{ medicineAId: oldMedicineId }, { medicineBId: oldMedicineId }],
      },
    });

    // 3. Resolve and prescribe replacement drug
    const { resolveDrugWithAI } = require('../services/aiDrugResolver');
    const { getDrugHarmLevel, calculateRegimenRisk } = require('../services/regimenRisk');
    const { calculateCumulativeBurden } = require('../services/burdenIndex');

    const resolved = await resolveDrugWithAI(substituteDrugName.trim());
    const resolvedName = resolved.resolvedName || substituteDrugName.trim();
    const harmLevel = resolved.harmLevel || getDrugHarmLevel(resolvedName, resolved.class);

    const newMed = await prisma.medicine.create({
      data: {
        patientId,
        name: resolvedName,
        standardizedCode: resolved.standardizedCode || null,
        type: 'PRESCRIPTION',
        dosage: substituteDosage?.trim() || (resolved.dosageOptions?.[0] || 'Standard dose'),
        harmLevel,
        addedBy: userId,
        dateAdded: new Date(),
      },
    });

    // 4. Re-check interaction flags for new medicine
    const activeOtherMeds = await prisma.medicine.findMany({
      where: { patientId, id: { not: newMed.id }, removedAt: null },
    });

    const newFlags = [];
    for (const other of activeOtherMeds) {
      const match = await lookupInteraction(newMed.name, other.name);
      if (match.found) {
        const flag = await prisma.interactionFlag.create({
          data: {
            patientId,
            medicineAId: newMed.id,
            medicineBId: other.id,
            severity: match.severity || 'Moderate',
            clinicalExplanation: match.note || `Potential ${match.severity || 'Moderate'} interaction between ${newMed.name} and ${other.name}.`,
            plainExplanation: match.note || `Caution: ${newMed.name} may interact with ${other.name}.`,
          },
        });
        newFlags.push(flag);
      }
    }

    const cumulativeBurden = await calculateCumulativeBurden(patientId);
    const regimenRisk = await calculateRegimenRisk(patientId);

    const doctorUser = await prisma.user.findUnique({ where: { id: userId } });
    const doctorLabel = doctorUser?.email ? `Dr. ${doctorUser.email.split('@')[0]}` : 'Doctor';

    // Socket dispatch
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patient.userId}`).emit('patient-regimen-updated', {
        action: 'DOCTOR_SUBSTITUTED',
        discontinued: oldMed.name,
        prescribed: newMed.name,
        rationale: rationale || 'Optimized for geriatric safety and lower polypharmacy burden.',
        doctorLabel,
        regimenRisk,
        cumulativeBurden,
      });
    }

    return res.status(200).json({
      message: `Successfully substituted ${oldMed.name} with ${newMed.name}.`,
      discontinued: oldMed,
      prescribed: newMed,
      newFlags,
      regimenRisk,
      cumulativeBurden,
    });
  } catch (err) {
    console.error('[POST /connection/doctor-substitute]', err);
    return res.status(500).json({ error: 'Failed to substitute medication.' });
  }
});

// In-memory / cache store for clinical directives & doctor consultation notes
const doctorDirectivesStore = new Map();

// ═════════════════════════════════════════════════════════════════════════════
// POST /connection/doctor-directive
// Doctor-auth: Issues a formal clinical consultation directive / lifestyle order
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor-directive', auth, requireRole(['DOCTOR']), async (req, res) => {
  const { userId } = req.user;
  const { patientId, text, category = 'REGIMEN_ADVICE', priority = 'HIGH' } = req.body;

  if (!patientId || !text?.trim()) {
    return res.status(400).json({ error: 'patientId and directive text are required.' });
  }

  try {
    const connection = await prisma.connection.findFirst({
      where: { connectedUserId: userId, patientId, status: 'APPROVED' },
    });
    if (!connection) {
      return res.status(403).json({ error: 'No approved connection to this patient.' });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const doctorUser = await prisma.user.findUnique({ where: { id: userId } });
    const doctorName = doctorUser?.name || (doctorUser?.email ? `Dr. ${doctorUser.email.split('@')[0]}` : 'Attending Physician');

    const directive = {
      id: crypto.randomUUID(),
      patientId,
      doctorId: userId,
      doctorName,
      text: text.trim(),
      category,
      priority,
      issuedAt: new Date().toISOString(),
    };

    const existing = doctorDirectivesStore.get(patientId) || [];
    doctorDirectivesStore.set(patientId, [directive, ...existing].slice(0, 20));

    // Emit live event
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patient.userId}`).emit('doctor-directive-received', directive);
    }

    return res.status(201).json({
      message: 'Clinical directive published successfully.',
      directive,
    });
  } catch (err) {
    console.error('[POST /connection/doctor-directive]', err);
    return res.status(500).json({ error: 'Failed to publish clinical directive.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /connection/doctor-patient/:patientId/directives
// Fetches active directives for a patient
// ═════════════════════════════════════════════════════════════════════════════
router.get('/doctor-patient/:patientId/directives', auth, async (req, res) => {
  const { patientId } = req.params;
  const directives = doctorDirectivesStore.get(patientId) || [];
  return res.status(200).json({ directives });
});

/** Helper: Computes organ toxicity burden index */
function calculateOrganRisk(activeMeds, organType) {
  const ORGAN_DRUG_MAP = {
    renal: ['ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'furosemide', 'gentamicin', 'vancomycin', 'cisplatin', 'lithium'],
    hepatic: ['acetaminophen', 'paracetamol', 'atorvastatin', 'simvastatin', 'methotrexate', 'amiodarone', 'valproate', 'isoniazid'],
    cardiovascular: ['amiodarone', 'sotalol', 'citalopram', 'erythromycin', 'azithromycin', 'haloperidol', 'ondansetron', 'warfarin', 'digoxin'],
  };

  const targetList = ORGAN_DRUG_MAP[organType] || [];
  let score = 0;
  const flaggedMeds = [];

  for (const m of activeMeds) {
    const lower = (m.name || '').toLowerCase();
    for (const key of targetList) {
      if (lower.includes(key)) {
        score += 25;
        flaggedMeds.push(m.name);
        break;
      }
    }
  }

  score = Math.min(100, score);
  const level = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low';

  return {
    score,
    level,
    flaggedMeds,
  };
}

module.exports = router;

