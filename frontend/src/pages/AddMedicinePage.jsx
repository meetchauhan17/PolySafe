import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useSocketEvent } from '../context/SocketContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Pill, Plus, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, X, Stethoscope, ShoppingBag, Leaf, Info, ScanLine,
  FileImage, TriangleAlert, Edit3, ShieldCheck, ExternalLink,
  Activity, AlertOctagon, Search, HelpCircle, Clock, User, CalendarDays,
  Sun, Sunset, Moon, Coffee, QrCode, FlaskConical, Layers, SwitchCamera,
  CheckSquare, Square, Sparkles, Building2, Calendar,
  Tag, ShieldAlert, Package, Zap, Shield, HeartPulse, Thermometer, Wind, Check,
  ChevronDown, RefreshCw, UploadCloud,
} from 'lucide-react';
import Card from '../components/Card';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { DrugHarmBadge } from '../components/DrugHarmLevel';
import PolySafeInput from '../components/PolySafeInput';
import PolySafeSelect from '../components/PolySafeSelect';
import LedIndicator from '../components/LedIndicator';
import SegmentedControl from '../components/SegmentedControl';
import { SharedDrawer } from '../motion/SharedLayout';
import { useReducedMotion } from '../motion/useReducedMotion';
import { SPRINGS } from '../motion/presets';
import { searchLocalResolver, LOCAL_RESOLVER_DRUGS } from '../data/localResolverList';
import { StatusPill, mapSeverityToPillStatus } from '../components/SafetyAlertsSection';
import { useT } from '../i18n/useT';
import VoiceInputButton from '../components/VoiceInputButton';
import { getMedicineIndication } from '../utils/indications';

// ─── Dosage Form Options ──────────────────────────────────────────────────────
const DOSAGE_FORMS = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup / Liquid' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream / Gel / Ointment' },
  { value: 'drops', label: 'Eye / Ear Drops' },
  { value: 'inhaler', label: 'Inhaler / Respules' },
];

// ─── Common Drug Indications / Purposes ──────────────────────────────────────
const COMMON_DRUG_PURPOSES = {
  dolo: 'Fever, Headache & Body Pain',
  calpol: 'Fever & Mild to Moderate Pain',
  crocin: 'Fever, Body Ache & Headache',
  paracetamol: 'Fever, Headache & Pain Relief',
  combiflam: 'Severe Headache, Muscle & Body Pain',
  naxdom: 'Migraine, Severe Headache & Joint Inflammation',
  voveran: 'Severe Joint Pain, Swelling & Arthritis',
  brufen: 'Inflammation, Muscle Pain & Dental Ache',
  ibuprofen: 'Pain Relief, Anti-inflammatory',
  diclofenac: 'Joint Pain, Sprain & Arthritis',
  naproxen: 'Migraine, Arthritis & Musculoskeletal Pain',
  loperamide: 'Diarrhea & Loose Motions',
  ors: 'Dehydration & Diarrhea Recovery',
  electral: 'Dehydration & Electrolyte Imbalance',
  'norflox-tz': 'Bacterial Diarrhea, Amoebiasis & Stomach Infection',
  norflox: 'Urinary Tract Infection & Bacterial Diarrhea',
  ofloxacin: 'Bacterial Diarrhea & Respiratory Infection',
  pan: 'Acidity, Gas & Acid Reflux (GERD)',
  'pan-d': 'Acidity, Gas, Acid Reflux & Nausea',
  pantoprazole: 'Acid Reflux, Heartburn & Peptic Ulcer',
  omeprazole: 'Heartburn, Gastric Ulcer & Hyperacidity',
  omez: 'Acid Reflux & Stomach Ulcers',
  rabeprazole: 'GERD, Acidity & Gastric Irritation',
  rabicip: 'Acid Reflux & Hyperacidity',
  digene: 'Instant Relief from Acidity, Gas & Heartburn',
  gelusil: 'Instant Relief from Acidity & Heartburn',
  metformin: 'Type 2 Diabetes & Blood Sugar Control',
  glycomet: 'Type 2 Diabetes & Blood Sugar Regulation',
  glimepiride: 'Type 2 Diabetes, Insulin Stimulation',
  januvia: 'Type 2 Diabetes Mellitus',
  telma: 'High Blood Pressure (Hypertension) & Heart Protection',
  telmisartan: 'High Blood Pressure & Cardiovascular Risk Reduction',
  amlodipine: 'High Blood Pressure & Angina (Chest Pain)',
  stamlo: 'High Blood Pressure (Hypertension)',
  losartan: 'High Blood Pressure & Kidney Protection',
  ecosprin: 'Blood Thinner, Heart Attack & Stroke Prevention',
  aspirin: 'Blood Thinner & Cardiovascular Protection',
  clopidogrel: 'Blood Thinner & Clot Prevention',
  atorvastatin: 'High Cholesterol & Heart Disease Prevention',
  atorva: 'Cholesterol Lowering & Lipid Control',
  rosuvastatin: 'High Cholesterol & Arterial Plaque Reduction',
  cheston: 'Common Cold, Runny Nose, Sneezing & Fever',
  sinarest: 'Cold, Sinus Congestion, Headache & Fever',
  ascoril: 'Cough, Chest Congestion & Phlegm Relief',
  alex: 'Dry Cough & Throat Irritation',
  benadryl: 'Cough Relief & Throat Soothing',
  cetirizine: 'Allergy, Sneezing, Runny Nose & Itching',
  allegra: 'Seasonal Allergies, Allergic Rhinitis & Hives',
  fexofenadine: 'Non-Drowsy Allergy Relief',
  levocetirizine: 'Allergy, Watery Eyes & Skin Rash',
  augmentin: 'Bacterial Infections (Ear, Throat, Chest, Skin)',
  amoxicillin: 'Bacterial Infection Treatment',
  azithromycin: 'Throat, Lung & Bacterial Infections',
  azithral: 'Bacterial Throat, Chest & Ear Infections',
  ciprofloxacin: 'Bacterial Infections & UTI',
  ondansetron: 'Nausea, Vomiting & Motion Sickness',
  vomikind: 'Nausea & Vomiting Control',
  shelcal: 'Calcium & Vitamin D3 Deficiency, Bone Strength',
  becosules: 'Mouth Ulcers, Vitamin B-Complex & C Supplement',
  neurobion: 'Nerve Health, Neuropathy & Vitamin B12 Deficiency',
  supradyn: 'Daily Multivitamin, Energy & Immunity',
  evion: 'Vitamin E Deficiency, Muscle Cramps & Skin Health',
  ashwagandha: 'Stress Relief, Vitality & Immunity',
  liv52: 'Liver Health, Protection & Appetite',
};

// ─── Brand to Generic Quick Chips ─────────────────────────────────────────────
const BRAND_TO_GENERIC_PRESETS = [
  { brand: 'Dolo 650', generic: 'Paracetamol', dosage: '650mg', type: 'PRESCRIPTION', purpose: 'Fever, Headache & Body Pain' },
  { brand: 'Combiflam', generic: 'Ibuprofen + Paracetamol', dosage: '400mg + 325mg', type: 'PRESCRIPTION', purpose: 'Severe Headache, Muscle & Body Pain' },
  { brand: 'Pan-D', generic: 'Pantoprazole + Domperidone', dosage: '40mg + 30mg', type: 'PRESCRIPTION', purpose: 'Acidity, Gas, Acid Reflux & Nausea' },
  { brand: 'Augmentin 625', generic: 'Amoxicillin + Clavulanic Acid', dosage: '625mg', type: 'PRESCRIPTION', purpose: 'Bacterial Infections' },
  { brand: 'Allegra 120', generic: 'Fexofenadine', dosage: '120mg', type: 'OTC', purpose: 'Seasonal Allergies & Rhinitis' },
  { brand: 'Shelcal 500', generic: 'Calcium + Vitamin D3', dosage: '500mg', type: 'OTC', purpose: 'Calcium & Vitamin D3 Deficiency' },
  { brand: 'Telma 40', generic: 'Telmisartan', dosage: '40mg', type: 'PRESCRIPTION', purpose: 'High Blood Pressure (Hypertension)' },
  { brand: 'Metformin 500', generic: 'Metformin', dosage: '500mg', type: 'PRESCRIPTION', purpose: 'Type 2 Diabetes Mellitus' },
];

// ─── Symptom / Condition Quick-Recommendation Formulary ───────────────────────
const CONDITION_ICONS = {
  'Headache': Zap,
  'Diarrhea': ShieldAlert,
  'Fever': Thermometer,
  'Acidity / Gas': Shield,
  'Body Pain': Activity,
  'Diabetes': FlaskConical,
  'Blood Pressure': HeartPulse,
  'Cough / Cold': Wind,
  'Allergy': ShieldCheck,
  'Vitamins / Immunity': Sparkles,
};

const CONDITION_MED_RECOMMENDATIONS = {
  'Headache': [
    { name: 'Dolo 650', dosage: '650mg', frequency: 'thrice', generic: 'Paracetamol', purpose: 'Fever, Headache & Body Pain' },
    { name: 'Combiflam', dosage: '400mg', frequency: 'twice', generic: 'Ibuprofen + Paracetamol', purpose: 'Severe Headache, Muscle & Body Pain' },
    { name: 'Naxdom 500', dosage: '500mg', frequency: 'twice', generic: 'Naproxen + Domperidone', purpose: 'Migraine, Severe Headache & Joint Inflammation' },
  ],
  'Diarrhea': [
    { name: 'Loperamide 2mg', dosage: '2mg', frequency: 'asneeded', generic: 'Loperamide', purpose: 'Diarrhea & Loose Motions' },
    { name: 'ORS Electral', dosage: '1 sachet', frequency: 'asneeded', generic: 'Oral Rehydration Salts', purpose: 'Dehydration & Diarrhea Recovery' },
    { name: 'Norflox-TZ', dosage: '1 tablet', frequency: 'twice', generic: 'Norfloxacin + Tinidazole', purpose: 'Bacterial Diarrhea, Amoebiasis & Stomach Infection' },
  ],
  'Fever': [
    { name: 'Dolo 650', dosage: '650mg', frequency: 'thrice', generic: 'Paracetamol', purpose: 'Fever, Headache & Body Pain' },
    { name: 'Calpol 500', dosage: '500mg', frequency: 'thrice', generic: 'Paracetamol', purpose: 'Fever & Mild to Moderate Pain' },
    { name: 'Crocin 650', dosage: '650mg', frequency: 'thrice', generic: 'Paracetamol', purpose: 'Fever, Body Ache & Headache' },
  ],
  'Acidity / Gas': [
    { name: 'Pan-D', dosage: '40mg+30mg', frequency: 'once', generic: 'Pantoprazole + Domperidone', purpose: 'Acidity, Gas, Acid Reflux & Nausea' },
    { name: 'Omeprazole 20mg', dosage: '20mg', frequency: 'once', generic: 'Omeprazole', purpose: 'Heartburn, Gastric Ulcer & Hyperacidity' },
    { name: 'Digene', dosage: '2 tablets', frequency: 'thrice', generic: 'Antacid & Antigas', purpose: 'Instant Relief from Acidity, Gas & Heartburn' },
  ],
  'Body Pain': [
    { name: 'Combiflam', dosage: '400mg', frequency: 'twice', generic: 'Ibuprofen + Paracetamol', purpose: 'Severe Headache, Muscle & Body Pain' },
    { name: 'Voveran 50', dosage: '50mg', frequency: 'twice', generic: 'Diclofenac', purpose: 'Severe Joint Pain, Swelling & Arthritis' },
    { name: 'Dolo 650', dosage: '650mg', frequency: 'thrice', generic: 'Paracetamol', purpose: 'Fever, Headache & Body Pain' },
  ],
  'Diabetes': [
    { name: 'Metformin 500mg', dosage: '500mg', frequency: 'twice', generic: 'Metformin', purpose: 'Type 2 Diabetes & Blood Sugar Control' },
    { name: 'Glycomet 500', dosage: '500mg', frequency: 'twice', generic: 'Metformin', purpose: 'Type 2 Diabetes & Blood Sugar Regulation' },
    { name: 'Glimepiride 1mg', dosage: '1mg', frequency: 'once', generic: 'Glimepiride', purpose: 'Type 2 Diabetes, Insulin Stimulation' },
  ],
  'Blood Pressure': [
    { name: 'Telma 40', dosage: '40mg', frequency: 'once', generic: 'Telmisartan', purpose: 'High Blood Pressure (Hypertension) & Heart Protection' },
    { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'once', generic: 'Amlodipine', purpose: 'High Blood Pressure & Angina (Chest Pain)' },
    { name: 'Losartan 50mg', dosage: '50mg', frequency: 'once', generic: 'Losartan', purpose: 'High Blood Pressure & Kidney Protection' },
  ],
  'Cough / Cold': [
    { name: 'Cheston Cold', dosage: '1 tablet', frequency: 'twice', generic: 'Cetirizine + Paracetamol + Phenylephrine', purpose: 'Common Cold, Runny Nose, Sneezing & Fever' },
    { name: 'Sinarest', dosage: '1 tablet', frequency: 'twice', generic: 'Paracetamol + Phenylephrine', purpose: 'Cold, Sinus Congestion, Headache & Fever' },
    { name: 'Ascoril-D', dosage: '10ml', frequency: 'thrice', generic: 'Dextromethorphan + Chlorpheniramine', purpose: 'Cough, Chest Congestion & Phlegm Relief' },
  ],
  'Allergy': [
    { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'once', generic: 'Cetirizine', purpose: 'Allergy, Sneezing, Runny Nose & Itching' },
    { name: 'Allegra 120', dosage: '120mg', frequency: 'once', generic: 'Fexofenadine', purpose: 'Seasonal Allergies, Allergic Rhinitis & Hives' },
    { name: 'Levocetirizine 5mg', dosage: '5mg', frequency: 'once', generic: 'Levocetirizine', purpose: 'Allergy, Watery Eyes & Skin Rash' },
  ],
  'Vitamins / Immunity': [
    { name: 'Shelcal 500', dosage: '500mg', frequency: 'once', generic: 'Calcium + Vitamin D3', purpose: 'Calcium & Vitamin D3 Deficiency, Bone Strength' },
    { name: 'Becosules', dosage: '1 capsule', frequency: 'once', generic: 'Vitamin B-Complex + C', purpose: 'Mouth Ulcers, Vitamin B-Complex & C Supplement' },
    { name: 'Neurobion Forte', dosage: '1 tablet', frequency: 'once', generic: 'Vitamin B12 + B-Complex', purpose: 'Nerve Health, Neuropathy & Vitamin B12 Deficiency' },
  ],
};

