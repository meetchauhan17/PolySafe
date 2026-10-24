/**
 * frontend/src/data/mockClinicalData.js
 *
 * Unified Single Source of Truth for Clinical Demo Data & Regimen Score Calculation.
 * Harmonizes HomePage, RiskAnalysisPage, ClinicalScoreExplainerModal, and Passport.
 */

export const DEMO_CLINICAL_PATIENT = {
  id: 'demo-patient-priya',
  name: 'Priya Sharma (Sample)',
  age: 68,
  gender: 'Female',
  bloodType: 'O Positive',
  conditions: ['Type 2 Diabetes', 'Hypertension', 'Osteoarthritis'],
  allergies: ['Penicillin', 'Sulfa Antibiotics'],
  emergencyContacts: [
    { name: 'Dr. Jane Foster', phone: '+91 98200 12345', relationship: 'Attending Cardiologist' },
    { name: 'Rahul Sharma', phone: '+91 98450 67890', relationship: 'Primary Caregiver (Son)' },
  ],
};

export const DEMO_CLINICAL_MEDICINES = [
  {
    id: 'd1',
    name: 'Warfarin',
    brand: 'Coumadin',
    generic: 'Warfarin Sodium',
    type: 'PRESCRIPTION',
    dosage: '5mg once daily (evening)',
    category: 'Anticoagulant (Blood Thinner)',
    purpose: 'Stroke Prevention & Thrombosis Prophylaxis in AFib',
    harmLevel: 5,
    acbScore: 2,
    foodInstruction: 'with_water',
    rxcui: '11289',
    prescribedBy: 'Dr. Jane Foster (Cardiology)',
    dateAdded: '2026-10-20T00:00:00.000Z',
    herbWarnings: [
      {
        herbName: 'allium sativum',
        severity: 'Moderate',
        mechanism: 'Garlic (Allium sativum) exerts antiplatelet action that synergizes with warfarin, increasing hemorrhagic risk.',
      },
    ],
    sideEffects: [
      { effectName: 'Hemorrhage / Bleeding', prr: 14.2 },
      { effectName: 'Hematoma', prr: 8.6 },
      { effectName: 'Hematuria', prr: 6.4 },
      { effectName: 'Epistaxis (Nosebleed)', prr: 5.1 },
    ],
    cascades: [
      { symptom: 'GI Bleed Risk', mechanism: 'Synergistic mucosal barrier depletion when co-administered with NSAIDs' },
    ],
  },
  {
    id: 'd2',
    name: 'Aspirin',
    brand: 'Ecosprin',
    generic: 'Acetylsalicylic Acid',
    type: 'OTC',
    dosage: '81mg daily (morning)',
    category: 'Antiplatelet / NSAID',
    purpose: 'Secondary Cardiovascular Protection & Stroke Prevention',
    harmLevel: 4,
    acbScore: 2,
    foodInstruction: 'after_food',
    rxcui: '1191',
    prescribedBy: 'Dr. Jane Foster (Cardiology)',
    dateAdded: '2026-10-20T00:00:00.000Z',
    herbWarnings: [
      {
        herbName: 'curcuma longa',
        severity: 'Moderate',
        mechanism: 'Turmeric (Curcumin) enhances antiplatelet response and gastric irritation.',
      },
    ],
    sideEffects: [
      { effectName: 'Dyspepsia / Gastric Irritation', prr: 7.8 },
      { effectName: 'Gastric Hemorrhage', prr: 9.3 },
      { effectName: 'Tinnitus', prr: 4.1 },
    ],
  },
  {
    id: 'd3',
    name: 'Lisinopril',
    brand: 'Prinivil',
    generic: 'Lisinopril Dihydrate',
    type: 'PRESCRIPTION',
    dosage: '10mg daily (morning)',
    category: 'ACE Inhibitor (Antihypertensive)',
    purpose: 'Essential Hypertension Control & Cardiac Protection',
    harmLevel: 3,
    acbScore: 0,
    foodInstruction: 'with_water',
    rxcui: '29046',
    prescribedBy: 'Dr. Rajesh Patel (Internal Medicine)',
    dateAdded: '2026-10-20T00:00:00.000Z',
    sideEffects: [
      { effectName: 'Intractable Dry Cough', prr: 11.4 },
      { effectName: 'Hyperkalemia', prr: 6.2 },
      { effectName: 'Dizziness / Orthostasis', prr: 3.5 },
    ],
    cascades: [
      { symptom: 'Chronic Dry Cough', mechanism: 'Bradykinin accumulation in lung parenchyma mistakenly treated with expectorants' },
    ],
  },
  {
    id: 'd4',
    name: 'Turmeric (Curcumin)',
    brand: 'Curcumin Extra',
    generic: 'Curcuminoids Extract',
    type: 'HERBAL',
    dosage: '500mg daily (evening)',
    category: 'Botanical Herbal Supplement',
    purpose: 'Joint Inflammation & Anti-inflammatory Support',
    harmLevel: 2,
    acbScore: 1,
    foodInstruction: 'with_milk',
    rxcui: '0',
    prescribedBy: 'Self-Administered OTC Herb',
    dateAdded: '2026-10-20T00:00:00.000Z',
    herbWarnings: [
      {
        herbName: 'curcuma longa',
        severity: 'Major',
        mechanism: 'Curcumin inhibits hepatic CYP2C9 clearance of Warfarin, elevating free plasma drug concentrations.',
      },
    ],
    sideEffects: [
      { effectName: 'Mild Nausea', prr: 2.1 },
      { effectName: 'Loose Stools', prr: 1.8 },
    ],
  },
];

