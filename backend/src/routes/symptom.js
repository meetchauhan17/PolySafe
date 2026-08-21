'use strict';

/**
 * routes/symptom.js
 *
 * POST /symptom  — Log a patient symptom and perform keyword-based prescribing
 *                  cascade detection against the patient's current medicine list.
 *
 * Logic:
 *  1. Validate and save the Symptom record.
 *  2. Load all CascadeReference rows and tokenise their symptomKeyword fields.
 *  3. Check if any keyword appears in the submitted symptom description.
 *  4. For each matching cascade, query the patient's medicines whose dateAdded
 *     is BEFORE the symptom date and whose name / type loosely matches the
 *     causing drug category.
 *  5. If a match is found, set possibleCauseMedicineId and return cascade details.
 *
 * Drug-category matching heuristic (no external ML — simple keyword inclusion):
 *   "calcium channel blocker" → amlodipine, nifedipine, diltiazem, verapamil, felodipine
 *   "opioid"                  → codeine, tramadol, morphine, oxycodone, fentanyl, hydrocodone
 *   "NSAID"                   → ibuprofen, naproxen, diclofenac, aspirin, celecoxib, meloxicam
 *   "anticholinergic"         → oxybutynin, tolterodine, amitriptyline, hydroxyzine, promethazine, ...
 *   "sedative"                → diazepam, lorazepam, alprazolam, zolpidem, clonazepam, temazepam
 *   "antihypertensive"        → lisinopril, ramipril, atenolol, metoprolol, amlodipine, valsartan, ...
 *   "antidepressant"          → amitriptyline, imipramine, fluoxetine, sertraline, paroxetine, ...
 *   "ACE inhibitor"           → lisinopril, ramipril, enalapril, captopril, perindopril
 *   "diuretic"                → furosemide, hydrochlorothiazide, spironolactone, bumetanide, ...
 */

const express = require('express');
const { z }   = require('zod');
const prisma  = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─── Drug category → name fragments map ──────────────────────────────────────
// Keys must match causingDrugCategory values in CascadeReference exactly
// (case-insensitive comparison applied below).
const CATEGORY_DRUG_KEYWORDS = {
  'calcium channel blocker': [
    'amlodipine', 'nifedipine', 'felodipine', 'diltiazem', 'verapamil',
    'lercanidipine', 'lacidipine', 'nimodipine',
  ],
  'opioid': [
    'codeine', 'tramadol', 'morphine', 'oxycodone', 'oxycontin', 'fentanyl',
    'hydrocodone', 'buprenorphine', 'methadone', 'tapentadol', 'dihydrocodeine',
  ],
  'nsaid': [
    'ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'celecoxib', 'meloxicam',
    'indomethacin', 'piroxicam', 'ketoprofen', 'ketorolac', 'mefenamic',
  ],
  'anticholinergic': [
    'oxybutynin', 'tolterodine', 'solifenacin', 'fesoterodine', 'darifenacin',
    'amitriptyline', 'imipramine', 'doxepin', 'nortriptyline', 'clomipramine',
    'hydroxyzine', 'promethazine', 'diphenhydramine', 'chlorpheniramine',
    'doxylamine', 'cyclobenzaprine', 'scopolamine', 'meclizine',
  ],
  'sedative': [
    'diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'temazepam',
    'nitrazepam', 'triazolam', 'oxazepam', 'zolpidem', 'zopiclone',
    'zaleplon', 'eszopiclone', 'midazolam',
  ],
  'antihypertensive': [
    'lisinopril', 'ramipril', 'enalapril', 'captopril', 'perindopril',
    'losartan', 'valsartan', 'candesartan', 'irbesartan', 'olmesartan',
    'atenolol', 'metoprolol', 'bisoprolol', 'carvedilol', 'propranolol',
    'amlodipine', 'nifedipine', 'felodipine',
  ],
  'antidepressant': [
    'amitriptyline', 'imipramine', 'doxepin', 'nortriptyline', 'clomipramine',
    'fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram',
    'venlafaxine', 'duloxetine', 'mirtazapine', 'trazodone', 'bupropion',
  ],
  'ace inhibitor': [
    'lisinopril', 'ramipril', 'enalapril', 'captopril', 'perindopril',
    'quinapril', 'trandolapril', 'benazepril', 'fosinopril',
  ],
  'diuretic': [
    'furosemide', 'hydrochlorothiazide', 'chlorthalidone', 'spironolactone',
    'eplerenone', 'amiloride', 'triamterene', 'bumetanide', 'torsemide',
    'indapamide', 'metolazone',
  ],
};

/**
 * Given a drug name, returns all category keys that match.
 * @param {string} drugName
 * @returns {string[]}
 */
