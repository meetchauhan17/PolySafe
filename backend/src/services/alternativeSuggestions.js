/**
 * services/alternativeSuggestions.js
 *
 * PolySafe Clinical De-prescribing & Safer Alternatives Engine (v6.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyzes active regimens and detected interaction flags to provide
 * physician-vetted, evidence-based safer alternatives and tapering guidance.
 */

'use strict';

const CLINICAL_ALTERNATIVES = [
  {
    id: 'nsaid-hypertension-cardiac',
    matchCondition: (meds) => {
      const hasNsaid = meds.some(m => /(ibuprofen|naproxen|diclofenac|aceclofenac|ketorolac|piroxicam)/i.test(m.name || m.generic || ''));
      const hasCardiac = meds.some(m => /(telmisartan|amlodipine|lisinopril|ramipril|losartan|atenolol|metoprolol)/i.test(m.name || m.generic || ''));
      return hasNsaid && hasCardiac;
    },
    triggerDrug: 'Systemic Oral NSAID (Painkiller)',
    detectedConcern: 'NSAIDs blunt antihypertensive efficacy and cause renal sodium retention, elevating blood pressure by 3–6 mmHg and increasing cardiovascular events.',
    saferOptions: [
      {
        name: 'Topical Diclofenac Gel (1%–2%)',
        category: 'Topical Analgesic',
        rationale: 'Provides equivalent localized analgesia for osteoarthritic and musculoskeletal pain with 95% lower systemic plasma absorption and negligible renal impact.',
        level: 'Minimal Systemic Risk (L1)',
      },
      {
        name: 'Paracetamol / Acetaminophen (500mg–650mg)',
        category: 'Non-Opioid Analgesic',
        rationale: 'First-line analgesic with no adverse impact on renal prostaglandins or blood pressure control (maintain total daily dose ≤ 3000mg).',
        level: 'Low Risk (L2)',
      },
      {
        name: 'Topical Capsaicin or Lidocaine Patch',
        category: 'Neuropathic / Musculoskeletal Topical',
        rationale: 'Non-systemic peripheral desensitization without drug-drug interaction liabilities.',
        level: 'Low Risk (L1)',
      },
    ],
    deprescribingTip: 'Taper oral NSAID to lowest effective dose for shortest possible duration (< 5 days) rather than continuous chronic administration.',
  },
  {
    id: 'anticoagulant-nsaid-bleeding',
    matchCondition: (meds) => {
      const hasBleeder = meds.some(m => /(warfarin|clopidogrel|aspirin|apixaban|rivaroxaban|dabigatran|deplatt)/i.test(m.name || m.generic || ''));
      const hasNsaid = meds.some(m => /(ibuprofen|naproxen|diclofenac|aceclofenac|combiflam|zerodol)/i.test(m.name || m.generic || ''));
      return hasBleeder && hasNsaid;
    },
    triggerDrug: 'NSAID + Blood Thinner Combination',
    detectedConcern: 'Concurrent antiplatelet/anticoagulant and systemic NSAID quadruples upper gastrointestinal bleeding and hemorrhagic ulcer risks.',
    saferOptions: [
      {
        name: 'Acetaminophen (Paracetamol) Regular Dosing',
        category: 'Non-Antiplatelet Analgesic',
        rationale: 'Does not inhibit platelet aggregation or irritate gastric mucosa, eliminating synergistic bleeding risks.',
        level: 'Low Risk (L2)',
      },
      {
        name: 'Co-Prescribe Gastroprotective PPI (e.g. Pantoprazole 40mg)',
        category: 'Gastric Acid Suppression',
        rationale: 'If NSAID cannot be avoided, co-administration of a PPI significantly reduces endoscopic ulceration and bleeding.',
        level: 'Harm Mitigation Strategy',
      },
    ],
    deprescribingTip: 'Switch to topical analgesia immediately and discontinue elective OTC painkillers.',
  },
  {
    id: 'high-acb-anticholinergic',
    matchCondition: (meds) => {
      return meds.some(m => /(amitriptyline|hydroxyzine|diphenhydramine|promethazine|chlorpheniramine)/i.test(m.name || m.generic || ''));
    },
    triggerDrug: 'High Anticholinergic Burden Agent (ACB Score 3)',
    detectedConcern: 'Strong anticholinergic properties provoke cognitive decline, acute delirium, memory fog, urinary retention, and dangerous fall hazards in polypharmacy patients.',
    saferOptions: [
      {
        name: 'Non-Sedating 2nd Generation Antihistamine (Fexofenadine / Levocetirizine)',
        category: 'Peripheral H1-Antagonist',
        rationale: 'Negligible blood-brain barrier penetration with zero anticholinergic cognitive burden (ACB Score 0).',
        level: 'Low Burden (L1)',
      },
      {
        name: 'Melatonin (1mg–3mg) / Sleep Hygiene Protocol',
        category: 'Chronobiotic Sleep Support',
        rationale: 'Physiological sleep phase synchronization without hangover sedation, motor ataxia, or dementia risk.',
        level: 'Minimal Risk (L1)',
      },
      {
        name: 'Sertraline / Escitalopram (for neuropathic or depressive symptoms)',
        category: 'Modern SSRI',
        rationale: 'Minimal anticholinergic affinity compared to tricyclics (Amitriptyline).',
        level: 'Low Burden (L2)',
      },
    ],
    deprescribingTip: 'Gradually taper tricyclics over 2–4 weeks to prevent cholinergic rebound symptoms.',
  },
  {
    id: 'sulfonylurea-hypoglycemia',
    matchCondition: (meds) => {
      return meds.some(m => /(glimepiride|glibenclamide|glyburide|gliclazide)/i.test(m.name || m.generic || ''));
    },
    triggerDrug: 'Sulfonylurea Antidiabetic',
    detectedConcern: 'Long-acting sulfonylureas carry high risks of severe, prolonged hypoglycemia, especially when renal function is mildly reduced.',
    saferOptions: [
      {
        name: 'DPP-4 Inhibitors (Sitagliptin / Vildagliptin / Linagliptin)',
        category: 'Incretin Enhancer',
        rationale: 'Glucose-dependent insulin secretion — effectively zero risk of hypoglycemia as monotherapy.',
        level: 'Intermediate (L3)',
      },
      {
        name: 'SGLT-2 Inhibitors (Dapagliflozin / Empagliflozin)',
        category: 'Renal Glucose Excretion',
        rationale: 'Low hypoglycemia risk with proven cardiorenal risk reduction benefits.',
        level: 'Intermediate (L3)',
      },
    ],
    deprescribingTip: 'Discuss substituting sulfonylurea with modern incretin agents during next endocrine review.',
  },
  {
    id: 'chronic-ppi-stewardsip',
    matchCondition: (meds) => {
      const ppiCount = meds.filter(m => /(pantoprazole|omeprazole|rabeprazole|esomeprazole|lansoprazole)/i.test(m.name || m.generic || '')).length;
      return ppiCount >= 1;
    },
    triggerDrug: 'Proton Pump Inhibitor (PPI)',
    detectedConcern: 'Long-term unmonitored PPI use (> 8–12 weeks) can impair magnesium, iron, and B12 absorption and lead to prescribing cascades.',
    saferOptions: [
      {
        name: 'Step-Down to H2 Receptor Antagonist (Famotidine 20mg)',
        category: 'H2 Blocker',
        rationale: 'Adequate nocturnal and mealtime acid suppression with lower risks of hypomagnesemia and bone demineralization.',
        level: 'Low Risk (L2)',
      },
      {
        name: 'On-Demand / PRN Dosing Strategy',
        category: 'Symptom-Driven Regimen',
        rationale: 'Taking the PPI only during symptom flare-ups reduces total lifetime pill burden by up to 60%.',
        level: 'Patient Stewardship',
      },
    ],
    deprescribingTip: 'Evaluate indication for continuous PPI: if uncomplicated dyspepsia or heartburn, attempt tapering over 2 weeks.',
  },
];

/**
 * Generate evidence-based alternative recommendations for a patient's regimen.
 *
 * @param {Array<Object>} medicines - Active medicines array
 * @returns {Array<Object>} Matched alternative suggestion plans
 */
function getSaferAlternativeSuggestions(medicines = []) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return [];
  }

  const recommendations = [];

  for (const item of CLINICAL_ALTERNATIVES) {
    try {
      if (item.matchCondition(medicines)) {
        recommendations.push({
          id: item.id,
          triggerDrug: item.triggerDrug,
          detectedConcern: item.detectedConcern,
          saferOptions: item.saferOptions,
          deprescribingTip: item.deprescribingTip,
        });
      }
    } catch (e) {
      console.warn('[alternativeSuggestions] Match error:', e.message);
    }
  }

  return recommendations;
}

module.exports = {
  CLINICAL_ALTERNATIVES,
  getSaferAlternativeSuggestions,
};
