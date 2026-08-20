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
const { BRAND_ALIASES, resolveDrugCandidates, getRxCuiForDrug } = require('../services/drugAliases');

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
// Standardizes drug names using local brand dictionaries, constituent parsing,
// and RxNorm / RxNav REST APIs.
async function lookupRxCui(name) {
  if (!name) return null;

  // ── DEMO MOCK ── RxNorm/RxNav not called. Remove DEMO_MODE=true for production.
  if (isDemoMode()) {
    const mockCui = getMockRxCui(name);
    console.log(`[rxnorm] DEMO_MODE=true — mock RxCUI for "${name}": ${mockCui ?? 'no match (null, non-failing)'}`);
    return mockCui;
  }

  // 1. Check curated aliases & constituent extraction first (instant)
  const aliasCui = getRxCuiForDrug(name);
  if (aliasCui) {
    console.log(`[rxnorm] Resolved RxCUI for "${name}" via drugAliases → ${aliasCui}`);
    return aliasCui;
  }

  // 2. Direct RxNav rxcui.json lookup
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&allSourcesFlag=1`;
    const { data } = await axios.get(url, { timeout: 4000 });
    const rxcui = data?.idGroup?.rxnormId?.[0] ?? null;
    if (rxcui) return rxcui;
  } catch (rxErr) {
    // try approximateTerm below
  }

  // 3. Approximate term lookup for brand/spelling variations
  try {
    const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(name)}&maxEntries=3`;
    const { data } = await axios.get(approxUrl, { timeout: 4000 });
    const candidatesList = data?.approximateGroup?.candidate ?? [];
    if (candidatesList.length > 0 && candidatesList[0]?.rxcui) {
      return candidatesList[0].rxcui;
    }
  } catch (approxErr) {
    console.warn(`[rxnorm] Approximate lookup failed for "${name}":`, approxErr.message);
  }

  return null;
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
      const rooms = [`patient-${userId}`, `patient-${patient.id}`];

      const emitResults = (payload) => {
        for (const r of rooms) {
          io.to(r).emit('interaction-checked', payload);
          io.to(r).emit('interaction-check-result', payload);
        }
      };

      try {
        // Calculate cumulative anticholinergic/sedative burden index
        const cumulativeBurden = await calculateCumulativeBurden(patient.id);

        // Fetch all OTHER medicines for this patient (include type for herb-drug check)
        const existingMeds = await prisma.medicine.findMany({
          where: { patientId: patient.id, id: { not: medicine.id }, removedAt: null },
          select: { id: true, name: true, type: true },
        });

        if (existingMeds.length === 0) {
          // First medicine — nothing to check pairwise against
          emitResults({
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
        emitResults({
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
        emitResults({
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