function getMatchingCategories(drugName) {
  const lower = drugName.toLowerCase();
  const matched = [];
  for (const [category, keywords] of Object.entries(CATEGORY_DRUG_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(category);
    }
  }
  return matched;
}

// ─── Zod schema ───────────────────────────────────────────────────────────────
const symptomSchema = z.object({
  description: z.string().trim().min(3, 'Please describe the symptom.'),
  dateLogged:  z.coerce.date().optional(), // defaults to now if not provided
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /symptom
// ═════════════════════════════════════════════════════════════════════════════
router.post('/', auth, requireRole(['PATIENT', 'CAREGIVER']), async (req, res) => {
  const parsed = symptomSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return res.status(400).json({ error: issues.map((i) => i.message).join(', ') });
  }

  const { description, dateLogged: rawDate } = parsed.data;
  const symptomDate = rawDate ?? new Date();
  const { userId } = req.user;

  try {
    // 1. Resolve patient
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return res.status(404).json({ error: 'No patient profile found. Please complete onboarding.' });
    }

    // 2. Save symptom first (without cascade link yet)
    let symptom = await prisma.symptom.create({
      data: {
        patientId:   patient.id,
        description: description.trim(),
        dateLogged:  symptomDate,
      },
    });

    // 3. Load all cascade references
    const cascadeRefs = await prisma.cascadeReference.findMany();

    // 4. Keyword match: check if any cascade keyword appears in the description
    const descLower = description.toLowerCase();

    // Multi-word keywords: sort longest-first for greedy match
    const sortedRefs = [...cascadeRefs].sort(
      (a, b) => b.symptomKeyword.length - a.symptomKeyword.length
    );

    const matchedCascades = sortedRefs.filter((ref) =>
      descLower.includes(ref.symptomKeyword.toLowerCase())
    );

    // 5. Fetch patient's medicines added on or before this symptom date,
    //    and not discontinued before the symptom occurred
    const maxDate = new Date(Math.max(Date.now(), symptomDate.getTime()));
    const priorMeds = await prisma.medicine.findMany({
      where: {
        patientId: patient.id,
        dateAdded: { lte: maxDate },
        OR: [
          { removedAt: null },
          { removedAt: { gte: symptomDate } },
        ],
      },
      orderBy: { dateAdded: 'asc' },
    });

    // 6. Cross-reference: find a medicine that falls into a matched cascade category
    let cascadeMatch = null;

    outer: for (const cascade of matchedCascades) {
      const categoryLower = cascade.causingDrugCategory.toLowerCase();

      for (const med of priorMeds) {
        const medCategories = getMatchingCategories(med.name);
        // Check if any of the medicine's categories match the cascade category
        if (medCategories.some((c) => c === categoryLower)) {
          cascadeMatch = {
            medicine:  med,
            cascade,
          };
          break outer;
        }
      }
    }

    // 7. If cascade match found — update symptom record
    if (cascadeMatch) {
      symptom = await prisma.symptom.update({
        where: { id: symptom.id },
        data:  { possibleCauseMedicineId: cascadeMatch.medicine.id },
      });
    }

    // 8. Build response
    const baseResponse = {
      symptom: {
        id:          symptom.id,
        description: symptom.description,
        dateLogged:  symptom.dateLogged,
      },
      cascadeDetected: !!cascadeMatch,
    };

    if (cascadeMatch) {
      return res.status(201).json({
        ...baseResponse,
        match: {
          medicineId:         cascadeMatch.medicine.id,
          medicineName:       cascadeMatch.medicine.name,
          medicineType:       cascadeMatch.medicine.type,
          medicineDosage:     cascadeMatch.medicine.dosage,
          dateStarted:        cascadeMatch.medicine.dateAdded,
          symptomKeyword:     cascadeMatch.cascade.symptomKeyword,
          causingDrugCategory: cascadeMatch.cascade.causingDrugCategory,
          cascadeDescription: cascadeMatch.cascade.description,
        },
      });
    }

    return res.status(201).json(baseResponse);
  } catch (err) {
    console.error('[POST /symptom]', err);
    res.status(500).json({ error: 'Failed to log symptom. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /symptom — List logged symptoms for the authenticated patient
// ═════════════════════════════════════════════════════════════════════════════
router.get('/', auth, async (req, res) => {
  const { userId } = req.user;
  try {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return res.status(200).json({ symptoms: [] });

    const symptoms = await prisma.symptom.findMany({
      where:   { patientId: patient.id },
      orderBy: { dateLogged: 'desc' },
      include: {
        possibleCauseMedicine: {
          select: { id: true, name: true, type: true, dosage: true, dateAdded: true },
        },
      },
    });

    return res.status(200).json({ symptoms });
  } catch (err) {
    console.error('[GET /symptom]', err);
    res.status(500).json({ error: 'Failed to load symptoms.' });
  }
});

module.exports = router;
