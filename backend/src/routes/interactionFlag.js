'use strict';

/**
 * GET /interaction-flag/:id
 *
 * Returns the full InteractionFlag record including:
 *   - both drug names + severity
 *   - clinical and plain explanations (Groq-generated or fallback)
 *   - cumulative burden snapshot (recalculated live)
 *   - burden index breakdown per medicine
 *
 * Access rules:
 *   - PATIENT: can only read their own flags
 *   - DOCTOR: can read flags for any patient they are actively connected to (Connection status = ACCEPTED)
 *   - CAREGIVER: can read flags for patients they are connected to
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const { calculateCumulativeBurden } = require('../services/burdenIndex');

const router = express.Router();

// ═════════════════════════════════════════════════════════════════════════════
// GET /interaction-flag/:id
// ═════════════════════════════════════════════════════════════════════════════
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;

  try {
    // 1. Fetch the flag with both medicines
    const flag = await prisma.interactionFlag.findUnique({
      where: { id },
      include: {
        patient:   true,
        medicineA: { select: { id: true, name: true, type: true, dosage: true, standardizedCode: true } },
        medicineB: { select: { id: true, name: true, type: true, dosage: true, standardizedCode: true } },
      },
    });

    if (!flag) {
      return res.status(404).json({ error: 'Interaction flag not found.' });
    }

    // 2. Authorization check
    const isPatientOwner = flag.patient?.userId === userId;

    if (role === 'PATIENT') {
      if (!isPatientOwner) {
        return res.status(403).json({ error: 'You do not have permission to view this flag.' });
      }
    } else if (role === 'DOCTOR' || role === 'CAREGIVER') {
      if (!isPatientOwner) {
        // Doctor or Caregiver must have an approved connection to this patient
        const connection = await prisma.connection.findFirst({
          where: {
            connectedUserId: userId,
            patientId: flag.patientId,
            status: 'APPROVED',
          },
        });
        if (!connection) {
          return res.status(403).json({
            error: 'You are not connected to this patient. Ask them to share access first.',
          });
        }
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // 3. Recalculate cumulative burden live (includes the new medicine)
    const burdenResult = await calculateCumulativeBurden(flag.patientId);

    return res.status(200).json({
      flag: {
        id:                  flag.id,
        severity:            flag.severity,
        clinicalExplanation: flag.clinicalExplanation,
        plainExplanation:    flag.plainExplanation,
        // 'groq' | 'fallback' | 'timeout' | 'demo-mock' — drives contextual UI in RiskAnalysisPage
        generatedBy:         flag.generatedBy ?? 'fallback',
        dateFlagged:         flag.dateFlagged,
        medicineA:           flag.medicineA,
        medicineB:           flag.medicineB,
        patient: {
          age:        flag.patient?.age ?? null,
          conditions: flag.patient?.conditions ?? [],
        },
      },
      burden: {
        totalScore:  burdenResult.totalScore,
        level:       burdenResult.level,
        explanation: burdenResult.explanation,
        breakdown:   burdenResult.breakdown,   // per-drug scores
        count:       burdenResult.count,
      },
    });
  } catch (err) {
    console.error('[GET /interaction-flag/:id]', err);
    res.status(500).json({ error: 'Failed to load interaction flag details.' });
  }
});

module.exports = router;