function getPurposeGuidance(purposeStr) {
  if (!purposeStr) return null;
  const p = purposeStr.toLowerCase();
  if (p.includes('diarrh') || p.includes('loose') || p.includes('electral') || p.includes('ors')) {
    return 'Maintain continuous hydration with oral rehydration solution (ORS). Seek urgent care if blood appears in stool or diarrhea persists over 48 hours.';
  }
  if (p.includes('headache') || p.includes('fever') || p.includes('pain') || p.includes('migraine') || p.includes('arthritis')) {
    return 'Take strictly after food with a full glass of water. Do not exceed recommended daily dose to protect gastric lining and kidneys.';
  }
  if (p.includes('acid') || p.includes('gerd') || p.includes('heartburn') || p.includes('gas')) {
    return 'Take 30-45 minutes before breakfast on an empty stomach for maximum acid suppression throughout the day.';
  }
  if (p.includes('blood pressure') || p.includes('hypertension') || p.includes('heart')) {
    return 'Take at consistent daily times. Monitor resting blood pressure regularly and do not discontinue abruptly.';
  }
  if (p.includes('diabetes') || p.includes('sugar') || p.includes('glucose')) {
    return 'Take with or immediately after meals to reduce GI disturbance. Keep fast-acting glucose available for unexpected hypoglycemia.';
  }
  if (p.includes('allergy') || p.includes('sneezing') || p.includes('hives')) {
    return 'May cause mild drowsiness in sensitive individuals; avoid alcohol or heavy machinery after evening dose.';
  }
  if (p.includes('cold') || p.includes('cough') || p.includes('sinus')) {
    return 'Drink warm liquids. If cough persists beyond 7 days or is accompanied by high fever, consult your doctor.';
  }
  if (p.includes('vitamin') || p.includes('calcium') || p.includes('supplement')) {
    return 'Take with or after main meal. Drink plenty of water throughout the day for optimal micronutrient absorption.';
  }
  return 'Take as directed by your physician or pharmacist. Keep consistent daily dosing.';
}

// ─── Indication & Condition Mapping Helpers ────────────────────────────────────
function mapIndicationToCondition(purposeStr = '', drugName = '', genericName = '') {
  const text = `${purposeStr} ${drugName} ${genericName}`.toLowerCase();
  if (!text.trim()) return null;

  // 1. Acidity / Gas / GERD / GI Reflux
  if (
    text.includes('acid') ||
    text.includes('gerd') ||
    text.includes('heartburn') ||
    text.includes('reflux') ||
    text.includes('gas') ||
    text.includes('ulcer') ||
    text.includes('gastric') ||
    text.includes('peptic') ||
    text.includes('nausea') ||
    text.includes('vomit') ||
    text.includes('antacid') ||
    text.includes('ppi') ||
    text.includes('pantoprazole') ||
    text.includes('omeprazole') ||
    text.includes('rabeprazole') ||
    text.includes('pan-d') ||
    text.includes('digene') ||
    text.includes('gelusil')
  ) {
    return 'Acidity / Gas';
  }

  // 2. Diarrhea / Loose motions / Dehydration
  if (
    text.includes('diarrh') ||
    text.includes('loose motion') ||
    text.includes('stomach infection') ||
    text.includes('ors') ||
    text.includes('electral') ||
    text.includes('loperamide') ||
    text.includes('norflox')
  ) {
    return 'Diarrhea';
  }

  // 3. Headache / Migraine
  if (
    text.includes('headache') ||
    text.includes('migraine') ||
    text.includes('cephalalgia') ||
    text.includes('naxdom')
  ) {
    return 'Headache';
  }

  // 4. Fever / Pyrexia
  if (
    text.includes('fever') ||
    text.includes('pyrexia') ||
    text.includes('paracetamol') ||
    text.includes('dolo') ||
    text.includes('calpol') ||
    text.includes('crocin')
  ) {
    return 'Fever';
  }

  // 5. Body Pain / Joint / Arthritis / Muscle
  if (
    text.includes('body pain') ||
    text.includes('joint') ||
    text.includes('arthritis') ||
    text.includes('muscle') ||
    text.includes('sprain') ||
    text.includes('inflammation') ||
    text.includes('analgesic') ||
    text.includes('nsaid') ||
    text.includes('diclofenac') ||
    text.includes('ibuprofen') ||
    text.includes('voveran') ||
    text.includes('brufen') ||
    text.includes('combiflam') ||
    text.includes('pain')
  ) {
    return 'Body Pain';
  }

  // 6. Diabetes / Blood Sugar / Glucose
  if (
    text.includes('diabet') ||
    text.includes('blood sugar') ||
    text.includes('glucose') ||
    text.includes('glycemic') ||
    text.includes('insulin') ||
    text.includes('metformin') ||
    text.includes('glycomet') ||
    text.includes('glimepiride') ||
    text.includes('januvia') ||
    text.includes('vildagliptin') ||
    text.includes('dapagliflozin') ||
    text.includes('empagliflozin')
  ) {
    return 'Diabetes';
  }

  // 7. Blood Pressure / Hypertension / Cardiovascular
  if (
    text.includes('blood pressure') ||
    text.includes('hypertension') ||
    text.includes('cardio') ||
    text.includes('heart') ||
    text.includes('angina') ||
    text.includes('antihypertensive') ||
    text.includes('telma') ||
    text.includes('telmisartan') ||
    text.includes('amlodipine') ||
    text.includes('losartan') ||
    text.includes('atenolol') ||
    text.includes('statin') ||
    text.includes('cholesterol') ||
    text.includes('atorvastatin') ||
    text.includes('rosuvastatin') ||
    text.includes('anticoagulant') ||
    text.includes('blood thinner') ||
    text.includes('warfarin') ||
    text.includes('ecosprin') ||
    text.includes('aspirin') ||
    text.includes('clopidogrel')
  ) {
    return 'Blood Pressure';
  }

  // 8. Cough / Cold / Respiratory / Sinus / Asthma
  if (
    text.includes('cough') ||
    text.includes('cold') ||
    text.includes('sinus') ||
    text.includes('nasal') ||
    text.includes('phlegm') ||
    text.includes('congestion') ||
    text.includes('bronch') ||
    text.includes('asthma') ||
    text.includes('copd') ||
    text.includes('wheez') ||
    text.includes('cheston') ||
    text.includes('sinarest') ||
    text.includes('ascoril') ||
    text.includes('alex') ||
    text.includes('benadryl') ||
    text.includes('inhaler') ||
    text.includes('salbutamol') ||
    text.includes('asthalin') ||
    text.includes('foracort') ||
    text.includes('budecort') ||
    text.includes('duolin')
  ) {
    return 'Cough / Cold';
  }

  // 9. Allergy / Rhinitis / Hives / Urticaria
  if (
    text.includes('allerg') ||
    text.includes('rhinitis') ||
    text.includes('sneez') ||
    text.includes('hives') ||
    text.includes('urticaria') ||
    text.includes('antihistamine') ||
    text.includes('itching') ||
    text.includes('watery eyes') ||
    text.includes('cetirizine') ||
    text.includes('allegra') ||
    text.includes('fexofenadine') ||
    text.includes('levocetirizine') ||
    text.includes('loratadine') ||
    text.includes('zyrtec') ||
    text.includes('montair') ||
    text.includes('montek')
  ) {
    return 'Allergy';
  }

  // 10. Vitamins / Immunity / Nutrition / Minerals
  if (
    text.includes('vitamin') ||
    text.includes('calcium') ||
    text.includes('mineral') ||
    text.includes('immunity') ||
    text.includes('supplement') ||
    text.includes('multivitamin') ||
    text.includes('iron') ||
    text.includes('folic') ||
    text.includes('b12') ||
    text.includes('d3') ||
    text.includes('zinc') ||
    text.includes('shelcal') ||
    text.includes('becosules') ||
    text.includes('neurobion') ||
    text.includes('supradyn') ||
    text.includes('evion') ||
    text.includes('ashwagandha') ||
    text.includes('liv52') ||
    text.includes('bone') ||
    text.includes('nerve')
  ) {
    return 'Vitamins / Immunity';
  }

  return null;
}

function resolveAndAutoFillIndication(drugName = '', genericName = '', category = '', overridePurpose = '') {
  let resolvedPurpose = (overridePurpose || '').trim();

  if (!resolvedPurpose && drugName) {
    const lowerName = drugName.toLowerCase().trim();
    if (COMMON_DRUG_PURPOSES[lowerName]) {
      resolvedPurpose = COMMON_DRUG_PURPOSES[lowerName];
    } else {
      const ind = getMedicineIndication({
        name: drugName,
        generic: genericName,
        category: category,
      });
      if (ind && ind !== 'Prescribed Medical Treatment') {
        resolvedPurpose = ind;
      } else {
        for (const [key, val] of Object.entries(COMMON_DRUG_PURPOSES)) {
          if (lowerName.includes(key) || key.includes(lowerName)) {
            resolvedPurpose = val;
            break;
          }
        }
      }
    }
  }

  const matchedCondition = mapIndicationToCondition(resolvedPurpose, drugName, genericName);

  return {
    purpose: resolvedPurpose || (matchedCondition ? CONDITION_MED_RECOMMENDATIONS[matchedCondition]?.[0]?.purpose || matchedCondition : ''),
    condition: matchedCondition,
  };
}

function extractDosageFromName(name = '') {
  const match = name.match(/\b(\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|sachet|tablet|puff))\b/i);
  if (match) return match[1].toLowerCase().replace(/\s+/g, '');
  const numMatch = name.match(/\b(\d{2,4})\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 5 && num <= 2000) return `${num}mg`;
  }
  return '';
}

function resolveMealInstruction(drugName = '', genericName = '', category = '') {
  const text = `${drugName} ${genericName} ${category}`.toLowerCase();

  if (
    text.includes('pan') ||
    text.includes('pantoprazole') ||
    text.includes('omeprazole') ||
    text.includes('rabeprazole') ||
    text.includes('esomeprazole') ||
    text.includes('omez') ||
    text.includes('digene') ||
    text.includes('gelusil') ||
    text.includes('antacid') ||
    text.includes('ppi')
  ) {
    return 'before_food';
  }

  if (text.includes('metformin') || text.includes('glycomet')) {
    return 'with_food';
  }

  if (text.includes('thyronorm') || text.includes('eltroxin') || text.includes('levothyroxine')) {
    return 'empty_stomach';
  }

  return 'after_food';
}

