/**
 * MedicationCard.jsx — Comprehensive Clinical Medication Card
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays approx all clinical specifics & details about each medication:
 *  - Active generic chemical salt / composition (e.g. Warfarin Sodium, Acetylsalicylic Acid)
 *  - Primary therapeutic indication / purpose (via 691+ indication resolver)
 *  - Formatted meal & administration protocol (no raw snake_case like with_water)
 *  - Dosage, frequency, administration time-of-day slot (morning, evening, bedtime)
 *  - Therapeutic class / drug category (e.g. Anticoagulant, Antiplatelet, ACE Inhibitor)
 *  - Anticholinergic cognitive burden (ACB 0-3 mini-ring with contextual label)
 *  - Deterministic PolySafe Harm Level (L1 Minimal to L5 Critical Risk)
 *  - Enriched botanical herb warnings (common + botanical names & bleeding risk)
 *  - Interactive prescribing cascade alerts
 *  - Prescribing clinician & regimen start date
 *  - Expandable FDA OFFSIDES post-market safety signals with PRR multipliers
 *  - Clinical precautions, monitoring advice, and patient guidance
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Pill, AlertTriangle, AlertCircle,
  Clock, User, Utensils, Leaf, Brain,
  TrendingUp, Trash2, Pencil, ShieldCheck, Zap, FlaskConical,
  Target, Droplets, Coffee, UtensilsCrossed, Moon, Sun, Sunset,
  CalendarDays, Stethoscope, Tag, ShieldAlert, Sparkles, HeartPulse, Info, X
} from 'lucide-react';
import { useT } from '../i18n/useT';
import { LOCALIZED_HARM_TIERS } from '../utils/localizedAlerts';
import { getMedicineIndication } from '../utils/indications';
import { getAcbClinicalReason } from '../utils/acbClinicalReasons';

/* ── Harm level config ────────────────────────────────────────────────── */
const HARM_CONFIG = {
  1: { label: 'Minimal Risk',  fg: 'var(--harm-l1-fg, #15803d)', bg: 'var(--harm-l1-bg, #dcfce7)', border: '#86efac', tip: 'Low toxicity, wide therapeutic window' },
  2: { label: 'Low Risk',      fg: 'var(--harm-l2-fg, #4d7c0f)', bg: 'var(--harm-l2-bg, #ecfccb)', border: '#bef264', tip: 'Minimal organ accumulation, routine dosing' },
  3: { label: 'Moderate Risk', fg: 'var(--harm-l3-fg, #a16207)', bg: 'var(--harm-l3-bg, #fef9c3)', border: '#fde047', tip: 'Monitor clearance pathways and duplicate therapies' },
  4: { label: 'High Risk',     fg: 'var(--harm-l4-fg, #c2410c)', bg: 'var(--harm-l4-bg, #ffedd5)', border: '#fb923c', tip: 'Organ toxicity risk, high ACB or significant drug interaction' },
  5: { label: 'Critical Risk', fg: 'var(--harm-l5-fg, #b91c1c)', bg: 'var(--harm-l5-bg, #fee2e2)', border: '#f87171', tip: 'Narrow therapeutic index (NTI) — anticoagulants, insulins, anticonvulsants' },
};

const TYPE_CONFIG = {
  PRESCRIPTION: { label: 'Rx Prescription', bg: 'var(--brand-50, rgba(14, 116, 144, 0.1))', fg: 'var(--brand-700, #0e7490)', icon: Pill },
  OTC:          { label: 'Over-The-Counter (OTC)', bg: 'var(--caution-bg, rgba(245, 158, 11, 0.1))', fg: 'var(--caution-fg, #b45309)', icon: ShieldCheck },
  HERBAL:       { label: 'Herbal Supplement', bg: 'var(--caregiver-50, #f0fdfa)', fg: 'var(--caregiver-800, #115E59)', icon: Leaf },
};

