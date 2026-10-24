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
const { screenFoodDrugInteractions } = require('../services/foodDrugService');
const { getSaferAlternativeSuggestions } = require('../services/alternativeSuggestions');
const { generateExplanation } = require('../services/explanationGenerator');

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

    // 4. Screen food/lifestyle interactions and clinical alternatives for involved drugs
    const involvedMedicines = [
      flag.medicineA ? { name: flag.medicineA.name, dosage: flag.medicineA.dosage } : null,
      flag.medicineB ? { name: flag.medicineB.name, dosage: flag.medicineB.dosage } : null,
    ].filter(Boolean);

    const foodInteractions = screenFoodDrugInteractions(involvedMedicines);
    const alternativeSuggestions = getSaferAlternativeSuggestions(involvedMedicines);

    const doctorQuestions = [
      `Is the combination of ${flag.medicineA?.name} and ${flag.medicineB?.name} strictly indicated for my clinical state, or is a safer non-interacting alternative available?`,
      `Should we adjust the timing (e.g., separating doses by 2 to 4 hours) or modify dosages to minimize pharmacological conflict?`,
      `What specific warning symptoms or baseline lab tests (e.g. INR, serum creatinine, liver enzymes, electrolytes) should be monitored?`,
    ];

    const actionPlan = flag.severity === 'Major' || flag.severity === 'Contraindicated'
      ? `Notify your prescribing physician or clinical pharmacist immediately regarding ${flag.medicineA?.name} + ${flag.medicineB?.name}. Do not alter prescribed doses abruptly without clinical supervision.`
      : `Discuss this combination during your next routine medical review. Take note of any new symptoms such as dizziness, fatigue, or upset stomach.`;

    const lang = String(req.query.lang || 'en').toLowerCase();
    let clinicalExp = flag.clinicalExplanation;
    let plainExp = flag.plainExplanation;
    let isTranslated = false;
    let generatedSource = flag.generatedBy ?? 'fallback';

    if (lang === 'hi' || lang === 'gu') {
      try {
        const localized = await generateExplanation({
          drugA: flag.medicineA?.name,
          drugB: flag.medicineB?.name,
          severity: flag.severity,
          burdenScore: burdenResult.totalScore,
          burdenLevel: burdenResult.level,
          patientAge: flag.patient?.age,
          patientConditions: flag.patient?.conditions,
          flagId: flag.id,
          lang,
        });
        if (localized) {
          clinicalExp = localized.clinical || clinicalExp;
          plainExp = localized.plain || plainExp;
          isTranslated = true;
          generatedSource = localized.generatedBy || generatedSource;
        }
      } catch (e) {
        console.warn(`[interactionFlag] Localized explanation failed for ${lang}:`, e.message);
      }
    }

    return res.status(200).json({
      flag: {
        id:                  flag.id,
        severity:            flag.severity,
        clinicalExplanation: clinicalExp,
        plainExplanation:    plainExp,
        isTranslated,
        lang,
        // 'groq' | 'fallback' | 'timeout' | 'demo-mock' — drives contextual UI in RiskAnalysisPage
        generatedBy:         generatedSource,
        dateFlagged:         flag.dateFlagged,
        medicineA:           flag.medicineA,
        medicineB:           flag.medicineB,
        actionPlan,
        doctorQuestions,
        patient: {
          age:        flag.patient?.age ?? null,
          conditions: flag.patient?.conditions ?? [],
        },
      },
      foodInteractions,
      alternativeSuggestions,
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
