/**
 * backend/src/services/safetyChecks.js
 *
 * PolySafe Multi-Dimensional Deterministic Clinical Safety Engine (v7.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * Goes beyond pairwise drug-drug interactions with 5 distinct deterministic checks:
 *   A. DUPLICATE_INGREDIENT : Same active chemical salt from multiple products
 *   B. DUPLICATE_CLASS      : Therapeutic class duplication (2 NSAIDs, 2 PPIs, etc.)
 *   C. ALLERGY              : Patient allergy group & cross-reactivity mapping
 *   D. DISEASE_DRUG         : AGS Beers 2023 & STOPP/START geriatric disease contraindications
 *   E. FOOD_SPACING         : Food timing, chelation, and drug-drug dosing interval spacing
 *
 * All alerts are deterministic from verified data files with source attribution.
 * Optional Groq rephrasing with a strict 6-second timeout and instant template fallback.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { resolveDrugWithAI } = require('./aiDrugResolver');
const { BRAND_ALIASES } = require('./drugAliases');
const { INDIAN_DRUGS } = require('../../data/indianDrugs');
const { isDemoMode } = require('../lib/demo');

const DATA_DIR = path.join(__dirname, '../../data');

// ─── Load Local Safety Datasets ───────────────────────────────────────────────
let DRUG_CLASSES = {};
let ALLERGY_GROUPS = [];
let DISEASE_DRUG_RULES = [];
let FOOD_SPACING_RULES = [];

try {
  const dcPath = path.join(DATA_DIR, 'drug-classes.json');
  if (fs.existsSync(dcPath)) {
    const raw = JSON.parse(fs.readFileSync(dcPath, 'utf8'));
    DRUG_CLASSES = raw.classes || raw;
  }
} catch (e) {
  console.warn('[safetyChecks] Could not load drug-classes.json:', e.message);
}

try {
  const agPath = path.join(DATA_DIR, 'allergy-groups.json');
  if (fs.existsSync(agPath)) {
    const raw = JSON.parse(fs.readFileSync(agPath, 'utf8'));
    ALLERGY_GROUPS = raw.groups || [];
  }
} catch (e) {
  console.warn('[safetyChecks] Could not load allergy-groups.json:', e.message);
}

try {
  const ddPath = path.join(DATA_DIR, 'disease-drug.json');
  if (fs.existsSync(ddPath)) {
    const raw = JSON.parse(fs.readFileSync(ddPath, 'utf8'));
    DISEASE_DRUG_RULES = raw.rules || [];
  }
} catch (e) {
  console.warn('[safetyChecks] Could not load disease-drug.json:', e.message);
}

try {
  const fsPath = path.join(DATA_DIR, 'food-spacing.json');
  if (fs.existsSync(fsPath)) {
    const raw = JSON.parse(fs.readFileSync(fsPath, 'utf8'));
    FOOD_SPACING_RULES = raw.rules || [];
  }
} catch (e) {
  console.warn('[safetyChecks] Could not load food-spacing.json:', e.message);
}

// ─── Helper: Normalize drug and salt names ────────────────────────────────────
function normalizeText(str) {
  if (!str) return '';
  return String(str).toLowerCase().trim();
}

function cleanSalt(salt) {
  if (!salt) return '';
  return String(salt)
    .toLowerCase()
    .replace(/\s+\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)(\s*(tablet|capsule|oral|syrup|injection|drops|gel|cream))?/ig, '')
    .replace(/\s+(hydrochloride|hcl|trihydrate|maleate|succinate|tartrate|mesylate|besylate|fumarate|potassium|sodium|calcium|phosphate|sulfate|sulphate)$/i, '')
    .replace(/^(tab|cap|inj|syp)\.?\s+/i, '')
    .trim();
}

// Canonical salt aliases for accurate duplicate and allergy detection
const SALT_ALIASES = {
  'paracetamol': 'paracetamol',
  'acetaminophen': 'paracetamol',
  'apap': 'paracetamol',
  'aspirin': 'aspirin',
  'acetylsalicylic acid': 'aspirin',
  'ecosprin': 'aspirin',
  'amoxicillin': 'amoxicillin',
  'amoxycillin': 'amoxicillin',
  'clavulanate': 'clavulanate',
  'clavulanic acid': 'clavulanate',
  'pantoprazole': 'pantoprazole',
  'omeprazole': 'omeprazole',
  'rabeprazole': 'rabeprazole',
  'esomeprazole': 'esomeprazole',
  'domperidone': 'domperidone',
  'ibuprofen': 'ibuprofen',
  'naproxen': 'naproxen',
  'diclofenac': 'diclofenac',
  'aceclofenac': 'aceclofenac',
  'curcumin': 'curcumin',
  'turmeric': 'curcumin',
  'warfarin': 'warfarin',
  'levothyroxine': 'levothyroxine',
  'thyroxine': 'levothyroxine',
  'calcium': 'calcium carbonate',
  'calcium carbonate': 'calcium carbonate',
  'shelcal': 'calcium carbonate',
  'ferrous sulfate': 'ferrous sulfate',
  'iron': 'ferrous sulfate',
};

function getCanonicalSalt(rawSalt) {
  const cleaned = cleanSalt(rawSalt);
  return SALT_ALIASES[cleaned] || cleaned;
}

// ─── Resolve constituents of a medicine ──────────────────────────────────────
async function resolveMedicineSalts(med) {
  const name = med.name || '';
  const normName = normalizeText(name);

  // 1. Direct Indian Drugs check
  const indianMatch = INDIAN_DRUGS.find(
    (d) => normalizeText(d.brandName) === normName || normName.includes(normalizeText(d.brandName))
  );
  if (indianMatch && Array.isArray(indianMatch.genericSalts) && indianMatch.genericSalts.length > 0) {
    return indianMatch.genericSalts.map(getCanonicalSalt);
  }

  // 2. Brand Aliases check
  const aliasMatch = BRAND_ALIASES[normName] ||
    Object.entries(BRAND_ALIASES).find(([k]) => normName.includes(k) || k.includes(normName))?.[1];
  if (aliasMatch && aliasMatch.generic) {
    const parts = aliasMatch.generic.split(/\s*[\+\/]\s*/);
    return parts.map(getCanonicalSalt);
  }

  // 3. AI Drug Resolver cache / heuristics
  try {
    const aiRes = await resolveDrugWithAI(name);
    if (aiRes && Array.isArray(aiRes.genericSalts) && aiRes.genericSalts.length > 0) {
      return aiRes.genericSalts.map(getCanonicalSalt);
    }
  } catch (err) {
    // continue
  }

  // 4. Default to cleaned name
  return [getCanonicalSalt(name)];
}