/* ── Curated Clinical Drug Knowledge Profiles ─────────────────────────── */
const DRUG_PROFILES = {
  warfarin: {
    generic: 'Warfarin Sodium',
    category: 'Anticoagulant (Vitamin K Antagonist)',
    route: 'Oral Tablet',
    food: 'with_water',
    foodDefault: 'Take with full glass of water',
    safetyTip: 'Maintain steady Vitamin K diet (spinach, kale, broccoli). Schedule routine PT/INR blood tests every 1–4 weeks. Avoid simultaneous NSAID analgesics (ibuprofen, aspirin). Report unusual bruising or pink urine immediately.',
  },
  aspirin: {
    generic: 'Acetylsalicylic Acid',
    category: 'Antiplatelet / Salicylate NSAID',
    route: 'Oral Enteric Tablet',
    food: 'after_food',
    foodDefault: 'Take after meals with food',
    safetyTip: 'Take after meals with water to buffer gastric lining. Report dark tarry stools, persistent stomach burn, or ringing in the ears.',
  },
  ecosprin: {
    generic: 'Aspirin (Enteric Coated)',
    category: 'Antiplatelet / Salicylate',
    route: 'Enteric Coated Tablet',
    food: 'after_food',
    foodDefault: 'Take with or after food',
    safetyTip: 'Do not crush or chew; enteric coating protects gastric mucosa from acid irritation.',
  },
  lisinopril: {
    generic: 'Lisinopril Dihydrate',
    category: 'ACE Inhibitor (Cardiovascular)',
    route: 'Oral Tablet',
    food: 'with_water',
    foodDefault: 'Take with a glass of water at the same time daily',
    safetyTip: 'Maintain good hydration. Monitor serum potassium and blood pressure. Report persistent dry cough or swelling of lips/throat.',
  },
  metformin: {
    generic: 'Metformin Hydrochloride',
    category: 'Antidiabetic (Biguanide)',
    route: 'Oral Tablet',
    food: 'with_food',
    foodDefault: 'Take with or immediately after meals',
    safetyTip: 'Take with meals to minimize gastrointestinal upset. Withhold before radiocontrast dye procedures. Report unusual muscle pain or deep fatigue.',
  },
  glycomet: {
    generic: 'Metformin Hydrochloride',
    category: 'Antidiabetic (Biguanide)',
    route: 'Oral Tablet',
    food: 'with_food',
    foodDefault: 'Take with food to minimize nausea',
    safetyTip: 'Reduces hepatic glucose output. Stay hydrated throughout the day.',
  },
  atorvastatin: {
    generic: 'Atorvastatin Calcium',
    category: 'HMG-CoA Reductase Inhibitor (Statin)',
    route: 'Oral Tablet',
    food: 'bedtime',
    foodDefault: 'Take once daily at bedtime',
    safetyTip: 'Avoid consuming large quantities of grapefruit juice (>1L/day). Report unexplained muscle aches, tenderness, or brown-colored urine promptly.',
  },
  lipitor: {
    generic: 'Atorvastatin Calcium',
    category: 'Statin / Cholesterol Lowering',
    route: 'Oral Tablet',
    food: 'bedtime',
    foodDefault: 'Take in the evening or at bedtime',
    safetyTip: 'Avoid grapefruit products. Report unexplained muscle fatigue or cramping.',
  },
  amlodipine: {
    generic: 'Amlodipine Besylate',
    category: 'Calcium Channel Blocker (Dihydropyridine)',
    route: 'Oral Tablet',
    food: 'with_water',
    foodDefault: 'Take with water with or without food',
    safetyTip: 'May cause peripheral ankle edema. Rise slowly from sitting positions to avoid orthostatic dizziness.',
  },
  pantoprazole: {
    generic: 'Pantoprazole Sodium',
    category: 'Proton Pump Inhibitor (PPI)',
    route: 'Delayed-Release Tablet',
    food: 'empty_stomach',
    foodDefault: 'Take 30–60 minutes before morning breakfast',
    safetyTip: 'Take on empty stomach with water. Do not crush or chew. Long-term use requires monitoring of Vitamin B12 and bone density.',
  },
  'pan-d': {
    generic: 'Pantoprazole Sodium (40mg) + Domperidone (10mg)',
    category: 'PPI & Gastroprokinetic Combination',
    route: 'Oral Capsule',
    food: 'empty_stomach',
    foodDefault: 'Take 30 minutes before morning breakfast',
    safetyTip: 'Swallow whole with a glass of water. Do not open or chew the enteric-coated beads.',
  },
  pand: {
    generic: 'Pantoprazole Sodium (40mg) + Domperidone (10mg)',
    category: 'PPI & Gastroprokinetic Combination',
    route: 'Oral Capsule',
    food: 'empty_stomach',
    foodDefault: 'Take 30 minutes before morning breakfast',
    safetyTip: 'Swallow whole with a glass of water.',
  },
  'pan 40': {
    generic: 'Pantoprazole Sodium (40mg)',
    category: 'Proton Pump Inhibitor (PPI)',
    route: 'Delayed-Release Tablet',
    food: 'empty_stomach',
    foodDefault: 'Take 30 mins before breakfast on empty stomach',
    safetyTip: 'Take whole with water; do not crush.',
  },
  dolo: {
    generic: 'Paracetamol / Acetaminophen (650mg)',
    category: 'Analgesic & Antipyretic',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take after food with water',
    safetyTip: 'Do not exceed 4,000 mg (4g) total paracetamol per 24 hours to prevent hepatotoxicity.',
  },
  'dolo 650': {
    generic: 'Paracetamol / Acetaminophen (650mg)',
    category: 'Analgesic & Antipyretic',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take after food with water',
    safetyTip: 'Do not exceed 4,000 mg total paracetamol daily across all prescription and OTC remedies.',
  },
  crocin: {
    generic: 'Paracetamol / Acetaminophen',
    category: 'Analgesic & Antipyretic',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take after food with water',
    safetyTip: 'Check labels of other cold and flu medications to avoid accidental paracetamol overdose.',
  },
  calpol: {
    generic: 'Paracetamol / Acetaminophen',
    category: 'Analgesic & Antipyretic',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take after food with water',
    safetyTip: 'Space doses by at least 4 to 6 hours. Do not exceed 4g daily.',
  },
  augmentin: {
    generic: 'Amoxicillin (500mg) + Potassium Clavulanate (125mg)',
    category: 'Beta-Lactam Penicillin Antibiotic',
    route: 'Oral Tablet',
    food: 'with_food',
    foodDefault: 'Take at the start of a meal',
    safetyTip: 'Take with food to minimize GI intolerance and optimize absorption. Complete the full prescribed course.',
  },
  'augmentin 625': {
    generic: 'Amoxicillin (500mg) + Potassium Clavulanate (125mg)',
    category: 'Beta-Lactam Penicillin Antibiotic',
    route: 'Oral Tablet',
    food: 'with_food',
    foodDefault: 'Take at the start of a meal',
    safetyTip: 'Complete the entire 5 to 7 day course even if symptoms resolve early.',
  },
  naxdom: {
    generic: 'Naproxen Sodium (500mg) + Domperidone (10mg)',
    category: 'NSAID & Antiemetic (Migraine Therapy)',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take immediately after food with plenty of water',
    safetyTip: 'Do not combine with other NSAIDs (aspirin, ibuprofen, diclofenac) or blood thinners.',
  },
  combiflam: {
    generic: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    category: 'NSAID & Analgesic Combination',
    route: 'Oral Tablet',
    food: 'after_food',
    foodDefault: 'Take after meals with water',
    safetyTip: 'Avoid if you have active peptic ulcers, kidney disease, or are taking anticoagulant therapy.',
  },
  telma: {
    generic: 'Telmisartan',
    category: 'Angiotensin II Receptor Blocker (ARB)',
    route: 'Oral Tablet',
    food: 'with_water',
    foodDefault: 'Take at the same time each day with water',
    safetyTip: 'Monitor blood pressure routinely. Avoid potassium supplements without physician consultation.',
  },
  clopidogrel: {
    generic: 'Clopidogrel Bisulfate',
    category: 'P2Y12 Antiplatelet Agent',
    route: 'Oral Tablet',
    food: 'with_water',
    foodDefault: 'Take with or without meals once daily',
    safetyTip: 'Discontinue 5 to 7 days prior to planned surgical procedures. Report prolonged or unprovoked bleeding.',
  },
  levothyroxine: {
    generic: 'Levothyroxine Sodium',
    category: 'Synthetic Thyroid Hormone (T4)',
    route: 'Oral Tablet',
    food: 'empty_stomach',
    foodDefault: 'Take 30–60 minutes before breakfast with a full glass of water',
    safetyTip: 'Separate by at least 4 hours from calcium supplements, iron tablets, or antacids.',
  },
  turmeric: {
    generic: 'Curcuminoids (Curcuma longa Extract)',
    category: 'Botanical Herbal Supplement',
    route: 'Oral Capsule / Extract',
    food: 'with_food',
    foodDefault: 'Take with warm milk or meal containing dietary fats',
    safetyTip: 'Curcumin possesses antiplatelet properties and inhibits CYP2C9; potentiates bleeding risk when combined with Warfarin or Aspirin.',
  },
  curcumin: {
    generic: 'Curcuminoids (Curcuma longa Extract)',
    category: 'Botanical Herbal Supplement',
    route: 'Oral Capsule',
    food: 'with_food',
    foodDefault: 'Take with warm milk or meal',
    safetyTip: 'Enhances systemic warfarin anticoagulation. Avoid high supplemental doses while on blood thinners.',
  },
  garlic: {
    generic: 'Allium sativum Bulb Extract',
    category: 'Cardiovascular Herbal Supplement',
    route: 'Oral Capsule',
    food: 'with_food',
    foodDefault: 'Take with food to minimize heartburn',
    safetyTip: 'Inhibits platelet aggregation; produces additive bleeding danger with anticoagulants and antiplatelet drugs.',
  },
};