export const DEMO_CLINICAL_SCHEDULE = [
  { medicineId: 'd1', name: 'Warfarin', dosage: '5mg', type: 'PRESCRIPTION', time: '08:00 AM' },
  { medicineId: 'd2', name: 'Aspirin', dosage: '81mg', type: 'OTC', time: '12:00 PM' },
  { medicineId: 'd3', name: 'Lisinopril', dosage: '10mg', type: 'PRESCRIPTION', time: '06:00 PM' },
  { medicineId: 'd4', name: 'Turmeric (Curcumin)', dosage: '500mg', type: 'HERBAL', time: '09:00 PM' },
];

export const DEMO_CLINICAL_FLAGS = [
  {
    id: 'f1',
    severity: 'Major',
    medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
    medicineB: { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL' },
    plainExplanation: "Turmeric may enhance Warfarin's blood-thinning effect, significantly increasing bleeding risk.",
    clinicalExplanation: 'Curcumin inhibits platelet aggregation and CYP2C9-mediated warfarin metabolism, elevating INR and bleeding propensity.',
    actionPlan: 'Avoid high-dose turmeric/curcumin supplements while on Warfarin unless explicitly monitored and calibrated by your anticoagulation clinic.',
    source: 'DDInter 2024 · OFFSIDES v2.1 · Botanical Monograph',
    doctorQuestions: [
      'How often should we check my INR while adjusting supplements or diet?',
      'Are there specific signs of minor bleeding (e.g. gum bleeding, bruising) I should report immediately?',
      'Can dietary turmeric in food be safely consumed in moderate culinary amounts?',
    ],
    dateFlagged: new Date().toISOString(),
  },
  {
    id: 'f2',
    severity: 'Moderate',
    medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
    medicineB: { id: 'd2', name: 'Aspirin', type: 'OTC' },
    plainExplanation: 'Taking Aspirin with Warfarin increases gastrointestinal bleeding risk.',
    clinicalExplanation: 'Combined anticoagulant (Warfarin) and antiplatelet (Aspirin) therapy produces additive antihemostatic effects, raising the risk of major upper GI haemorrhage.',
    actionPlan: 'Verify dual antithrombotic indication with your cardiologist or primary care physician. Consider gastroprotective co-prescription (PPI) if combination is clinically mandated.',
    source: 'DDInter 2024 · CHEST Antithrombotic Guidelines',
    doctorQuestions: [
      'Is the combination of low-dose Aspirin and Warfarin strictly indicated for my cardiovascular condition?',
      'Should I take a stomach-protecting medication (like a PPI) to reduce bleeding risk?',
    ],
    dateFlagged: new Date().toISOString(),
  },
];

export const DEMO_CLINICAL_REGIMEN_RISK = {
  averageRisk: 3.5,
  level: 5,
  score: 5.0,
  tier: 'L5',
  label: 'CRITICAL',
  color: 'red',
  highestRiskDrug: {
    name: 'Warfarin',
    dosage: '5mg',
    harmLevel: 5,
    tier: 'L5',
  },
  distribution: { L1: 0, L2: 1, L3: 1, L4: 1, L5: 1 },
  activeCount: 4,
  flagCount: 2,
  majorFlagCount: 1,
};

export const DEMO_CLINICAL_ACB_SCORE = 5;

export const DEMO_CLINICAL_FOOD_INTERACTIONS = [
  {
    foodItem: 'Dark Leafy Greens (Spinach, Kale, Methi)',
    severity: 'Major',
    actionBadge: 'Keep Vitamin K Steady',
    clinicalTitle: 'Erratic Vitamin K intake destabilizes INR ratio under Warfarin therapy.',
    rationale: 'Sudden surges in dietary Vitamin K accelerate prothrombin synthesis, counteracting Warfarin and precipitating blood clot risks.',
    safeAction: 'Maintain a consistent portion size of leafy vegetables each week rather than stopping or binging abruptly.',
  },
  {
    foodItem: 'High-Dose Turmeric / Curcumin Supplements',
    severity: 'Major',
    actionBadge: 'Avoid Concentrated Extract',
    clinicalTitle: 'Synergistic antiplatelet and CYP2C9 inhibition increases bleeding risk.',
    rationale: 'Curcumin capsules inhibit platelet aggregation and impede warfarin clearance in the liver.',
    safeAction: 'Normal culinary seasoning in cooked food is safe. Stop medicinal concentrated turmeric pills while on Warfarin.',
  },
  {
    foodItem: 'Potassium Salt Substitutes',
    severity: 'Moderate',
    actionBadge: 'Avoid Salt Substitutes',
    clinicalTitle: 'Risk of elevated blood potassium (Hyperkalemia) with Lisinopril.',
    rationale: 'ACE inhibitors reduce potassium excretion through kidneys; potassium chloride salt substitutes compound this effect.',
    safeAction: 'Use lemon juice, herbs, and garlic for low-sodium flavoring instead of potassium chloride substitutes.',
  },
];

export const DEMO_CLINICAL_SAFETY_ALERTS = [
  {
    id: 'demo-alert-1',
    type: 'DISEASE_DRUG',
    severity: 'MAJOR',
    medicines: ['Aspirin'],
    clinicalText: 'Aspirin NSAID therapy in documented Hypertension: Regular NSAIDs inhibit renal vasodilatory prostaglandin synthesis, promoting fluid retention and antagonizing ACE inhibitor antihypertensive efficacy.',
    plainText: 'Aspirin caution with Hypertension: Regular NSAID intake can cause fluid retention and counteract blood pressure medications like Lisinopril. Monitor your daily blood pressure readings closely.',
    rationale: 'AGS Beers Criteria 2023 / STOPP v3: Use lowest effective dose with regular blood pressure surveillance.',
    source: 'AGS Beers Criteria 2023',
  },
  {
    id: 'demo-alert-2',
    type: 'FOOD_SPACING',
    severity: 'MAJOR',
    medicines: ['Warfarin'],
    clinicalText: 'Vitamin K dietary consistency requirement with Warfarin oral anticoagulation: Sudden dietary surges in dark leafy greens counteract hepatic vitamin K antagonism, precipitating thrombotic risk.',
    plainText: 'Keep leafy green vegetables (spinach, kale, broccoli) steady in your diet each week. Large swings in Vitamin K can counteract Warfarin and alter your blood clotting time.',
    rationale: 'Warfarin Anticoagulation Guidelines: Maintain consistent weekly dietary Vitamin K intake.',
    source: 'FDA / CHEST Guidelines',
  },
];

/**
 * Single Unified Deterministic Calculation for Regimen Risk Scores
 * Guarantees 100% synchronization between Home Page, Risk Page, and Modals.
 */
export function computeUnifiedScores({
  regimenRisk,
  medicines = [],
  flags = [],
  status = 'SAFE',
  acbScore,
} = {}) {
  const hasRegimenRisk = regimenRisk && typeof regimenRisk.level === 'number';

  // Highest individual harm level in regimen
  const maxHarm = medicines.length > 0
    ? Math.max(...medicines.map((m) => m.harmLevel || 1))
    : 1;

  const highestDrug = regimenRisk?.highestRiskDrug || (medicines.length > 0
    ? medicines.reduce((prev, curr) => ((curr.harmLevel || 1) > (prev?.harmLevel || 1) ? curr : prev), medicines[0])
    : null);

  // Interaction flags evaluation
  const hasMajorFlags = flags.some((f) => ['MAJOR', 'CONTRAINDICATED'].includes((f.severity || '').toUpperCase()));
  const hasModerateFlags = flags.some((f) => (f.severity || '').toUpperCase() === 'MODERATE');

  // Overall Harm Score (1.0 to 5.0 scale)
  let score = 1.0;
  let level = 1;
  let label = 'Safe Regimen';

  if (hasRegimenRisk) {
    level = regimenRisk.level;
    score = typeof regimenRisk.score === 'number' ? regimenRisk.score : level;
    label = regimenRisk.label || (level >= 5 ? 'Critical Risk' : level === 4 ? 'High Risk' : level === 3 ? 'Caution Needed' : 'Safe Regimen');
  } else if (maxHarm === 5 || hasMajorFlags || status === 'CRITICAL') {
    level = 5;
    score = 5.0;
    label = 'Critical Risk';
  } else if (hasModerateFlags || maxHarm >= 4 || status === 'CAUTION') {
    level = 4;
    score = 4.0;
    label = 'High Vigilance';
  } else if (maxHarm === 3) {
    level = 3;
    score = 3.0;
    label = 'Caution Needed';
  } else if (maxHarm === 2) {
    level = 2;
    score = 2.0;
    label = 'Low Risk';
  }

  // ACB Score (Cumulative)
  const calculatedAcb = medicines.reduce((sum, m) => sum + (m.acbScore || 0), 0);
  const finalAcb = typeof acbScore === 'number' && acbScore > 0
    ? acbScore
    : (calculatedAcb > 0 ? calculatedAcb : (level >= 5 ? 5 : level >= 4 ? 3 : 1));

  // Average Regimen Burden
  const averageRisk = regimenRisk?.averageRisk ?? (medicines.length > 0
    ? parseFloat((medicines.reduce((sum, m) => sum + (m.harmLevel || 1), 0) / medicines.length).toFixed(1))
    : 1.0);

  return {
    score,
    level,
    label,
    acbScore: finalAcb,
    averageRisk,
    highestRiskDrug: highestDrug,
    highestDrugName: highestDrug?.name || 'High-Risk Medication',
    hasMajorFlags,
  };
}