function resolveClinicalDetails(drugName = '', genericName = '', rawCategory = '', existingData = {}) {
  const extractedName = (drugName || '').trim();
  const lowerName = extractedName.toLowerCase();

  const localMatch = searchLocalResolver(extractedName);
  const bestLocal = localMatch?.length > 0 ? localMatch[0] : null;

  // 1. Resolve Generic Name & Composition Salts
  let resolvedGeneric = (genericName || existingData.genericName || existingData.generic_name || bestLocal?.generic || '').trim();
  let resolvedSalts = Array.isArray(existingData.composition) && existingData.composition.length > 0
    ? existingData.composition
    : (Array.isArray(existingData.genericSalts) && existingData.genericSalts.length > 0
        ? existingData.genericSalts
        : (bestLocal?.genericSalts || []));

  if (!resolvedGeneric) {
    if (lowerName.includes('dolo') || lowerName.includes('calpol') || lowerName.includes('crocin')) resolvedGeneric = 'Paracetamol';
    else if (lowerName.includes('pan-d') || lowerName.includes('pantocid-d')) resolvedGeneric = 'Pantoprazole + Domperidone';
    else if (lowerName.includes('combiflam')) resolvedGeneric = 'Ibuprofen + Paracetamol';
    else if (lowerName.includes('augmentin')) resolvedGeneric = 'Amoxicillin + Clavulanic Acid';
    else if (lowerName.includes('naxdom')) resolvedGeneric = 'Naproxen + Domperidone';
    else if (lowerName.includes('zerodol sp')) resolvedGeneric = 'Aceclofenac + Paracetamol + Serratiopeptidase';
    else if (lowerName.includes('telma')) resolvedGeneric = 'Telmisartan';
    else if (lowerName.includes('glycomet') || lowerName.includes('metformin')) resolvedGeneric = 'Metformin';
    else if (lowerName.includes('atorva')) resolvedGeneric = 'Atorvastatin';
    else if (lowerName.includes('allegra')) resolvedGeneric = 'Fexofenadine';
    else if (lowerName.includes('cheston')) resolvedGeneric = 'Cetirizine + Paracetamol + Phenylephrine';
    else if (lowerName.includes('sinarest')) resolvedGeneric = 'Paracetamol + Phenylephrine + Chlorpheniramine';
    else if (lowerName.includes('shelcal')) resolvedGeneric = 'Calcium + Vitamin D3';
    else if (lowerName.includes('becosules')) resolvedGeneric = 'Vitamin B-Complex + Vitamin C';
    else if (lowerName.includes('neurobion')) resolvedGeneric = 'Vitamin B12 + B-Complex';
    else if (lowerName.includes('electral') || lowerName.includes('ors')) resolvedGeneric = 'Oral Rehydration Salts';
    else if (lowerName.includes('digene')) resolvedGeneric = 'Magnesium Hydroxide + Aluminum Hydroxide + Simethicone';
    else if (lowerName.includes('gelusil')) resolvedGeneric = 'Magnesium Hydroxide + Aluminum Hydroxide + Dimethicone';
  }

  if (resolvedSalts.length === 0 && resolvedGeneric) {
    if (resolvedGeneric.includes('+')) {
      resolvedSalts = resolvedGeneric.split('+').map(s => s.trim()).filter(Boolean);
    } else if (resolvedGeneric.includes(',')) {
      resolvedSalts = resolvedGeneric.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      resolvedSalts = [resolvedGeneric];
    }
  }

  // 2. Resolve Strength / Dosage
  let resolvedDosage = (existingData.strength || existingData.suggestedDosage || existingData.dosage || '').trim();
  if (!resolvedDosage) {
    resolvedDosage = extractDosageFromName(extractedName) || bestLocal?.dosage || '';
  }
  if (!resolvedDosage) {
    if (lowerName.includes('dolo 650') || lowerName.includes('dolo')) resolvedDosage = '650mg';
    else if (lowerName.includes('pan-d') || lowerName.includes('pantocid-d')) resolvedDosage = '40mg + 30mg SR';
    else if (lowerName.includes('combiflam')) resolvedDosage = '400mg + 325mg';
    else if (lowerName.includes('augmentin 625') || lowerName.includes('augmentin')) resolvedDosage = '625mg';
    else if (lowerName.includes('naxdom 500') || lowerName.includes('naxdom')) resolvedDosage = '500mg + 10mg';
    else if (lowerName.includes('zerodol sp')) resolvedDosage = '100mg + 325mg + 15mg';
    else if (lowerName.includes('calpol 500') || lowerName.includes('calpol')) resolvedDosage = '500mg';
    else if (lowerName.includes('crocin 650')) resolvedDosage = '650mg';
    else if (lowerName.includes('crocin')) resolvedDosage = '500mg';
    else if (lowerName.includes('telma 40') || lowerName.includes('telma')) resolvedDosage = '40mg';
    else if (lowerName.includes('glycomet 500') || lowerName.includes('glycomet') || lowerName.includes('metformin')) resolvedDosage = '500mg';
    else if (lowerName.includes('cheston cold') || lowerName.includes('sinarest')) resolvedDosage = '1 tablet';
    else if (lowerName.includes('allegra 120') || lowerName.includes('allegra')) resolvedDosage = '120mg';
    else if (lowerName.includes('cetirizine 10') || lowerName.includes('cetirizine')) resolvedDosage = '10mg';
    else if (lowerName.includes('shelcal 500') || lowerName.includes('shelcal')) resolvedDosage = '500mg';
    else if (lowerName.includes('becosules')) resolvedDosage = '1 capsule';
    else if (lowerName.includes('neurobion')) resolvedDosage = '1 tablet';
    else if (lowerName.includes('electral') || lowerName.includes('ors')) resolvedDosage = '1 sachet (21.8g)';
    else if (lowerName.includes('digene')) resolvedDosage = '2 tablets';
    else if (lowerName.includes('voveran 50') || lowerName.includes('voveran')) resolvedDosage = '50mg';
    else if (lowerName.includes('azithral 500') || lowerName.includes('azithral')) resolvedDosage = '500mg';
  }

  // 3. Clinical Indication & Condition
  let { purpose: resolvedPurpose, condition: resolvedCondition } = resolveAndAutoFillIndication(
    extractedName,
    resolvedGeneric,
    rawCategory,
    existingData.purpose || existingData.indication || bestLocal?.purpose
  );
  if (!resolvedPurpose && bestLocal?.purpose) {
    resolvedPurpose = bestLocal.purpose;
    resolvedCondition = mapIndicationToCondition(resolvedPurpose, extractedName, resolvedGeneric);
  }

  // 4. Meal Instruction
  let mealInstruction = existingData.foodInstruction || (bestLocal?.foodInstruction !== 'any' ? bestLocal?.foodInstruction : '') || '';
  if (!mealInstruction || mealInstruction === 'any') {
    mealInstruction = resolveMealInstruction(extractedName, resolvedGeneric, rawCategory);
  }

  // 5. Recommended Frequency & Timings
  let resolvedFreq = existingData.frequency || existingData.commonFrequency || bestLocal?.commonFrequency || '';
  let resolvedTimings = existingData.extractedTimings || (existingData.timing ? [existingData.timing] : (bestLocal?.extractedTimings || []));

  if (!resolvedFreq) {
    if (
      lowerName.includes('pan') ||
      lowerName.includes('telma') ||
      lowerName.includes('amlodipine') ||
      lowerName.includes('atorva') ||
      lowerName.includes('shelcal') ||
      lowerName.includes('allegra') ||
      lowerName.includes('cetirizine') ||
      lowerName.includes('warfarin') ||
      lowerName.includes('losartan')
    ) {
      resolvedFreq = 'once';
      resolvedTimings = lowerName.includes('warfarin') || lowerName.includes('atorva') ? ['evening'] : lowerName.includes('cetirizine') ? ['bedtime'] : ['morning'];
    } else if (
      lowerName.includes('augmentin') ||
      lowerName.includes('combiflam') ||
      lowerName.includes('voveran') ||
      lowerName.includes('norflox') ||
      lowerName.includes('naxdom') ||
      lowerName.includes('amoxicillin') ||
      lowerName.includes('metformin') ||
      lowerName.includes('glycomet')
    ) {
      resolvedFreq = 'twice';
      resolvedTimings = ['morning', 'evening'];
    } else if (lowerName.includes('dolo') || lowerName.includes('crocin') || lowerName.includes('calpol')) {
      resolvedFreq = 'thrice';
      resolvedTimings = ['morning', 'afternoon', 'evening'];
    } else {
      resolvedFreq = 'once';
      resolvedTimings = ['morning'];
    }
  } else {
    const f = resolvedFreq.toLowerCase();
    if (f.includes('thrice') || f.includes('tid')) {
      resolvedFreq = 'thrice';
      resolvedTimings = ['morning', 'afternoon', 'evening'];
    } else if (f.includes('twice') || f.includes('bid')) {
      resolvedFreq = 'twice';
      resolvedTimings = ['morning', 'evening'];
    } else if (f.includes('four') || f.includes('qid')) {
      resolvedFreq = 'four';
      resolvedTimings = ['morning', 'afternoon', 'evening', 'bedtime'];
    } else {
      resolvedFreq = 'once';
      resolvedTimings = lowerName.includes('warfarin') || lowerName.includes('atorva') ? ['evening'] : lowerName.includes('cetirizine') ? ['bedtime'] : ['morning'];
    }
  }

  // 6. Dosage Form
  let resolvedForm = (existingData.form || '').toLowerCase();
  if (!resolvedForm) {
    if (
      lowerName.includes('pan-d') ||
      lowerName.includes('pantocid-d') ||
      lowerName.includes('omez-d') ||
      lowerName.includes('rabekind-d') ||
      lowerName.includes('omez') ||
      lowerName.includes('becosules') ||
      lowerName.includes('evion') ||
      lowerName.includes('capsule') ||
      lowerName.includes('cap')
    ) {
      resolvedForm = 'capsule';
    } else if (
      lowerName.includes('syrup') ||
      lowerName.includes('suspension') ||
      lowerName.includes('liquid') ||
      lowerName.includes('ascoril') ||
      lowerName.includes('alex') ||
      lowerName.includes('benadryl') ||
      lowerName.includes('corex') ||
      lowerName.includes('grilinctus')
    ) {
      resolvedForm = 'syrup';
    } else if (lowerName.includes('drop') || lowerName.includes('otrivin') || lowerName.includes('nasivion')) {
      resolvedForm = 'drops';
    } else if (
      lowerName.includes('inhaler') ||
      lowerName.includes('respule') ||
      lowerName.includes('asthalin') ||
      lowerName.includes('foracort') ||
      lowerName.includes('seroflo') ||
      lowerName.includes('budecort') ||
      lowerName.includes('duolin')
    ) {
      resolvedForm = 'inhaler';
    } else if (
      lowerName.includes('cream') ||
      lowerName.includes('gel') ||
      lowerName.includes('ointment') ||
      lowerName.includes('volini') ||
      lowerName.includes('omnigel') ||
      lowerName.includes('moov')
    ) {
      resolvedForm = 'cream';
    } else if (lowerName.includes('injection') || lowerName.includes('inj') || lowerName.includes('insulin')) {
      resolvedForm = 'injection';
    } else {
      resolvedForm = 'tablet';
    }
  } else {
    if (resolvedForm.includes('capsule')) resolvedForm = 'capsule';
    else if (resolvedForm.includes('syrup') || resolvedForm.includes('liquid') || resolvedForm.includes('suspension')) resolvedForm = 'syrup';
    else if (resolvedForm.includes('drop')) resolvedForm = 'drops';
    else if (resolvedForm.includes('inhaler') || resolvedForm.includes('respule')) resolvedForm = 'inhaler';
    else if (resolvedForm.includes('cream') || resolvedForm.includes('gel') || resolvedForm.includes('ointment')) resolvedForm = 'cream';
    else if (resolvedForm.includes('injection')) resolvedForm = 'injection';
    else resolvedForm = 'tablet';
  }

  // 7. Regulatory Type
  let resolvedType = existingData.suggestedType;
  if (!resolvedType) {
    if (
      rawCategory.toLowerCase().includes('herb') ||
      rawCategory.toLowerCase().includes('ayurved') ||
      lowerName.includes('turmeric') ||
      lowerName.includes('ashwagandha') ||
      lowerName.includes('liv52') ||
      lowerName.includes('triphala') ||
      lowerName.includes('tulsi') ||
      lowerName.includes('neem') ||
      bestLocal?.source === 'herbal'
    ) {
      resolvedType = 'HERBAL';
    } else if (
      rawCategory.toLowerCase().includes('otc') ||
      lowerName.includes('paracetamol') ||
      lowerName.includes('dolo') ||
      lowerName.includes('calpol') ||
      lowerName.includes('crocin') ||
      lowerName.includes('digene') ||
      lowerName.includes('gelusil') ||
      lowerName.includes('ors') ||
      lowerName.includes('electral') ||
      lowerName.includes('shelcal') ||
      lowerName.includes('becosules') ||
      lowerName.includes('strepsils') ||
      lowerName.includes('vicks') ||
      bestLocal?.source === 'otc'
    ) {
      resolvedType = 'OTC';
    } else {
      resolvedType = 'PRESCRIPTION';
    }
  }

  return {
    genericName: resolvedGeneric,
    salts: resolvedSalts,
    dosage: resolvedDosage,
    purpose: resolvedPurpose,
    condition: resolvedCondition,
    mealInstruction,
    frequency: resolvedFreq,
    timings: resolvedTimings,
    form: resolvedForm,
    type: resolvedType,
  };
}

// ─── Medicine type options ────────────────────────────────────────────────────
const MEDICINE_TYPES = [
  {
    value: 'PRESCRIPTION',
    label: 'Prescription (Rx)',
    shortLabel: 'Prescription',
    description: 'Doctor-prescribed medicines',
    icon: <Stethoscope className="w-5 h-5" />,
    toggleIcon: <Stethoscope className="w-4 h-4" />,
  },
  {
    value: 'OTC',
    label: 'Over-The-Counter',
    shortLabel: 'OTC',
    description: 'Pharmacy shelf / non-prescription',
    icon: <ShoppingBag className="w-5 h-5" />,
    toggleIcon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    value: 'HERBAL',
    label: 'Herbal / Ayurvedic',
    shortLabel: 'Herbal',
    description: 'Supplements, herbs, tonics — checked against our herb-drug database',
    icon: <Leaf className="w-5 h-5" />,
    toggleIcon: <Leaf className="w-4 h-4" />,
  },
];

const SEVERITY_COLOR = {
  Major: { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-200', badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300', icon: <AlertOctagon className="w-5 h-5 text-rose-500" /> },
  Contraindicated: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-400 dark:border-red-800', text: 'text-red-900 dark:text-red-200', badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300', icon: <AlertOctagon className="w-5 h-5 text-red-600" /> },
  Moderate: { bg: 'bg-[var(--surface)]', border: 'border-[var(--caution-fg)]/50', text: 'text-[var(--ink)]', badge: 'bg-[var(--surface-2)] text-[var(--ink)]', icon: <TriangleAlert className="w-5 h-5 text-[var(--caution-fg)]" /> },
  Minor: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-300 dark:border-yellow-800', text: 'text-yellow-800 dark:text-yellow-200', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', icon: <Info className="w-5 h-5 text-yellow-500" /> },
  Unknown: { bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-300 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-300', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', icon: <Info className="w-5 h-5 text-gray-400" /> },
};

// ─── Pill ID Swatch Data ──────────────────────────────────────────────────────
const PILL_SHAPES = [
  {
    id: 'round',
    label: 'Round',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    id: 'oval',
    label: 'Oval / Oblong',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <ellipse cx="12" cy="12" rx="9" ry="5" />
      </svg>
    ),
  },
  {
    id: 'capsule',
    label: 'Capsule',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <path d="M7 16l10-10a4 4 0 0 1 5.66 5.66L12.66 21.66a4 4 0 0 1-5.66-5.66z" />
        <line x1="8.5" y1="11.5" x2="14.5" y2="17.5" />
      </svg>
    ),
  },
  {
    id: 'diamond',
    label: 'Diamond',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <polygon points="12,2 21,12 12,22 3,12" />
      </svg>
    ),
  },
  {
    id: 'triangle',
    label: 'Triangle',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <polygon points="12,3 21,20 3,20" />
      </svg>
    ),
  },
  {
    id: 'square',
    label: 'Square',
    svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    ),
  },
];

const PILL_COLORS = [
  { id: 'white', label: 'White', colorClass: 'bg-white border-2 border-slate-300 dark:border-slate-600' },
  { id: 'yellow', label: 'Yellow', colorClass: 'bg-amber-400' },
  { id: 'orange', label: 'Orange', colorClass: 'bg-orange-500' },
  { id: 'red', label: 'Red / Pink', colorClass: 'bg-rose-500' },
  { id: 'blue', label: 'Blue', colorClass: 'bg-sky-500' },
  { id: 'green', label: 'Green', colorClass: 'bg-emerald-500' },
  { id: 'brown', label: 'Brown / Tan', colorClass: 'bg-amber-800' },
  { id: 'purple', label: 'Purple', colorClass: 'bg-purple-500' },
];

// ─── API helpers ──────────────────────────────────────────────────────────────
async function scanPrescription(payload) {
  const form = new FormData();
  if (payload instanceof File) {
    form.append('image', payload);
  } else if (payload?.image) {
    form.append('image', payload.image);
    if (payload.backImage) {
      form.append('backImage', payload.backImage);
    }
  }
  const resp = await axios.post('/medicine/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 25_000,
  });
  return resp.data;
}

async function addMedicine({ name, type, dosage, purpose, notes }) {
  const resp = await axios.post('/medicine', { name, type, dosage, purpose, notes });
  return resp.data;
}

async function batchAddMedicines(medicines) {
  const resp = await axios.post('/medicine/batch', { medicines });
  return resp.data;
}