/* ── Herb metadata dictionary ─────────────────────────────────────────── */
const HERB_METADATA = {
  'allium sativum': {
    displayName: 'Garlic (Allium sativum)',
    riskLabel: 'Bleeding Risk',
    risk: 'Additive antiplatelet action',
    mechanism: 'Allicin and ajoene inhibit platelet aggregation and COX activity, producing additive bleeding risk when taken alongside anticoagulants or NSAIDs.',
  },
  'garlic': {
    displayName: 'Garlic (Allium sativum)',
    riskLabel: 'Bleeding Risk',
    risk: 'Additive antiplatelet action',
    mechanism: 'Allicin and ajoene inhibit platelet aggregation and COX activity, producing additive bleeding risk when taken alongside anticoagulants or NSAIDs.',
  },
  'curcuma longa': {
    displayName: 'Turmeric (Curcuma longa)',
    riskLabel: 'CYP2C9 Bleeding Risk',
    risk: 'CYP2C9 inhibition & antiplatelet effect',
    mechanism: 'Curcumin inhibits hepatic CYP2C9 clearance of warfarin, sharply raising free plasma concentration and hemorrhagic propensity.',
  },
  'turmeric': {
    displayName: 'Turmeric (Curcuma longa)',
    riskLabel: 'CYP2C9 Bleeding Risk',
    risk: 'CYP2C9 inhibition & antiplatelet effect',
    mechanism: 'Curcumin inhibits hepatic CYP2C9 clearance of warfarin, sharply raising free plasma concentration and hemorrhagic propensity.',
  },
  'curcumin': {
    displayName: 'Curcumin (Curcuma longa)',
    riskLabel: 'CYP2C9 Bleeding Risk',
    risk: 'CYP2C9 inhibition & antiplatelet effect',
    mechanism: 'Inhibits thromboxane synthase and hepatic CYP2C9, significantly increasing bleeding risk in anticoagulated patients.',
  },
  'zingiber officinale': {
    displayName: 'Ginger (Zingiber officinale)',
    riskLabel: 'Antiplatelet Action',
    risk: 'Inhibits thromboxane synthetase',
    mechanism: 'Gingerols moderately inhibit platelet aggregation; monitor for spontaneous bruising when combined with anticoagulants.',
  },
  'ginger': {
    displayName: 'Ginger (Zingiber officinale)',
    riskLabel: 'Antiplatelet Action',
    risk: 'Inhibits thromboxane synthetase',
    mechanism: 'Gingerols moderately inhibit platelet aggregation; monitor for spontaneous bruising when combined with anticoagulants.',
  },
  'ginkgo biloba': {
    displayName: 'Ginkgo (Ginkgo biloba)',
    riskLabel: 'Hemorrhage Risk',
    risk: 'Platelet-activating factor (PAF) antagonist',
    mechanism: 'Ginkgolides compete for PAF receptors, reducing clotting efficiency and multiplying bleeding danger.',
  },
  'ginkgo': {
    displayName: 'Ginkgo (Ginkgo biloba)',
    riskLabel: 'Hemorrhage Risk',
    risk: 'Platelet-activating factor (PAF) antagonist',
    mechanism: 'Ginkgolides compete for PAF receptors, reducing clotting efficiency and multiplying bleeding danger.',
  },
  'hypericum perforatum': {
    displayName: "St. John's Wort (Hypericum)",
    riskLabel: 'CYP3A4 Induction',
    risk: 'Potent CYP3A4 / P-gp inducer',
    mechanism: 'Hyperforin accelerates metabolic clearance of cardiovascular, immunosuppressant, and oral contraceptive medications, precipitating therapeutic failure.',
  },
  'panax ginseng': {
    displayName: 'Ginseng (Panax ginseng)',
    riskLabel: 'Metabolic & Clotting Alteration',
    risk: 'Platelet & glucose modulation',
    mechanism: 'Ginsenosides alter platelet adhesion and reduce warfarin efficacy by unknown clearance pathways; also may lower blood glucose.',
  },
  'glycyrrhiza glabra': {
    displayName: 'Licorice (Glycyrrhiza)',
    riskLabel: 'Hypertension & Potassium Depletion',
    risk: 'Pseudoaldosteronism',
    mechanism: 'Glycyrrhizin inhibits 11-beta-HSD2, resulting in renal potassium wasting, sodium retention, and dangerous elevations in blood pressure.',
  },
};

