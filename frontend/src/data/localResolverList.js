/**
 * frontend/src/data/localResolverList.js
 *
 * Offline-capable Indian Formulary & Drug Resolver Dictionary
 * ────────────────────────────────────────────────────────────
 * Embedded client-side knowledge base for instant 0ms autocomplete & search,
 * enabling full offline and guest demo execution without backend dependencies.
 * Hand-authored clinical entries marked with: needs clinical review
 */

export const LOCAL_RESOLVER_DRUGS = [
  // ── 1. Analgesics, Antipyretics & NSAIDs ──
  {
    name: 'Dolo 650',
    generic: 'Paracetamol',
    rxcui: '161',
    dosage: '650mg',
    purpose: 'Fever, Headache & Body Pain',
    category: 'Analgesic / Antipyretic',
    safetyTip: 'Do not exceed 4g paracetamol in 24 hours. Take after meals with water.',
    dosageOptions: ['650mg'],
    commonFrequency: 'thrice',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Calpol 500',
    generic: 'Paracetamol',
    rxcui: '161',
    dosage: '500mg',
    purpose: 'Fever & Mild to Moderate Pain',
    category: 'Analgesic / Antipyretic',
    safetyTip: 'Avoid combining with other paracetamol-containing cold remedies.',
    dosageOptions: ['500mg', '650mg', '250mg/5ml'],
    commonFrequency: 'thrice',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Crocin Advance',
    generic: 'Paracetamol',
    rxcui: '161',
    dosage: '500mg',
    purpose: 'Fast-Acting Fever & Pain Relief',
    category: 'Analgesic / Antipyretic',
    safetyTip: 'Take strictly after meals with water to avoid gastric irritation.',
    dosageOptions: ['500mg', '650mg'],
    commonFrequency: 'thrice',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Combiflam',
    generic: 'Ibuprofen + Paracetamol',
    rxcui: '5640',
    dosage: '400mg + 325mg',
    purpose: 'Severe Headache, Musculoskeletal & Dental Pain',
    category: 'Dual NSAID / Analgesic-Antipyretic',
    safetyTip: 'Take strictly after food with a full glass of water. Avoid if history of peptic ulcers.',
    dosageOptions: ['400mg+325mg'],
    commonFrequency: 'twice',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Naxdom 500',
    generic: 'Naproxen + Domperidone',
    rxcui: '7258',
    dosage: '500mg + 10mg',
    purpose: 'Migraine with Nausea & Severe Vascular Headache',
    category: 'NSAID + Prokinetic (Migraine)',
    safetyTip: 'Take immediately at the onset of migraine aura with a snack or meal.',
    dosageOptions: ['500mg+10mg', '250mg+10mg'],
    commonFrequency: 'asneeded',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Zerodol SP',
    generic: 'Aceclofenac + Paracetamol + Serratiopeptidase',
    rxcui: '16689',
    dosage: '100mg + 325mg + 15mg',
    purpose: 'Post-operative Pain, Edema & Joint Inflammation',
    category: 'NSAID + Analgesic + Proteolytic Enzyme',
    safetyTip: 'Take after meals. Serratiopeptidase assists in resolving inflammatory tissue fluid.',
    dosageOptions: ['100mg+325mg+15mg'],
    commonFrequency: 'twice',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },

  // ── 2. Gastroenterology & Acid Peptic ──
  {
    name: 'Pan-D',
    generic: 'Pantoprazole + Domperidone',
    rxcui: '40790',
    dosage: '40mg + 30mg SR',
    purpose: 'Acidity, Gas, Acid Reflux (GERD) & Nausea',
    category: 'PPI + Prokinetic (GERD / Dyspepsia)',
    safetyTip: 'Take 30 to 45 minutes before morning breakfast on an empty stomach.',
    dosageOptions: ['40mg+10mg', '40mg+30mg SR'],
    commonFrequency: 'once',
    foodInstruction: 'before_food',
    source: 'rxnorm',
  },
  {
    name: 'Pantocid 40',
    generic: 'Pantoprazole',
    rxcui: '40790',
    dosage: '40mg',
    purpose: 'Hyperacidity, Peptic Ulcer & Gastric Healing',
    category: 'Proton Pump Inhibitor (PPI)',
    safetyTip: 'Take before the first meal of the day.',
    dosageOptions: ['20mg', '40mg'],
    commonFrequency: 'once',
    foodInstruction: 'before_food',
    source: 'rxnorm',
  },
  {
    name: 'Omez 20',
    generic: 'Omeprazole',
    rxcui: '7646',
    dosage: '20mg',
    purpose: 'Acid Reflux, Heartburn & Stomach Ulcers',
    category: 'Proton Pump Inhibitor (PPI)',
    safetyTip: 'Swallow whole with water before food; do not crush or chew capsule granules.',
    dosageOptions: ['10mg', '20mg', '40mg'],
    commonFrequency: 'once',
    foodInstruction: 'before_food',
    source: 'rxnorm',
  },
  {
    name: 'Digene Gel',
    generic: 'Magnesium Hydroxide + Aluminium Hydroxide + Simethicone',
    rxcui: null,
    dosage: '10ml',
    purpose: 'Instant Antacid Relief from Heartburn & Gas',
    category: 'Antacid & Antiflatulent',
    safetyTip: 'Shake bottle thoroughly. Take after meals and before bedtime.',
    dosageOptions: ['10ml', '200ml bottle'],
    commonFrequency: 'asneeded',
    foodInstruction: 'after_food',
    source: 'otc',
  },

  // ── 3. Cardiovascular & Anticoagulants ──
  {
    name: 'Warfarin',
    generic: 'Warfarin Sodium',
    rxcui: '11289',
    dosage: '5mg',
    purpose: 'Blood Thinner for DVT, PE & Atrial Fibrillation Clot Prevention',
    category: 'Vitamin K Antagonist (Anticoagulant)',
    safetyTip: 'Critical narrow therapeutic index. Maintain stable vitamin K dietary intake. Report unusual bruising.',
    dosageOptions: ['1mg', '2mg', '2.5mg', '3mg', '5mg'],
    commonFrequency: 'once',
    foodInstruction: 'evening',
    source: 'rxnorm',
  },
  {
    name: 'Aspirin (Ecosprin 75)',
    generic: 'Aspirin',
    rxcui: '1191',
    dosage: '75mg',
    purpose: 'Antiplatelet Cardio-protection & Stroke Prevention',
    category: 'Antiplatelet (Blood Thinner)',
    safetyTip: 'Take with or after food. Enteric-coated formulations reduce stomach irritation.',
    dosageOptions: ['75mg', '150mg'],
    commonFrequency: 'once',
    foodInstruction: 'after_food',
    source: 'rxnorm',
  },
  {
    name: 'Telma H',
    generic: 'Telmisartan + Hydrochlorothiazide',
    rxcui: '73494',
    dosage: '40mg + 12.5mg',
    purpose: 'High Blood Pressure & Cardiac Risk Reduction',
    category: 'ARB + Thiazide Diuretic (Antihypertensive)',
    safetyTip: 'Take in the morning. Stay well-hydrated. Monitor periodic electrolytes and creatinine.',
    dosageOptions: ['40mg+12.5mg', '80mg+12.5mg'],
    commonFrequency: 'once',
    foodInstruction: 'morning',
    source: 'rxnorm',
  },
  {
    name: 'Stamlo Beta',
    generic: 'Amlodipine + Atenolol',
    rxcui: '17767',
    dosage: '5mg + 50mg',
    purpose: 'Hypertension with Tachycardia or Angina',
    category: 'CCB + Beta-1 Blocker (Antihypertensive)',
    safetyTip: 'Take at a consistent time daily. Do not discontinue abruptly.',
    dosageOptions: ['5mg+50mg'],
    commonFrequency: 'once',
    foodInstruction: 'any',
    source: 'rxnorm',
  },
  {
    name: 'Amlodipine 5mg',
    generic: 'Amlodipine Besylate',
    rxcui: '17767',
    dosage: '5mg',
    purpose: 'High Blood Pressure & Angina Pectoris',
    category: 'Calcium Channel Blocker (CCB)',
    safetyTip: 'Monitor for peripheral pedal edema (ankle swelling).',
    dosageOptions: ['2.5mg', '5mg', '10mg'],
    commonFrequency: 'once',
    foodInstruction: 'any',
    source: 'rxnorm',
  },
  {
    name: 'Atorva 10 (Atorvastatin)',
    generic: 'Atorvastatin',
    rxcui: '83367',
    dosage: '10mg',
    purpose: 'Lower High Cholesterol & Prevent Heart Attack',
    category: 'HMG-CoA Reductase Inhibitor (Statin)',
    safetyTip: 'Best taken at bedtime when hepatic cholesterol synthesis is highest. Avoid grapefruit juice.',
    dosageOptions: ['10mg', '20mg', '40mg', '80mg'],
    commonFrequency: 'once',
    foodInstruction: 'bedtime',
    source: 'rxnorm',
  },

  // ── 4. Diabetes & Metabolic ──
  {
    name: 'Metformin 500 (Glycomet)',
    generic: 'Metformin Hydrochloride',
    rxcui: '6809',
    dosage: '500mg',
    purpose: 'Type 2 Diabetes Mellitus & Insulin Sensitization',
    category: 'Biguanide (Antidiabetic)',
    safetyTip: 'Take with or immediately after meals to minimize gastrointestinal upset.',
    dosageOptions: ['500mg', '850mg', '1000mg SR'],
    commonFrequency: 'twice',
    foodInstruction: 'with_food',
    source: 'rxnorm',
  },
  {
    name: 'Januvia 100',
    generic: 'Sitagliptin',
    rxcui: '593411',
    dosage: '100mg',
    purpose: 'Type 2 Diabetes Blood Sugar Regulation',
    category: 'DPP-4 Inhibitor',
    safetyTip: 'Can be taken with or without food. Low inherent hypoglycemia risk when used alone.',
    dosageOptions: ['25mg', '50mg', '100mg'],
    commonFrequency: 'once',
    foodInstruction: 'any',
    source: 'rxnorm',
  },

  // ── 5. Neuro-Psychiatry & Sedatives ──
  {
    name: 'Amitriptyline',
    generic: 'Amitriptyline Hydrochloride',
    rxcui: '704',
    dosage: '25mg',
    purpose: 'Neuropathic Pain, Sleep Aid & Migraine Prophylaxis',
    category: 'Tricyclic Antidepressant (TCA)',
    safetyTip: 'High Anticholinergic Burden (ACB: 3). Causes dry mouth and sedation; take strictly at bedtime.',
    dosageOptions: ['10mg', '25mg', '50mg'],
    commonFrequency: 'once',
    foodInstruction: 'bedtime',
    source: 'rxnorm',
  },
  {
    name: 'Escitalopram',
    generic: 'Escitalopram Oxalate',
    rxcui: '32937',
    dosage: '10mg',
    purpose: 'Depression, Generalised Anxiety & Panic Disorder',
    category: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    safetyTip: 'Take in the morning to avoid insomnia. Do not stop abruptly without tapering.',
    dosageOptions: ['5mg', '10mg', '20mg'],
    commonFrequency: 'once',
    foodInstruction: 'morning',
    source: 'rxnorm',
  },

  // ── 6. Herbals & Dietary Supplements ──
  {
    name: 'Turmeric (Curcumin)',
    generic: 'Curcumin Extract',
    rxcui: null,
    dosage: '500mg',
    purpose: 'Joint Health, Anti-inflammatory & Antioxidant',
    category: 'Herbal Supplement',
    safetyTip: 'Contains anticoagulant and CYP2C9 inhibitory properties. Extreme bleeding danger if taken with Warfarin or Aspirin.',
    dosageOptions: ['250mg', '500mg', '1000mg'],
    commonFrequency: 'once',
    foodInstruction: 'with_food',
    source: 'herbal',
  },
  {
    name: 'Ashwagandha',
    generic: 'Withania Somnifera Extract',
    rxcui: null,
    dosage: '500mg',
    purpose: 'Stress Adaptation, Vigor & Sleep Quality',
    category: 'Ayurvedic Rasayana / Adaptogen',
    safetyTip: 'May potentiate sedative and thyroid medications. Take with warm milk or after dinner.',
    dosageOptions: ['300mg', '500mg'],
    commonFrequency: 'once',
    foodInstruction: 'bedtime',
    source: 'herbal',
  },
  {
    name: 'Ginkgo Biloba',
    generic: 'Ginkgo Biloba Leaf Extract',
    rxcui: null,
    dosage: '120mg',
    purpose: 'Cognitive Support & Peripheral Vascular Circulation',
    category: 'Botanical Extract',
    safetyTip: 'Antiplatelet botanical activity. Contraindicated with blood thinners and prior to surgery.',
    dosageOptions: ['60mg', '120mg'],
    commonFrequency: 'once',
    foodInstruction: 'with_food',
    source: 'herbal',
  },
  {
    name: 'Shelcal 500',
    generic: 'Calcium Carbonate + Vitamin D3',
    rxcui: null,
    dosage: '500mg + 250 IU',
    purpose: 'Osteopenia, Osteoporosis & Calcium Deficiency',
    category: 'Nutritional Mineral Supplement',
    safetyTip: 'Take after your largest meal with plenty of water for optimal absorption.',
    dosageOptions: ['500mg'],
    commonFrequency: 'once',
    foodInstruction: 'after_food',
    source: 'otc',
  },
  {
    name: 'Becosules',
    generic: 'Vitamin B-Complex + Vitamin C',
    rxcui: null,
    dosage: '1 capsule',
    purpose: 'Mouth Ulcers, Fatigue & Vitamin B Deficiency',
    category: 'Water-Soluble Vitamin Complex',
    safetyTip: 'Take in the morning with water. Harmless bright yellow urine discoloration is normal.',
    dosageOptions: ['1 capsule'],
    commonFrequency: 'once',
    foodInstruction: 'after_food',
    source: 'otc',
  },
  {
    name: 'Neurobion Forte',
    generic: 'Vitamin B1 + B6 + B12 (Cyanocobalamin)',
    rxcui: null,
    dosage: '1 tablet',
    purpose: 'Diabetic Neuropathy & Nerve Regeneration',
    category: 'Neurotropic Vitamin Formulation',
    safetyTip: 'Take daily after lunch or breakfast.',
    dosageOptions: ['1 tablet'],
    commonFrequency: 'once',
    foodInstruction: 'after_food',
    source: 'otc',
  },

  // ── 7. Antibiotics, Anti-Allergics & Respiratory ──
  {
    name: 'Augmentin 625',
    generic: 'Amoxicillin + Clavulanic Acid',
    rxcui: '723',
    dosage: '500mg + 125mg',
    purpose: 'Bacterial Respiratory, Sinus, Dental & Soft Tissue Infections',
    category: 'Penicillin + Beta-Lactamase Inhibitor',
    safetyTip: 'Take with food to reduce GI upset. Complete the full prescribed course even if feeling better.',
    dosageOptions: ['625mg', '375mg', '1000mg'],
    commonFrequency: 'twice',
    foodInstruction: 'with_food',
    source: 'rxnorm',
  },
  {
    name: 'Cheston Cold',
    generic: 'Cetirizine + Paracetamol + Phenylephrine',
    rxcui: null,
    dosage: '1 tablet',
    purpose: 'Common Cold, Runny Nose, Sneezing & Sinus Congestion',
    category: 'Antihistamine + Decongestant + Antipyretic',
    safetyTip: 'May cause mild drowsiness. Avoid driving or operating machinery.',
    dosageOptions: ['1 tablet'],
    commonFrequency: 'twice',
    foodInstruction: 'after_food',
    source: 'otc',
  },
  {
    name: 'Allegra 120',
    generic: 'Fexofenadine Hydrochloride',
    rxcui: '111419',
    dosage: '120mg',
    purpose: 'Non-Drowsy Allergy Relief, Hives & Allergic Rhinitis',
    category: 'Second-Generation Antihistamine',
    safetyTip: 'Take with plain water only; avoid fruit juices (orange, apple, grapefruit) within 4 hours.',
    dosageOptions: ['120mg', '180mg'],
    commonFrequency: 'once',
    foodInstruction: 'any',
    source: 'rxnorm',
  },
  {
    name: 'Cetirizine 10mg',
    generic: 'Cetirizine Hydrochloride',
    rxcui: '20610',
    dosage: '10mg',
    purpose: 'Seasonal Allergies, Watery Eyes, Sneezing & Itching',
    category: 'Antihistamine',
    safetyTip: 'Best taken in the evening before bed to offset potential drowsiness.',
    dosageOptions: ['5mg', '10mg'],
    commonFrequency: 'once',
    foodInstruction: 'bedtime',
    source: 'rxnorm',
  },
];

/**
 * Perform instant offline matching against local formulary
 * @param {string} query
 * @returns {Array<object>}
 */
export function searchLocalResolver(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  const qLower = query.trim().toLowerCase();
  const seen = new Set();
  const results = [];

  for (const item of LOCAL_RESOLVER_DRUGS) {
    const nameMatch = item.name.toLowerCase().includes(qLower);
    const genMatch = item.generic.toLowerCase().includes(qLower);
    const purpMatch = (item.purpose || '').toLowerCase().includes(qLower);
    const catMatch = (item.category || '').toLowerCase().includes(qLower);

    if (nameMatch || genMatch || purpMatch || catMatch) {
      const key = item.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          ...item,
          extractedTimings: item.commonFrequency === 'twice' ? ['morning', 'evening']
            : item.commonFrequency === 'thrice' ? ['morning', 'afternoon', 'evening']
            : item.foodInstruction === 'bedtime' ? ['bedtime']
            : ['morning'],
        });
      }
    }

    if (results.length >= 10) break;
  }

  return results;
}