// ─── Pulsing dot animation component ─────────────────────────────────────────
function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--brand-600)]"
          style={{
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Interaction Check Result Panel ──────────────────────────────────────────
function InteractionResult({ result, medicineName }) {
  if (!result) return null;

  if (result.summary === 'check-error') {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Interaction check unavailable</p>
          <p className="text-xs text-gray-500 mt-0.5">{result.message}</p>
        </div>
      </div>
    );
  }

  if (result.summary === 'no-prior-medicines') {
    return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[var(--ink)]">First medicine added!</p>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Add more medicines — PolySafe will check each pair for interactions automatically.
          </p>
        </div>
      </div>
    );
  }

  if (result.summary === 'all-clear') {
    return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[var(--ink)]">No known interactions found</p>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">
            Checked <strong>{medicineName}</strong> against {result.checkedCount} medicine{result.checkedCount !== 1 ? 's' : ''} — 
            no DDInter matches. Always verify with your doctor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {result.cumulativeBurden && (
        <div className={`p-4 rounded-2xl border ${
          result.cumulativeBurden.level === 'Critical' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 text-rose-900 dark:text-rose-200' :
          result.cumulativeBurden.level === 'Moderate' ? 'bg-[var(--surface-2)] border-[var(--caution-fg)]/50 text-[var(--ink)]' :
          'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--ink)]'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Anticholinergic / Sedative Burden
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              result.cumulativeBurden.level === 'Critical' ? 'bg-rose-200 text-rose-900 font-extrabold' :
              result.cumulativeBurden.level === 'Moderate' ? 'bg-amber-200 text-amber-900 font-extrabold' :
              'bg-emerald-200 text-emerald-900 font-extrabold'
            }`}>
              Score: {result.cumulativeBurden.totalScore} · {result.cumulativeBurden.level}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {result.cumulativeBurden.explanation}
          </p>
        </div>
      )}

      {result.flagsFound?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-bold text-[var(--ink)]">
              {result.flagsFound.length} interaction{result.flagsFound.length !== 1 ? 's' : ''} detected
            </p>
          </div>

          {result.flagsFound.map((flag, i) => {
            const colors = SEVERITY_COLOR[flag.severity] ?? SEVERITY_COLOR.Unknown;
            return (
              <div
                key={flag.flagId ?? i}
                className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} space-y-2.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {colors.icon}
                    <div>
                      <p className={`text-sm font-bold ${colors.text}`}>
                        {flag.drugA} + {flag.drugB}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {flag.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${colors.text} opacity-90`}>
                  {flag.plainExplanation}
                </p>

                {flag.flagId && (
                  <Link
                    to={`/risk/${flag.flagId}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-[var(--brand-600)] hover:bg-[#1F5245] px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Risk Details</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Live Camera Viewfinder Modal Component ───────────────────────────────────
function LiveCameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }

    let activeStream = null;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setCameraError('Could not access camera. Please allow camera permissions or upload an image file.');
      });

    return () => {
      if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, facingMode]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-scan.jpg', { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[var(--border)] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[var(--brand-600)]" />
            <h3 className="font-bold text-sm text-[var(--ink)]">Live Medicine Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--ink-3)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-video sm:aspect-4/3 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-300 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p>{cameraError}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-6 sm:inset-10 border-2 border-[var(--coral)] rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_20px_rgba(235,94,85,0.4)]">
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-t-3 border-l-3 border-[var(--coral)]" />
                  <span className="w-5 h-5 border-t-3 border-r-3 border-[var(--coral)]" />
                </div>
                <div className="text-center">
                  <p className="inline-block text-[11px] font-semibold text-white bg-black/60 backdrop-blur-xs py-1 px-3.5 rounded-full border border-white/20">
                    Align medicine strip or prescription in frame
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-b-3 border-l-3 border-[var(--coral)]" />
                  <span className="w-5 h-5 border-b-3 border-r-3 border-[var(--coral)]" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 flex items-center justify-between gap-3 bg-[var(--surface-2)] border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-3 rounded-2xl bg-[var(--surface)] text-[var(--ink-3)] hover:text-[var(--ink)] border border-[var(--border)] shadow-[var(--shadow-xs)] cursor-pointer"
            title="Switch Camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSnap}
            disabled={!!cameraError}
            className="flex-1 py-3.5 ps-btn ps-btn-primary flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span>Capture & Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Barcode & DataMatrix Lookup Modal ───────────────────────────────────────
function BarcodeModal({ isOpen, onClose, onSelect }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/medicine/barcode/${encodeURIComponent(barcode.trim())}`);
      if (data.found) {
        onSelect(data);
        onClose();
        notify.success('Medicine Found from Barcode', `Loaded ${data.drug_name}`);
      } else {
        setError(data.message || 'No direct match found for this barcode.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-[var(--brand-600)]" />
            <h3 className="font-bold text-base text-[var(--ink)]">Box Barcode & DataMatrix Lookup</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--ink-3)]">
          Enter or paste the barcode / GTIN / NDC number from the medicine carton for instant recognition:
        </p>

        <form onSubmit={handleLookup} className="space-y-3">
          <PolySafeInput
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. 8901234567890 or 0071-0155-23"
            autoFocus
          />

          {error && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="ps-btn ps-btn-secondary flex-1 py-2.5 text-xs cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !barcode.trim()}
              className="ps-btn ps-btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Lookup Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Multi-Medicine Batch Review Component ──────────────────────────────────
function MultiMedBatchReviewCard({ scanResult, onBatchAdd, onDismiss }) {
  const medications = scanResult.medications || [];
  const [selectedMeds, setSelectedMeds] = useState(
    medications.map((_, idx) => idx)
  );
  const [addingBatch, setAddingBatch] = useState(false);

  const toggleSelect = (idx) => {
    setSelectedMeds((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleAddAll = async () => {
    const medsToAdd = selectedMeds.map((idx) => {
      const med = medications[idx];
      const name = med.drug_name || med.name;
      const clinical = resolveClinicalDetails(name, med.generic_name, med.category, med);
      return {
        name,
        type: clinical.type || med.suggestedType || 'PRESCRIPTION',
        dosage: clinical.dosage || med.strength || undefined,
        purpose: clinical.purpose || undefined,
        frequency: clinical.frequency || med.frequency || 'once',
        notes: clinical.mealInstruction || med.foodInstruction || undefined,
        form: clinical.form || med.form || 'tablet',
      };
    });
    if (medsToAdd.length === 0) {
      notify.warn('No Medicines Selected', 'Please select at least 1 medicine to add.');
      return;
    }
    setAddingBatch(true);
    try {
      await onBatchAdd(medsToAdd);
    } finally {
      setAddingBatch(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl border border-[var(--brand-600)]/40 bg-[var(--surface)] space-y-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[var(--brand-600)] text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ink)]">
              Prescription Multi-Medicine Detected ({medications.length} Drugs)
            </h3>
            <p className="text-xs text-[var(--ink-3)]">
              {scanResult.prescriber ? `Prescribed by Dr. ${scanResult.prescriber}` : 'Review and select medicines to add'}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/25">
          Batch Ready
        </span>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {medications.map((med, idx) => {
          const isSelected = selectedMeds.includes(idx);
          const salts = Array.isArray(med.composition) && med.composition.length > 0
            ? med.composition
            : (med.genericSalts || []);

          return (
            <div
              key={idx}
              onClick={() => toggleSelect(idx)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'bg-[var(--surface-2)] border-[var(--brand-600)] shadow-[var(--shadow-xs)]'
                  : 'bg-[var(--surface)] border-[var(--border)] opacity-60'
              }`}
            >
              <div className="mt-0.5">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-[var(--brand-600)]" />
                ) : (
                  <Square className="w-5 h-5 text-[var(--ink-3)]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h4 className="font-bold text-sm text-[var(--ink)] truncate">
                    {med.drug_name || med.name}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                    {med.strength || 'Standard dose'}
                  </span>
                </div>

                {med.generic_name && (
                  <p className="text-xs text-[var(--ink-3)] truncate">
                    {med.generic_name}
                  </p>
                )}

                {salts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {salts.map((s, sIdx) => (
                      <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--brand-600)]/20 text-[var(--brand-600)]">
                        <FlaskConical className="w-2.5 h-2.5" />
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-bold text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline cursor-pointer"
        >
          Cancel & Edit Manually
        </button>

        <button
          type="button"
          onClick={handleAddAll}
          disabled={addingBatch || selectedMeds.length === 0}
          className="w-full sm:w-auto px-6 py-3 ps-btn ps-btn-primary flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {addingBatch ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Medicines...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Selected ({selectedMeds.length}) to My Regimen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Scan Results Review Card Component ──────────────────────────────────────
function ScanResultsReviewCard({ scanResult, onDismiss, onBatchAdd, onFieldFocus }) {
  if (!scanResult) return null;

  if (Array.isArray(scanResult.medications) && scanResult.medications.length > 1) {
    return <MultiMedBatchReviewCard scanResult={scanResult} onBatchAdd={onBatchAdd} onDismiss={onDismiss} />;
  }

  const rawConf = (scanResult.confidence || 'high').toLowerCase();
  const isHigh = rawConf === 'high';
  const isLow = rawConf === 'low';
  const confidencePercent = isHigh ? 94 : isLow ? 46 : 72;

  const source = scanResult.source || scanResult.engine || 'gemini';
  const engineLabel =
    source === 'gemini_vision' || source === 'gemini' ? 'Gemini 1.5 Flash Vision' :
    source === 'tesseract' ? 'Local Tesseract OCR' :
    source === 'ocr_gemini_hybrid' ? 'Smart Hybrid Vision' :
    'OCR.space Multi-Engine';

  const drugName = scanResult.drug_name || scanResult.candidate || scanResult.generic_name;
  const strength = scanResult.strength || scanResult.suggestedDosage;
  const prescriber = scanResult.prescriber || scanResult.prescriberName;
  const salts = Array.isArray(scanResult.composition) && scanResult.composition.length > 0
    ? scanResult.composition
    : (scanResult.genericSalts || []);

  return (
    <div className={`p-5 rounded-3xl border-2 bg-[var(--paper)] space-y-4 shadow-[var(--shadow-sm)] ${
      isLow ? 'border-rose-300 dark:border-rose-800' : 'border-[var(--brand-600)]/30'
    }`}>
      {/* Header with Confidence Meter and Source Chip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Review Scanned Details</h3>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">{engineLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Chip */}
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
            {engineLabel}
          </span>

          {/* Color-Coded Confidence Meter */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-2xs">
            <div className="w-16 h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold ${
              isHigh ? 'text-emerald-700 dark:text-emerald-400' : isLow ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
            }`}>
              {confidencePercent}% {isHigh ? 'High' : isLow ? 'Low' : 'Med'}
            </span>
          </div>
        </div>
      </div>

      {/* Field-level highlight warning if confidence is low */}
      {isLow && (
        <div className="p-3 bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Low extraction confidence:</strong> Image clarity was suboptimal. The highlighted fields below have been pre-filled — please verify them carefully against your physical prescription.
          </p>
        </div>
      )}

      {/* Extracted Details Grid with field-level highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className={`p-3 rounded-2xl border transition-all ${
          isLow
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/20'
            : 'bg-[var(--surface)] border-[var(--border)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)]">Extracted Drug</span>
            {isLow && <span className="text-[10px] font-bold text-rose-600">Verify</span>}
          </div>
          <p className="font-bold text-[var(--ink)] text-sm truncate mt-0.5">{drugName || '—'}</p>
          {scanResult.generic_name && (
            <p className="text-[11px] text-[var(--ink-3)] truncate">Generic: {scanResult.generic_name}</p>
          )}
        </div>

        <div className={`p-3 rounded-2xl border transition-all ${
          isLow
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/20'
            : 'bg-[var(--surface)] border-[var(--border)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-3)]">Strength & Form</span>
            {isLow && <span className="text-[10px] font-bold text-rose-600">Verify</span>}
          </div>
          <p className="font-bold text-[var(--ink)] text-sm truncate mt-0.5">
            {strength || '—'} {scanResult.form ? `(${scanResult.form})` : ''}
          </p>
          {scanResult.category && (
            <p className="text-[11px] text-[var(--ink-3)] truncate">{scanResult.category}</p>
          )}
        </div>

        {/* Clinical Indication & Purpose Tile */}
        <div className="p-3 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/25 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Clinical Indication & Purpose
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full">
              Auto-filled in Step 2 below
            </span>
          </div>
          <p className="font-bold text-[var(--ink)] text-xs sm:text-sm mt-0.5">
            {scanResult.purpose || scanResult.indication || getMedicineIndication({ name: drugName, generic: scanResult.generic_name, category: scanResult.category })}
          </p>
        </div>
      </div>

      {/* Chemical Salts Decomposition */}
      {salts.length > 0 && (
        <div className="p-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[var(--brand-600)]">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Active Chemical Salts Breakdown:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {salts.map((salt, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] shadow-2xs"
              >
                <Pill className="w-3 h-3 text-[var(--brand-600)]" />
                {salt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prescriber */}
      {prescriber && (
        <div className="flex items-center gap-2 p-2.5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-xs">
          <span className="font-bold text-[var(--brand-600)]">Prescriber:</span>
          <span className="text-[var(--ink)] font-semibold">{prescriber.startsWith('Dr.') ? prescriber : `Dr. ${prescriber}`}</span>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[11px] text-[var(--ink-3)]">Pre-filled in form below · fully editable</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-bold text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline cursor-pointer"
        >
          Clear scan results
        </button>
      </div>
    </div>
  );
}

// ─── Main Redesigned Component ────────────────────────────────────────────────
export default function AddMedicinePage() {
  const navigate = useNavigate();
  const { isGuest, requireAuth } = useAuth();
  const { t } = useT();
  const isReduced = useReducedMotion();
  const fileInputRef = useRef(null);

  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tabParam = searchParams.get('tab');
  const resolvedInitialTab = (tabParam === 'pill' || tabParam === 'pill_id') ? 'pill_id' : tabParam === 'search' ? 'search' : 'scan';

  // Tab state: 'scan' | 'search' | 'pill_id'
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);

  useEffect(() => {
    if (tabParam) {
      const target = (tabParam === 'pill' || tabParam === 'pill_id') ? 'pill_id' : tabParam === 'search' ? 'search' : 'scan';
      setActiveTab(target);
    }
  }, [tabParam]);

  // Form inputs
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [compositionSalts, setCompositionSalts] = useState([]);
  const [form, setForm] = useState('tablet');
  const [type, setType] = useState('PRESCRIPTION');
  const [dosage, setDosage] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [safetyWarning, setSafetyWarning] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [timings, setTimings] = useState([]);
  const [prescriber, setPrescriber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [notes, setNotes] = useState('');
  const [isScanFilled, setIsScanFilled] = useState(false);
  const [selectedDrugInfo, setSelectedDrugInfo] = useState(null);

  // Scan state: 'idle' | 'scanning' | 'confirm' | 'error'
  const [scanState, setScanState] = useState('idle');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanProgressStep, setScanProgressStep] = useState(1); // 1 = Uploading, 2 = Reading, 3 = Verifying

  // Advanced Scanning Modals
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [scanMode, setScanMode] = useState('single');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const backFileInputRef = useRef(null);

  // Search Combobox state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem('polysafe_recent_searches');
      return stored ? JSON.parse(stored) : ['Dolo 650', 'Metformin 500mg', 'Pantoprazole 40mg', 'Ashwagandha'];
    } catch {
      return ['Dolo 650', 'Metformin 500mg', 'Pantoprazole 40mg', 'Ashwagandha'];
    }
  });
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);
  const nameInputRef = useRef(null);

  // Pill ID state
  const [selectedPillShape, setSelectedPillShape] = useState(null);
  const [selectedPillColor, setSelectedPillColor] = useState(null);
  const [pillImprintCode, setPillImprintCode] = useState('');
  const [pillState, setPillState] = useState('idle');
  const [pillMatches, setPillMatches] = useState([]);
  const [pillError, setPillError] = useState(null);
  const pillFileInputRef = useRef(null);

  // Live interaction check & safety preview
  const [checkState, setCheckState] = useState('idle');
  const [checkResult, setCheckResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [savedMedicineName, setSavedMedicineName] = useState('');

  // Duplicate conflict & bottom sheet drawer
  const [duplicateConflict, setDuplicateConflict] = useState(null);
  const [isDuplicateDrawerOpen, setIsDuplicateDrawerOpen] = useState(false);

  // Pre-save "If you add this" safety check alerts
  const [safetyPreviewAlerts, setSafetyPreviewAlerts] = useState([]);
  const [safetyPreviewLoading, setSafetyPreviewLoading] = useState(false);


  // Save recent search
  const addRecentSearch = (term) => {
    if (!term || term.trim().length < 2) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('polysafe_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          nameInputRef.current && !nameInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Safety Preview debounce
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setSafetyPreviewAlerts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSafetyPreviewLoading(true);
      try {
        const { data } = await axios.post('/medicine/preview-safety', {
          name: trimmed,
          dosage,
          type,
        });
        const alerts = data?.alerts || [];
        setSafetyPreviewAlerts(alerts);

        // Check if duplicate alert exists
        const dupAlert = alerts.find(a => a.type === 'DUPLICATE_INGREDIENT' || a.type === 'DUPLICATE_CLASS');
        if (dupAlert && !duplicateConflict) {
          setDuplicateConflict({
            name: trimmed,
            existingDosage: 'Active regimen',
            newDosage: dosage || 'Incoming dose',
            alertText: dupAlert.plainText,
          });
        }
      } catch (e) {
        console.warn('Safety preview request failed', e);
      } finally {
        setSafetyPreviewLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [name, dosage, type, duplicateConflict]);

  // Drug autocomplete fetch
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);

    if (isGuest || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const localMatches = searchLocalResolver(query);
      setSuggestions(localMatches);
      setShowSuggestions(localMatches.length > 0);
      setSelectedIdx(-1);
      setSearchLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`/medicine/search?q=${encodeURIComponent(query)}`);
      const results = (data?.suggestions && data.suggestions.length > 0)
        ? data.suggestions
        : searchLocalResolver(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIdx(-1);
    } catch {
      const fallback = searchLocalResolver(query);
      setSuggestions(fallback);
      setShowSuggestions(fallback.length > 0);
      setSelectedIdx(-1);
    } finally {
      setSearchLoading(false);
    }
  }, [isGuest]);

  const handleNameChange = useCallback((value) => {
    setName(value);
    if (submitError) setSubmitError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }, [fetchSuggestions, submitError]);

  const handleSelectSuggestion = useCallback((sug) => {
    setName(sug.name);
    addRecentSearch(sug.name);

    const clinical = resolveClinicalDetails(sug.name, sug.generic, sug.category, sug);

    if (clinical.genericName) setGenericName(clinical.genericName);
    if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
    if (clinical.dosage) setDosage(clinical.dosage);
    if (clinical.form) setForm(clinical.form);
    if (clinical.type) setType(clinical.type);
    if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
    if (clinical.frequency) setFrequency(clinical.frequency);
    if (clinical.timings?.length > 0) setTimings(clinical.timings);

    if (clinical.purpose) setPurpose(clinical.purpose);
    if (clinical.condition) setSelectedCondition(clinical.condition);

    if (sug.extractedTimings?.length > 0) {
      setTimings(sug.extractedTimings);
    } else if (sug.commonFrequency === 'twice') {
      setTimings(['morning', 'evening']);
    } else if (sug.commonFrequency === 'thrice') {
      setTimings(['morning', 'afternoon', 'evening']);
    } else if (sug.commonFrequency === 'four') {
      setTimings(['morning', 'afternoon', 'evening', 'bedtime']);
    } else if (sug.commonFrequency === 'once') {
      setTimings(['morning']);
    }

    if (sug.source === 'herbal' || sug.name?.toLowerCase().includes('turmeric') || sug.name?.toLowerCase().includes('ashwagandha') || clinical.type === 'HERBAL') {
      setType('HERBAL');
    } else if (clinical.type) {
      setType(clinical.type);
    } else if (sug.source === 'otc' || sug.category?.toLowerCase().includes('otc')) {
      setType('OTC');
    } else {
      setType('PRESCRIPTION');
    }

    setSelectedDrugInfo(sug);
    setShowSuggestions(false);
    setSuggestions([]);
    notify.success('Drug Details Auto-Filled', `Auto-filled details for "${sug.name}"${sug.dosage ? ` (${sug.dosage})` : ''}`);
  }, []);

  const handleNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[selectedIdx >= 0 ? selectedIdx : 0]);
      } else if (name.trim().length >= 2) {
        const clinical = resolveClinicalDetails(name.trim(), genericName);
        if (clinical.genericName) setGenericName(clinical.genericName);
        if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
        if (clinical.dosage) setDosage(clinical.dosage);
        if (clinical.purpose) setPurpose(clinical.purpose);
        if (clinical.condition) setSelectedCondition(clinical.condition);
        if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
        if (clinical.frequency) setFrequency(clinical.frequency);
        if (clinical.timings?.length > 0) setTimings(clinical.timings);
        if (clinical.form) setForm(clinical.form);
        if (clinical.type) setType(clinical.type);
        setShowSuggestions(false);
        notify.success('Drug Details Auto-Filled', `Auto-filled details for "${name.trim()}"`);
      }
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, selectedIdx, handleSelectSuggestion, name, genericName]);

  // Grouped suggestions for the combobox
  const groupedSuggestions = useMemo(() => {
    const rx = [];
    const otc = [];
    const herbal = [];

    suggestions.forEach(sug => {
      const isHerb = sug.source === 'herbal' || sug.category?.toLowerCase().includes('ayurvedic') || sug.category?.toLowerCase().includes('herbal');
      const isOtc = sug.category?.toLowerCase().includes('otc') || sug.category?.toLowerCase().includes('analgesic') || sug.category?.toLowerCase().includes('antacid');
      if (isHerb) herbal.push(sug);
      else if (isOtc) otc.push(sug);
      else rx.push(sug);
    });

    return [
      { category: 'Prescription Drugs (Rx)', items: rx },
      { category: 'Over-The-Counter (OTC)', items: otc },
      { category: 'Herbal & Ayurvedic', items: herbal },
    ].filter(g => g.items.length > 0);
  }, [suggestions]);

  // Pill ID mutation
  const searchPillMutation = useMutation({
    mutationFn: async ({ file, imprintCode }) => {
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await axios.post('/medicine/identify-pill', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
      } else {
        const { data } = await axios.post('/medicine/identify-pill', { imprintCode });
        return data;
      }
    },
    onMutate: () => {
      setPillState('searching');
      setPillError(null);
    },
    onSuccess: (data) => {
      setPillState('results');
      let matches = data?.possibleMatches || [];

      // If user selected shape or color swatches, score and filter
      if (selectedPillShape || selectedPillColor) {
        matches = matches.map(m => {
          let score = 90;
          if (selectedPillShape && m.shape?.toLowerCase().includes(selectedPillShape)) score += 5;
          if (selectedPillColor && m.color?.toLowerCase().includes(selectedPillColor)) score += 5;
          return { ...m, matchScore: score };
        });
      } else {
        matches = matches.map((m, idx) => ({ ...m, matchScore: Math.max(95 - idx * 4, 75) }));
      }

      setPillMatches(matches);
      if (matches.length === 0) {
        notify.info('No Exact Imprint Match', 'Try re-verifying the code or searching from the formulary tab.');
      } else {
        notify.success('Matches Found', `Found ${matches.length} candidate medication(s).`);
      }
    },
    onError: (err) => {
      setPillState('error');
      setPillError(err?.response?.data?.error || 'Pill lookup failed.');
      notify.error('Pill Lookup Failed', err?.response?.data?.error || 'Could not identify pill.');
    },
  });

  const handlePillManualSearch = (e) => {
    e?.preventDefault();
    if (!pillImprintCode.trim()) return;
    searchPillMutation.mutate({ imprintCode: pillImprintCode.trim() });
  };

  const handleSelectPillMatch = (match) => {
    setName(match.drugName);
    addRecentSearch(match.drugName);

    const clinical = resolveClinicalDetails(match.drugName, match.genericName, match.category, match);

    if (clinical.genericName) setGenericName(clinical.genericName);
    if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
    if (clinical.dosage) setDosage(clinical.dosage);
    if (clinical.form) setForm(clinical.form);
    if (clinical.type) setType(clinical.type);
    if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
    if (clinical.frequency) setFrequency(clinical.frequency);
    if (clinical.timings?.length > 0) setTimings(clinical.timings);

    if (clinical.purpose) setPurpose(clinical.purpose);
    if (clinical.condition) setSelectedCondition(clinical.condition);

    setIsScanFilled(true);
    setPillState('idle');
    notify.success('Pill Details Loaded', `Pre-filled "${match.drugName}". Review all fields before saving.`);
  };

  // Live interaction check via shared socket
  const handleInteractionResult = useCallback((data) => {
    setCheckResult(data);
    setCheckState('done');
  }, []);

  useSocketEvent('interaction-checked', handleInteractionResult);
  useSocketEvent('interaction-check-result', handleInteractionResult);

  // Scan mutation with 3-step animated progress simulation
  const scanMutation = useMutation({
    mutationFn: scanPrescription,
    onMutate: () => {
      setScanState('scanning');
      setScanError(null);
      setScanResult(null);
      setScanProgressStep(1);

      // Advance through animated steps
      setTimeout(() => setScanProgressStep(2), 900);
      setTimeout(() => setScanProgressStep(3), 2200);
    },
    onSuccess: (data) => {
      setScanResult(data);
      setScanState('confirm');

      const extractedName = data.drug_name || data.candidate || data.generic_name;
      if (extractedName) {
        setName(extractedName);
        addRecentSearch(extractedName);

        const clinical = resolveClinicalDetails(extractedName, data.generic_name || data.genericName, data.category, data);

        if (clinical.genericName) setGenericName(clinical.genericName);
        if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
        if (clinical.dosage) setDosage(clinical.dosage);
        if (clinical.form) setForm(clinical.form);
        if (clinical.type) setType(clinical.type);
        if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
        if (clinical.frequency) setFrequency(clinical.frequency);
        if (clinical.timings?.length > 0) setTimings(clinical.timings);

        if (clinical.purpose) {
          setPurpose(clinical.purpose);
          data.purpose = clinical.purpose;
          data.indication = clinical.purpose;
        }
        if (clinical.condition) {
          setSelectedCondition(clinical.condition);
        }

        if (data.manufacturer) setManufacturer(data.manufacturer);
        if (data.batchNo) setBatchNo(data.batchNo);
        if (data.expiryDate) setExpiryDate(data.expiryDate);
        if (data.safetyTip) setSafetyWarning(data.safetyTip);

        const prescriberVal = data.prescriber || data.prescriberName;
        if (prescriberVal) setPrescriber(prescriberVal);

        setIsScanFilled(true);
        setSelectedDrugInfo({
          name: extractedName,
          generic: clinical.genericName || extractedName,
          rxcui: data.rxcui || data.standardizedCode,
          dosage: clinical.dosage,
          category: data.category || (clinical.type === 'HERBAL' ? 'Ayurvedic / Herbal' : 'Prescription Drug'),
          safetyTip: data.safetyTip || 'Verify dosage and administration instructions with your physician.',
          dosageOptions: data.dosageOptions || [],
          source: data.source || (data.rxcui ? 'rxnorm' : 'gemini'),
        });

        notify.success('Prescription Scanned & Auto-Filled', `Auto-filled details for "${extractedName}".`);
      } else {
        notify.info('Text Extracted', 'Please verify or enter the medicine name below.');
      }
    },
    onError: (err) => {
      let msg = err.response?.data?.error;
      if (!msg) {
        if (err.response?.status === 502 || err.code === 'ECONNREFUSED') {
          msg = 'Connection to the OCR engine was momentarily interrupted. Please click scan again.';
        } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          msg = 'Scan timed out — please try again with a clearer photo or enter details manually.';
        } else {
          msg = err.message || 'OCR scan failed. Please enter the medicine name manually.';
        }
      }
      setScanError(msg);
      setScanState('error');
      notify.warning('OCR Scan Notice', msg);
    },
  });

  // Add Medicine mutation
  const addMutation = useMutation({
    mutationFn: addMedicine,
    onSuccess: (data) => {
      setSubmitError(null);
      setSubmitSuccess(data);
      const medName = data.medicine?.name ?? name;
      setSavedMedicineName(medName);
      notify.success('Medicine Added Successfully', `"${medName}" has been saved to your medication list.`);

      if (data.checkingInteractions) {
        setCheckState('checking');
        setCheckResult(null);

        setTimeout(() => {
          setCheckState((prev) => {
            if (prev === 'checking') {
              setCheckResult({
                summary: 'check-error',
                message: 'Interaction check timed out. Please check your risk summary on the dashboard.',
              });
              notify.info('Analysis Pending', 'Interaction check taking longer than usual.');
              return 'done';
            }
            return prev;
          });
        }, 20_000);
      }
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        const existing = err.response.data?.existingMedicine;
        setDuplicateConflict({
          name: existing?.name || name,
          existingDosage: existing?.dosage || 'Current dose',
          newDosage: dosage || 'New dose',
          id: existing?.id,
          alertText: `"${existing?.name || name}" is already in your active medication regimen.`,
        });
        setIsDuplicateDrawerOpen(true);
        setSubmitError(`"${existing?.name || name}" is already in your active medication list.`);
        notify.warning('Duplicate Dose Detected', `"${existing?.name || name}" is already in your active list.`);
        return;
      }
      const msg = err.response?.data?.error || err.message || 'Failed to add medicine.';
      setSubmitError(msg);
      notify.error('Could Not Add Medicine', msg);
    },
  });

  const handleConfirmUpdateDosage = async () => {
    try {
      setSubmitError(null);
      const resp = await axios.post('/medicine', {
        name,
        type,
        dosage,
        forceUpdate: true,
      });
      setDuplicateConflict(null);
      setIsDuplicateDrawerOpen(false);
      setSubmitSuccess(resp.data);
      const medName = resp.data.medicine?.name ?? name;
      setSavedMedicineName(medName);
      notify.success('Dosage Updated', `Updated dosage for "${medName}".`);
      if (resp.data.checkingInteractions) {
        setCheckState('checking');
        setCheckResult(null);
      }
    } catch (e) {
      notify.error('Update Failed', e.response?.data?.error || e.message);
    }
  };

  const batchAddMutation = useMutation({
    mutationFn: batchAddMedicines,
    onSuccess: (data) => {
      notify.success('Prescription Batch Added', `Successfully added ${data.addedCount} medicines to your regimen.`);
      navigate('/home');
    },
    onError: (err) => {
      notify.error('Batch Add Failed', err.response?.data?.error || err.message);
    },
  });

  // Handlers for file selection & drop
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isGuest) {
      requireAuth('scan and extract prescription labels');
      e.target.value = '';
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('idle'); setScanError(null);
    scanMutation.mutate(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (isGuest) {
      requireAuth('scan and extract prescription labels');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('idle');
    setScanError(null);
    scanMutation.mutate(file);
  };

  const handleFrontSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleBackSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleTwoSidedAnalyze = () => {
    if (!frontFile && !backFile) {
      notify.warn('No Photos Selected', 'Please upload or snap at least one side of the packaging.');
      return;
    }
    setScanState('idle');
    setScanError(null);
    scanMutation.mutate({
      image: frontFile || backFile,
      backImage: backFile && frontFile ? backFile : undefined,
    });
  };

  const handleLiveCameraCapture = (file) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('idle');
    setScanError(null);
    scanMutation.mutate(file);
  };

  const handleBarcodeSelect = (drugData) => {
    const medName = drugData.drug_name;
    setName(medName);
    addRecentSearch(medName);

    const clinical = resolveClinicalDetails(medName, drugData.generic_name, drugData.category, drugData);

    if (clinical.genericName) setGenericName(clinical.genericName);
    if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
    if (clinical.dosage) setDosage(clinical.dosage);
    if (clinical.form) setForm(clinical.form);
    if (clinical.type) setType(clinical.type);
    if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
    if (clinical.frequency) setFrequency(clinical.frequency);
    if (clinical.timings?.length > 0) setTimings(clinical.timings);
    if (clinical.purpose) setPurpose(clinical.purpose);
    if (clinical.condition) setSelectedCondition(clinical.condition);
    if (drugData.safetyTip) setSafetyWarning(drugData.safetyTip);

    setIsScanFilled(true);
    setSelectedDrugInfo({
      name: medName,
      generic: clinical.genericName || medName,
      rxcui: drugData.rxcui,
      dosage: clinical.dosage,
      category: drugData.category || (clinical.type === 'HERBAL' ? 'Ayurvedic / Herbal' : 'Prescription Drug'),
      safetyTip: drugData.safetyTip,
      source: drugData.source || 'local_registry',
    });
    notify.success('Barcode Recognized', `Auto-filled details for "${medName}".`);
  };

  const handleDismissScan = () => {
    setScanState('idle');
    setScanResult(null);
    setScanError(null);
    setIsScanFilled(false);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    if (frontPreview) { URL.revokeObjectURL(frontPreview); setFrontPreview(null); setFrontFile(null); }
    if (backPreview) { URL.revokeObjectURL(backPreview); setBackPreview(null); setBackFile(null); }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setSubmitError(null);
    if (!name.trim()) {
      setSubmitError('Please enter or select a medicine name.');
      notify.warn('Medicine Name Required', 'Please enter or select a medicine name.');
      return;
    }

    const scheduleParts = [];
    if (dosage.trim()) scheduleParts.push(dosage.trim());
    if (form) {
      const formLabels = {
        tablet: 'Tablet', capsule: 'Capsule', syrup: 'Syrup / Liquid',
        injection: 'Injection', cream: 'Cream / Gel', drops: 'Drops', inhaler: 'Inhaler',
      };
      scheduleParts.push(formLabels[form] || form);
    }
    if (genericName.trim() && genericName.trim().toLowerCase() !== name.trim().toLowerCase()) {
      scheduleParts.push(`Salts: ${genericName.trim()}`);
    }

    if (frequency) {
      const freqMap = {
        once: 'Once daily', twice: 'Twice daily', thrice: '3x daily',
        four: '4x daily', weekly: 'Weekly', asneeded: 'As needed (PRN)', alternate: 'Alternate days',
      };
      const freqLabel = freqMap[frequency] || frequency;
      if (timings.length > 0) {
        const timingLabels = timings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
        scheduleParts.push(`${freqLabel} (${timingLabels})`);
      } else {
        scheduleParts.push(freqLabel);
      }
    }

    if (notes) {
      const noteMap = {
        before_food: 'Before food', after_food: 'After food', with_food: 'With food',
        empty_stomach: 'Empty stomach', with_water: 'With water', avoid_dairy: 'Avoid dairy',
      };
      scheduleParts.push(noteMap[notes] || notes);
    }

    if (prescriber.trim()) scheduleParts.push(`Rx: ${prescriber.trim()}`);
    if (manufacturer.trim()) scheduleParts.push(`Mfr: ${manufacturer.trim()}`);
    if (expiryDate.trim()) scheduleParts.push(`Exp: ${expiryDate.trim()}`);

    const formattedDosage = scheduleParts.join(' • ');

    if (isGuest) {
      const isTurmeric = name.toLowerCase().includes('turm') || name.toLowerCase().includes('curcum');
      const isNsaid = name.toLowerCase().includes('aspirin') || name.toLowerCase().includes('ecosprin') || name.toLowerCase().includes('ibu') || name.toLowerCase().includes('combiflam') || name.toLowerCase().includes('naxdom');

      const mockFlags = [];
      if (isTurmeric) {
        mockFlags.push({
          flagId: 'demo-flag-1',
          drugA: 'Warfarin',
          drugB: name.trim(),
          severity: 'Major',
          plainExplanation: 'Curcumin in Turmeric enhances blood thinning effects when taken alongside Warfarin, sharply increasing bleeding danger.',
        });
      } else if (isNsaid) {
        mockFlags.push({
          flagId: 'demo-flag-2',
          drugA: 'Warfarin',
          drugB: name.trim(),
          severity: 'Major',
          plainExplanation: 'Taking an NSAID / Antiplatelet with Warfarin compounds your anti-hemostatic load, significantly elevating gastrointestinal bleeding risk.',
        });
      }

      setSubmitSuccess({
        medicine: {
          id: 'guest-med-eval',
          name: name.trim(),
          type,
          dosage: formattedDosage || 'Standard Dose',
          purpose: purpose.trim() || undefined,
          dateAdded: new Date().toISOString(),
        },
        rxNorm: {
          found: true,
          rxcui: selectedDrugInfo?.rxcui || '161',
          note: 'Evaluated locally via PolySafe Offline Formulary Resolver (Guest Demo)',
        },
        flagsFound: mockFlags,
        cumulativeBurden: {
          totalScore: mockFlags.length > 0 ? 3 : 1,
          level: mockFlags.length > 0 ? 'Moderate' : 'Low',
          explanation: mockFlags.length > 0
            ? 'Active pharmacological conflict detected against your demo medication regimen.'
            : 'No high-risk contraindications detected against your baseline regimen.',
        },
      });
      setSavedMedicineName(name.trim());
      notify.success('Prescription Evaluated', `Evaluated "${name.trim()}" in Guest Mode.`);
      return;
    }

    addMutation.mutate({
      name: name.trim(),
      type,
      dosage: formattedDosage || undefined,
      purpose: purpose.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleAddAnother = () => {
    setSubmitSuccess(null);
    setName('');
    setGenericName('');
    setCompositionSalts([]);
    setDosage('');
    setManufacturer('');
    setBatchNo('');
    setExpiryDate('');
    setSafetyWarning('');
    setPurpose('');
    setSelectedCondition(null);
    setScanState('idle');
    setCheckState('idle');
    setCheckResult(null);
    setSavedMedicineName('');
    setIsScanFilled(false);
  };

  // ─── Post-submit: Success State with Flying Medicine Card Animation ────────
  if (submitSuccess) {
    const med = submitSuccess.medicine;
    const rxn = submitSuccess.rxNorm;

    return (
      <div className="min-h-[85vh] bg-[var(--canvas)] flex items-center justify-center px-4 py-12">
        <motion.div
          layoutId="newMedicineCard"
          initial={isReduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRINGS.snappy}
          className="max-w-xl w-full space-y-6"
        >
          {/* Fly-in Regimen Card */}
          <div className="ps-card p-8 space-y-6 text-center border-2 border-[var(--brand-600)]/30 shadow-[var(--shadow-lg)] bg-[var(--paper)]">
            <motion.div
              initial={isReduced ? {} : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </motion.div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--brand-600)] bg-[var(--brand-600)]/10 px-3 py-1 rounded-full">
                Added to Active Regimen
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-[var(--font-heading)] mt-2">
                {med.name}
              </h2>
              <p className="text-sm text-[var(--ink-3)]">{med.dosage || 'Standard Schedule'}</p>
            </div>

            {/* Regimen Preview List Slot */}
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)]">
                <span className="flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-[var(--brand-600)]" />
                  <span>Clinical Regimen Slot:</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink-2)]">
                  {type}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--ink-2)] pt-1">
                <span>{genericName || 'Active Formula'}</span>
                <DrugHarmBadge category={selectedDrugInfo?.category || ''} name={med.name} size="sm" />
              </div>
            </div>

            {/* RxNorm status */}
            <div className={`flex items-start space-x-3 p-3.5 rounded-2xl border text-xs text-left ${
              rxn?.found
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--ink)]'
                : 'bg-[var(--surface-2)] border-[var(--caution-fg)]/30 text-[var(--ink)]'
            }`}>
              {rxn?.found ? (
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--caution-fg)]" />
              )}
              <div>
                <p className="font-bold">{rxn?.found ? `RxNorm Standardized — CUI #${rxn.rxcui}` : 'RxNorm Standardization Local'}</p>
                <p className="mt-0.5 opacity-80">{rxn?.note || 'Standard active constituent linked.'}</p>
              </div>
            </div>
          </div>

          {/* Real-time Interaction Check Panel */}
          <div className="ps-card p-6 space-y-4 border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border ${
                checkState === 'checking' ? 'bg-[var(--brand-600)]/10 border-[var(--brand-600)]/20 text-[var(--brand-600)]' :
                checkResult?.summary === 'flags-found' ? 'bg-rose-500/10 border-rose-500/25 text-rose-600' :
                'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
              }`}>
                {checkState === 'checking' ? <Activity className="w-4 h-4 animate-pulse" /> :
                checkResult?.summary === 'flags-found' ? <AlertOctagon className="w-4 h-4" /> :
                <ShieldCheck className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {checkState === 'checking' ? 'Screening Against Current Regimen…' : 'DDInter Interaction Results'}
                </h3>
                {checkState === 'checking' && (
                  <p className="text-[11px] text-[var(--ink-3)]">Checking against active medicines with DDInter engine…</p>
                )}
              </div>
            </div>

            {checkState === 'checking' && (
              <div className="flex items-center space-x-3 py-4 px-2">
                <PulsingDots />
                <p className="text-sm text-[var(--brand-600)] font-semibold">
                  Evaluating drug-drug interaction pairs…
                </p>
              </div>
            )}

            {checkState === 'done' && checkResult && (
              <InteractionResult result={checkResult} medicineName={savedMedicineName} />
            )}
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => navigate('/home', { state: { newMedicineId: med?.id } })}
              className="ps-btn ps-btn-primary py-3.5 flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <span>View Safety Status on Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <button onClick={handleAddAnother} className="ps-btn ps-btn-secondary flex-1 py-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <Plus className="w-4 h-4" /><span>Add Another</span>
              </button>
              <button onClick={() => navigate('/home')} className="ps-btn ps-btn-secondary flex-1 py-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <ArrowLeft className="w-4 h-4" /><span>Back to List</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Form View ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={scanMode === 'two_sided' ? handleFrontSelect : handleFileSelect}
      />
      <input
        ref={backFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleBackSelect}
      />
      <input
        ref={pillFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) searchPillMutation.mutate({ file });
        }}
      />

      <div className="space-y-6">
        {/* ── Page Header Card (Polished Spacing & Responsive Padding) ── */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          {/* Top Row: Back Navigation + Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="ps-btn ps-btn-secondary py-1.5 px-3 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer rounded-xl hover:bg-[var(--surface-2)] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-600)] animate-pulse" />
                <span>Multimodal Intake Hub</span>
                <span className="text-[var(--brand-600)]/60">·</span>
                <span className="font-mono text-[11px]">RxNorm & Indian Formulary</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--brand-600)]/8 border border-[var(--brand-600)]/20 text-[var(--brand-600)] shadow-2xs">
                <Leaf className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" />
                <span>Includes herb-drug checks for Turmeric & Ashwagandha</span>
              </div>
            </div>
          </div>

          {/* Heading Row */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
              Add <span className="font-serif italic font-normal text-[var(--coral)]">Medicine</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-2xl leading-relaxed">
              Scan prescriptions, search Indian & global formularies, or identify loose tablets by imprint.
            </p>
          </div>

          {/* Segmented Tab Navigator with Clean Sizing & Padding */}
          <div className="pt-1 w-full max-w-xl">
            <SegmentedControl
              name="add-medicine-tab"
              size="md"
              fullWidth
              value={activeTab}
              onChange={(val) => setActiveTab(val)}
              options={[
                {
                  value: 'scan',
                  label: 'Scan Slip / Box',
                  icon: <ScanLine className="w-4 h-4" />,
                },
                {
                  value: 'search',
                  label: 'Search Formulary',
                  icon: <Search className="w-4 h-4" />,
                },
                {
                  value: 'pill_id',
                  label: 'Pill ID',
                  icon: <Pill className="w-4 h-4" />,
                },
              ]}
            />
          </div>
        </div>

        {/* Global form error banner */}
        {submitError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start space-x-3 text-rose-800 dark:text-rose-200 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{submitError}</p>
          </div>
        )}

        {/* ── 2-Column Responsive Layout: Intake + Live Preview Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════════════════════════════════════════════════════════════════════
              LEFT COLUMN: Active Intake Tab + Packaging & Schedule Form
              ════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* ── TAB 1: SCAN ── */}
            {activeTab === 'scan' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Single vs Two-Sided Scan Toggle */}
                <div className="flex items-center gap-1.5 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setScanMode('single')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scanMode === 'single'
                        ? 'bg-[var(--brand-600)] text-white shadow-xs'
                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Single Photo / Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('two_sided')}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scanMode === 'two_sided'
                        ? 'bg-[var(--brand-600)] text-white shadow-xs'
                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Two-Sided (Front & Back)</span>
                  </button>
                </div>

                {/* Idle Dropzone */}
                {scanState === 'idle' && (
                  <div className="space-y-4">
                    {scanMode === 'single' ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-200 bg-[var(--paper)] text-center cursor-pointer ${
                          isDragOver
                            ? 'border-[var(--coral)] ring-4 ring-[var(--coral)]/15 shadow-[var(--shadow-md)]'
                            : 'border-[var(--border)] hover:border-[var(--brand-600)]/60 shadow-[var(--shadow-xs)]'
                        }`}
                      >
                        {/* Viewfinder Corners with Motion Animation */}
                        <motion.span
                          animate={{ scale: isDragOver ? 1.25 : 1, x: isDragOver ? -3 : 0, y: isDragOver ? -3 : 0 }}
                          transition={SPRINGS.snappy}
                          className={`absolute top-4 left-4 w-7 h-7 border-t-3 border-l-3 rounded-tl-lg pointer-events-none transition-colors ${
                            isDragOver ? 'border-[var(--coral)]' : 'border-[var(--brand-600)]'
                          }`}
                        />
                        <motion.span
                          animate={{ scale: isDragOver ? 1.25 : 1, x: isDragOver ? 3 : 0, y: isDragOver ? -3 : 0 }}
                          transition={SPRINGS.snappy}
                          className={`absolute top-4 right-4 w-7 h-7 border-t-3 border-r-3 rounded-tr-lg pointer-events-none transition-colors ${
                            isDragOver ? 'border-[var(--coral)]' : 'border-[var(--brand-600)]'
                          }`}
                        />
                        <motion.span
                          animate={{ scale: isDragOver ? 1.25 : 1, x: isDragOver ? -3 : 0, y: isDragOver ? 3 : 0 }}
                          transition={SPRINGS.snappy}
                          className={`absolute bottom-4 left-4 w-7 h-7 border-b-3 border-l-3 rounded-bl-lg pointer-events-none transition-colors ${
                            isDragOver ? 'border-[var(--coral)]' : 'border-[var(--brand-600)]'
                          }`}
                        />
                        <motion.span
                          animate={{ scale: isDragOver ? 1.25 : 1, x: isDragOver ? 3 : 0, y: isDragOver ? 3 : 0 }}
                          transition={SPRINGS.snappy}
                          className={`absolute bottom-4 right-4 w-7 h-7 border-b-3 border-r-3 rounded-br-lg pointer-events-none transition-colors ${
                            isDragOver ? 'border-[var(--coral)]' : 'border-[var(--brand-600)]'
                          }`}
                        />

                        {/* Dropzone Center Content */}
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-600)]/10 text-[var(--brand-600)] flex items-center justify-center mx-auto shadow-2xs">
                            <UploadCloud className="w-8 h-8" />
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
                              Drop prescription, blister strip, or carton here
                            </h3>
                            <p className="text-xs text-[var(--ink-3)]">
                              Supports JPG, PNG, WEBP · Multimodal Gemini Vision extracts chemical salts & dosage
                            </p>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isGuest) { requireAuth('use the camera scanner'); return; }
                                setIsLiveCameraOpen(true);
                              }}
                              className="ps-btn ps-btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Live Viewfinder</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="ps-btn ps-btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <FileImage className="w-4 h-4" />
                              <span>Browse Photos</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isGuest) { requireAuth('scan barcodes'); return; }
                                setIsBarcodeModalOpen(true);
                              }}
                              className="ps-btn ps-btn-secondary py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Box Barcode</span>
                            </button>
                          </div>

                          {/* Clinical Sample Link */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  setScanState('scanning');
                                  setScanError(null);
                                  setPreviewUrl('/sample-prescriptions/naxdom-sample.jpg');
                                  const res = await fetch('/sample-prescriptions/naxdom-sample.jpg');
                                  const blob = await res.blob();
                                  const file = new File([blob], 'naxdom-sample.jpg', { type: 'image/jpeg' });
                                  scanMutation.mutate(file);
                                } catch {
                                  setScanError('Failed to load sample image.');
                                  setScanState('error');
                                }
                              }}
                              className="text-xs font-semibold text-[var(--brand-600)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Try clinical sample (Naxdom 500 Migraine Formulation)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Two-Sided Scan */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-5 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--paper)] hover:border-[var(--brand-600)] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[160px]"
                          >
                            {frontPreview ? (
                              <div className="relative w-full text-center">
                                <img src={frontPreview} alt="Front" className="max-h-28 mx-auto object-contain rounded-lg" />
                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-600)]/15 text-[var(--brand-600)]">
                                  Front Ready
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="p-3 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                                  <Camera className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-bold text-[var(--ink)]">1. Front Side (Brand Name)</p>
                                  <p className="text-[10px] text-[var(--ink-3)]">Tap to snap or select front</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div
                            onClick={() => backFileInputRef.current?.click()}
                            className="p-5 rounded-3xl border-2 border-dashed border-[var(--border)] bg-[var(--paper)] hover:border-[var(--brand-600)] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[160px]"
                          >
                            {backPreview ? (
                              <div className="relative w-full text-center">
                                <img src={backPreview} alt="Back" className="max-h-28 mx-auto object-contain rounded-lg" />
                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-600)]/15 text-[var(--brand-600)]">
                                  Back Ready
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="p-3 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                                  <FlaskConical className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-bold text-[var(--ink)]">2. Back Side (Salts Table)</p>
                                  <p className="text-[10px] text-[var(--ink-3)]">Tap to snap or select back</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {(frontFile || backFile) && (
                          <button
                            type="button"
                            onClick={handleTwoSidedAnalyze}
                            className="w-full py-3.5 ps-btn ps-btn-primary flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Analyze Front & Back Sides</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3-Step Animated Progress State with Laser Scan Line */}
                {scanState === 'scanning' && (
                  <div className="p-6 sm:p-8 rounded-3xl border border-[var(--brand-600)]/30 bg-[var(--paper)] space-y-6 shadow-[var(--shadow-sm)]">
                    {/* 3-Step Progress Stepper */}
                    <div className="w-full max-w-md mx-auto">
                      <div className="flex items-center justify-between text-xs font-bold font-mono">
                        <div className={`flex items-center gap-1.5 ${scanProgressStep >= 1 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${scanProgressStep >= 1 ? 'bg-[var(--brand-600)] text-white' : 'bg-[var(--border)]'}`}>1</span>
                          <span>Uploading</span>
                        </div>
                        <div className={`h-0.5 flex-1 mx-2 transition-colors ${scanProgressStep >= 2 ? 'bg-[var(--brand-600)]' : 'bg-[var(--border)]'}`} />
                        <div className={`flex items-center gap-1.5 ${scanProgressStep >= 2 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${scanProgressStep >= 2 ? 'bg-[var(--brand-600)] text-white' : 'bg-[var(--border)]'}`}>2</span>
                          <span>Reading</span>
                        </div>
                        <div className={`h-0.5 flex-1 mx-2 transition-colors ${scanProgressStep >= 3 ? 'bg-[var(--brand-600)]' : 'bg-[var(--border)]'}`} />
                        <div className={`flex items-center gap-1.5 ${scanProgressStep >= 3 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${scanProgressStep >= 3 ? 'bg-[var(--brand-600)] text-white' : 'bg-[var(--border)]'}`}>3</span>
                          <span>Verifying</span>
                        </div>
                      </div>
                    </div>

                    {/* Image Preview with Moving Laser Scan Line */}
                    <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl overflow-hidden border border-[var(--border)] bg-black/5 dark:bg-black/30 flex items-center justify-center shadow-inner">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Scanning..." className="w-full h-full object-contain opacity-70" />
                      ) : (
                        <div className="p-4 text-center text-xs text-[var(--ink-3)] flex flex-col items-center gap-2">
                          <FileImage className="w-8 h-8 text-[var(--brand-600)] animate-pulse" />
                          <span>Prescription Document</span>
                        </div>
                      )}

                      {/* Moving laser scan line */}
                      {!isReduced && (
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--coral)] to-transparent shadow-[0_0_15px_var(--coral)] z-10"
                          animate={{ top: ['0%', '94%', '0%'] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        />
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-[var(--brand-600)]">
                        {scanProgressStep === 1 && 'Uploading high-resolution image...'}
                        {scanProgressStep === 2 && 'Multimodal AI extracting chemical salts & dosage...'}
                        {scanProgressStep === 3 && 'Cross-checking with RxNorm & Indian Formulary...'}
                      </p>
                      <p className="text-[11px] text-[var(--ink-3)]">
                        Decomposing active constituents and detecting potential drug interactions
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {scanState === 'error' && (
                  <div className="p-5 rounded-3xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                    <div className="flex items-start space-x-3 text-rose-800 dark:text-rose-200">
                      <TriangleAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Scan unsuccessful</p>
                        <p className="text-xs opacity-90 mt-0.5">{scanError}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="ps-btn ps-btn-secondary flex-1 py-2 text-xs cursor-pointer">
                        <Camera className="w-4 h-4" /><span>Try Again</span>
                      </button>
                      <button type="button" onClick={handleDismissScan} className="ps-btn ps-btn-secondary flex-1 py-2 text-xs cursor-pointer">
                        Type Manually
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed Review Card */}
                {scanState === 'confirm' && scanResult && (
                  <ScanResultsReviewCard
                    scanResult={scanResult}
                    onDismiss={handleDismissScan}
                    onBatchAdd={(meds) => batchAddMutation.mutate(meds)}
                    onFieldFocus={() => nameInputRef.current?.focus()}
                  />
                )}
              </div>
            )}

            {/* ── TAB 2: SEARCH FORMULARY (Combobox, Brand-to-Generic, Harm Badges, Recent Searches) ── */}
            {activeTab === 'search' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="ps-card p-6 space-y-4 border border-[var(--border)] bg-[var(--paper)] shadow-[var(--shadow-xs)]">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Search Formulary & Indian Brands
                    </h3>
                    <p className="text-xs text-[var(--ink-3)]">
                      Matches 60+ common medications, Indian trade names, and herbal preparations instantly.
                    </p>
                  </div>

                  {/* Brand-to-Generic Quick Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      Popular Brand-to-Generic Mappings:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BRAND_TO_GENERIC_PRESETS.map((preset) => (
                        <button
                          key={preset.brand}
                          type="button"
                          onClick={() => {
                            setName(preset.brand);
                            addRecentSearch(preset.brand);
                            const clinical = resolveClinicalDetails(preset.brand, preset.generic, '', preset);
                            if (clinical.genericName) setGenericName(clinical.genericName);
                            if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
                            if (clinical.dosage) setDosage(clinical.dosage);
                            if (clinical.purpose) setPurpose(clinical.purpose);
                            if (clinical.condition) setSelectedCondition(clinical.condition);
                            if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
                            if (clinical.frequency) setFrequency(clinical.frequency);
                            if (clinical.timings?.length > 0) setTimings(clinical.timings);
                            if (clinical.form) setForm(clinical.form);
                            if (clinical.type) setType(clinical.type);
                            notify.success('Preset Loaded', `Selected ${preset.brand} (${clinical.genericName || preset.generic})`);
                          }}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--brand-600)] border border-[var(--border)] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span className="font-bold text-[var(--ink)]">{preset.brand}</span>
                          <span className="text-[10px] text-[var(--ink-3)]">→</span>
                          <span className="text-[11px] text-[var(--brand-600)]">{preset.generic}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[var(--ink-3)]" />
                        Recent:
                      </span>
                      {recentSearches.slice(0, 5).map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setName(term);
                            handleNameChange(term);
                            const clinical = resolveClinicalDetails(term);
                            if (clinical.genericName) setGenericName(clinical.genericName);
                            if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
                            if (clinical.dosage) setDosage(clinical.dosage);
                            if (clinical.purpose) setPurpose(clinical.purpose);
                            if (clinical.condition) setSelectedCondition(clinical.condition);
                            if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
                            if (clinical.frequency) setFrequency(clinical.frequency);
                            if (clinical.timings?.length > 0) setTimings(clinical.timings);
                            if (clinical.form) setForm(clinical.form);
                            if (clinical.type) setType(clinical.type);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--brand-600)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: PILL ID (Shape & Color Swatches, Imprint Code, Match Cards) ── */}
            {activeTab === 'pill_id' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="ps-card p-6 space-y-5 border border-[var(--border)] bg-[var(--paper)] shadow-[var(--shadow-xs)]">
                  {/* Safety Caveat */}
                  <div className="flex items-start space-x-3 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
                    <TriangleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Pharmacist Safety Notice:</strong> Physical imprint lookup is for reference guidance. Never ingest an unknown medication without confirmation from a licensed pharmacist or doctor.
                    </p>
                  </div>

                  {/* Shape Selector Swatches */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        1. Pill Shape
                      </label>
                      <span className="text-[10px] text-[var(--ink-3)]">Tap matching shape</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PILL_SHAPES.map((shape) => {
                        const isSelected = selectedPillShape === shape.id;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setSelectedPillShape(prev => prev === shape.id ? null : shape.id)}
                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer min-h-[70px] ${
                              isSelected
                                ? 'bg-[var(--brand-600)]/10 border-[var(--brand-600)] text-[var(--brand-600)] ring-2 ring-[var(--brand-600)]/20 shadow-xs'
                                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--brand-600)]/50'
                            }`}
                          >
                            <span className={isSelected ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}>
                              {shape.svg}
                            </span>
                            <span className="text-[11px] font-semibold">{shape.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selector Swatches */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        2. Pill Color
                      </label>
                      <span className="text-[10px] text-[var(--ink-3)]">Tap matching hue</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PILL_COLORS.map((col) => {
                        const isSelected = selectedPillColor === col.id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setSelectedPillColor(prev => prev === col.id ? null : col.id)}
                            className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                              isSelected
                                ? 'bg-[var(--surface-2)] border-[var(--brand-600)] ring-2 ring-[var(--brand-600)]/25 shadow-xs'
                                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--brand-600)]/50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full shadow-2xs ${col.colorClass}`} />
                            <span className="text-[10px] font-semibold text-[var(--ink-2)] truncate max-w-full">
                              {col.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Imprint Input & Search */}
                  <form onSubmit={handlePillManualSearch} className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                      3. Stamped Imprint Code
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <PolySafeInput
                          type="text"
                          value={pillImprintCode}
                          onChange={(e) => setPillImprintCode(e.target.value)}
                          placeholder="e.g. L484, IP 109, M367, 54 543"
                          leftIcon={<Search className="w-4 h-4" />}
                          className="text-sm font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={searchPillMutation.isPending || !pillImprintCode.trim()}
                        className="ps-btn ps-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {searchPillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>Identify</span>
                      </button>
                    </div>
                  </form>

                  {/* Quick Try Sample Imprint */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-[var(--ink-3)]">Common verification:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPillImprintCode('L484');
                        setSelectedPillShape('oval');
                        setSelectedPillColor('white');
                        searchPillMutation.mutate({ imprintCode: 'L484' });
                      }}
                      className="text-xs font-bold text-[var(--brand-600)] hover:underline cursor-pointer"
                    >
                      Sample Imprint "L484" (Acetaminophen 500mg)
                    </button>
                  </div>

                  {/* Pill Results Grid */}
                  {pillState === 'results' && (
                    <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[var(--ink)]">
                          Reference Matches ({pillMatches.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPillState('idle');
                            setPillMatches([]);
                          }}
                          className="text-xs text-[var(--ink-3)] hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>

                      {pillMatches.length === 0 ? (
                        <div className="p-4 bg-[var(--surface-2)] rounded-2xl text-center space-y-1">
                          <p className="text-xs font-bold text-[var(--ink)]">No reference matches found</p>
                          <p className="text-[11px] text-[var(--ink-3)]">
                            Try searching by drug name or consulting a pharmacist.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {pillMatches.map((match) => (
                            <div
                              key={match.id || match.imprintCode}
                              className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand-600)] transition-all space-y-2.5 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                                    Imprint: {match.imprintCode}
                                  </span>
                                  <h4 className="text-sm font-bold text-[var(--ink)] mt-1">
                                    {match.drugName}
                                  </h4>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  {match.matchScore || 92}% Match
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
                                {match.strength && <span>{match.strength}</span>}
                                {match.shape && <span>• {match.shape}</span>}
                                {match.color && <span>• {match.color}</span>}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectPillMatch(match)}
                                className="w-full ps-btn ps-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Select & Fill Form</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              <Card
                title="Medicine & Schedule Details"
                subtitle="Verify active chemical composition, packaging label, and administration schedule"
                icon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
                badge={
                  isScanFilled ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Filled</span>
                    </span>
                  ) : null
                }
                className="space-y-6"
              >
                {/* 1. Identity & Active Chemical Salts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)] text-xs font-black">
                        1
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                        Medicine & Active Chemical Composition
                      </h4>
                    </div>
                  </div>

                  {/* Medicine Name with Combobox Dropdown */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Medicine / Brand Name <span className="text-rose-500">*</span>
                      </label>
                      {name.trim().length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--ink-3)] font-semibold">Harm Tier:</span>
                          <DrugHarmBadge category={selectedDrugInfo?.category || ''} name={name.trim()} size="sm" />
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div className="relative flex items-center w-full">
                        <PolySafeInput
                          ref={nameInputRef}
                          type="text"
                          required
                          autoComplete="off"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onBlur={() => {
                            if (name.trim().length >= 2) {
                              const clinical = resolveClinicalDetails(name.trim());
                              if (clinical.genericName) setGenericName(clinical.genericName);
                              if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
                              if (clinical.dosage) setDosage(clinical.dosage);
                              if (clinical.purpose) setPurpose(clinical.purpose);
                              if (clinical.condition) setSelectedCondition(clinical.condition);
                              if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
                              if (clinical.frequency) setFrequency(clinical.frequency);
                              if (clinical.timings?.length > 0) setTimings(clinical.timings);
                              if (clinical.form) setForm(clinical.form);
                              if (clinical.type) setType(clinical.type);
                            }
                          }}
                          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                          onKeyDown={handleNameKeyDown}
                          placeholder={t('add_medicine.search_placeholder', 'e.g. Dolo 650, Augmentin 625, Warfarin, Turmeric')}
                          leftIcon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
                          rightIcon={searchLoading ? <Loader2 className="w-4 h-4 text-[var(--brand-600)] animate-spin" /> : null}
                          error={Boolean(submitError && !name.trim())}
                          className="!pl-11 pr-28"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                          <VoiceInputButton
                            onResult={(text) => handleNameChange(text)}
                            title={t('add_medicine.voice_search_title', 'Speak medication name')}
                          />
                          {isScanFilled && (
                            <span className="text-[10px] font-mono font-bold text-[var(--brand-600)] bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              <span>Scanned</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grouped Combobox Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-50 left-0 right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden max-h-80 overflow-y-auto"
                        >
                          {groupedSuggestions.map((group) => (
                            <div key={group.category} className="border-b border-[var(--border)]/60 last:border-0">
                              <div className="px-3.5 py-1.5 bg-[var(--surface-2)] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                                {group.category} ({group.items.length})
                              </div>
                              {group.items.map((sug, idx) => {
                                const globalIdx = suggestions.indexOf(sug);
                                const isSelected = globalIdx === selectedIdx;

                                return (
                                  <button
                                    key={`${sug.name}-${idx}`}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelectSuggestion(sug)}
                                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors cursor-pointer ${
                                      isSelected ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/60'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-[var(--ink)] truncate font-[var(--font-heading)]">
                                          {sug.name}
                                        </p>
                                        {sug.category && (
                                          <DrugHarmBadge category={sug.category} name={sug.name} size="sm" />
                                        )}
                                      </div>
                                      {sug.generic !== sug.name && (
                                        <p className="text-[11px] text-[var(--ink-3)] truncate font-mono">
                                          Salts: {sug.generic}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                      {sug.dosage && (
                                        <span className="text-[10px] font-mono font-bold text-[var(--ink-2)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                                          {sug.dosage}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generic / Active Chemical Composition */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Generic / Active Chemical Composition
                      </label>
                      <span className="text-[10px] text-[var(--ink-3)]">Active salts from blister table</span>
                    </div>
                    <PolySafeInput
                      type="text"
                      value={genericName}
                      onChange={(e) => {
                        setGenericName(e.target.value);
                        if (e.target.value.includes('+')) {
                          setCompositionSalts(e.target.value.split('+').map(s => s.trim()).filter(Boolean));
                        }
                      }}
                      placeholder="e.g. Paracetamol + Caffeine"
                      leftIcon={<FlaskConical className="w-4 h-4 text-[var(--brand-600)]" />}
                      className="text-xs font-medium"
                    />

                    {compositionSalts.length > 0 && (
                      <div className="p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] space-y-1.5">
                        <span className="text-[10px] font-bold text-[var(--ink-3)] uppercase tracking-wider block">
                          Decomposed Chemical Salts ({compositionSalts.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {compositionSalts.map((salt, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--surface)] text-[var(--brand-600)] border border-[var(--brand-600)]/20 shadow-2xs"
                            >
                              <FlaskConical className="w-3 h-3 text-[var(--brand-600)]" />
                              <span>{salt}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Regulatory Class 3-Way Toggle */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                      Medicine Regulatory Class <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {MEDICINE_TYPES.map((t) => {
                        const isActive = type === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setType(t.value)}
                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-bold ${
                              isActive
                                ? 'bg-[var(--surface-2)] border-[var(--brand-600)] text-[var(--brand-600)] ring-2 ring-[var(--brand-600)]/20 shadow-xs'
                                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--brand-600)]/50'
                            }`}
                          >
                            <span>{t.toggleIcon}</span>
                            <span>{t.shortLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dosage Form & Strength */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Dosage Form
                      </label>
                      <PolySafeSelect
                        value={form}
                        onChange={(e) => setForm(e.target.value)}
                        leftIcon={<Package className="w-4 h-4 text-[var(--brand-600)]" />}
                        className="text-xs"
                      >
                        {DOSAGE_FORMS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </PolySafeSelect>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Strength / Dosage
                      </label>
                      <PolySafeInput
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. 500mg, 10ml, 1 puff"
                        leftIcon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
                        className="text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Clinical Purpose & Proven Recommendations */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)] text-xs font-black">
                        2
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                        Clinical Indication & Purpose
                      </h4>
                    </div>
                    {purpose && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {isScanFilled ? 'Auto-Filled from Scan' : 'Active Reason Set'}
                      </span>
                    )}
                  </div>

                  {/* Symptom chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(CONDITION_MED_RECOMMENDATIONS).map((condName) => {
                      const isSelected = selectedCondition === condName || (purpose && purpose.toLowerCase().includes(condName.toLowerCase()));
                      const IconComp = CONDITION_ICONS[condName] || Activity;
                      return (
                        <button
                          key={condName}
                          type="button"
                          onClick={() => {
                            if (selectedCondition === condName) {
                              setSelectedCondition(null);
                            } else {
                              setSelectedCondition(condName);
                              const defaultRec = CONDITION_MED_RECOMMENDATIONS[condName]?.[0]?.purpose || condName;
                              setPurpose(defaultRec);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[var(--brand-600)] text-white shadow-xs border-[var(--brand-600)]'
                              : 'bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--brand-600)] border-[var(--border)]'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{condName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Recommended Medicines for Selected Condition */}
                  {selectedCondition && CONDITION_MED_RECOMMENDATIONS[selectedCondition]?.length > 0 && (
                    <div className="p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-2)]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                          <span>Recommended Medicines for {selectedCondition}:</span>
                        </span>
                        <span className="text-[10px] text-[var(--ink-3)] font-normal">Click to auto-fill details</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CONDITION_MED_RECOMMENDATIONS[selectedCondition].map((recMed) => (
                          <button
                            key={recMed.name}
                            type="button"
                            onClick={() => {
                              setName(recMed.name);
                              addRecentSearch(recMed.name);
                              const clinical = resolveClinicalDetails(recMed.name, recMed.generic, '', recMed);
                              if (clinical.genericName) setGenericName(clinical.genericName);
                              if (clinical.salts?.length > 0) setCompositionSalts(clinical.salts);
                              if (clinical.dosage) setDosage(clinical.dosage);
                              if (clinical.purpose) setPurpose(clinical.purpose);
                              if (clinical.condition) setSelectedCondition(clinical.condition);
                              if (clinical.mealInstruction) setNotes(clinical.mealInstruction);
                              if (clinical.frequency) setFrequency(clinical.frequency);
                              if (clinical.timings?.length > 0) setTimings(clinical.timings);
                              if (clinical.form) setForm(clinical.form);
                              if (clinical.type) setType(clinical.type);
                              notify.success('Auto-Filled', `Auto-filled details for ${recMed.name}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--brand-600)] hover:text-white text-[var(--ink)] border border-[var(--border)] transition-all cursor-pointer shadow-2xs group"
                          >
                            <Pill className="w-3.5 h-3.5 text-[var(--brand-600)] group-hover:text-white" />
                            <span className="font-bold">{recMed.name}</span>
                            <span className="text-[10px] opacity-70">({recMed.dosage})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <PolySafeInput
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Fever & Pain Relief, Hypertension, Post-op pain"
                    leftIcon={<Activity className="w-4 h-4 text-[var(--brand-600)]" />}
                    className="text-xs"
                  />
                  {purpose && getPurposeGuidance(purpose) && (
                    <p className="text-[11px] text-[var(--ink-3)] italic px-1">
                      Guidance: {getPurposeGuidance(purpose)}
                    </p>
                  )}
                </div>

                {/* 3. Schedule & Timings */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--brand-600)]/10 text-[var(--brand-600)] text-xs font-black">
                        3
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                        Dosage Schedule & Administration
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Frequency
                      </label>
                      <PolySafeSelect
                        value={frequency}
                        onChange={(e) => {
                          const newFreq = e.target.value;
                          setFrequency(newFreq);
                          if (newFreq === 'once') setTimings(['morning']);
                          else if (newFreq === 'twice') setTimings(['morning', 'evening']);
                          else if (newFreq === 'thrice') setTimings(['morning', 'afternoon', 'evening']);
                          else if (newFreq === 'four') setTimings(['morning', 'afternoon', 'evening', 'bedtime']);
                        }}
                        leftIcon={<Clock className="w-4 h-4 text-[var(--brand-600)]" />}
                        className="text-xs font-medium"
                      >
                        <option value="once">Once daily (OD)</option>
                        <option value="twice">Twice daily (BD / BID)</option>
                        <option value="thrice">3 times daily (TID)</option>
                        <option value="four">4 times daily (QID)</option>
                        <option value="weekly">Weekly</option>
                        <option value="asneeded">As needed (PRN)</option>
                      </PolySafeSelect>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Meal Instruction
                      </label>
                      <PolySafeSelect
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        leftIcon={<CalendarDays className="w-4 h-4 text-[var(--brand-600)]" />}
                        className="text-xs"
                      >
                        <option value="">No special instructions</option>
                        <option value="after_food">Take after food (Post-meal)</option>
                        <option value="before_food">Take before food (Pre-meal)</option>
                        <option value="with_food">Take with food</option>
                        <option value="empty_stomach">Take on empty stomach</option>
                        <option value="with_water">Take with water</option>
                      </PolySafeSelect>
                    </div>
                  </div>

                  {/* Timing slots */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" />, time: '8:00 AM' },
                      { id: 'afternoon', label: 'Afternoon', icon: <Coffee className="w-3.5 h-3.5" />, time: '1:00 PM' },
                      { id: 'evening', label: 'Evening', icon: <Sunset className="w-3.5 h-3.5" />, time: '6:00 PM' },
                      { id: 'bedtime', label: 'Bedtime', icon: <Moon className="w-3.5 h-3.5" />, time: '10:00 PM' },
                    ].map((slot) => {
                      const isActive = timings.includes(slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            setTimings(prev =>
                              prev.includes(slot.id)
                                ? prev.filter(t => t !== slot.id)
                                : [...prev, slot.id]
                            );
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-[var(--surface-2)] text-[var(--brand-600)] border-[var(--brand-600)] shadow-2xs'
                              : 'bg-[var(--surface)] text-[var(--ink-3)] border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {slot.icon}
                            <span>{slot.label}</span>
                          </div>
                          <span className="text-[10px] font-normal opacity-60">{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addMutation.isPending || !name.trim()}
                    className="ps-btn ps-btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {addMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Validating with RxNorm & saving...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Add to My Medicine List</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </Card>
            </form>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              RIGHT COLUMN: "If you add this" Live Preview Panel (Sticky)
              ════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="ps-card p-6 rounded-3xl border border-[var(--border)] bg-[var(--paper)] shadow-[var(--shadow-sm)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[var(--coral)]/10 text-[var(--coral)]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      "If you add this"
                    </h3>
                    <p className="text-[11px] text-[var(--ink-3)]">
                      Live interaction & safety simulation
                    </p>
                  </div>
                </div>

                {safetyPreviewLoading ? (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--brand-600)] font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking</span>
                  </span>
                ) : safetyPreviewAlerts.length > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                    {safetyPreviewAlerts.length} Alert{safetyPreviewAlerts.length !== 1 ? 's' : ''}
                  </span>
                ) : name.trim().length >= 3 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    All Clear
                  </span>
                ) : null}
              </div>

              {/* Subtle Shake-Free Fade Panel */}
              <div className="min-h-[140px]">
                <AnimatePresence mode="wait">
                  {name.trim().length < 3 ? (
                    <motion.div
                      key="empty-standby"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="p-6 rounded-2xl bg-[var(--surface-2)] text-center space-y-2 border border-dashed border-[var(--border)]"
                    >
                      <Activity className="w-6 h-6 text-[var(--ink-3)] mx-auto" />
                      <p className="text-xs font-bold text-[var(--ink)]">Regimen screening standby</p>
                      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                        Type or scan a medication to screen in real-time against active prescriptions, duplicates, and known allergies.
                      </p>
                    </motion.div>
                  ) : safetyPreviewAlerts.length > 0 ? (
                    <motion.div
                      key="alerts-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      {safetyPreviewAlerts.map((alert) => {
                        const pillStatus = mapSeverityToPillStatus(alert.severity);
                        const isDuplicate = alert.type === 'DUPLICATE_INGREDIENT' || alert.type === 'DUPLICATE_CLASS';

                        return (
                          <div
                            key={alert.id || alert.plainText}
                            className={`p-3.5 rounded-2xl border space-y-2 ${
                              alert.severity === 'CRITICAL' || alert.severity === 'MAJOR'
                                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <StatusPill status={pillStatus} label={alert.severity || 'Notice'} size="sm" />
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-3)]">
                                {isDuplicate ? 'Duplicate Dose' : alert.type || 'Interaction'}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-[var(--ink)] leading-snug">
                              {alert.plainText}
                            </p>

                            {isDuplicate && (
                              <button
                                type="button"
                                onClick={() => setIsDuplicateDrawerOpen(true)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--coral)] hover:underline cursor-pointer pt-0.5"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Resolve duplicate dose in drawer →</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  ) : !safetyPreviewLoading ? (
                    <motion.div
                      key="clear-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Clear to add "{name.trim()}"
                      </p>
                      <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                        No known drug interactions, duplicate active ingredients, allergy conflicts, or disease precautions detected.
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Review & Confirm Drawer Trigger */}
              {name.trim() && (
                <div className="pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsDuplicateDrawerOpen(true)}
                    className="w-full py-2.5 ps-btn ps-btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Review Dosing Sheet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Duplicate-Dose Resolver & Confirm Sheet Drawer (Bottom Sheet) ── */}
      <SharedDrawer
        isOpen={isDuplicateDrawerOpen}
        onClose={() => setIsDuplicateDrawerOpen(false)}
        side="bottom"
        title="Dosing Conflict & Duplicate Resolver"
      >
        <div className="space-y-5 text-sm">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
            <TriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-950 dark:text-amber-200">
                Potential Duplicate Active Ingredient
              </h4>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                {duplicateConflict?.alertText || `You may already be taking an active formulation containing this ingredient. Check dosage limits to avoid hepatic toxicity.`}
              </p>
            </div>
          </div>

          {/* Dosing comparison card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-[var(--ink-3)]">Current In Regimen</span>
              <p className="font-bold text-sm text-[var(--ink)]">{duplicateConflict?.name || 'Active Regimen Medicine'}</p>
              <p className="text-[11px] text-[var(--ink-3)]">Dose: {duplicateConflict?.existingDosage || 'Prescribed dose'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-[var(--ink-3)]">Incoming Candidate</span>
              <p className="font-bold text-sm text-[var(--ink)]">{name || 'New Medicine'}</p>
              <p className="text-[11px] text-[var(--brand-600)] font-bold">New Dose: {dosage || 'Standard dose'}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleConfirmUpdateDosage}
              className="w-full py-3 ps-btn ps-btn-primary flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Update Existing Dosage to "{dosage || 'New Dose'}"</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDuplicateDrawerOpen(false);
                handleSubmit();
              }}
              className="w-full py-3 ps-btn ps-btn-secondary flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Keep Both (Doctor-Approved Multi-Agent Combination)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDuplicateDrawerOpen(false)}
              className="w-full py-2.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] hover:underline cursor-pointer text-center"
            >
              Cancel & Modify Dosage
            </button>
          </div>
        </div>
      </SharedDrawer>

      {/* ── Advanced Modals ── */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={handleLiveCameraCapture}
      />

      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onSelect={handleBarcodeSelect}
      />
    </div>
  );
}