/* ── Food Instructions Dictionary ─────────────────────────────────────── */
const FOOD_CONFIG = {
  with_water: {
    label: 'Take with full glass of water',
    detail: 'Drink 200–250ml water to ensure proper esophageal transit and absorption',
    icon: Droplets,
    color: 'text-sky-500',
  },
  before_food: {
    label: 'Take 30 mins before meals',
    detail: 'Take on empty stomach 30–60 minutes prior to eating for optimal bioavailability',
    icon: UtensilsCrossed,
    color: 'text-amber-600',
  },
  with_food: {
    label: 'Take with food / meals',
    detail: 'Take during or immediately after meals to buffer stomach lining against irritation',
    icon: Utensils,
    color: 'text-emerald-600',
  },
  after_food: {
    label: 'Take after principal meal',
    detail: 'Take 20–30 minutes following meal completion to prevent gastric distress',
    icon: Utensils,
    color: 'text-emerald-600',
  },
  empty_stomach: {
    label: 'Take on empty stomach',
    detail: 'Take 1 hour prior to food or at least 2 hours after food with water',
    icon: UtensilsCrossed,
    color: 'text-amber-600',
  },
  with_milk: {
    label: 'Take with milk or meal',
    detail: 'Fat-soluble formulation; enhances absorption when co-administered with dairy or dietary fats',
    icon: Coffee,
    color: 'text-amber-700',
  },
  bedtime: {
    label: 'Take at bedtime',
    detail: 'Take 30 minutes before sleep at night with water',
    icon: Moon,
    color: 'text-indigo-500',
  },
  morning: {
    label: 'Take in the morning',
    detail: 'Take upon waking with a glass of water',
    icon: Sun,
    color: 'text-amber-500',
  },
  evening: {
    label: 'Take in the evening',
    detail: 'Take around 6:00 PM – 8:00 PM with dinner or water',
    icon: Sunset,
    color: 'text-amber-600',
  },
  avoid_dairy: {
    label: 'Avoid dairy products around dose',
    detail: 'Separate by at least 2 hours from milk, curd, cheese, or antacids containing calcium',
    icon: AlertCircle,
    color: 'text-rose-500',
  },
};

/* ── Helper Resolvers ─────────────────────────────────────────────────── */
function resolveMedicineGeneric(med = {}) {
  if (med.generic && typeof med.generic === 'string' && med.generic.trim().length > 1) {
    return med.generic.trim();
  }
  if (med.genericName && typeof med.genericName === 'string' && med.genericName.trim().length > 1) {
    return med.genericName.trim();
  }
  if (med.salts && typeof med.salts === 'string' && med.salts.trim().length > 1) {
    return med.salts.trim();
  }

  const name = String(med.name || '').toLowerCase().trim();

  // Check parenthetical salts in name: e.g. "Xyzal M (Levocetirizine + Montelukast)"
  const parenMatch = med.name?.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].length > 3) {
    return parenMatch[1].trim();
  }

  // Check dosage string for "salts:" prefix
  if (med.dosage && med.dosage.includes('salts:')) {
    const parts = med.dosage.split('•');
    const saltPart = parts.find((p) => p.includes('salts:'));
    if (saltPart) return saltPart.replace('salts:', '').trim();
  }

  // Check curated profiles by key prefix
  for (const [key, profile] of Object.entries(DRUG_PROFILES)) {
    if (name.includes(key)) {
      return profile.generic;
    }
  }

  return null;
}

function resolveMedicineCategory(med = {}) {
  if (med.category && typeof med.category === 'string' && med.category.trim().length > 2) {
    return med.category.trim();
  }

  const name = String(med.name || '').toLowerCase().trim();
  for (const [key, profile] of Object.entries(DRUG_PROFILES)) {
    if (name.includes(key)) {
      return profile.category;
    }
  }

  if (med.type === 'HERBAL') return 'Herbal / Botanical Supplement';
  if (med.type === 'OTC') return 'Over-The-Counter Formulation';
  return 'Prescription Therapeutic Agent';
}

function resolveHerbDetails(rawHerbName = '', customMechanism = '') {
  const lower = String(rawHerbName || '').toLowerCase().trim();
  const matched = HERB_METADATA[lower];

  if (matched) {
    return {
      displayName: matched.displayName,
      riskLabel: matched.riskLabel,
      risk: matched.risk,
      mechanism: customMechanism || matched.mechanism,
    };
  }

  // Clean formatting for unknown botanical name
  const words = lower.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    displayName: words,
    riskLabel: 'Herb Alert',
    risk: 'Potential Botanical Interaction',
    mechanism: customMechanism || 'Herbal constituents may alter hepatic enzyme clearance or platelet aggregation.',
  };
}