// ─── Optional Groq Rephrasing with Strict 6s Timeout ─────────────────────────
async function rephraseWithGroq(plainTextTemplate, context = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || isDemoMode() || apiKey === 'YOUR_GROQ_API_KEY_HERE' || apiKey.startsWith('gsk_demo')) {
    return plainTextTemplate;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const prompt = `You are a warm, reassuring clinical pharmacist speaking directly to a patient.
Rephrase this medication safety alert into clear, empathetic, 1-2 sentence plain language:
"${plainTextTemplate}"
Patient context: ${context.age ? `Age ${context.age}` : ''}
Keep the clinical warning intact. Return ONLY the plain sentence without preamble or quotes.`;

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        timeout: 6000,
      }
    );
    clearTimeout(timer);

    const rephrased = res.data?.choices?.[0]?.message?.content?.trim();
    return rephrased || plainTextTemplate;
  } catch (err) {
    // On timeout, network drop, or error -> fallback to deterministic template immediately
    return plainTextTemplate;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECK A: DUPLICATE_INGREDIENT
// ═════════════════════════════════════════════════════════════════════════════
async function checkDuplicateIngredients(enrichedMeds) {
  const alerts = [];
  const ingredientMap = new Map(); // salt -> array of { med, originalSalt }

  for (const m of enrichedMeds) {
    for (const salt of m.salts) {
      if (!salt || salt.length < 2) continue;
      if (!ingredientMap.has(salt)) {
        ingredientMap.set(salt, []);
      }
      ingredientMap.get(salt).push(m);
    }
  }

  for (const [salt, medsList] of ingredientMap.entries()) {
    // Unique medicines by ID or Name
    const uniqueMeds = medsList.filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx);
    if (uniqueMeds.length >= 2) {
      const isParacetamol = salt === 'paracetamol' || salt === 'acetaminophen';
      const isNsaid = ['ibuprofen', 'naproxen', 'diclofenac', 'aceclofenac', 'ketorolac', 'mefenamic acid'].includes(salt);
      const isVitamin = ['calcium carbonate', 'vitamin d3', 'cholecalciferol', 'methylcobalamin', 'folic acid', 'ascorbic acid'].includes(salt);

      let severity = 'MODERATE';
      if (isParacetamol) severity = 'CRITICAL';
      else if (isNsaid)  severity = 'MAJOR';
      else if (isVitamin) severity = 'MINOR';

      const medNames = uniqueMeds.map((m) => m.name).join(' and ');
      const saltDisplay = salt.charAt(0).toUpperCase() + salt.slice(1);

      const clinicalText = `Duplicate Active Ingredient Detected: Multiple prescribed/active medications (${medNames}) contain ${saltDisplay}. Concurrent ingestion substantially compounds total daily dosage and increases systemic toxicity risk.`;
      const plainText = isParacetamol
        ? `You are taking Paracetamol in two different medicines (${medNames}). Taking both together can exceed the safe liver limit (4,000 mg/day) and cause acute liver damage.`
        : `You are taking the exact same active ingredient (${saltDisplay}) from multiple products (${medNames}). Combining them can lead to an accidental double dose.`;

      alerts.push({
        id: `dup-ing-${salt}`,
        type: 'DUPLICATE_INGREDIENT',
        severity,
        medicines: uniqueMeds.map((m) => ({ id: m.id, name: m.name, type: m.type, dosage: m.dosage })),
        clinicalText,
        plainText,
        rationale: `Both products deliver identical chemical salt (${saltDisplay}), multiplying systemic plasma exposure.`,
        source: 'CDSCO National Formulary / Indian Pharmacopoeia / PolySafe Resolver',
      });
    }
  }

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECK B: DUPLICATE_CLASS
// ═════════════════════════════════════════════════════════════════════════════
async function checkDuplicateClasses(enrichedMeds) {
  const alerts = [];
  const classMap = new Map(); // className -> array of meds

  for (const m of enrichedMeds) {
    const matchedClasses = new Set();
    for (const salt of m.salts) {
      const classInfo = DRUG_CLASSES[salt];
      if (classInfo && classInfo.class) {
        matchedClasses.add(classInfo.class);
      }
    }
    // Also check direct medicine name in drug classes
    const directInfo = DRUG_CLASSES[cleanSalt(m.name)];
    if (directInfo && directInfo.class) {
      matchedClasses.add(directInfo.class);
    }

    m.assignedClasses = Array.from(matchedClasses);
    for (const c of m.assignedClasses) {
      if (!classMap.has(c)) {
        classMap.set(c, []);
      }
      classMap.get(c).push(m);
    }
  }

  // Cross-class check: Dual RAAS blockade (ACE Inhibitor + ARB)
  const aceiMeds = classMap.get('ACE Inhibitor') || [];
  const arbMeds  = classMap.get('Angiotensin II Receptor Blocker (ARB)') || [];
  if (aceiMeds.length > 0 && arbMeds.length > 0) {
    const raasMeds = [...aceiMeds, ...arbMeds].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
    const medNames = raasMeds.map((m) => m.name).join(' + ');
    alerts.push({
      id: 'dup-class-dual-raas',
      type: 'DUPLICATE_CLASS',
      severity: 'MAJOR',
      medicines: raasMeds.map((m) => ({ id: m.id, name: m.name, type: m.type, dosage: m.dosage })),
      clinicalText: `Dual RAAS Blockade: Concomitant use of an ACE Inhibitor (${aceiMeds.map(m=>m.name).join(', ')}) and an ARB (${arbMeds.map(m=>m.name).join(', ')}). Dual blockade increases hypotension, acute kidney injury, and hyperkalemia without added survival benefit.`,
      plainText: `You are taking two different kinds of blood pressure medicines that block the same kidney hormone system (${medNames}). Combining them can cause severe blood pressure drops, kidney strain, and high potassium.`,
      rationale: 'Dual renin-angiotensin-aldosterone system inhibition confers increased nephrotoxicity and hyperkalemia risk.',
      source: 'ACC/AHA/ESC Heart Failure & Hypertension Guidelines',
    });
  }

  // Same class checks
  for (const [className, medsList] of classMap.entries()) {
    const uniqueMeds = medsList.filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx);
    if (uniqueMeds.length >= 2) {
      // Determine severity based on therapeutic class
      let severity = 'MODERATE';
      if (className.includes('NSAID'))                          severity = 'MAJOR';
      else if (className.includes('Benzodiazepine'))            severity = 'CRITICAL';
      else if (className.includes('Statin'))                    severity = 'MAJOR';
      else if (className.includes('ACE Inhibitor'))             severity = 'MAJOR';
      else if (className.includes('Angiotensin II Receptor'))   severity = 'MAJOR';
      else if (className.includes('Opioid'))                    severity = 'CRITICAL';
      else if (className.includes('Sulfonylurea'))              severity = 'MAJOR';

      const medNames = uniqueMeds.map((m) => m.name).join(' and ');
      const clinicalText = `Therapeutic Class Duplication: Regimen contains multiple agents from the ${className} class (${medNames}). Dual therapy provides negligible additive efficacy while significantly compounding organ toxicity and adverse reactions.`;
      const plainText = className.includes('NSAID')
        ? `You have two different NSAID pain relievers (${medNames}). Taking two anti-inflammatory drugs together doubles stomach ulcer and kidney injury risks without providing extra pain relief.`
        : `You are taking more than one medicine from the same family (${className}: ${medNames}). Taking two medicines that work the same way increases side effects without extra clinical benefit.`;

      alerts.push({
        id: `dup-class-${className.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type: 'DUPLICATE_CLASS',
        severity,
        medicines: uniqueMeds.map((m) => ({ id: m.id, name: m.name, type: m.type, dosage: m.dosage })),
        clinicalText,
        plainText,
        rationale: `Prescribing two agents from the same pharmacological class provides minimal additive benefit while compounding adverse event risk.`,
        source: 'WHO-ATC Classification / AGS Beers Criteria 2023',
      });
    }
  }

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECK C: ALLERGY
// ═════════════════════════════════════════════════════════════════════════════
async function checkAllergies(patient, enrichedMeds) {
  const alerts = [];
  const patientAllergies = (patient.allergies || []).map(normalizeText).filter(Boolean);
  if (patientAllergies.length === 0) return alerts;

  for (const allergyStr of patientAllergies) {
    // 1. Identify matched allergy groups
    const matchedGroups = ALLERGY_GROUPS.filter((g) => {
      const normName = normalizeText(g.name);
      const normId   = normalizeText(g.id);
      if (allergyStr.includes(normId) || normId.includes(allergyStr) || allergyStr.includes(normName)) {
        return true;
      }
      return (g.synonyms || []).some((s) => allergyStr.includes(normalizeText(s)) || normalizeText(s).includes(allergyStr));
    });

    for (const group of matchedGroups) {
      // Check non-drug allergens (e.g. latex)
      if (group.id === 'latex_not_drug') {
        alerts.push({
          id: `allergy-latex-device`,
          type: 'ALLERGY',
          severity: 'INFO',
          medicines: [],
          clinicalText: `Latex Sensitivity Alert: Patient has documented natural rubber latex allergy. Ensure medical staff use non-latex gloves, silicone catheterization products, and needle-free vial stoppers for all procedures.`,
          plainText: `Latex Allergy on Record: Your medical team is notified to use latex-free medical gloves, tubing, and vial stoppers during any clinic visits or injections.`,
          rationale: group.nonDrugAlert || 'Direct type I IgE-mediated hypersensitivity to Hevea brasiliensis proteins.',
          source: group.source || 'CDC / NIOSH Latex Allergy Alert',
        });
        continue;
      }

      // Check direct group members across patient's medicines
      for (const med of enrichedMeds) {
        const medNameLower = normalizeText(med.name);
        const medSaltsLower = med.salts.map(normalizeText);

        const isDirectMember = (group.members || []).some((member) => {
          const mLower = normalizeText(member);
          return medNameLower.includes(mLower) || medSaltsLower.some((s) => s.includes(mLower) || mLower.includes(s));
        });

        if (isDirectMember) {
          alerts.push({
            id: `allergy-${group.id}-${med.id}`,
            type: 'ALLERGY',
            severity: 'CRITICAL',
            medicines: [{ id: med.id, name: med.name, type: med.type, dosage: med.dosage }],
            clinicalText: `Direct Allergen Contraindication: Patient has a documented allergy to '${group.name}' ('${allergyStr}'). '${med.name}' contains an active constituent belonging to this group. High risk of anaphylaxis, severe cutaneous adverse reactions (SCAR), or angioedema.`,
            plainText: `CRITICAL ALLERGY WARNING: You are recorded as allergic to ${group.name} (${allergyStr}). Your medicine ${med.name} contains this exact medicine. Do not take this medication without urgent doctor confirmation.`,
            rationale: `Immunoglobulin or T-cell mediated hypersensitivity to active chemical group.`,
            source: group.source || 'AAAAI Drug Allergy Practice Parameters',
          });
        }

        // Check cross-reactivity
        if (!isDirectMember && Array.isArray(group.crossReactivities)) {
          for (const cross of group.crossReactivities) {
            const targetGroup = ALLERGY_GROUPS.find((g) => g.id === cross.targetGroupId);
            if (targetGroup) {
              const isCrossMember = (targetGroup.members || []).some((m) => {
                const mLower = normalizeText(m);
                return medNameLower.includes(mLower) || medSaltsLower.some((s) => s.includes(mLower) || mLower.includes(s));
              });

              if (isCrossMember) {
                alerts.push({
                  id: `allergy-cross-${group.id}-${cross.targetGroupId}-${med.id}`,
                  type: 'ALLERGY',
                  severity: cross.severity || 'MAJOR',
                  medicines: [{ id: med.id, name: med.name, type: med.type, dosage: med.dosage }],
                  clinicalText: `Potential Allergic Cross-Reactivity: Patient is allergic to ${group.name}. '${med.name}' belongs to ${cross.targetGroupName}. ${cross.clinicalNote}`,
                  plainText: `Allergy Caution: You have a ${group.name} allergy. ${med.name} belongs to ${cross.targetGroupName}, which has a small cross-reaction risk. ${cross.plainNote}`,
                  rationale: `Shared beta-lactam core or structural immunogenic homology.`,
                  source: cross.source || group.source,
                });
              }
            }
          }
        }
      }
    }
  }

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECK D: DISEASE_DRUG
// ═════════════════════════════════════════════════════════════════════════════
async function checkDiseaseDrug(patient, enrichedMeds) {
  const alerts = [];
  const patientConditions = (patient.conditions || []).map(normalizeText).filter(Boolean);
  if (patientConditions.length === 0) return alerts;

  for (const rule of DISEASE_DRUG_RULES) {
    // 1. Check condition match
    const conditionMatched = rule.conditionKeywords.some((keyword) => {
      const kw = normalizeText(keyword);
      return patientConditions.some((cond) => cond.includes(kw) || kw.includes(cond));
    });

    if (!conditionMatched) continue;

    // 2. Check drug match in patient active regimen
    for (const med of enrichedMeds) {
      const medNameLower = normalizeText(med.name);
      const medSaltsLower = med.salts.map(normalizeText);

      const isDrugMatch = rule.drugMatch.some((target) => {
        const tLower = normalizeText(target);
        return medNameLower.includes(tLower) || medSaltsLower.some((s) => s.includes(tLower) || tLower.includes(s));
      });

      if (isDrugMatch) {
        alerts.push({
          id: `${rule.id}-${med.id}`,
          type: 'DISEASE_DRUG',
          severity: rule.severity,
          medicines: [{ id: med.id, name: med.name, type: med.type, dosage: med.dosage }],
          clinicalText: `${rule.title}: In patients with ${rule.conditionKeywords[0]}, ${rule.clinicalText}`,
          plainText: rule.plainText,
          rationale: rule.rationale,
          source: rule.source,
        });
      }
    }
  }

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// CHECK E: FOOD_SPACING
// ═════════════════════════════════════════════════════════════════════════════
async function checkFoodSpacing(enrichedMeds) {
  const alerts = [];

  for (const rule of FOOD_SPACING_RULES) {
    if (rule.type === 'TIMING_SPACING') {
      // Requires BOTH drugs/components to be in active regimen
      const primaryMeds = enrichedMeds.filter((m) => {
        const nameLower = normalizeText(m.name);
        const saltsLower = m.salts.map(normalizeText);
        return rule.drugMatch.some((t) => nameLower.includes(normalizeText(t)) || saltsLower.some((s) => s.includes(normalizeText(t))));
      });

      const interactorMeds = enrichedMeds.filter((m) => {
        const nameLower = normalizeText(m.name);
        const saltsLower = m.salts.map(normalizeText);
        const target = normalizeText(rule.interactor);
        return nameLower.includes(target) || saltsLower.some((s) => s.includes(target) || target.includes(s));
      });

      if (primaryMeds.length > 0 && interactorMeds.length > 0) {
        const combined = [...primaryMeds, ...interactorMeds].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);
        alerts.push({
          id: `${rule.id}-${primaryMeds[0].id}-${interactorMeds[0].id}`,
          type: 'FOOD_SPACING',
          severity: rule.severity,
          medicines: combined.map((m) => ({ id: m.id, name: m.name, type: m.type, dosage: m.dosage })),
          clinicalText: `${rule.title}: ${rule.clinicalText}`,
          plainText: `${rule.plainText} Advice: ${rule.spacingRule}`,
          rationale: rule.rationale,
          source: rule.source,
        });
      }
    } else {
      // Single-drug food / dietary advice
      for (const med of enrichedMeds) {
        const nameLower = normalizeText(med.name);
        const saltsLower = med.salts.map(normalizeText);

        const isMatch = rule.drugMatch.some((t) => nameLower.includes(normalizeText(t)) || saltsLower.some((s) => s.includes(normalizeText(t))));

        if (isMatch) {
          alerts.push({
            id: `${rule.id}-${med.id}`,
            type: 'FOOD_SPACING',
            severity: rule.severity,
            medicines: [{ id: med.id, name: med.name, type: med.type, dosage: med.dosage }],
            clinicalText: `${rule.title}: ${rule.clinicalText}`,
            plainText: `${rule.plainText} Tip: ${rule.spacingRule}`,
            rationale: rule.rationale,
            source: rule.source,
          });
        }
      }
    }
  }

  return alerts;
}

// ═════════════════════════════════════════════════════════════════════════════
// MASTER FUNCTION: runSafetyChecks
// ═════════════════════════════════════════════════════════════════════════════
async function runSafetyChecks({ patient = {}, medicines = [], newMedicine = null, enableAiRephrasing = false }) {
  // Combine existing active medicines with newMedicine preview if provided
  const allMeds = [...medicines];
  if (newMedicine && newMedicine.name) {
    allMeds.push({
      id: newMedicine.id || 'preview-new-med',
      name: newMedicine.name,
      type: newMedicine.type || 'PRESCRIPTION',
      dosage: newMedicine.dosage || 'Standard dose',
    });
  }

  // Enrich each medicine with canonical constituents
  const enrichedMeds = [];
  for (const med of allMeds) {
    const salts = await resolveMedicineSalts(med);
    enrichedMeds.push({
      ...med,
      salts,
    });
  }

  // Run all 5 checks in parallel
  const [duplicateIngredients, duplicateClasses, allergyAlerts, diseaseDrugAlerts, foodSpacingAlerts] = await Promise.all([
    checkDuplicateIngredients(enrichedMeds),
    checkDuplicateClasses(enrichedMeds),
    checkAllergies(patient, enrichedMeds),
    checkDiseaseDrug(patient, enrichedMeds),
    checkFoodSpacing(enrichedMeds),
  ]);

  const rawAlerts = [
    ...duplicateIngredients,
    ...duplicateClasses,
    ...allergyAlerts,
    ...diseaseDrugAlerts,
    ...foodSpacingAlerts,
  ];

  // Optional: rephrase plainText with Groq if requested and not in demo mode
  if (enableAiRephrasing && process.env.GROQ_API_KEY && !isDemoMode()) {
    try {
      await Promise.all(
        rawAlerts.slice(0, 5).map(async (alert) => {
          alert.plainText = await rephraseWithGroq(alert.plainText, { age: patient.age });
        })
      );
    } catch (e) {
      // ignore
    }
  }

  // Sort alerts by severity: CRITICAL > MAJOR > MODERATE > MINOR > INFO
  const severityRank = { CRITICAL: 5, MAJOR: 4, MODERATE: 3, MINOR: 2, INFO: 1 };
  rawAlerts.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

  return rawAlerts;
}

module.exports = {
  runSafetyChecks,
  resolveMedicineSalts,
  DRUG_CLASSES,
  ALLERGY_GROUPS,
  DISEASE_DRUG_RULES,
  FOOD_SPACING_RULES,
};
