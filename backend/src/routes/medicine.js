'use strict';

const express = require('express');
const axios = require('axios');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { lookupAllPairs } = require('../services/interactionLookup');
const { isDemoMode, getMockRxCui } = require('../lib/demo');

const router = express.Router();

const { calculateCumulativeBurden } = require('../services/burdenIndex');
const { generateExplanation } = require('../services/explanationGenerator');

// ─── Zod schema ──────────────────────────────────────────────────────────────
const medicineSchema = z.object({
  name: z.string().trim().min(1, 'Medicine name is required'),
  type: z.enum(['PRESCRIPTION', 'OTC', 'HERBAL']),
  dosage: z.string().trim().optional(),
});

function validate(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error?.issues ?? result.error?.errors ?? [];
    res.status(400).json({ error: issues.map((i) => i.message).join(', ') });
    return null;
  }
  return result.data;
}

// ─── RxNorm standardisation ───────────────────────────────────────────────────
// If the drug name has no RxNorm match (common for herbal/Ayurvedic/brand-only
// drugs), we return null and the medicine is saved with standardizedCode=null.
// This is a graceful non-failure — the interaction check continues by name
// matching. We do NOT return a 404 or 422 here.
async function lookupRxCui(name) {
  // ── DEMO MOCK ── RxNorm/RxNav not called. Remove DEMO_MODE=true for production.
  if (isDemoMode()) {
    const mockCui = getMockRxCui(name);
    console.log(`[rxnorm] DEMO_MODE=true — mock RxCUI for "${name}": ${mockCui ?? 'no match (null, non-failing)'}`);
    return mockCui; // null is valid — means no standardised code, not an error
  }

  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&allSourcesFlag=1`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const rxcui = data?.idGroup?.rxnormId?.[0] ?? null;
    // null means no match — not an error. Medicine saves with standardizedCode=null.
    // Interaction check will still run using the drug name string.
    return rxcui;
  } catch (rxErr) {
    // RxNorm is a non-critical service. Any network/timeout error is swallowed
    // here so it never causes the medicine-add request to fail.
    // The drug is saved with standardizedCode=null and the check runs by name.
    const timedOut  = rxErr.code === 'ECONNABORTED' || rxErr.message?.includes('timeout');
    const noNetwork = rxErr.code === 'ENOTFOUND'    || rxErr.code === 'ECONNREFUSED';
    console.warn(
      `[rxnorm] Lookup failed for "${name}" — ${
        timedOut  ? 'request timed out after 5s' :
        noNetwork ? 'RxNav unreachable (network error)' :
        `HTTP ${rxErr.response?.status ?? 'unknown'}: ${rxErr.response?.data?.message || rxErr.message}`
      } — saving medicine with standardizedCode=null (non-failing).`
    );
    return null; // graceful non-failure: medicine still saved, interaction check still runs
  }
}

// ─── Severity → plain english ──────────────────────────────────────────────────
const SEVERITY_PLAIN = {
  Major:           'This combination can cause serious harm. Talk to your doctor before taking both.',
  Moderate:        'These medicines may interact. Monitor for side effects and inform your doctor.',
  Minor:           'A minor interaction is possible. No immediate action needed, but keep your doctor informed.',
  Contraindicated: 'These medicines should NOT be taken together. Consult your doctor or pharmacist immediately.',
  Unknown:         'An interaction was detected but the severity is not yet classified. Ask your doctor.',
};

function plainExplanation(severity) {
  return SEVERITY_PLAIN[severity] ?? 'An interaction was flagged. Please consult your doctor.';
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /medicine
// ═════════════════════════════════════════════════════════════════════════════
router.post('/', auth, requireRole(['PATIENT', 'CAREGIVER']), async (req, res) => {
  const data = validate(medicineSchema, req.body, res);
  if (!data) return;

  const { name, type, dosage } = data;
  const { userId } = req.user;

  // grab io so we can emit after the HTTP response is sent
  const io = req.app.get('io');

  try {
    // ── 1. Resolve the patient row ────────────────────────────────────────────
    let patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(401).json({ error: 'User account not found. Please sign in again.' });
      }
      patient = await prisma.patient.create({
        data: {
          userId,
          age: 65,
          conditions: [],
          allergies: [],
        },
      });
    }

    // ── 2. RxNorm standardisation ─────────────────────────────────────────────
    const standardizedCode = await lookupRxCui(name);
    console.log(
      `[rxnorm] "${name}" → ${standardizedCode ? `RxCUI ${standardizedCode}` : 'no match'}`
    );

    // ── 3. Duplicate detection ────────────────────────────────────────────────
    if (standardizedCode) {
      const existing = await prisma.medicine.findFirst({
        where: { patientId: patient.id, standardizedCode },
      });
      if (existing) {
        return res.status(409).json({
          error: 'Already in your list — update dosage instead?',
          existingMedicine: {
            id: existing.id,
            name: existing.name,
            dosage: existing.dosage,
            standardizedCode: existing.standardizedCode,
            dateAdded: existing.dateAdded,
          },
        });
      }
    }

    // ── 4. Save to DB ─────────────────────────────────────────────────────────
    const medicine = await prisma.medicine.create({
      data: {
        patientId:        patient.id,
        name:             name.trim(),
        standardizedCode: standardizedCode ?? null,
        type,
        dosage:           dosage?.trim() ?? null,
        addedBy:          userId,
        dateAdded:        new Date(),
      },
    });

    // ── 5. Respond immediately — don't block on interaction check ─────────────
    res.status(201).json({
      message: 'Medicine added successfully.',
      medicine: {
        id:               medicine.id,
        name:             medicine.name,
        type:             medicine.type,
        dosage:           medicine.dosage,
        standardizedCode: medicine.standardizedCode,
        standardized:     !!medicine.standardizedCode,
        dateAdded:        medicine.dateAdded,
      },
      rxNorm: {
        searched: name,
        found:    !!standardizedCode,
        rxcui:    standardizedCode,
        note:     standardizedCode
          ? 'Drug standardized via RxNorm — interaction check running in background.'
          : 'Drug not in RxNorm (common for herbal/Ayurvedic). Checking by name matching.',
      },
      checkingInteractions: true, // tells the frontend to open the socket listener
    });

    // ── 6. ASYNC: Interaction check + Burden calculation + emit via Socket.io ──
    // Run after HTTP response is flushed — never blocks the patient's UX.
    setImmediate(async () => {
      const room = `patient-${userId}`;
      try {
        // Calculate cumulative anticholinergic/sedative burden index
        const cumulativeBurden = await calculateCumulativeBurden(patient.id);

        // Fetch all OTHER medicines for this patient (include type for herb-drug check)
        const existingMeds = await prisma.medicine.findMany({
          where: { patientId: patient.id, id: { not: medicine.id } },
          select: { id: true, name: true, type: true },
        });

        if (existingMeds.length === 0) {
          // First medicine — nothing to check pairwise against
          io.to(room).emit('interaction-checked', {
            newMedicineId:   medicine.id,
            newMedicineName: medicine.name,
            flagsFound:      [],
            notInDataset:    [],
            cumulativeBurden,
            summary: 'no-prior-medicines',
            message: 'No other medicines in your list — nothing to check against yet.',
          });
          return;
        }

        // Only check pairs that include the NEW medicine
        const pairsToCheck = existingMeds.map((m) => ({
          drugA: medicine.name,
          drugB: m.name,
          existingMedId: m.id,
        }));

        const flagsCreated = [];
        const notInDataset = [];

        // ── DDInter check — runs for ALL medicine types ────────────────────────
        for (const pair of pairsToCheck) {
          const result = await lookupAllPairs([pair.drugA, pair.drugB], { includeNotFound: true });
          const match = result[0]; // single pair → one result

          if (!match) continue;

          if (match.found) {
            // Generate clinical & plain explanations using Groq (8s timeout + safe fallback)
            const explanation = await generateExplanation({
              drugA: pair.drugA,
              drugB: pair.drugB,
              severity: match.severity,
              burdenScore: cumulativeBurden.totalScore,
              burdenLevel: cumulativeBurden.level,
              patientAge: patient.age,
              patientConditions: patient.conditions || [],
            });

            // Create InteractionFlag record with clinical & plain explanation + generatedBy source
            const flag = await prisma.interactionFlag.create({
              data: {
                patientId:           patient.id,
                medicineAId:         medicine.id,
                medicineBId:         pair.existingMedId,
                severity:            match.severity,
                clinicalExplanation: explanation.clinical,
                plainExplanation:    explanation.plain,
                generatedBy:         explanation.generatedBy ?? 'fallback', // persisted for frontend UI
                dateFlagged:         new Date(),
              },
            });

            flagsCreated.push({
              flagId:               flag.id,
              drugA:                pair.drugA,
              drugB:                pair.drugB,
              severity:             match.severity,
              clinicalExplanation:  flag.clinicalExplanation,
              plainExplanation:     flag.plainExplanation,
              cumulativeBurdenLevel: cumulativeBurden.level,
              generatedBy:          explanation.generatedBy,
              source:               'ddinter',
            });
          } else if (match.notInDataset) {
            notInDataset.push({ drugA: pair.drugA, drugB: pair.drugB });
          }
        }

        // ── Herb-drug check — HERBAL medicines only ────────────────────────────
        // Checks the new herb against ALL existing medicines (including non-herbals).
        // Also checks existing herbals against the newly added non-herbal medicine.
        if (medicine.type === 'HERBAL' || existingMeds.some((m) => m.type === 'HERBAL')) {
          // Herb references are in HerbDrugReference — load them once
          const allHerbRefs = await prisma.herbDrugReference.findMany();

          for (const pair of pairsToCheck) {
            // Determine which is the herb (A or B)
            const herbName = medicine.type === 'HERBAL' ? pair.drugA : pair.drugB;
            const drugName = medicine.type === 'HERBAL' ? pair.drugB : pair.drugA;

            // Avoid double-flagging pairs already caught by DDInter
            const alreadyFlagged = flagsCreated.some(
              (f) =>
                (f.drugA.toLowerCase() === pair.drugA.toLowerCase() &&
                  f.drugB.toLowerCase() === pair.drugB.toLowerCase()) ||
                (f.drugA.toLowerCase() === pair.drugB.toLowerCase() &&
                  f.drugB.toLowerCase() === pair.drugA.toLowerCase())
            );
            if (alreadyFlagged) continue;

            const herbNameLower = herbName.toLowerCase().trim();
            const drugNameLower = drugName.toLowerCase().trim();

            // Match: herbName in the HerbDrugReference herbName (partial / token)
            // and the drugName field appears in the existing drug name OR is a
            // category label that matches a token in the existing drug name
            const herbRef = allHerbRefs.find((ref) => {
              const refHerb = ref.herbName.toLowerCase();
              const refDrug = ref.drugName.toLowerCase();

              // Herb must match: the ref herb is contained in or equal to the
              // added medicine's name
              const herbMatch = herbNameLower.includes(refHerb) || refHerb.includes(herbNameLower);
              if (!herbMatch) return false;

              // Drug must match: the ref drug word appears in the paired drug name,
              // or the paired drug name appears in the ref drug
              return (
                drugNameLower.includes(refDrug) ||
                refDrug.includes(drugNameLower) ||
                // class match: "warfarin" matches ref "warfarin", "blood thinner", etc.
                refDrug.split(/\s+/).some((w) => w.length > 3 && drugNameLower.includes(w))
              );
            });

            if (!herbRef) continue;

            // Found a herb-drug match — generate explanation and create flag
            const explanation = await generateExplanation({
              drugA: pair.drugA,
              drugB: pair.drugB,
              severity: herbRef.severity,
              burdenScore: cumulativeBurden.totalScore,
              burdenLevel: cumulativeBurden.level,
              patientAge: patient.age,
              patientConditions: patient.conditions || [],
            });

            const herbMedId   = medicine.type === 'HERBAL' ? medicine.id : pair.existingMedId;
            const drugMedId   = medicine.type === 'HERBAL' ? pair.existingMedId : medicine.id;

            const flag = await prisma.interactionFlag.create({
              data: {
                patientId:           patient.id,
                medicineAId:         herbMedId,
                medicineBId:         drugMedId,
                severity:            herbRef.severity,
                clinicalExplanation: explanation.clinical || herbRef.description,
                plainExplanation:    explanation.plain || herbRef.description,
                generatedBy:         explanation.generatedBy ?? 'fallback', // persisted for frontend UI
                dateFlagged:         new Date(),
              },
            });

            flagsCreated.push({
              flagId:               flag.id,
              drugA:                pair.drugA,
              drugB:                pair.drugB,
              severity:             herbRef.severity,
              clinicalExplanation:  flag.clinicalExplanation,
              plainExplanation:     flag.plainExplanation,
              cumulativeBurdenLevel: cumulativeBurden.level,
              generatedBy:          explanation.generatedBy,
              source:               'herb-drug', // lets frontend show a herb icon
            });

            console.log(
              `[herb-drug] Herb-drug flag: ${herbName} ↔ ${drugName} (${herbRef.severity}) for patient ${userId}`
            );
          }
        }

        // Emit result + cumulative burden to the patient's socket room
        io.to(room).emit('interaction-checked', {
          newMedicineId:   medicine.id,
          newMedicineName: medicine.name,
          flagsFound:      flagsCreated,
          notInDataset,
          cumulativeBurden,
          summary: flagsCreated.length > 0 ? 'flags-found' : 'all-clear',
          message: flagsCreated.length > 0
            ? `${flagsCreated.length} interaction${flagsCreated.length > 1 ? 's' : ''} found with your current medicines.`
            : 'No known interactions found with your current medicines.',
          checkedCount: pairsToCheck.length,
        });

        console.log(
          `[interaction-check] Patient ${userId} | ${flagsCreated.length} flags | Burden Score: ${cumulativeBurden.totalScore} (${cumulativeBurden.level})`
        );
      } catch (err) {
        console.error('[interaction-check async]', err);
        // Emit a graceful error so the frontend spinner doesn't hang forever
        io.to(room).emit('interaction-checked', {
          newMedicineId:   medicine.id,
          newMedicineName: medicine.name,
          flagsFound:      [],
          notInDataset:    [],
          cumulativeBurden: { totalScore: 0, level: 'Normal' },
          summary: 'check-error',
          message: 'Interaction check encountered an error. Please review manually.',
          error: true,
        });
      }
    });
  } catch (err) {
    console.error('[POST /medicine]', err);
    res.status(500).json({ error: 'Failed to add medicine. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /medicine (Returns only active, non-discontinued medicines)
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(200).json({ medicines: [] });

    const medicines = await prisma.medicine.findMany({
      where: { patientId: patient.id, removedAt: null },
      orderBy: { dateAdded: 'desc' },
    });

    return res.status(200).json({
      medicines: medicines.map((m) => ({
        id:               m.id,
        name:             m.name,
        type:             m.type,
        dosage:           m.dosage,
        standardizedCode: m.standardizedCode,
        standardized:     !!m.standardizedCode,
        dateAdded:        m.dateAdded,
      })),
    });
  } catch (err) {
    console.error('[GET /medicine]', err);
    res.status(500).json({ error: 'Failed to fetch medicines.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /medicine/:id — Edit dosage and/or medicine type (Prescription/OTC/Herbal)
// ═════════════════════════════════════════════════════════════════════════════
router.put('/:id', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { dosage, type, name: prohibitedName, standardizedCode: prohibitedCode } = req.body;

  if (prohibitedName !== undefined || prohibitedCode !== undefined) {
    return res.status(400).json({
      error: 'Drug name and code cannot be modified. If the drug is incorrect, discontinue it and add the new one.',
    });
  }

  const validTypes = ['PRESCRIPTION', 'OTC', 'HERBAL'];
  if (type && !validTypes.includes(type.toUpperCase())) {
    return res.status(400).json({
      error: `Invalid medicine type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const existing = await prisma.medicine.findFirst({
      where: { id, patientId: patient.id, removedAt: null },
    });
    if (!existing) return res.status(404).json({ error: 'Active medicine not found in your list.' });

    const updateData = {};
    if (dosage !== undefined) updateData.dosage = dosage ? String(dosage).trim() : null;
    if (type) updateData.type = type.toUpperCase();

    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    // Recalculate cumulative burden score
    const cumulativeBurden = await calculateCumulativeBurden(patient.id);

    return res.status(200).json({
      message: 'Medicine updated successfully.',
      medicine: {
        id:               updatedMedicine.id,
        name:             updatedMedicine.name,
        type:             updatedMedicine.type,
        dosage:           updatedMedicine.dosage,
        standardizedCode: updatedMedicine.standardizedCode,
        dateAdded:        updatedMedicine.dateAdded,
      },
      cumulativeBurden,
    });
  } catch (err) {
    console.error('[PUT /medicine/:id]', err);
    res.status(500).json({ error: 'Failed to update medicine.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /medicine/:id — Soft-delete (sets removedAt timestamp)
// ═════════════════════════════════════════════════════════════════════════════
router.delete('/:id', auth, requireRole(['PATIENT']), async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(404).json({ error: 'Patient profile not found.' });

    const medicine = await prisma.medicine.findFirst({
      where: { id, patientId: patient.id, removedAt: null },
    });
    if (!medicine) return res.status(404).json({ error: 'Active medicine not found in your list.' });

    const removedAt = new Date();
    await prisma.medicine.update({
      where: { id },
      data:  { removedAt },
    });

    // Recalculate cumulative burden after discontinuation
    const cumulativeBurden = await calculateCumulativeBurden(patient.id);

    return res.status(200).json({
      message: `"${medicine.name}" has been marked as discontinued.`,
      medicineId: id,
      removedAt,
      cumulativeBurden,
    });
  } catch (err) {
    console.error('[DELETE /medicine/:id]', err);
    res.status(500).json({ error: 'Failed to remove medicine.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /medicine/search?q=<query> — Real-time drug name autocomplete
// Queries: 1) Curated brand alias dictionary  2) RxNorm Suggest API
//          3) Local DDInter reference database
// Returns up to 10 unique suggestions with source, category, dosage options, safety tips
// ═════════════════════════════════════════════════════════════════════════════
const BRAND_ALIASES = {
  'naxdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'nexdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'dolo':        { display: 'Dolo 650 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '650 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'crocin':      { display: 'Crocin (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Monitor total daily paracetamol intake across all cold/fever formulations.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'pan-d':       { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pand':        { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'augmentin':   { display: 'Augmentin (Amoxicillin + Clavulanate)', generic: 'Amoxicillin', rxcui: '723', dosage: '625 mg', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ecosprin':    { display: 'Ecosprin (Aspirin)', generic: 'Aspirin', rxcui: '1191', dosage: '75 mg', category: 'Antiplatelet / Cardio', safetyTip: 'Low-dose cardio-protective. Take with food to minimize gastric bleeding risk.', dosageOptions: ['75 mg', '150 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'combiflam':   { display: 'Combiflam (Ibuprofen + Paracetamol)', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', category: 'NSAID / Pain Relief', safetyTip: 'Take after meals. Avoid if you have active peptic ulcer or renal impairment.', dosageOptions: ['400 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'telma':       { display: 'Telma (Telmisartan)', generic: 'Telmisartan', rxcui: '42355', dosage: '40 mg', category: 'Antihypertensive (ARB)', safetyTip: 'Take consistently at the same time each day; monitor blood pressure regularly.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'voveran':     { display: 'Voveran (Diclofenac)', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', category: 'NSAID / Anti-inflammatory', safetyTip: 'Potent anti-inflammatory. Take with food or antacid to avoid stomach irritation.', dosageOptions: ['50 mg', '75 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'shelcal':     { display: 'Shelcal 500 (Calcium + Vitamin D3)', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', category: 'Bone Health / Mineral', safetyTip: 'Take with or after lunch for optimal absorption; separate from iron supplements by 2 hours.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'warfarin':    { display: 'Warfarin', generic: 'Warfarin', rxcui: '11289', dosage: '5 mg', category: 'Anticoagulant (Blood Thinner)', safetyTip: 'CRITICAL: Maintain consistent Vitamin K intake. Regular INR blood tests required. Avoid NSAIDs.', dosageOptions: ['1 mg', '2 mg', '2.5 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aspirin':     { display: 'Aspirin', generic: 'Aspirin', rxcui: '1191', dosage: '81 mg', category: 'Antiplatelet / NSAID', safetyTip: 'Take with food or a full glass of water. Report any unusual bruising or bleeding immediately.', dosageOptions: ['75 mg', '81 mg', '100 mg', '325 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'metformin':   { display: 'Metformin', generic: 'Metformin', rxcui: '6809', dosage: '500 mg', category: 'Antidiabetic (Biguanide)', safetyTip: 'Take with or immediately after meals to reduce gastrointestinal upset.', dosageOptions: ['250 mg', '500 mg', '850 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'atorvastatin':{ display: 'Atorvastatin', generic: 'Atorvastatin', rxcui: '83367', dosage: '10 mg', category: 'Statin / Cholesterol', safetyTip: 'Usually taken at bedtime. Avoid excessive grapefruit juice. Report muscle pain.', dosageOptions: ['10 mg', '20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'lisinopril':  { display: 'Lisinopril', generic: 'Lisinopril', rxcui: '29046', dosage: '10 mg', category: 'Antihypertensive (ACEi)', safetyTip: 'Monitor for persistent dry cough or dizziness when standing up.', dosageOptions: ['2.5 mg', '5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'amlodipine':  { display: 'Amlodipine', generic: 'Amlodipine', rxcui: '17767', dosage: '5 mg', category: 'Calcium Channel Blocker', safetyTip: 'Check for ankle swelling (peripheral edema) or lightheadedness.', dosageOptions: ['2.5 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'simvastatin': { display: 'Simvastatin', generic: 'Simvastatin', rxcui: '36567', dosage: '20 mg', category: 'Statin / Cholesterol', safetyTip: 'Take in the evening. Avoid strong CYP3A4 inhibitors (e.g. fluconazole, clarithromycin).', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'omeprazole':  { display: 'Omeprazole', generic: 'Omeprazole', rxcui: '40790', dosage: '20 mg', category: 'PPI / Antacid', safetyTip: 'Take 30-60 minutes before the first meal of the day.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ibuprofen':   { display: 'Ibuprofen', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', category: 'NSAID / Pain Relief', safetyTip: 'Always take with food or milk. High risk of interaction with blood thinners (Warfarin/Aspirin).', dosageOptions: ['200 mg', '400 mg', '600 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'fluconazole': { display: 'Fluconazole', generic: 'Fluconazole', rxcui: '4450', dosage: '150 mg', category: 'Antifungal', safetyTip: 'Potent CYP enzyme inhibitor — significantly elevates statin and warfarin blood levels.', dosageOptions: ['50 mg', '150 mg', '200 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'losartan':    { display: 'Losartan', generic: 'Losartan', rxcui: '52175', dosage: '50 mg', category: 'Antihypertensive (ARB)', safetyTip: 'Avoid potassium supplements or salt substitutes containing potassium without consulting doctor.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'metoprolol':  { display: 'Metoprolol', generic: 'Metoprolol', rxcui: '6918', dosage: '50 mg', category: 'Beta Blocker', safetyTip: 'Take with or right after food. Do not stop abruptly — taper under medical guidance.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'prednisone':  { display: 'Prednisone', generic: 'Prednisone', rxcui: '8640', dosage: '10 mg', category: 'Corticosteroid', safetyTip: 'Take with morning food to mimic natural cortisol cycle and minimize insomnia.', dosageOptions: ['5 mg', '10 mg', '20 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'levothyroxine':{ display: 'Levothyroxine', generic: 'Levothyroxine', rxcui: '10582', dosage: '50 mcg', category: 'Thyroid Hormone', safetyTip: 'Take first thing in the morning on an empty stomach with a full glass of water, 30-60 min before breakfast.', dosageOptions: ['25 mcg', '50 mcg', '75 mcg', '100 mcg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'azithromycin':{ display: 'Azithromycin', generic: 'Azithromycin', rxcui: '18631', dosage: '500 mg', category: 'Macrolide Antibiotic', safetyTip: 'Take 1 hour before or 2 hours after food. Separate from aluminium/magnesium antacids.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'cetirizine':  { display: 'Cetirizine', generic: 'Cetirizine', rxcui: '20610', dosage: '10 mg', category: 'Antihistamine (Allergy)', safetyTip: 'May cause mild drowsiness. Best taken in the evening with water.', dosageOptions: ['5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'pantoprazole':{ display: 'Pantoprazole', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Swallow whole — do not crush or chew. Take 30-60 min before breakfast.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ranitidine':  { display: 'Ranitidine', generic: 'Ranitidine', rxcui: '9143', dosage: '150 mg', category: 'H2 Blocker / Antacid', safetyTip: 'Can be taken with or without food. Used for short-term relief of acid indigestion.', dosageOptions: ['75 mg', '150 mg', '300 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'montelukast': { display: 'Montelukast', generic: 'Montelukast', rxcui: '88249', dosage: '10 mg', category: 'Leukotriene Inhibitor (Asthma)', safetyTip: 'Usually taken once daily in the evening for asthma and allergic rhinitis.', dosageOptions: ['4 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'gabapentin':  { display: 'Gabapentin', generic: 'Gabapentin', rxcui: '25480', dosage: '300 mg', category: 'Anticonvulsant / Neuropathic', safetyTip: 'May cause dizziness or sedation; avoid alcohol. Do not abruptly discontinue.', dosageOptions: ['100 mg', '300 mg', '600 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'clopidogrel': { display: 'Clopidogrel', generic: 'Clopidogrel', rxcui: '32968', dosage: '75 mg', category: 'Antiplatelet', safetyTip: 'Do not stop without cardiologist advice. Avoid taking with omeprazole unless directed.', dosageOptions: ['75 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'rosuvastatin':{ display: 'Rosuvastatin', generic: 'Rosuvastatin', rxcui: '301542', dosage: '10 mg', category: 'Statin / Cholesterol', safetyTip: 'Can be taken at any time of day, with or without food. Report unexplained muscle aches.', dosageOptions: ['5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'amoxicillin': { display: 'Amoxicillin', generic: 'Amoxicillin', rxcui: '723', dosage: '500 mg', category: 'Penicillin Antibiotic', safetyTip: 'Take at evenly spaced intervals and finish the entire prescription.', dosageOptions: ['250 mg', '500 mg', '875 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'ciprofloxacin':{ display: 'Ciprofloxacin', generic: 'Ciprofloxacin', rxcui: '2551', dosage: '500 mg', category: 'Fluoroquinolone Antibiotic', safetyTip: 'Do not take with dairy products or calcium-fortified juices alone. Drink plenty of fluids.', dosageOptions: ['250 mg', '500 mg', '750 mg'], commonFrequency: 'twice', foodInstruction: 'avoid_dairy' },
  'diclofenac':  { display: 'Diclofenac', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', category: 'NSAID / Pain Relief', safetyTip: 'Take with food. Monitor for fluid retention, blood pressure changes, or GI distress.', dosageOptions: ['25 mg', '50 mg', '75 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naproxen':    { display: 'Naproxen', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Anti-inflammatory', safetyTip: 'Take with food or milk. Avoid taking multiple NSAIDs concurrently.', dosageOptions: ['250 mg', '375 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'tramadol':    { display: 'Tramadol', generic: 'Tramadol', rxcui: '10689', dosage: '50 mg', category: 'Opioid Analgesic', safetyTip: 'Risk of sedation and serotonin syndrome when taken with SSRI antidepressants.', dosageOptions: ['50 mg', '100 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_food' },
  'sertraline':  { display: 'Sertraline', generic: 'Sertraline', rxcui: '36437', dosage: '50 mg', category: 'SSRI Antidepressant', safetyTip: 'Take once daily in morning or evening. Takes 2-4 weeks for full therapeutic effect.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'fluoxetine':  { display: 'Fluoxetine', generic: 'Fluoxetine', rxcui: '4493', dosage: '20 mg', category: 'SSRI Antidepressant', safetyTip: 'Usually taken in the morning due to energizing effect. Long half-life.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'clonazepam':  { display: 'Clonazepam', generic: 'Clonazepam', rxcui: '2598', dosage: '0.5 mg', category: 'Benzodiazepine / Sedative', safetyTip: 'HIGH SEDATION: Additive CNS depression when combined with opioids or antihistamines.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg', '2 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'alprazolam':  { display: 'Alprazolam', generic: 'Alprazolam', rxcui: '596', dosage: '0.25 mg', category: 'Benzodiazepine / Anxiolytic', safetyTip: 'Short-acting sedative. Avoid alcohol. May impair driving/machinery operation.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'hydrochlorothiazide': { display: 'Hydrochlorothiazide', generic: 'Hydrochlorothiazide', rxcui: '5487', dosage: '25 mg', category: 'Thiazide Diuretic', safetyTip: 'Take in the morning to prevent nighttime urination. Stay hydrated.', dosageOptions: ['12.5 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'furosemide':  { display: 'Furosemide', generic: 'Furosemide', rxcui: '4603', dosage: '40 mg', category: 'Loop Diuretic', safetyTip: 'Take early in the day. Monitor potassium levels and blood pressure.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'paracetamol': { display: 'Paracetamol (Acetaminophen)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'acetaminophen':{ display: 'Acetaminophen (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'turmeric':    { display: 'Turmeric (Curcumin)', generic: 'Turmeric', rxcui: null, dosage: '500 mg', category: 'Ayurvedic / Herbal Anti-inflammatory', safetyTip: 'Natural anticoagulant effect — moderate bleeding interaction risk with Warfarin/Aspirin.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'ashwagandha': { display: 'Ashwagandha (Withania somnifera)', generic: 'Ashwagandha', rxcui: null, dosage: '300 mg', category: 'Ayurvedic Adaptogen / Calming', safetyTip: 'May have additive sedative effect when combined with CNS depressants or thyroid meds.', dosageOptions: ['300 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginkgo':      { display: 'Ginkgo Biloba', generic: 'Ginkgo', rxcui: null, dosage: '120 mg', category: 'Herbal Supplement (Cognitive)', safetyTip: 'Inhibits platelet aggregation — increased bleeding risk when paired with blood thinners.', dosageOptions: ['60 mg', '120 mg', '240 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginseng':     { display: 'Ginseng (Panax ginseng)', generic: 'Ginseng', rxcui: null, dosage: '200 mg', category: 'Herbal Energy / Adaptogen', safetyTip: 'May lower blood sugar; caution if on insulin or metformin. Can reduce Warfarin efficacy.', dosageOptions: ['100 mg', '200 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'st john':     { display: "St. John's Wort", generic: "St. John's Wort", rxcui: null, dosage: '300 mg', category: 'Herbal Mood Supplement', safetyTip: 'MAJOR CYP3A4 INDUCER: Lowers efficacy of statins, anticoagulants, oral contraceptives.', dosageOptions: ['300 mg', '600 mg', '900 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'fish oil':    { display: 'Fish Oil (Omega-3)', generic: 'Omega-3 Fatty Acids', rxcui: null, dosage: '1000 mg', category: 'Cardiovascular Supplement', safetyTip: 'High doses (>3g/day) have mild antiplatelet effects. Inform surgeon prior to procedures.', dosageOptions: ['500 mg', '1000 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin d':   { display: 'Vitamin D3 (Cholecalciferol)', generic: 'Cholecalciferol', rxcui: '11253', dosage: '1000 IU', category: 'Vitamin / Bone Health', safetyTip: 'Fat-soluble vitamin; best absorbed when taken with a meal containing dietary fat.', dosageOptions: ['400 IU', '1000 IU', '2000 IU', '60000 IU'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin c':   { display: 'Vitamin C (Ascorbic Acid)', generic: 'Ascorbic Acid', rxcui: '1151', dosage: '500 mg', category: 'Immune / Antioxidant', safetyTip: 'Water-soluble vitamin. Take with water. Enhances iron absorption.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'calcium':     { display: 'Calcium Carbonate', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', category: 'Mineral Supplement', safetyTip: 'Take with meals for optimal absorption. Separate from thyroid meds and iron by 4 hours.', dosageOptions: ['250 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'iron':        { display: 'Ferrous Sulfate (Iron)', generic: 'Ferrous Sulfate', rxcui: '4471', dosage: '325 mg', category: 'Mineral / Antianemic', safetyTip: 'Best on empty stomach with Vitamin C. Do not take with calcium, tea, or antacids.', dosageOptions: ['65 mg', '200 mg', '325 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'melatonin':   { display: 'Melatonin', generic: 'Melatonin', rxcui: null, dosage: '3 mg', category: 'Sleep Aid Supplement', safetyTip: 'Take 30-60 minutes before desired bedtime in a darkened environment.', dosageOptions: ['1 mg', '3 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'multivitamin':{ display: 'Multivitamin', generic: 'Multivitamin', rxcui: null, dosage: '1 tablet', category: 'General Dietary Supplement', safetyTip: 'Take with breakfast or lunch to avoid mild stomach upset.', dosageOptions: ['1 tablet'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'zinc':        { display: 'Zinc Sulfate', generic: 'Zinc', rxcui: null, dosage: '50 mg', category: 'Immune / Mineral', safetyTip: 'Always take with food to prevent nausea. Separate from antibiotics by 2 hours.', dosageOptions: ['15 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'folic acid':  { display: 'Folic Acid', generic: 'Folic Acid', rxcui: '4511', dosage: '5 mg', category: 'Vitamin B9 Supplement', safetyTip: 'Essential for red blood cell production and prenatal health.', dosageOptions: ['400 mcg', '1 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'b12':         { display: 'Vitamin B12 (Methylcobalamin)', generic: 'Cyanocobalamin', rxcui: '11248', dosage: '1500 mcg', category: 'Nerve & Blood Health', safetyTip: 'Essential for neurological health, especially in vegetarians and patients on Metformin/PPIs.', dosageOptions: ['500 mcg', '1000 mcg', '1500 mcg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aloe vera':   { display: 'Aloe Vera', generic: 'Aloe Vera', rxcui: null, dosage: '500 mg', category: 'Herbal Supplement', safetyTip: 'May lower blood glucose and potassium levels. Consult doctor if taking diuretics or insulin.', dosageOptions: ['500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'garlic':      { display: 'Garlic Extract (Allium sativum)', generic: 'Garlic', rxcui: null, dosage: '600 mg', category: 'Cardiovascular Herbal', safetyTip: 'Mild antiplatelet activity — monitor for bruising if taking anticoagulant drugs.', dosageOptions: ['300 mg', '600 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'echinacea':   { display: 'Echinacea', generic: 'Echinacea', rxcui: null, dosage: '400 mg', category: 'Immune Herbal', safetyTip: 'Use for short-term support during colds (10-14 days). Caution in autoimmune conditions.', dosageOptions: ['200 mg', '400 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'valerian':    { display: 'Valerian Root', generic: 'Valerian', rxcui: null, dosage: '500 mg', category: 'Herbal Sleep & Calming', safetyTip: 'Additive central nervous system depression when taken with alcohol or sedatives.', dosageOptions: ['300 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
};

router.get('/search', auth, async (req, res) => {
  const query = (req.query.q || '').trim();
  if (query.length < 2) {
    return res.json({ suggestions: [] });
  }

  const qLower = query.toLowerCase();
  const seen = new Set();
  const suggestions = [];

  // ── 1. Local brand alias dictionary (instant, no network) ─────────────────
  for (const [key, val] of Object.entries(BRAND_ALIASES)) {
    if (key.includes(qLower) || val.display.toLowerCase().includes(qLower) || val.generic.toLowerCase().includes(qLower)) {
      const id = val.display.toLowerCase();
      if (!seen.has(id)) {
        seen.add(id);
        suggestions.push({
          name: val.display,
          generic: val.generic,
          rxcui: val.rxcui,
          dosage: val.dosage,
          category: val.category || null,
          safetyTip: val.safetyTip || null,
          dosageOptions: val.dosageOptions || [],
          commonFrequency: val.commonFrequency || 'once',
          foodInstruction: val.foodInstruction || '',
          source: val.rxcui ? 'rxnorm' : 'herbal',
        });
      }
    }
  }

  // ── 2. Local DDInter database matches ────────────────────────────────────
  try {
    const dbMatches = await prisma.drugInteractionReference.findMany({
      where: {
        OR: [
          { drugAName: { startsWith: query, mode: 'insensitive' } },
          { drugBName: { startsWith: query, mode: 'insensitive' } },
        ],
      },
      select: { drugAName: true, drugBName: true },
      take: 10,
    });

    for (const match of dbMatches) {
      for (const drugName of [match.drugAName, match.drugBName]) {
        if (drugName.toLowerCase().startsWith(qLower)) {
          const id = drugName.toLowerCase();
          if (!seen.has(id)) {
            seen.add(id);
            suggestions.push({
              name: drugName,
              generic: drugName,
              rxcui: null,
              dosage: null,
              category: 'Clinical Database',
              safetyTip: 'Refer to physician instructions for individualized dosing.',
              dosageOptions: [],
              commonFrequency: 'once',
              foodInstruction: '',
              source: 'ddinter',
            });
          }
        }
      }
    }
  } catch (dbErr) {
    console.warn('[search] DDInter lookup error:', dbErr.message);
  }

  // ── 3. RxNorm Suggest API (live network — only if we need more results) ──
  if (suggestions.length < 8 && !isDemoMode()) {
    try {
      const rxUrl = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`;
      const { data } = await axios.get(rxUrl, { timeout: 3000 });
      const rxSuggestions = data?.suggestionGroup?.suggestionList?.suggestion ?? [];

      for (const sug of rxSuggestions.slice(0, 6)) {
        const id = sug.toLowerCase();
        if (!seen.has(id)) {
          seen.add(id);
          suggestions.push({
            name: sug,
            generic: sug,
            rxcui: null,
            dosage: null,
            category: 'RxNorm Drug Entry',
            safetyTip: 'Standardized formulary entry.',
            dosageOptions: [],
            commonFrequency: 'once',
            foodInstruction: '',
            source: 'rxnorm-suggest',
          });
        }
      }
    } catch (rxErr) {
      // Non-critical — silent fail, local results still serve
    }

    // Also try RxNorm approximate term for top suggestion with actual RxCUI
    if (suggestions.length < 6) {
      try {
        const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=5`;
        const { data } = await axios.get(approxUrl, { timeout: 3000 });
        const candidates = data?.approximateGroup?.candidate ?? [];

        for (const c of candidates) {
          if (c.rxcui && parseFloat(c.score || '0') >= 4.0) {
            const displayName = c.name || query;
            const id = displayName.toLowerCase();
            if (!seen.has(id)) {
              seen.add(id);
              suggestions.push({
                name: displayName,
                generic: displayName,
                rxcui: c.rxcui,
                dosage: null,
                category: 'RxNorm Verified',
                safetyTip: 'Standardized formulary entry with RxCUI code.',
                dosageOptions: [],
                commonFrequency: 'once',
                foodInstruction: '',
                source: 'rxnorm',
              });
            }
          }
        }
      } catch (approxErr) {
        // Non-critical — silent fail
      }
    }
  }

  return res.json({ suggestions: suggestions.slice(0, 10) });
});

module.exports = router;