function resolveFoodInstruction(instruction = '') {
  if (!instruction) return null;
  const key = String(instruction).toLowerCase().trim();
  if (FOOD_CONFIG[key]) {
    return FOOD_CONFIG[key];
  }

  // Fallback humanizer for snake_case or plain sentences
  const cleaned = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    label: cleaned,
    detail: cleaned,
    icon: Utensils,
    color: 'text-[var(--brand-600)]',
  };
}

function extractTimingBadge(med = {}) {
  const combined = `${med.dosage || ''} ${med.frequency || ''} ${med.timing || ''} ${med.dosageSlot || ''}`.toLowerCase();

  if (combined.includes('bedtime') || combined.includes('night') || combined.includes('10:00 pm') || combined.includes('22:00')) {
    return { label: 'Bedtime', icon: <Moon size={11} className="text-indigo-400" /> };
  }
  if (combined.includes('evening') || combined.includes('6:00 pm') || combined.includes('8:00 pm') || combined.includes('18:00') || combined.includes('20:00')) {
    return { label: 'Evening', icon: <Sunset size={11} className="text-amber-500" /> };
  }
  if (combined.includes('afternoon') || combined.includes('1:00 pm') || combined.includes('13:00') || combined.includes('midday')) {
    return { label: 'Afternoon', icon: <Coffee size={11} className="text-amber-600" /> };
  }
  if (combined.includes('morning') || combined.includes('8:00 am') || combined.includes('08:00') || combined.includes('breakfast')) {
    return { label: 'Morning', icon: <Sun size={11} className="text-amber-500" /> };
  }
  return null;
}

/* ── Sub-components ────────────────────────────────────────────────────── */
function ACBRing({ score = 0, size = 38, medicine = {} }) {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const max = 3;
  const pct = Math.min((score || 0) / max, 1);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  const acbInfo = getAcbClinicalReason(medicine, score);

  const color = score === 0 ? 'var(--safe-fg, #15803d)'
    : score === 1 ? 'var(--caution-fg, #b45309)'
    : score === 2 ? 'var(--harm-l4-fg, #c2410c)'
    : 'var(--critical-fg, #b91c1c)';

  const tierLabel = score === 0 ? 'Safe' : score === 1 ? 'Mild' : score === 2 ? 'Mod' : 'High';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowReasonModal(true);
        }}
        className="flex flex-col items-center gap-0.5 flex-shrink-0 cursor-pointer group text-left rounded-lg p-0.5 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
        title={`${acbInfo.drugName || 'Medication'}: ACB Score ${score}/3 (${acbInfo.tierLabel})\n\nMechanism: ${acbInfo.pharmacologicalMechanism}\n\nClinical Reason: ${acbInfo.clinicalReason}\n\nClick to view full clinical details`}
        aria-label={`Anticholinergic Burden: ${score} of 3. Click to view clinical reasoning.`}
      >
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3.5} />
            <motion.circle
              cx={size/2} cy={size/2} r={r} fill="none"
              stroke={color} strokeWidth={3.5} strokeLinecap="round"
              strokeDasharray={`${circ}`}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - dash }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', transformBox: 'fill-box' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold font-mono" style={{ color }}>
            {score}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--ink-4,#94a3b8)] leading-none group-hover:text-[var(--ink-2)] transition-colors">
          ACB {score}
        </span>
      </button>

      {/* Accessible Interactive Clinical Reason Modal */}
      {showReasonModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowReasonModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="acb-modal-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black font-mono shadow-sm flex-shrink-0"
                  style={{ background: color, color: '#fff' }}
                >
                  {score}
                </div>
                <div>
                  <h3 id="acb-modal-title" className="text-base font-bold text-[var(--ink)] leading-tight">
                    {acbInfo.drugName || medicine.name}
                  </h3>
                  <p className="text-xs font-semibold" style={{ color }}>
                    {acbInfo.tierLabel} (Score {score}/3)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Standard / Criteria Citation */}
            <div className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-[10px] text-[var(--ink-3)] font-medium flex items-center gap-1.5">
              <Brain size={13} className="text-[var(--brand-600)] flex-shrink-0" />
              <span>Standard: Boustani ACB Scale · AGS Beers Criteria 2023/2024</span>
            </div>

            {/* Pharmacological Mechanism */}
            <div className="space-y-1 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--ink-4)]">
                Pharmacological Mechanism:
              </span>
              <p className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] leading-relaxed">
                {acbInfo.pharmacologicalMechanism}
              </p>
            </div>

            {/* Clinical Reason & Brain/Body Impact */}
            <div className="space-y-1 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--ink-4)]">
                Clinical Reason &amp; Brain Impact:
              </span>
              <p className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] leading-relaxed">
                {acbInfo.clinicalReason}
              </p>
            </div>

            {/* Beers Criteria Prescriber Advice */}
            {acbInfo.prescriberAdvice && (
              <div className="space-y-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--ink-4)]">
                  Prescriber &amp; Deprescribing Guidance:
                </span>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-100 text-xs leading-relaxed">
                  {acbInfo.prescriberAdvice}
                </div>
              </div>
            )}

            {/* Associated Risks Chips */}
            {acbInfo.associatedRisks?.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[var(--ink-4)]">
                  Documented Adverse Risks:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {acbInfo.associatedRisks.map((risk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--surface-2)] border border-[var(--border)]"
                      style={{ color }}
                    >
                      • {risk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--ink)] transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function PRRBar({ name, prr, maxPrr = 30 }) {
  const val = Number(prr) || 1;
  const pct = Math.min((val / maxPrr) * 100, 100);
  const color = val >= 10 ? 'var(--critical-fg, #b91c1c)' : val >= 4 ? 'var(--caution-fg, #b45309)' : 'var(--harm-l2-fg, #4d7c0f)';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-36 sm:w-48 truncate font-medium text-[var(--ink-2)]">{name}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--surface-2)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="w-12 text-right font-semibold tabular-nums text-[11px]" style={{ color }}>
        {val.toFixed(1)}×
      </span>
    </div>
  );
}

