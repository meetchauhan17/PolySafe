/**
 * DrugHarmLevel.jsx — Industrial Skeuomorphic WHO/NCI Harm Level Visualizers & OFFSIDES Signal Miner
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Loader2, Info, FlaskConical,
  Activity, AlertTriangle, Pill, Heart, Leaf, ShieldAlert
} from 'lucide-react';
import Card from './Card';
import LedIndicator from './LedIndicator';

// ─── Harm level config (WHO / NCI 5-Tier) ─────────────────────────────────────
export const HARM_LEVELS = {
  1: {
    tier: 'L1',
    label: 'Low Risk',
    shortLabel: 'L1 LOW',
    color: 'var(--safe-fg)',
    ledStatus: 'safe',
    bg: 'bg-emerald-950/5',
    border: 'border-[var(--safe-fg)]',
    badgeCls: 'text-[var(--safe-fg)] border-[var(--safe-fg)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--safe-fg)]',
    tip: 'Multivitamins, minerals, probiotics, herbs — minimal inherent clinical toxicity.',
  },
  2: {
    tier: 'L2',
    label: 'Mild Risk',
    shortLabel: 'L2 MILD',
    color: 'var(--doctor-600)',
    ledStatus: 'online',
    bg: 'bg-sky-950/5',
    border: 'border-[var(--doctor-600)]',
    badgeCls: 'text-[var(--doctor-600)] border-[var(--doctor-600)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--doctor-600)]',
    tip: 'Antacids, H2 blockers, PPIs, antihistamines — monitor for mild GI or drowsiness effects.',
  },
  3: {
    tier: 'L3',
    label: 'Moderate Risk',
    shortLabel: 'L3 MOD',
    color: 'var(--caution-fg)',
    ledStatus: 'caution',
    bg: 'bg-amber-950/5',
    border: 'border-[var(--caution-fg)]',
    badgeCls: 'text-[var(--caution-fg)] border-[var(--caution-fg)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--caution-fg)]',
    tip: 'NSAIDs, CCBs, beta2 agonists, antibiotics, steroids — routine clinical monitoring advised.',
  },
  4: {
    tier: 'L4',
    label: 'High Risk',
    shortLabel: 'L4 HIGH',
    color: '#d97706',
    ledStatus: 'caution',
    bg: 'bg-orange-950/5',
    border: 'border-amber-500',
    badgeCls: 'text-amber-600 border-amber-500 shadow-[var(--shadow-sm)]',
    barColor: 'bg-amber-500',
    tip: 'Statins, opioids, SSRIs/SNRIs, TCAs, ARBs, ACEIs, antidiabetics — high-alert prescription drug.',
  },
  5: {
    tier: 'L5',
    label: 'Critical Risk',
    shortLabel: 'L5 CRIT',
    color: 'var(--critical-fg)',
    ledStatus: 'critical',
    bg: 'bg-rose-950/5',
    border: 'border-[var(--critical-fg)]',
    badgeCls: 'text-[var(--critical-fg)] border-[var(--critical-fg)] font-black shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--critical-fg)]',
    tip: 'Anticoagulants (Warfarin), insulins, anticonvulsants, lithium — narrow therapeutic index.',
  },
};

const CLASS_RISK_MAP = {
  // L5 Critical (Narrow Therapeutic Index & High-Alert)
  'anticoagulant': 5, 'blood thinner': 5, 'warfarin': 5, 'factor xa': 5, 'heparin': 5, 'apixaban': 5, 'rivaroxaban': 5, 'dabigatran': 5,
  'insulin': 5, 'basal insulin': 5, 'anticonvulsant': 5, 'antiseizure': 5, 'phenytoin': 5, 'carbamazepine': 5,
  'valproate': 5, 'lithium': 5, 'chemotherapy': 5, 'cytotoxic': 5, 'immunosuppressant': 5,
  'tofacitinib': 5, 'tfct': 5, 'jak inhibitor': 5, 'targeted dmard': 5,
  'digoxin': 5, 'antiarrhythmic': 5, 'amiodarone': 5, 'methotrexate': 5, 'cyclosporine': 5, 'tacrolimus': 5, 'colchicine': 5,

  // L4 High (Cardiovascular, CNS & Metabolic High-Risk)
  'statin': 4, 'atorvastatin': 4, 'rosuvastatin': 4, 'simvastatin': 4, 'opioid': 4, 'narcotic': 4,
  'tramadol': 4, 'ssri': 4, 'snri': 4, 'tca': 4, 'sertraline': 4, 'fluoxetine': 4, 'escitalopram': 4,
  'duloxetine': 4, 'amitriptyline': 4, 'arb': 4, 'acei': 4, 'telmisartan': 4, 'losartan': 4, 'ramipril': 4,
  'oral antidiabetic': 4, 'metformin': 4, 'glimepiride': 4, 'gliclazide': 4, 'sitagliptin': 4, 'dapagliflozin': 4,
  'benzodiazepine': 4, 'antipsychotic': 4, 'sedative': 4, 'hypnotic': 4, 'clonazepam': 4, 'alprazolam': 4, 'zolpidem': 4,
  'antiplatelet': 4, 'clopidogrel': 4, 'ticagrelor': 4, 'prasugrel': 4,

  // L3 Moderate (Organ Clearance & Standard Systemic Therapeutics)
  'nsaid': 3, 'paracetamol': 3, 'acetaminophen': 3, 'ibuprofen': 3, 'naproxen': 3, 'diclofenac': 3, 'aceclofenac': 3, 'aspirin': 3, 'ecosprin': 3,
  'calcium channel blocker': 3, 'ccb': 3, 'amlodipine': 3, 'nifedipine': 3, 'diltiazem': 3, 'verapamil': 3,
  'beta2 agonist': 3, 'salbutamol': 3, 'albuterol': 3, 'formoterol': 3, 'inhaler': 3,
  'antibiotic': 3, 'amoxicillin': 3, 'augmentin': 3, 'azithromycin': 3, 'ciprofloxacin': 3, 'cefixime': 3,
  'corticosteroid': 3, 'steroid': 3, 'prednisolone': 3, 'budesonide': 3, 'dexamethasone': 3,
  'beta blocker': 3, 'metoprolol': 3, 'atenolol': 3, 'bisoprolol': 3, 'carvedilol': 3, 'propranolol': 3,
  'diuretic': 3, 'furosemide': 3, 'torsemide': 3, 'spironolactone': 3, 'hydrochlorothiazide': 3,
  'thyroid': 3, 'levothyroxine': 3, 'thyronorm': 3, 'eltroxin': 3,
  'pregabalin': 3, 'gabapentin': 3, 'antifungal': 3, 'fluconazole': 3, 'itraconazole': 3,
  'muscle relaxant': 3, 'baclofen': 3, 'thiocolchicoside': 3, 'chlorzoxazone': 3,
  'antigout': 3, 'allopurinol': 3, 'febuxostat': 3,

  // L2 Mild (Symptomatic & Gastroprotective)
  'antacid': 2, 'h2 blocker': 2, 'ppi': 2, 'pantoprazole': 2, 'omeprazole': 2, 'rabeprazole': 2, 'famotidine': 2, 'ranitidine': 2,
  'antihistamine': 2, 'cetirizine': 2, 'levocetirizine': 2, 'loratadine': 2, 'fexofenadine': 2, 'diphenhydramine': 2,
  'prokinetic': 2, 'domperidone': 2, 'metoclopramide': 2, 'itopride': 2, 'sucralfate': 2, 'laxative': 2, 'lactulose': 2,

  // L1 Low (Nutritional, Vitamins & Botanical Supplements)
  'multivitamin': 1, 'vitamin': 1, 'mineral': 1, 'calcium': 1, 'zinc': 1, 'iron': 1, 'folic acid': 1,
  'probiotic': 1, 'herb': 1, 'herbal': 1, 'turmeric': 1, 'curcumin': 1, 'ginkgo': 1, 'ashwagandha': 1,
  'garlic': 1, 'ginseng': 1, 'ginger': 1, 'omega-3': 1, 'cod liver oil': 1,
};

// ─── Mathematical Average Regimen Burden Scale ───────────────────────────────
export function getAverageBurdenTier(avgScore) {
  const score = parseFloat(avgScore) || 1.0;
  if (score >= 4.5) {
    return {
      tier: 'L5',
      label: 'Critical Load',
      color: 'var(--critical-fg)',
      ledStatus: 'critical',
      desc: 'Critical aggregate pharmacological burden across regimen.',
    };
  }
  if (score >= 3.5) {
    return {
      tier: 'L4',
      label: 'High Load (Tier 4)',
      color: '#d97706',
      ledStatus: 'caution',
      desc: 'Elevated pharmacological burden across multiple active systemic medications.',
    };
  }
  if (score >= 2.5) {
    return {
      tier: 'L3',
      label: 'Moderate Load (Tier 3)',
      color: 'var(--caution-fg)',
      ledStatus: 'caution',
      desc: 'Standard therapeutic polypharmacy burden requiring routine clinical monitoring.',
    };
  }
  if (score >= 1.5) {
    return {
      tier: 'L2',
      label: 'Mild Load (Tier 2)',
      color: 'var(--doctor-600)',
      ledStatus: 'online',
      desc: 'Low-to-moderate pharmacological complexity with mild cumulative burden.',
    };
  }
  return {
    tier: 'L1',
    label: 'Low Load (Tier 1)',
    color: 'var(--safe-fg)',
    ledStatus: 'safe',
    desc: 'Minimal pharmacological burden; low intrinsic toxicity potential.',
  };
}

// ─── Clinical Pharmacology & Risk Rationale Engine ───────────────────────────
export function getDrugHarmReason(drugOrName, category = '', composition = '') {
  let name = '';
  let cat = category || '';
  let salts = composition || '';
  let dosage = '';
  let generic = '';

  if (typeof drugOrName === 'object' && drugOrName !== null) {
    name = drugOrName.name || '';
    cat = drugOrName.category || cat;
    salts = drugOrName.composition || drugOrName.salts || salts;
    dosage = drugOrName.dosage || '';
    generic = drugOrName.generic || '';
  } else if (typeof drugOrName === 'string') {
    name = drugOrName;
  }

  const combined = `${name} ${cat} ${salts} ${dosage} ${generic}`.toLowerCase();

  // 1. Tofacitinib / TFCT-NIB / JAK Inhibitors / Targeted DMARDs (Level 5)
  if (/tofacitinib|tfct|jak inhibitor|baricitinib|upadacitinib|targeted dmard/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Oral Janus Kinase (JAK1/JAK3) Inhibitor · Targeted Synthetic DMARD',
      summary: 'Targeted synthetic DMARD with systemic immunosuppression & FDA boxed warnings for infection and thrombosis.',
      reason: 'Inhibits intracellular JAK-STAT cytokine signaling. Classified as Level 5 Critical Risk due to potent systemic immunosuppression and official FDA Boxed Warnings for severe opportunistic infections (bacterial, viral, fungal, mycobacterial), deep vein thrombosis and pulmonary embolism (DVT/PE), major adverse cardiovascular events (MACE), and malignancies.',
      monitoring: 'Complete blood count with differential (ANC/hemoglobin), liver enzymes (ALT/AST), fasting lipid panel, latent TB screening, and infection surveillance.',
      sentinel: true,
    };
  }

  // 2. Warfarin / Oral Vitamin K Antagonists (Level 5)
  if (/warfarin|coumadin|vitamin k antagonist/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Vitamin K Antagonist (Oral Anticoagulant)',
      summary: 'Narrow therapeutic index anticoagulant with severe major hemorrhage and INR instability risks.',
      reason: 'Competitively blocks vitamin K epoxide reductase (VKORC1), depleting clotting factors II, VII, IX, and X. Classified as Level 5 Critical Risk due to an extremely narrow therapeutic index and high risk of life-threatening internal or intracranial hemorrhage, exacerbated by dietary vitamin K changes and CYP2C9 metabolic interactions.',
      monitoring: 'Routine Prothrombin Time (PT) and International Normalized Ratio (INR) calibration, bleeding symptom surveillance (bruising, melena, hematuria), and interaction checks.',
      sentinel: true,
    };
  }

  // 3. Direct Oral Anticoagulants (DOACs) & Heparins (Level 5)
  if (/apixaban|rivaroxaban|dabigatran|edoxaban|eliquis|xarelto|pradaxa|heparin|enoxaparin|clexane/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Direct Oral Anticoagulant (DOAC / Factor Xa / Thrombin Inhibitor)',
      summary: 'Direct antithrombotic agent requiring strict renal dose calibration and major bleeding surveillance.',
      reason: 'Directly neutralizes Factor Xa or thrombin. Classified as Level 5 Critical Risk due to major bleeding liabilities, lack of rapid oral reversal in community settings, and strong dependence on renal elimination.',
      monitoring: 'Renal function (eGFR / serum creatinine), baseline CBC, and observation for occult gastrointestinal or systemic bleeding.',
      sentinel: true,
    };
  }

  // 4. Insulins & Analogues (Level 5)
  if (/insulin|glargine|lantus|novorapid|humalog|actrapid|mixtard|toujeo|degludec|lispro|aspart/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Exogenous Pancreatic Hormone (ISMP High-Alert)',
      summary: 'High-alert injectable hormone requiring precise blood glucose tracking and meal coordination.',
      reason: 'Stimulates cellular glucose uptake. Classified as Level 5 Critical Risk (ISMP High-Alert) due to sudden, life-threatening neuroglycopenic hypoglycemia risks (confusion, seizures, coma) and acute intracellular potassium shifts triggering dangerous hypokalemia.',
      monitoring: 'Self-monitoring of blood glucose (SMBG), HbA1c every 3 months, continuous glucose telemetry, and hypoglycemia rescue readiness.',
      sentinel: true,
    };
  }

  // 5. Lithium (Level 5)
  if (/lithium/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Monovalent Cation Mood Stabilizer',
      summary: 'Narrow therapeutic index psychotropic with severe neurotoxicity and nephrotoxicity risks.',
      reason: 'Therapeutic window (0.6–1.2 mEq/L) is dangerously close to neurotoxic and nephrotoxic thresholds (>1.5 mEq/L). Toxicity is readily precipitated by dehydration, sodium depletion, thiazide diuretics, ACE inhibitors, or NSAIDs.',
      monitoring: 'Trough serum lithium concentration, serum creatinine, electrolytes (sodium/potassium), and thyroid profile (TSH).',
      sentinel: true,
    };
  }

  // 6. Narrow Therapeutic Index Anticonvulsants (Level 5)
  if (/phenytoin|carbamazepine|valproate|divalproex|lamotrigine|levetiracetam|tegretol|eptoin|keppra/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Narrow Therapeutic Index Antiepileptic / Mood Stabilizer',
      summary: 'Narrow therapeutic range antiepileptic with saturable kinetics, organ toxicity, and CYP enzyme modulation.',
      reason: 'Suppresses neuronal excitability via sodium/calcium channel modulation. Classified as Level 5 Critical Risk due to saturable zero-order pharmacokinetics (phenytoin), hepatic auto-induction (carbamazepine), and severe toxicities (cerebellar ataxia, bone marrow suppression, hepatotoxicity, and DRESS/SJS syndrome).',
      monitoring: 'Therapeutic drug serum levels, liver function tests, complete blood counts, and dermatological vigilance.',
      sentinel: true,
    };
  }

  // 7. Amlodipine & Calcium Channel Blockers (Level 3)
  if (/amlodipine|nifedipine|felodipine|diltiazem|verapamil|calcium channel blocker|ccb|stamlo/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Dihydropyridine Calcium Channel Blocker (CCB)',
      summary: 'Peripheral arterial vasodilator requiring routine clinical monitoring for dependent ankle edema and hypotension.',
      reason: 'Inhibits transmembrane calcium influx in vascular smooth muscle, causing selective arterial vasodilation. Classified as Level 3 Moderate Risk: requires routine clinical monitoring for dose-dependent dependent peripheral ankle edema (precapillary arteriolar dilation), orthostatic hypotension, reflex tachycardia, and CYP3A4 substrate drug interactions.',
      monitoring: 'Resting seated blood pressure, heart rate, daily inspection for lower-limb/ankle edema, and avoidance of strong CYP3A4 inhibitors.',
      sentinel: false,
    };
  }

  // 8. Naxdom / Naproxen + Domperidone (Level 3)
  if (/naxdom|naproxen|domperidone/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Dual NSAID + Dopamine D2 Prokinetic',
      summary: 'Naproxen (gastric mucosal erosion & renal perfusion risk) combined with Domperidone (arrhythmia/QT risk).',
      reason: 'Naproxen non-selectively inhibits COX-1/COX-2, depleting gastric protective prostaglandins (high risk of dyspepsia, peptic ulceration, and GI bleeding) and blunting renal blood flow. Domperidone is a peripheral dopamine antagonist that carries potential cardiac QTc prolongation and ventricular arrhythmia risks if combined with other QT-prolonging drugs or CYP3A4 inhibitors.',
      monitoring: 'Gastrointestinal tolerance (dyspepsia, dark/tarry stools), resting blood pressure, renal function, and strict avoidance of additional NSAIDs (aspirin/ibuprofen).',
      sentinel: false,
    };
  }

  // 9. Xyzal M / Levocetirizine + Montelukast (Level 3)
  if (/xyzal|levocetirizine|montelukast/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Dual 2nd-Gen H1-Antihistamine + Leukotriene Receptor Antagonist (LTRA)',
      summary: 'Levocetirizine (sedation under polypharmacy) combined with Montelukast (neuropsychiatric safety advisory).',
      reason: 'Levocetirizine provides selective peripheral H1 histamine blockade with low sedation, but can compound central nervous system depression when combined with sedatives, analgesics, or alcohol. Montelukast selectively antagonizes the cysteinyl leukotriene CysLT1 receptor and carries an official FDA boxed safety alert for neuropsychiatric events (including dream abnormalities, insomnia, depression, and agitation).',
      monitoring: 'Daytime alertness/sedation, behavioral and sleep symptoms, and caution with concurrent CNS depressants.',
      sentinel: false,
    };
  }

  // 10. Paracetamol / Acetaminophen (Level 3)
  if (/paracetamol|acetaminophen|dolo|crocin|calpol/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Central Analgesic & Antipyretic',
      summary: 'Centrally-acting analgesic; strict 24-hr cumulative dose ceiling to prevent hepatotoxicity.',
      reason: 'Inhibits central prostaglandin synthesis. Classified as Level 3 Moderate Risk because hepatic metabolism via CYP2E1 generates the reactive metabolite NAPQI, which depletes hepatic glutathione. Cumulative daily dose must not exceed 4000 mg (or 2000 mg in hepatic compromise/chronic alcohol intake) to prevent acute hepatocellular necrosis.',
      monitoring: '24-hour cumulative paracetamol dose tracking across all multi-ingredient medications; liver function tests in chronic therapy.',
      sentinel: false,
    };
  }

  // 11. Systemic NSAIDs (Level 3)
  if (/ibuprofen|diclofenac|aceclofenac|combiflam|voveran|zerodol|meloxicam|etoricoxib|nsaid/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Non-Steroidal Anti-Inflammatory Drug (NSAID)',
      summary: 'COX inhibitor with gastrointestinal mucosal ulceration, cardiovascular, and renal risks.',
      reason: 'Inhibits cyclooxygenase (COX-1/COX-2), depleting protective gastric prostaglandins and reducing renal perfusion. Carries risks of peptic ulcer disease, gastrointestinal hemorrhage, blunting of antihypertensive therapy, fluid retention, accelerated renal impairment, and thrombotic cardiovascular events.',
      monitoring: 'Blood pressure, renal function (serum creatinine), GI tolerance (dyspepsia/dark stools), and hydration.',
      sentinel: false,
    };
  }

  // 12. Statins (Level 4)
  if (/statin|atorvastatin|rosuvastatin|simvastatin|pravastatin|atorlip|rozavel/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'HMG-CoA Reductase Inhibitor (Statin)',
      summary: 'High-alert lipid lowering agent with skeletal muscle myopathy and transaminase elevation risks.',
      reason: 'Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A reductase. Classified as Level 4 High Risk due to risks of skeletal muscle toxicity (ranging from myalgias to toxic rhabdomyolysis and renal failure), elevated liver transaminases, and high susceptibility to CYP3A4/OATP1B1 drug-drug interactions.',
      monitoring: 'Baseline and periodic liver function tests (ALT/AST), serum creatine kinase (CK) if muscle pain occurs.',
      sentinel: false,
    };
  }

  // 13. ARBs & ACE Inhibitors (Level 4)
  if (/telmisartan|losartan|valsartan|olmesartan|ramipril|enalapril|lisinopril|arb|acei|telma/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'Renin-Angiotensin System Inhibitor (ARB / ACEI)',
      summary: 'Antihypertensive requiring vigilance for acute hyperkalemia, renal decline, and hypotension.',
      reason: 'Blocks angiotensin II type 1 (AT1) receptors or inhibits angiotensin-converting enzyme, decreasing peripheral vascular resistance. Classified as Level 4 High Risk due to critical hemodynamic and electrolyte risks: acute hyperkalemia (especially with potassium supplements/diuretics), orthostatic hypotension, and acute GFR reduction during dehydration.',
      monitoring: 'Serum potassium, serum creatinine/eGFR, blood pressure, and hydration status.',
      sentinel: false,
    };
  }

  // 14. Oral Antidiabetics (Level 4)
  if (/metformin|glimepiride|gliclazide|glipizide|dapagliflozin|empagliflozin|sitagliptin|vildagliptin|oral antidiabetic|januvia|galvus|forxiga/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'Oral Antidiabetic / Hypoglycemic Agent',
      summary: 'Glycemic control agent with hypoglycemia (sulfonylureas) or lactic acidosis (metformin) risks.',
      reason: 'Controls glycemic load. Classified as Level 4 High Risk: sulfonylureas (Glimepiride) carry prolonged severe hypoglycemia risk in renal compromise or skipped meals; Metformin carries rare but life-threatening lactic acidosis risk during acute renal decline or tissue hypoxia; SGLT2 inhibitors require euDKA monitoring.',
      monitoring: 'Blood glucose levels (fasting/postprandial), HbA1c, renal function (eGFR), and hydration.',
      sentinel: false,
    };
  }

  // 15. Opioids & Central Analgesics (Level 4)
  if (/tramadol|morphine|codeine|fentanyl|oxycodone|tapentadol|opioid|narcotic|ultracet/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'Central Mu-Opioid Receptor Agonist',
      summary: 'High-alert opioid analgesic with respiratory depression, profound sedation, and dependence risks.',
      reason: 'Binds central mu-opioid receptors. Classified as Level 4 High-Alert due to severe dose-dependent respiratory depression, profound sedation, and synergistic fatality risk when combined with benzodiazepines or sedatives. Tramadol additionally carries serotonin syndrome and seizure risks.',
      monitoring: 'Respiratory rate, sedation depth, bowel motility, and strict avoidance of concurrent sedative polypharmacy.',
      sentinel: false,
    };
  }

  // 16. Antidepressants (Level 4)
  if (/sertraline|escitalopram|fluoxetine|paroxetine|citalopram|duloxetine|venlafaxine|amitriptyline|ssri|snri|tca|zoloft|prozac|nexito/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'Serotonergic Antidepressant (SSRI / SNRI / TCA)',
      summary: 'Psychotropic with additive serotonin syndrome, platelet bleeding, and QTc prolongation risks.',
      reason: 'Modulates central monoamine reuptake. Classified as Level 4 High Risk due to collective polypharmacy risks: severe serotonin syndrome with other serotonergic agents, increased bleeding propensity due to platelet serotonin depletion, hyponatremia (SIADH), and cardiac QTc interval prolongation.',
      monitoring: 'Serotonin toxicity signs (tremor, hyperreflexia), serum sodium, ECG QTc interval, and mood symptoms.',
      sentinel: false,
    };
  }

  // 17. Proton Pump Inhibitors & Acid Reducers (Level 2)
  if (/pantoprazole|omeprazole|rabeprazole|esomeprazole|famotidine|ranitidine|ppi|antacid|h2 blocker|pan-d|pantocid/i.test(combined)) {
    return {
      level: 2,
      tier: 'L2',
      className: 'Proton Pump Inhibitor (PPI) / Gastric Acid Suppressant',
      summary: 'Gastric acid inhibitor; long-term polypharmacy risks include hypomagnesemia and nutrient malabsorption.',
      reason: 'Irreversibly inhibits the gastric parietal H+/K+-ATPase pump. Classified as Level 2 Mild Risk for short-term courses, but continuous long-term polypharmacy is associated with hypomagnesemia, impaired absorption of calcium and vitamin B12, and altered bioavailability of pH-dependent co-prescribed drugs.',
      monitoring: 'Periodic reassessment of long-term indication, serum magnesium, and dietary calcium/B12.',
      sentinel: false,
    };
  }

  // 18. Antihistamines (Level 2)
  if (/cetirizine|loratadine|fexofenadine|antihistamine|allegra|cetzine|avil/i.test(combined)) {
    return {
      level: 2,
      tier: 'L2',
      className: 'Peripheral 2nd-Generation H1 Antihistamine',
      summary: 'Peripheral H1 blocker with low sedation; monitor for additive drowsiness in elderly polypharmacy.',
      reason: 'Blocks peripheral H1 receptors with low sedation compared to first-generation agents. Classified as Level 2 Mild Risk; monitor for additive sedation if co-administered with central nervous system depressants or analgesics.',
      monitoring: 'Daytime alertness and caution when combined with sedative medications.',
      sentinel: false,
    };
  }

  // 19. Antibiotics (Level 3)
  if (/antibiotic|amoxicillin|azithromycin|ciprofloxacin|levofloxacin|cefixime|augmentin/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Systemic Antimicrobial / Antibiotic',
      summary: 'Antimicrobial agent requiring monitoring for hypersensitivity, microbiome disruption, and CYP interactions.',
      reason: 'Bactericidal or bacteriostatic antimicrobial therapy. Classified as Level 3 Moderate Risk due to risks of hypersensitivity, gut microbiome disruption (C. difficile colitis), organ clearance burdens, and specific class toxicities (e.g. fluoroquinolone QT prolongation and tendinopathy; macrolide CYP3A4 inhibition).',
      monitoring: 'Signs of allergic reaction, gastrointestinal tolerance, hydration, and renal function.',
      sentinel: false,
    };
  }

  // 20. Corticosteroids (Level 3)
  if (/prednisolone|dexamethasone|budesonide|corticosteroid|steroid/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Systemic Glucocorticoid',
      summary: 'Anti-inflammatory steroid with glycemic, fluid retention, and gastrointestinal liabilities.',
      reason: 'Suppresses multiple inflammatory pathways. Classified as Level 3 Moderate Risk due to acute liabilities: steroid-induced hyperglycemia, fluid/sodium retention, peptic ulceration (synergistic ulcer risk with NSAIDs), and secondary adrenal suppression upon abrupt discontinuation.',
      monitoring: 'Blood glucose, blood pressure, weight/edema, gastric comfort, and structured taper schedule.',
      sentinel: false,
    };
  }

  // 22. Antiplatelets (Level 3-4)
  if (/clopidogrel|plavix|deplatt|ticagrelor|prasugrel|aspirin|ecosprin|antiplatelet/i.test(combined)) {
    const isPotentP2Y12 = /clopidogrel|ticagrelor|prasugrel/i.test(combined);
    return {
      level: isPotentP2Y12 ? 4 : 3,
      tier: isPotentP2Y12 ? 'L4' : 'L3',
      className: isPotentP2Y12 ? 'P2Y12 Platelet Inhibitor (Antiplatelet)' : 'Platelet Aggregation Inhibitor (Antiplatelet)',
      summary: 'Antiplatelet agent with bleeding liabilities, especially when combined with NSAIDs or anticoagulants.',
      reason: 'Irreversibly inhibits platelet aggregation via P2Y12 ADP receptor blockade or COX-1 acetylation. Key polypharmacy liability is synergistic bleeding risk (GI hemorrhage, hematoma, purpura) when co-prescribed with NSAIDs, anticoagulants, SSRIs, or herbal antiplatelets.',
      monitoring: 'Signs of overt or occult hemorrhage (dark stools, petechiae, gingival bleeding) and complete blood count.',
      sentinel: false,
    };
  }

  // 23. Beta-Blockers (Level 3)
  if (/metoprolol|atenolol|bisoprolol|carvedilol|propranolol|labetalol|nebivolol|betaloc|beta blocker/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Beta-Adrenergic Receptor Blocker (Beta-Blocker)',
      summary: 'Cardiovascular agent requiring vigilance for bradycardia, hypotension, and bronchospasm.',
      reason: 'Selectively or non-selectively blocks beta-1/beta-2 adrenergic receptors, reducing cardiac contractility and chronotropy. Classified as Level 3 Moderate Risk: requires clinical monitoring for symptomatic bradycardia (<50 bpm), AV nodal conduction delay, hypotension, blunting of hypoglycemia warning signs in diabetics, and bronchospasm in reactive airway disease.',
      monitoring: 'Resting pulse rate, resting blood pressure, blood glucose awareness in diabetics, and avoid abrupt discontinuation.',
      sentinel: false,
    };
  }

  // 24. Diuretics (Level 3)
  if (/furosemide|lasix|torsemide|hydrochlorothiazide|chlorthalidone|spironolactone|aldactone|dytor|diuretic/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Diuretic (Loop / Thiazide / Potassium-Sparing)',
      summary: 'Renal electrolyte-modulating agent with hypokalemia, hyponatremia, and acute dehydration liabilities.',
      reason: 'Promotes renal sodium and water excretion. Classified as Level 3 Moderate Risk due to rapid fluid and electrolyte shifts: loop/thiazide diuretics carry high risks of hypokalemia, hyponatremia, volume depletion, and hyperuricemia; spironolactone carries severe hyperkalemia risk when combined with ACEIs/ARBs or potassium supplements.',
      monitoring: 'Serum electrolytes (sodium, potassium), renal function (serum creatinine/BUN), daily weight, and orthostatic blood pressure.',
      sentinel: false,
    };
  }

  // 25. Thyroid Hormone Replacement (Level 3)
  if (/levothyroxine|thyronorm|eltroxin|synthroid|thyroxine|thyroid/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Exogenous Thyroid Hormone Replacement (T4)',
      summary: 'Narrow therapeutic endocrine agent requiring precise fasting administration and TSH titration.',
      reason: 'Replaces endogenous synthetic T4. Classified as Level 3 Moderate Risk: narrow therapeutic titration window where overreplacement risks iatrogenic hyperthyroidism, atrial fibrillation, and osteopenia, while underreplacement causes persistent hypometabolism. Absorption is severely compromised by calcium, iron, PPIs, or food.',
      monitoring: 'Serum Thyroid Stimulating Hormone (TSH) and free T4 every 6-12 weeks; strict morning fasting administration 30-60 mins before food.',
      sentinel: false,
    };
  }

  // 26. Cardiac Glycosides & Antiarrhythmics (Level 5)
  if (/digoxin|lanoxin|amiodarone|cordarone|sotalol|flecainide|antiarrhythmic/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Cardiac Glycoside / Antiarrhythmic Agent (Narrow Therapeutic Index)',
      summary: 'Narrow therapeutic index cardiovascular agent with severe arrhythmia and digitalis toxicity risks.',
      reason: 'Inhibits myocardial Na+/K+-ATPase or cardiac ion channels. Classified as Level 5 Critical Risk due to an extremely narrow margin of safety. Toxic concentrations precipitate fatal ventricular arrhythmias, complete heart block, visual disturbances, and hyperkalemia. Toxicity is markedly provoked by hypokalemia (often induced by concurrent diuretics) or P-gp/CYP inhibitors.',
      monitoring: 'Serum digoxin level, serum potassium and magnesium, ECG monitoring, and renal function.',
      sentinel: true,
    };
  }

  // 27. Chemotherapy & Immunosuppressants (Level 5)
  if (/methotrexate|azathioprine|mycophenolate|cyclosporine|tacrolimus|hydroxyurea|cyclophosphamide|cytotoxic|chemotherapy/i.test(combined)) {
    return {
      level: 5,
      tier: 'L5',
      className: 'Cytotoxic / Immunosuppressive Chemotherapeutic Agent',
      summary: 'High-alert cytotoxic agent with myelosuppression, hepatotoxicity, and opportunistic infection hazards.',
      reason: 'Inhibits cellular DNA synthesis, purine metabolism, or calcineurin pathways. Classified as Level 5 Critical Risk due to severe systemic liabilities: life-threatening bone marrow suppression (leukopenia, thrombocytopenia), acute and chronic hepatotoxicity, nephrotoxicity, and profound opportunistic infection vulnerability.',
      monitoring: 'CBC with differential, comprehensive liver function tests, serum creatinine/eGFR, and pulmonary assessment.',
      sentinel: true,
    };
  }

  // 28. Benzodiazepines & Sedative-Hypnotics (Level 4)
  if (/clonazepam|alprazolam|diazepam|lorazepam|zolpidem|zolfresh|alprax|restyl|benzodiazepine|sedative|hypnotic/i.test(combined)) {
    return {
      level: 4,
      tier: 'L4',
      className: 'Benzodiazepine / Non-Benzodiazepine Hypnotic (GABA-A Modulator)',
      summary: 'Central GABA-A modulator with excessive sedation, fall/fracture liability, and cognitive blunting.',
      reason: 'Potentiates central inhibitory GABAergic neurotransmission. Classified as Level 4 High Risk: high polypharmacy risk of severe respiratory depression and death if combined with opioids or alcohol; high risk of daytime cognitive impairment, ataxia, motor vehicle accidents, and hip fractures in elderly patients (Beers Criteria high-alert).',
      monitoring: 'Sedation depth, cognitive status, gait stability/fall risk, and strictly avoid concurrent central depressants or abrupt cessation.',
      sentinel: false,
    };
  }

  // 29. Neuropathic Agents (Level 3)
  if (/pregabalin|gabapentin|lyrica|pregalin/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Voltage-Gated Calcium Channel Alpha-2-Delta Modulator',
      summary: 'Neuropathic agent with additive sedation, dizziness, peripheral edema, and renal clearance dependence.',
      reason: 'Binds alpha-2-delta auxiliary subunits of voltage-gated calcium channels in the CNS. Classified as Level 3 Moderate Risk: causes dose-dependent somnolence, dizziness, ataxia, and peripheral dependent edema. Highly synergistic CNS depression when combined with opioids, antihistamines, or alcohol.',
      monitoring: 'Daytime sedation, fall risk, renal function (exclusively renally cleared), and mood/suicidality monitoring.',
      sentinel: false,
    };
  }

  // 30. Muscle Relaxants (Level 3)
  if (/baclofen|thiocolchicoside|chlorzoxazone|tizanidine|myoril|muscle relaxant/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Centrally-Acting Skeletal Muscle Relaxant',
      summary: 'Central antispasmodic requiring caution for marked drowsiness, hypotension, and muscle weakness.',
      reason: 'Acts at spinal or supraspinal GABA-B receptors or polysynaptic reflex pathways. Moderate risk due to sedation, lightheadedness, hepatic load (thiocolchicoside/chlorzoxazone), and additive central depression in multi-drug regimens.',
      monitoring: 'Daytime alertness, motor coordination, liver enzymes, and avoidance of other sedating compounds.',
      sentinel: false,
    };
  }

  // 31. Antifungals (Level 3-4)
  if (/fluconazole|itraconazole|ketoconazole|voriconazole|forcan|canditral|antifungal/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Triazole Antifungal · Potent Cytochrome P450 Inhibitor',
      summary: 'Potent cytochrome P450 inhibitor creating dramatic elevation in co-administered drug plasma levels.',
      reason: 'Inhibits fungal lanosterol 14-alpha-demethylase, but also potently inhibits human CYP3A4, CYP2C9, and CYP2C19. Classified as Level 3-4 Risk: causes dramatic, potentially lethal plasma spikes in co-administered statins (rhabdomyolysis), warfarin (catastrophic hemorrhage), and calcium channel blockers (severe hypotension).',
      monitoring: 'Liver function tests, cardiac QTc interval, and comprehensive metabolic interaction check before concurrent prescription.',
      sentinel: false,
    };
  }

  // 32. Gout & Uric Acid Reducers (Level 3-4)
  if (/allopurinol|febuxostat|colchicine|zyloric|febutaz|antigout/i.test(combined)) {
    const isColchicine = /colchicine/i.test(combined);
    return {
      level: isColchicine ? 4 : 3,
      tier: isColchicine ? 'L4' : 'L3',
      className: isColchicine ? 'Mitotic Spindle Inhibitor (Narrow Index Antigout)' : 'Xanthine Oxidase Inhibitor (Antigout)',
      summary: isColchicine ? 'Narrow therapeutic index antigout agent with severe toxicity risk in renal impairment.' : 'Urate-lowering agent requiring vigilance for hypersensitivity (SCAR/SJS) and renal clearance.',
      reason: isColchicine
        ? 'Binds tubulin to suppress microtubule polymerization. Classified as Level 4-5 High-Alert due to an extremely narrow margin of safety: severe gastrointestinal cramping, bone marrow suppression, and fatal toxicity if co-prescribed with strong CYP3A4 or P-gp inhibitors.'
        : 'Inhibits uric acid synthesis. Classified as Level 3 Moderate Risk: allopurinol carries risk of severe allopurinol hypersensitivity syndrome (AHS/SJS, particularly in HLA-B*5801 carriers).',
      monitoring: 'Renal function, serum uric acid, liver enzymes, and immediate reporting of any cutaneous rash or gastrointestinal symptoms.',
      sentinel: isColchicine,
    };
  }

  // 33. Respiratory Bronchodilators & Inhalers (Level 3)
  if (/salbutamol|albuterol|formoterol|salmeterol|ipratropium|tiotropium|asthalin|foracort|inhaler/i.test(combined)) {
    return {
      level: 3,
      tier: 'L3',
      className: 'Bronchodilator (Beta2 Agonist / Antimuscarinic Inhaler)',
      summary: 'Respiratory agent requiring monitoring for tremor, reflex tachycardia, and hypokalemia.',
      reason: 'Stimulates pulmonary beta-2 adrenergic receptors or blocks muscarinic M3 receptors, inducing bronchial smooth muscle relaxation. Classified as Level 3 Moderate Risk: systemic absorption can cause tachycardia, palpitations, skeletal muscle tremors, and transient hypokalemia.',
      monitoring: 'Resting pulse rate, tremor evaluation, serum potassium in high-dose therapy, and proper inhaler technique.',
      sentinel: false,
    };
  }

  // ─── Dynamic Fallback Generator for Any Other Unrecognized Medicine ────────
  let fallbackLevel = drugOrName?.harmLevel;
  if (!fallbackLevel) {
    const text = `${cat} ${name}`.toLowerCase();
    for (const [key, level] of Object.entries(CLASS_RISK_MAP)) {
      if (text.includes(key)) {
        fallbackLevel = level;
        break;
      }
    }
  }
  if (!fallbackLevel) fallbackLevel = 3;
  const cfg = HARM_LEVELS[fallbackLevel] || HARM_LEVELS[3];

  const customSafetyTip = drugOrName?.safetyTip;
  const dynamicClassName = cat || (fallbackLevel === 5 ? 'High-Alert Sentinel Medication' : fallbackLevel === 4 ? 'High-Risk Systemic Agent' : fallbackLevel === 3 ? 'Standard Systemic Medication' : fallbackLevel === 2 ? 'Symptomatic / Gastroprotective Medication' : 'Nutritional / Supportive Formulation');

  return {
    level: fallbackLevel,
    tier: cfg.tier,
    className: dynamicClassName,
    summary: customSafetyTip || `${cfg.label} agent under WHO/NCI clinical pharmacological scale.`,
    reason: customSafetyTip
      ? `${cfg.label} medication. Clinical safety directive: ${customSafetyTip} Requires routine monitoring for organ clearance, metabolic tolerance, and potential pharmacokinetic interactions in multi-drug polypharmacy.`
      : `${cfg.label} medication classified under international WHO/NCI pharmacological standards. Requires regular clinical monitoring for organ clearance, metabolic tolerance, and potential pairwise pharmacokinetic interactions in multi-drug regimens.`,
    monitoring: fallbackLevel >= 4
      ? 'Periodic hepatic/renal function testing, blood pressure, symptom tolerance, and physician follow-up.'
      : 'Routine clinical evaluation, symptom tolerance, and adherence checks.',
    sentinel: fallbackLevel === 5,
  };
}

export function computeRiskLevel(category = '', name = '', flags = []) {
  const text = `${category} ${name}`.toLowerCase();

  for (const [key, level] of Object.entries(CLASS_RISK_MAP)) {
    if (text.includes(key)) {
      return level;
    }
  }

  if (flags && flags.length >= 2) return 4;
  if (flags && flags.length === 1) return 3;

  return 3;
}

// ─── OFFSIDES Side Effects & Clinical Safety Explorer (Expandable) ───────────
export function KnownSideEffectsPanel({ medicineId, medicineName, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !data) {
      setLoading(true);
      const isDemo = !medicineId || String(medicineId).startsWith('demo-');
      const url = isDemo
        ? `/medicine/sideeffects/lookup?name=${encodeURIComponent(medicineName || '')}`
        : `/medicine/${medicineId}/sideeffects`;

      axios.get(url)
        .then(r => setData(r.data))
        .catch(() => {
          if (medicineName) {
            return axios.get(`/medicine/sideeffects/lookup?name=${encodeURIComponent(medicineName)}`)
              .then(r => setData(r.data))
              .catch(() => setData(null));
          }
          setData(null);
        })
        .finally(() => setLoading(false));
    }
  }, [open, data, medicineId, medicineName]);

  const hasBurden = data?.burden && data.burden.score > 0;
  const hasCascades = data?.cascades && data.cascades.length > 0;
  const hasHerbs = data?.herbInteractions && data.herbInteractions.length > 0;

  return (
    <div className={`rounded-xl overflow-hidden shadow-[var(--shadow-sm)] bg-[var(--canvas)] border border-[var(--border)] ${className}`}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--canvas)] hover:bg-[var(--border)] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <FlaskConical className="w-4 h-4 text-[var(--brand-600)] flex-shrink-0" />
          <span className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)]">
            Clinical Safety Signals
          </span>
          <span className="text-[10px] font-mono font-bold text-[var(--ink-3)] bg-[var(--border)] px-2 py-0.5 rounded-full shadow-[var(--shadow-inner)]">
            FDA OFFSIDES
          </span>
          {hasBurden && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              ACB {data.burden.score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--brand-600)] flex-shrink-0">
          <span>{open ? 'COLLAPSE' : 'EXPAND'}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-3.5 space-y-3 bg-[var(--canvas)] text-xs">
              {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-[var(--ink-3)] font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-600)]" />
                  <span>Mining FDA adverse event signals & clinical data...</span>
                </div>
              ) : (
                <>
                  {/* Anticholinergic Cognitive Burden Alert */}
                  {hasBurden && (
                    <div className="p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/25 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          Anticholinergic Burden: ACB {data.burden.score} / 3
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                          {data.burden.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                        {data.burden.clinicalNote} — monitor for cumulative sedation, dizziness, dry mouth, or cognitive symptoms under polypharmacy.
                      </p>
                    </div>
                  )}

                  {/* Known Prescribing Cascade Alert */}
                  {hasCascades && (
                    <div className="p-2.5 rounded-lg border bg-purple-500/10 border-purple-500/25 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span>Documented Prescribing Cascade Risk</span>
                      </div>
                      <div className="space-y-1">
                        {data.cascades.map((c, ci) => (
                          <p key={ci} className="text-[11px] text-[var(--ink-2)] leading-snug">
                            • <strong className="text-[var(--ink)]">{c.symptomKeyword}:</strong> {c.description}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Herb-Drug Interaction Precautions */}
                  {hasHerbs && (
                    <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/25 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Documented Herbal Precautions</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {data.herbInteractions.map((h, hi) => (
                          <span
                            key={hi}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--ink)] border border-emerald-400/40 shadow-xs"
                            title={h.description}
                          >
                            {h.herbName} ({h.severity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FDA OFFSIDES Pharmacovigilance Header */}
                  <div className="flex items-center justify-between text-[10px] text-[var(--ink-3)] font-mono pt-1">
                    <span className="font-bold uppercase tracking-wider">FDA Pharmacovigilance Signals (PRR ≥ 1.5)</span>
                    {data?.total ? <span>{data.total} signals identified</span> : null}
                  </div>

                  {/* Adverse Reactions List */}
                  {!data?.sideEffects || data.sideEffects.length === 0 ? (
                    <p className="text-xs text-[var(--ink-3)] font-mono italic py-1">
                      No statistically elevated adverse signals (PRR ≥ 1.5) recorded for {medicineName || 'this medicine'}.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {data.sideEffects.map((se, idx) => {
                        const prr = parseFloat(se.prr);
                        const isHigh = prr >= 10;
                        const isMedium = prr >= 5;
                        const badgeCls = isHigh
                          ? 'text-[var(--critical-fg)] border-[var(--critical-fg)]/40 bg-rose-500/10'
                          : isMedium
                          ? 'text-orange-600 dark:text-orange-400 border-orange-500/40 bg-orange-500/10'
                          : 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10';

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Activity className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                              <span className="font-medium text-[var(--ink)] leading-snug break-words">
                                {se.sideEffect}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap shadow-xs ${badgeCls}`}
                                title={`Proportional Reporting Ratio (PRR): ${prr.toFixed(2)}`}
                              >
                                PRR {prr.toFixed(1)}×
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="text-[10px] text-[var(--ink-3)] font-mono pt-1 text-right">
                    Source: FDA FAERS & OFFSIDES (1.2M records)
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 1. Drug Harm Badge (Compact, Pre-Add & Card Indicator) ───────────────────
export function DrugHarmBadge({ harmLevel, category = '', name = '', flags = [], size = 'sm', className = '' }) {
  const level = harmLevel || computeRiskLevel(category, name, flags);
  const cfg = HARM_LEVELS[level] || HARM_LEVELS[3];
  const reason = getDrugHarmReason(name, category);

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-xl border bg-[var(--canvas)] ${cfg.badgeCls} ${className}`}
        title={reason.summary || cfg.tip}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
        <span>{cfg.shortLabel} — {cfg.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-[var(--canvas)] ${cfg.badgeCls} ${className}`}
      title={reason.summary || cfg.tip}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      <span>{cfg.shortLabel}</span>
    </span>
  );
}

// ─── 2. Drug Harm Panel (Expandable on Medicine Cards) ─────────────────────────
export function DrugHarmPanel({ medicine, flags = [], className = '' }) {
  const [open, setOpen] = useState(false);

  const level = medicine.harmLevel || computeRiskLevel(medicine.category, medicine.name, flags);
  const cfg = HARM_LEVELS[level] || HARM_LEVELS[3];
  const reason = getDrugHarmReason(medicine);

  const myFlags = flags.filter(f =>
    f.medicineA?.id === medicine.id || f.medicineB?.id === medicine.id
  );

  return (
    <div className={`rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] border border-[var(--border)] ${className}`}>
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border)]/70 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <LedIndicator status={cfg.ledStatus} size="sm" />
          <span className="text-xs font-bold font-[var(--font-heading)] tracking-tight" style={{ color: cfg.color }}>
            {cfg.tier} · {cfg.label}
          </span>
          {reason.sentinel && (
            <span className="text-[9px] bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-full font-bold">
              High-Alert
            </span>
          )}
          {myFlags.length > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
              {myFlags.length} flag{myFlags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--ink-3)] font-medium">
          <span>{open ? 'Hide Details' : 'View Risk Rationale'}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-[var(--ink-3)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-3)]" />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="harm-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-2 space-y-3 bg-[var(--canvas)]">
              {/* Dynamic Risk Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--ink-3)] font-bold uppercase">WHO/NCI Harm Level</span>
                  <span className="font-bold" style={{ color: cfg.color }}>Level {level} / 5 · {cfg.label}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-2)] shadow-[var(--shadow-inner)] overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${cfg.barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(level / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Dedicated Clinical Pharmacology & Safety Rationale */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    <FlaskConical className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" />
                    <span>Clinical Pharmacology & Risk Rationale</span>
                  </div>
                  {reason.sentinel ? (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                      HIGH-ALERT SENTINEL
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-3)] border border-[var(--border)]">
                      TIER {level} SURVEILLANCE
                    </span>
                  )}
                </div>

                {/* Class Tag */}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--brand-600)] font-semibold">
                  <Pill className="w-3 h-3 flex-shrink-0" />
                  <span>{reason.className || medicine.category || 'Prescription Medicine'}</span>
                </div>

                {/* Specific Medical Rationale */}
                <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                  {reason.reason}
                </p>

                {/* Specific Monitoring Parameters */}
                {reason.monitoring && (
                  <div className="pt-2 border-t border-[var(--border)] flex items-start gap-1.5 text-[10px] text-[var(--ink-2)]">
                    <Activity className="w-3 h-3 text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
                    <span><strong>Clinical Monitoring Focus:</strong> {reason.monitoring}</span>
                  </div>
                )}
              </div>

              {/* Active interaction flags */}
              {myFlags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-[var(--ink-3)] uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-rose-600" />
                    Active Interaction Flags
                  </p>
                  {myFlags.map((flag, i) => {
                    const other = flag.medicineA?.id === medicine.id ? flag.medicineB?.name : flag.medicineA?.name;
                    return (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] font-mono leading-tight text-[var(--ink)]">
                        <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{flag.severity}</strong> with <em>{other}</em></span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* OFFSIDES Side Effects Explorer */}
              <KnownSideEffectsPanel
                medicineId={medicine.id}
                medicineName={medicine.name}
                className="mt-2"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 3. Polypharmacy Harm Dashboard (Home Page Overview Widget) ───────────────
export function PolypharmacyHarmDashboard({ medicines = [], flags = [], regimenRisk = null }) {
  const shouldReduceMotion = useReducedMotion();
  if (!medicines || medicines.length === 0) return null;

  const harmLevels = medicines.map(m => m.harmLevel || computeRiskLevel(m.category, m.name, flags));
  const avgRisk = harmLevels.reduce((a, b) => a + b, 0) / harmLevels.length;
  const highestLevel = Math.max(...harmLevels);

  const highestDrug = medicines.find(m => (m.harmLevel || computeRiskLevel(m.category, m.name, flags)) === highestLevel) || medicines[0];
  const highestCfg = HARM_LEVELS[highestLevel] || HARM_LEVELS[3];
  const peakReason = getDrugHarmReason(highestDrug);

  // True mathematical average burden tier for the mean score (e.g. 3.5 -> High Load)
  const avgBurden = getAverageBurdenTier(avgRisk);

  // Overall clinical regimen tier (e.g. 5 if peak is 5 or flags >= 3, else backend regimenRisk level)
  const currentTierLevel = regimenRisk?.level || (highestLevel === 5 ? 5 : Math.round(avgRisk));
  const currentTierCfg = HARM_LEVELS[currentTierLevel] || HARM_LEVELS[3];

  const isEscalated = currentTierLevel > Math.round(avgRisk) || (highestLevel === 5 && avgRisk < 4.5);

  return (
    <Card
      title="Polypharmacy Regimen Risk"
      icon={<Heart className="w-4 h-4 text-[var(--brand-600)]" />}
      badge={
        <span className="text-[11px] font-mono font-bold text-[var(--ink)] bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 rounded-full shadow-2xs">
          {medicines.length} ACTIVE DRUG{medicines.length !== 1 ? 'S' : ''}
        </span>
      }
      className="space-y-4"
    >
      <div className="space-y-3.5">
        {/* 2 Stat Inset Wells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Average Risk Score */}
          <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] shadow-xs hover:border-[var(--border-strong)] transition-all space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[var(--ink-3)] uppercase tracking-wider">
                Average Regimen Burden
              </span>
              <LedIndicator status={avgBurden.ledStatus} size="sm" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black font-mono" style={{ color: avgBurden.color }}>
                {avgRisk.toFixed(1)} / 5.0
              </span>
              <span
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[var(--surface)] shadow-2xs"
                style={{ borderColor: avgBurden.color, color: avgBurden.color }}
              >
                {avgBurden.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-3)] font-mono leading-tight">
              Calculated mean harm load across {medicines.length} active medication{medicines.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Highest Risk Drug */}
          <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] shadow-xs hover:border-[var(--border-strong)] transition-all space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[var(--ink-3)] uppercase tracking-wider">
                Peak Risk Agent
              </span>
              <LedIndicator status={highestCfg.ledStatus} size="sm" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <span className="text-sm sm:text-base font-bold text-[var(--ink)] font-[var(--font-heading)] truncate min-w-0">
                {highestDrug.name}
              </span>
              <DrugHarmBadge harmLevel={highestLevel} size="sm" />
            </div>
            <p className="text-[11px] text-[var(--ink-3)] font-mono leading-tight">
              {peakReason.summary || highestCfg.tip}
            </p>
          </div>
        </div>

        {/* Clinical Sentinel Escalation Override Banner */}
        {isEscalated && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 shadow-xs">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-[var(--font-heading)] text-rose-900 dark:text-rose-200">
                  Clinical Sentinel Rule: Regimen Escalated to L5 Critical
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                  SENTINEL OVERRIDE
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                While the mathematical average burden across your {medicines.length} medicines is <strong>{avgRisk.toFixed(1)} / 5.0 ({avgBurden.label})</strong>, clinical safety protocols escalate overall regimen monitoring to <strong>L5 Critical Risk</strong> because your regimen includes <strong className="text-rose-700 dark:text-rose-400">{highestDrug.name}</strong>. In clinical pharmacotherapy, high-alert and narrow therapeutic index sentinel agents supersede numerical averages to mandate specialized clinical vigilance.
              </p>
            </div>
          </div>
        )}

        {/* 5-Tier Spectrum Meter */}
        <div className="space-y-3 p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
            <div className="flex items-center gap-2">
              <span className="tracking-wide uppercase font-[var(--font-heading)]">WHO/NCI 5-Tier Spectrum</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
                Clinical Harm Scale
              </span>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-lg border text-xs font-extrabold shadow-2xs bg-[var(--surface)]"
              style={{
                borderColor: currentTierCfg.color,
                color: currentTierCfg.color,
              }}
            >
              Regimen: {currentTierCfg.tier} ({currentTierCfg.label}) {isEscalated ? '· Escalated' : ''}
            </span>
          </div>

          {/* 5 Segmented Color Blocks */}
          <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            {[1, 2, 3, 4, 5].map((lvl, index) => {
              const cfg = HARM_LEVELS[lvl];
              const isCurrent = lvl === currentTierLevel;
              return (
                <motion.div
                  key={lvl}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: isCurrent ? 1 : 0.45,
                    scale: isCurrent ? 1.0 : 0.98,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { delay: index * 0.05, duration: 0.2, ease: 'easeOut' }
                  }
                  className={`h-4 rounded-lg transition-all relative flex items-center justify-center ${cfg.barColor} ${
                    isCurrent
                      ? 'ring-2 ring-white/90 shadow-sm z-10'
                      : 'hover:opacity-75'
                  }`}
                  title={`Level ${lvl}: ${cfg.label} ${isCurrent ? '(Current Regimen)' : ''}`}
                >
                  {isCurrent && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 5 Uniformly Aligned Labels on Same Baseline */}
          <div className="grid grid-cols-5 gap-1.5 text-center items-center">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const cfg = HARM_LEVELS[lvl];
              const isCurrent = lvl === currentTierLevel;
              return (
                <div key={lvl} className="flex justify-center">
                  <span
                    className={`w-full py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wider truncate border transition-all ${
                      isCurrent
                        ? 'bg-[var(--surface)] shadow-xs font-extrabold'
                        : 'bg-transparent border-transparent text-[var(--ink-3)]'
                    }`}
                    style={isCurrent ? { borderColor: cfg.color, color: cfg.color } : {}}
                  >
                    {cfg.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DrugHarmPanel;