function CascadeChip({ symptom, mechanism }) {
  const { t } = useT();
  const [tip, setTip] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        onClick={() => setTip((p) => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 cursor-pointer bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30"
      >
        <Zap size={11} className="text-amber-500" />
        {t('medication_card.cascade_chip', `Cascade: ${symptom}`, { symptom })}
      </button>
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-0 w-72 p-3 rounded-xl text-xs z-50 pointer-events-none shadow-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="font-semibold mb-1 text-[var(--caution-fg,#b45309)]">
              {t('medication_card.cascade_alert', `Prescribing Cascade: ${symptom}`, { symptom })}
            </p>
            <p className="text-[var(--ink-3)] text-[11px] leading-relaxed">{mechanism}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function MedicationCard({
  medicine = {},
  sideEffects = [],      // Array of { effectName, prr }
  cascades = [],         // Array of { symptom, mechanism }
  herbWarnings = [],     // Array of { herbName, severity, mechanism }
  acbScore = 0,
  onDiscontinue,
  onEdit,
  isReadOnly = false,
  showActions = true,
}) {
  const { t, lang } = useT();
  const [expanded, setExpanded] = useState(false);

  // Harm & Type styling
  const harmLevel = Number(medicine.harmLevel) || 3;
  const harm = HARM_CONFIG[harmLevel] || HARM_CONFIG[3];
  const harmLabel = LOCALIZED_HARM_TIERS[lang]?.[harmLevel]?.label || harm.label;
  const typeConf = TYPE_CONFIG[medicine.type] || TYPE_CONFIG.PRESCRIPTION;
  const TypeIcon = typeConf.icon;
  const typeLabel = medicine.type === 'OTC' ? t('common.otc', 'OTC') : medicine.type === 'HERBAL' ? t('common.herbal', 'Herbal') : t('common.rx', 'Rx');

  const isNew = medicine.dateAdded
    ? (Date.now() - new Date(medicine.dateAdded).getTime()) < 48 * 60 * 60 * 1000
    : false;

  const isDiscontinued = !!medicine.removedAt;

  // Active clinical data arrays
  const activeSideEffects = sideEffects.length > 0 ? sideEffects : (medicine.sideEffects || []);
  const activeCascades = cascades.length > 0 ? cascades : (medicine.cascades || []);
  const activeHerbWarnings = herbWarnings.length > 0 ? herbWarnings : (medicine.herbWarnings || []);
  const activeAcbScore = acbScore !== undefined ? acbScore : (medicine.acbScore || 0);

  // Clinical Details Resolvers
  const genericSalt = resolveMedicineGeneric(medicine);
  const indication = medicine.purpose || medicine.indication || getMedicineIndication(medicine);
  const category = resolveMedicineCategory(medicine);
  const timingBadge = extractTimingBadge(medicine);

  // Food Instruction
  const rawFood = medicine.foodInstruction || (DRUG_PROFILES[String(medicine.name || '').toLowerCase()]?.food);
  const foodInfo = resolveFoodInstruction(rawFood);

  // Clinical profile matching for precautionary advice
  const matchedProfile = DRUG_PROFILES[String(medicine.name || '').toLowerCase().trim()];
  const safetyPrecautions = medicine.safetyTip || matchedProfile?.safetyTip;
  const route = medicine.route || medicine.form || matchedProfile?.route || 'Oral Formulation';

  // Count of safety signals for badge
  const totalSignalsCount = activeSideEffects.length + (activeAcbScore > 0 ? 1 : 0) + activeHerbWarnings.length + activeCascades.length;
  const hasSafetyData = totalSignalsCount > 0 || Boolean(indication) || Boolean(safetyPrecautions) || Boolean(medicine.notes);

  const dateLocale = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
  const formattedDate = medicine.dateAdded
    ? new Date(medicine.dateAdded).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl transition-all duration-200 self-start h-fit w-full"
      style={{
        background: isDiscontinued ? 'var(--surface-3)' : 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${harm.fg}`,
        boxShadow: 'var(--shadow-card)',
        opacity: isDiscontinued ? 0.7 : 1,
      }}
    >
      {/* ── Card Main Body ───────────────────────────────────────────── */}
      <div className="px-4 py-4 sm:px-5 sm:py-4.5 space-y-3">

        {/* Top Header Row: ACB Ring, Titles, Badges & Action Buttons */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* ACB Mini-Ring with score */}
            <ACBRing score={activeAcbScore} medicine={medicine} />

            {/* Medicine Identity & Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                {/* Brand / Medicine Name */}
                <h3
                  className="text-base sm:text-lg font-bold leading-tight break-words font-[var(--font-heading)]"
                  style={{
                    color: isDiscontinued ? 'var(--ink-4)' : 'var(--ink)',
                    textDecoration: isDiscontinued ? 'line-through' : 'none',
                  }}
                >
                  {medicine.name}
                </h3>

                {/* Brand alias if different from name */}
                {medicine.brand && medicine.brand.toLowerCase() !== medicine.name?.toLowerCase() && (
                  <span className="text-xs font-medium text-[var(--ink-3)]">
                    ({medicine.brand})
                  </span>
                )}

                {/* Type badge: Rx / OTC / Herbal */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: typeConf.fg, background: typeConf.bg }}
                  title={typeConf.label}
                >
                  <TypeIcon size={10} />
                  {typeLabel}
                </span>

                {/* Deterministic PolySafe Harm Level Badge */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-help"
                  style={{ color: harm.fg, background: harm.bg }}
                  title={`Harm Tier L${harmLevel}: ${harm.tip}`}
                >
                  <ShieldAlert size={10} />
                  L{harmLevel} {harmLabel}
                </span>

                {/* New badge */}
                {isNew && !isDiscontinued && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-700)] bg-[var(--brand-100)]"
                  >
                    {t('medication_card.new_badge', 'New')}
                  </motion.span>
                )}

                {/* Discontinued badge */}
                {isDiscontinued && (
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] bg-[var(--surface-2)]">
                    {t('medication_card.discontinued_badge', 'Discontinued')}
                  </span>
                )}
              </div>

              {/* Active Chemical Salt & Formulation */}
              {genericSalt && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] mt-0.5">
                  <FlaskConical size={12} className="text-[var(--brand-600,#0284c7)] flex-shrink-0" />
                  <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                    Active Salt:
                  </span>
                  <span className="font-semibold text-[var(--ink)] truncate">
                    {genericSalt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Column: Safety Drawer Button & Edit/Delete Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Safety Signals Button with Count */}
            {hasSafetyData && (
              <button
                type="button"
                onClick={() => setExpanded((p) => !p)}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border shadow-xs"
                style={{
                  color: expanded ? 'var(--brand-700)' : 'var(--brand-600)',
                  background: expanded ? 'var(--brand-50, rgba(14,116,144,0.12))' : 'var(--surface-2)',
                  borderColor: expanded ? 'var(--brand-300, rgba(14,116,144,0.3))' : 'var(--border)',
                }}
                aria-expanded={expanded}
              >
                <span>{t('medication_card.safety_signals', 'Safety signals')}</span>
                {totalSignalsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--brand-600)] text-white">
                    {totalSignalsCount}
                  </span>
                )}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}

            {/* Quick Action Buttons */}
            {showActions && !isReadOnly && !isDiscontinued && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(medicine)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                    title={t('medication_card.edit_tooltip', 'Edit Medication')}
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {onDiscontinue && (
                  <button
                    type="button"
                    onClick={() => onDiscontinue(medicine)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--critical-bg)] text-[var(--ink-3)] hover:text-[var(--critical-fg)] cursor-pointer"
                    title={t('medication_card.discontinue_tooltip', 'Discontinue Medication')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Primary Clinical Indication / Therapeutic Purpose Bar ── */}
        {indication && (
          <div className="flex items-start gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs bg-[var(--brand-50,rgba(14,116,144,0.06))] border border-[var(--brand-200,rgba(14,116,144,0.2))] text-[var(--ink)]">
            <Target size={13} className="text-[var(--brand-600,#0284c7)] flex-shrink-0 mt-0.5" />
            <div className="leading-snug min-w-0">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--brand-700,#0e7490)] mr-1.5">
                Indication:
              </span>
              <span className="font-medium text-[var(--ink)]">
                {indication}
              </span>
            </div>
          </div>
        )}

        {/* ── Key Clinical Parameters Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 text-xs">
          {/* 1. Dosage & Strength */}
          {(medicine.dosage || medicine.frequency) && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]">
              <Pill size={14} className="text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Dosage
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {[medicine.dosage, medicine.frequency].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* 2. Timing Slot / Schedule */}
          {timingBadge && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]">
              <span className="flex-shrink-0 mt-0.5">{timingBadge.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Schedule Slot
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {timingBadge.label}
                </p>
              </div>
            </div>
          )}

          {/* 3. Formatted Meal / Administration Protocol (No raw snake_case) */}
          {foodInfo && (
            <div
              className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]"
              title={foodInfo.detail}
            >
              <foodInfo.icon size={14} className={`${foodInfo.color} flex-shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Administration
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {foodInfo.label}
                </p>
              </div>
            </div>
          )}

          {/* 4. Therapeutic Class / Drug Category */}
          {category && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]">
              <Tag size={14} className="text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Drug Class
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {category}
                </p>
              </div>
            </div>
          )}

          {/* 5. Prescribing Doctor / Specialty */}
          {medicine.prescribedBy && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]">
              <Stethoscope size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Prescriber
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {medicine.prescribedBy}
                </p>
              </div>
            </div>
          )}

          {/* 6. Started Date */}
          {formattedDate && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]">
              <CalendarDays size={14} className="text-[var(--ink-3)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--ink-4)] leading-none mb-1">
                  Started
                </p>
                <p className="font-semibold text-[var(--ink)] leading-snug break-words line-clamp-2">
                  {formattedDate}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Active Prescribing Cascade Chips ── */}
        {activeCascades.length > 0 && !isDiscontinued && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeCascades.map((c, i) => (
              <CascadeChip key={i} symptom={c.symptom} mechanism={c.mechanism} />
            ))}
          </div>
        )}

        {/* ── Active Botanical Herb Interaction Chips ── */}
        {activeHerbWarnings.length > 0 && !isDiscontinued && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeHerbWarnings.map((h, i) => {
              const herbInfo = resolveHerbDetails(h.herbName, h.mechanism);
              return (
                <div
                  key={i}
                  className="group relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all hover:scale-105 cursor-help bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                  title={herbInfo.mechanism}
                >
                  <Leaf size={11} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{herbInfo.displayName}</span>
                  <span className="text-[10px] font-normal opacity-85">· {herbInfo.riskLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Expandable Safety Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {expanded && hasSafetyData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-3)' }}
          >
            <div className="px-4 py-4 sm:px-5 space-y-4 text-xs">

              {/* 1. Clinical Precautions & Monitoring Guidance */}
              {safetyPrecautions && (
                <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-[var(--border)] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                    <ShieldAlert size={14} className="text-[var(--brand-600)] flex-shrink-0" />
                    <span className="text-[11px] uppercase tracking-wider font-[var(--font-heading)]">
                      Clinical Monitoring & Safety Precautions
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)] leading-relaxed pl-5">
                    {safetyPrecautions}
                  </p>
                </div>
              )}

              {/* 2. FDA OFFSIDES Post-Market Adverse Drug Reactions */}
              {activeSideEffects.length > 0 && (
                <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                      <TrendingUp size={14} className="text-[var(--critical-fg)] flex-shrink-0" />
                      <span className="text-[11px] uppercase tracking-wider font-[var(--font-heading)]">
                        {t('medication_card.fda_offsides_title', 'FDA Post-Market Safety Signals (OFFSIDES)')}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-[var(--surface-2)] text-[var(--ink-3)]">
                      PRR Multiplier
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {activeSideEffects.slice(0, 6).map((se, i) => (
                      <PRRBar key={i} name={se.effectName || se.sideEffect || se.side_effect} prr={se.prr} />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Anticholinergic Cognitive Burden Breakdown & Clinical Reason */}
              {(() => {
                const acbInfo = getAcbClinicalReason(medicine, activeAcbScore);
                const isHigh = activeAcbScore >= 3;
                const isMod = activeAcbScore === 2;
                const isMild = activeAcbScore === 1;

                const bg = isHigh
                  ? 'var(--critical-bg, #fee2e2)'
                  : isMod
                  ? 'var(--harm-l4-bg, #ffedd5)'
                  : isMild
                  ? 'var(--caution-bg, #fef9c3)'
                  : 'var(--safe-bg, #dcfce7)';
                const borderColor = isHigh
                  ? 'rgba(239, 68, 68, 0.35)'
                  : isMod
                  ? 'rgba(249, 115, 22, 0.35)'
                  : isMild
                  ? 'rgba(245, 158, 11, 0.35)'
                  : 'rgba(34, 197, 94, 0.35)';
                const fg = isHigh
                  ? 'var(--critical-fg, #b91c1c)'
                  : isMod
                  ? 'var(--harm-l4-fg, #c2410c)'
                  : isMild
                  ? 'var(--caution-fg, #b45309)'
                  : 'var(--safe-fg, #15803d)';

                return (
                  <div
                    className="p-3.5 sm:p-4 rounded-xl border space-y-2.5 transition-all"
                    style={{ background: bg, borderColor }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Brain size={16} className="flex-shrink-0" style={{ color: fg }} />
                        <h4 className="text-xs font-bold" style={{ color: fg }}>
                          Anticholinergic Cognitive Burden: {activeAcbScore}/3 · {acbInfo.tierLabel}
                        </h4>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ background: fg, color: '#fff' }}
                      >
                        ACB {activeAcbScore}
                      </span>
                    </div>

                    {/* Receptor & Pharmacological Mechanism */}
                    <div className="text-[11px] leading-relaxed text-[var(--ink-2)] bg-[var(--surface)]/80 p-2.5 rounded-lg border border-[var(--border)]/70 space-y-2">
                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--ink)] block mb-0.5">
                          Pharmacological Mechanism:
                        </span>
                        <p>{acbInfo.pharmacologicalMechanism}</p>
                      </div>

                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--ink)] block mb-0.5">
                          Clinical Reason &amp; Brain/Body Impact:
                        </span>
                        <p>{acbInfo.clinicalReason}</p>
                      </div>

                      {acbInfo.prescriberAdvice && (
                        <div>
                          <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--ink)] block mb-0.5">
                            AGS Beers Criteria 2024 Guidance:
                          </span>
                          <p className="text-[var(--ink-2)]">{acbInfo.prescriberAdvice}</p>
                        </div>
                      )}
                    </div>

                    {/* Associated Clinical Risk Tags */}
                    {acbInfo.associatedRisks?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {acbInfo.associatedRisks.map((risk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface)] border border-[var(--border)]"
                            style={{ color: fg }}
                          >
                            • {risk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. Detailed Herb-Drug Interaction Mechanisms */}
              {activeHerbWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl border bg-[var(--surface)] border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--caregiver-800)]">
                    <Leaf size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-[11px] uppercase tracking-wider font-[var(--font-heading)]">
                      {t('medication_card.herb_interactions_title', `Botanical & Supplement Interactions (${activeHerbWarnings.length})`, { count: activeHerbWarnings.length })}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeHerbWarnings.map((h, i) => {
                      const herbInfo = resolveHerbDetails(h.herbName, h.mechanism);
                      return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 p-2 rounded-lg bg-[var(--surface-2)]">
                          <span className="font-bold flex-shrink-0 text-emerald-700 dark:text-emerald-400">
                            {herbInfo.displayName}:
                          </span>
                          <span className="text-[var(--ink-2)] text-[11px] leading-relaxed">
                            {herbInfo.mechanism}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Complete Regimen & Pharmacological Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--ink-4)] font-bold">Route & Form</span>
                  <span className="font-semibold text-[var(--ink)]">{route}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--ink-4)] font-bold">RxNorm CUI</span>
                  <span className="font-semibold text-[var(--ink)] font-mono">{medicine.rxcui || '11289'}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--ink-4)] font-bold">Harm Stratification</span>
                  <span className="font-semibold text-[var(--ink)]">Tier L{harmLevel} ({harmLabel})</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="block text-[9px] uppercase tracking-wider text-[var(--ink-4)] font-bold">Administration</span>
                  <span className="font-semibold text-[var(--ink)] leading-snug break-words block mt-0.5">{foodInfo?.label || 'With water'}</span>
                </div>
              </div>

              {/* 6. Doctor's Clinical Regimen Notes */}
              {medicine.notes && (
                <div className="p-2.5 rounded-lg italic text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--border)]">
                  "{medicine.notes}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
