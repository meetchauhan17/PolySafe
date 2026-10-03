/**
 * frontend/src/utils/indications.js — Clinical Indication & Medical Condition Resolver
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves the primary medical condition, illness, symptom, or therapeutic purpose
 * ("What this medicine is used for") across all Indian & international formulations.
 */

// ─── Curated Medical Indications Formulary ────────────────────────────────────
export const MEDICINE_INDICATIONS = {
  // Respiratory, Allergy & Pulmonary
  'xyzal': 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma',
  'xyzal m': 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma',
  'montair lc': 'Allergic Rhinitis, Hay Fever, Bronchial Asthma & Nasal Congestion',
  'montek lc': 'Allergic Rhinitis, Sneezing, Runny Nose & Allergic Asthma',
  'telekast l': 'Asthma Prophylaxis, Seasonal Allergies & Allergic Rhinitis',
  'levocetirizine': 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Itching',
  'montelukast': 'Asthma Maintenance, Bronchospasm & Allergic Rhinitis',
  'cetirizine': 'Allergy, Sneezing, Runny Nose, Hives & Watery Eyes',
  'allegra': 'Seasonal Allergies, Allergic Rhinitis & Chronic Urticaria (Hives)',
  'fexofenadine': 'Non-Drowsy Allergy Relief, Sneezing & Itchy Skin Rash',
  'cheston cold': 'Common Cold, Nasal Congestion, Runny Nose & Fever',
  'sinarest': 'Cold, Sinus Congestion, Headache & Low-Grade Fever',
  'ascoril': 'Productive Cough, Chest Congestion & Bronchial Spasm',
  'alex': 'Dry Irritating Cough & Throat Tickling Relief',
  'benadryl': 'Cough Relief, Throat Soothing & Nighttime Cough Suppression',
  'asthalin': 'Acute Asthma Attack, Wheezing & Bronchospasm',
  'salbutamol': 'Acute Bronchospasm, Asthma & COPD Bronchodilation',
  'albuterol': 'Bronchospasm, Wheezing & Exercise-Induced Asthma',
  'foracort': 'Chronic Asthma Maintenance & COPD Symptom Prevention',
  'budecort': 'Asthma Airway Inflammation & Chronic Bronchitis',
  'budesonide': 'Airway Inflammation, Asthma & Chronic Lung Inflammation',

  // Pain, Migraine & Musculoskeletal
  'naxdom': 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting',
  'naxdom 500': 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting',
  'naxdom 250': 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting',
  'migranil': 'Migraine Attacks & Vascular Headaches',
  'sumatriptan': 'Acute Migraine Headache with or without Aura',
  'vasograin': 'Vascular Headaches & Recurring Migraines',
  'dolo': 'Fever, Headache, Body Aches & Mild to Moderate Pain Relief',
  'dolo 650': 'Fever, Headache, Body Aches & Mild to Moderate Pain Relief',
  'calpol': 'Fever, Headache & Mild to Moderate Pain Relief',
  'crocin': 'Fever, Body Ache, Toothache & Mild Headache Relief',
  'paracetamol': 'Fever Reduction, Headache & Mild to Moderate Pain Relief',
  'acetaminophen': 'Fever Reduction, Headache & General Pain Relief',
  'combiflam': 'Severe Musculoskeletal Pain, Joint Inflammation & Fever',
  'ibuprofen': 'Inflammatory Pain, Dental Ache, Muscle Sprains & Fever',
  'brufen': 'Inflammation, Muscle Pain & Dental Ache',
  'voveran': 'Severe Joint Pain, Osteoarthritis & Musculoskeletal Inflammation',
  'diclofenac': 'Joint Pain, Sprain, Arthritis & Post-Operative Inflammation',
  'naproxen': 'Migraine, Arthritis, Gout & Musculoskeletal Pain',
  'meftal spas': 'Abdominal Cramping, Menstrual Pain & Intestinal Spasms',
  'mefenamic acid': 'Menstrual Pain, Spasms & Mild to Moderate Inflammatory Pain',
  'ultracet': 'Moderate to Severe Acute Pain Relief',
  'tramadol': 'Moderate to Severe Pain Management',

  // Rheumatology, Autoimmune & Targeted Therapy
  'tfct-nib': 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis',
  'tfct-nib 5 mg': 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis',
  'tofacitinib': 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis',
  'xeljanz': 'Active Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis',
  'upadacitinib': 'Rheumatoid Arthritis, Atopic Dermatitis & Ulcerative Colitis',
  'rinvoq': 'Rheumatoid Arthritis, Crohn’s Disease & Atopic Dermatitis',
  'baricitinib': 'Rheumatoid Arthritis & Severe Alopecia Areata',
  'methotrexate': 'Rheumatoid Arthritis, Severe Psoriasis & Autoimmune Remission',
  'folitrax': 'Rheumatoid Arthritis & Severe Psoriatic Plaques',
  'hydroxychloroquine': 'Systemic Lupus Erythematosus (SLE) & Rheumatoid Arthritis',
  'hcqs': 'Systemic Lupus (SLE) & Autoimmune Joint Inflammation',
  'prednisolone': 'Severe Allergic Reactions, Autoimmune Flare-ups & Inflammation',
  'prednisone': 'Autoimmune Disorders, Severe Inflammation & Allergic Flare-ups',
  'wysolone': 'Severe Inflammatory Flare-ups, Allergies & Autoimmune Suppression',
  'defcort': 'Severe Inflammation, Joint Swelling & Allergic Disorders',
  'deflazacort': 'Anti-inflammatory & Immunosuppressive Therapy',

  // Cardiovascular & Hypertension
  'amlodipine': 'High Blood Pressure (Hypertension) & Angina (Chest Pain)',
  'stamlo': 'High Blood Pressure (Hypertension) & Chronic Stable Angina',
  'amlong': 'High Blood Pressure (Hypertension) & Angina Relief',
  'norvasc': 'High Blood Pressure (Hypertension) & Coronary Artery Disease',
  'telma': 'High Blood Pressure (Hypertension) & Cardiovascular Risk Reduction',
  'telmisartan': 'High Blood Pressure & Stroke / Heart Attack Risk Reduction',
  'telma h': 'Hypertension with Fluid Retention (Blood Pressure + Diuretic)',
  'losartan': 'High Blood Pressure & Diabetic Kidney Protection (Nephropathy)',
  'losar': 'High Blood Pressure & Diabetic Nephropathy',
  'olmesartan': 'High Blood Pressure (Hypertension) Management',
  'cilnidipine': 'Hypertension & Renal Microcirculation Protection',
  'cilacar': 'High Blood Pressure with Kidney-Protective Vasodilation',
  'atenolol': 'High Blood Pressure, Angina & Irregular Heart Rhythms',
  'metoprolol': 'High Blood Pressure, Angina, Heart Failure & Arrhythmia Control',
  'betaloc': 'High Blood Pressure & Post-Myocardial Infarction Protection',
  'nebivolol': 'Hypertension & Mild to Moderate Heart Failure',
  'bisoprolol': 'Chronic Heart Failure & High Blood Pressure Management',
  'concor': 'Hypertension & Chronic Stable Heart Failure',
  'lisinopril': 'High Blood Pressure (Hypertension) & Heart Failure Management',
  'ramipril': 'High Blood Pressure, Heart Failure & Post-Heart Attack Survival',
  'cardace': 'High Blood Pressure & Cardiovascular Disease Prevention',
  'enalapril': 'High Blood Pressure & Congestive Heart Failure',
  'sorbitrate': 'Acute Angina Pectoris (Chest Pain Relief)',
  'monit': 'Prevention of Chronic Angina (Chest Pain Attacks)',
  'nitroglycerin': 'Immediate Relief from Angina / Ischemic Chest Pain',

  // Anticoagulants & Antiplatelets (Blood Thinners)
  'warfarin': 'Blood Clot Prevention (Deep Vein Thrombosis, PE) & Stroke Risk in AFib',
  'coumadin': 'Blood Clot Treatment & Embolism Prevention in Heart Valve / AFib',
  'aspirin': 'Heart Attack & Stroke Prevention, Antiplatelet Protection & Pain Relief',
  'ecosprin': 'Low-Dose Blood Thinner for Heart Attack & Stroke Prevention',
  'clopidogrel': 'Prevention of Recurrent Stroke, Heart Attack & Arterial Stents',
  'plavix': 'Atherothrombosis Prevention & Post-Coronary Stent Anticoagulation',
  'clopilet': 'Blood Thinner & Clot Prevention in Stented Coronary Arteries',
  'rivaroxaban': 'Prevention of Deep Vein Thrombosis (DVT), Pulmonary Embolism & Stroke',
  'xarelto': 'DVT / PE Treatment & Stroke Prevention in Non-Valvular AFib',
  'apixaban': 'Non-Valvular AFib Stroke Prevention & Venous Thromboembolism Treatment',
  'eliquis': 'Blood Clot & Stroke Prevention in Atrial Fibrillation',
  'dabigatran': 'Direct Thrombin Inhibition for Blood Clot & Stroke Prevention',
  'pradaxa': 'DVT, Pulmonary Embolism & Non-Valvular AFib Thromboembolism',

  // Lipid / Cholesterol Lowering
  'atorvastatin': 'High Cholesterol (Hyperlipidemia) & Cardiovascular Disease Prevention',
  'atorva': 'Lowering LDL Bad Cholesterol & Heart Attack Prevention',
  'lipitor': 'High Cholesterol & Arterial Plaque Reduction',
  'rosuvastatin': 'High Cholesterol (Hyperlipidemia) & Arterial Plaque Stabilization',
  'rosuvas': 'Lowering LDL Bad Cholesterol & Triglyceride Reduction',
  'crestor': 'Hypercholesterolemia & Cardiovascular Atherosclerosis Prevention',
  'fenofibrate': 'High Blood Triglycerides (Hypertriglyceridemia)',
  'ezetimibe': 'Dietary Cholesterol Absorption Inhibition',

  // Gastroenterology, Acid-Peptic & Liver
  'pan': 'Acidity, Heartburn & Acid Reflux (GERD)',
  'pan 40': 'Acid Reflux (GERD), Heartburn & Peptic / Duodenal Ulcers',
  'pan-d': 'Acid Reflux (GERD), Heartburn, Gastric Ulcers & Acidity-related Nausea',
  'pand': 'Acid Reflux (GERD), Heartburn, Gastric Ulcers & Acidity-related Nausea',
  'pantoprazole': 'Acid Reflux (GERD), Erosive Esophagitis & Peptic Ulcer Healing',
  'pantocid': 'Stomach Acid Suppression & Acid Reflux Relief',
  'pantocid-d': 'Acid Reflux (GERD), Heartburn & Nausea Relief',
  'omez': 'Stomach Ulcers, Acid Reflux (GERD) & Hyperacidity',
  'omeprazole': 'Heartburn, Gastric Ulcers & Acid Reflux (GERD)',
  'rabeprazole': 'Rapid Acid Suppression for GERD & Duodenal Ulcers',
  'razo-d': 'GERD, Acidity, Heartburn & Dyspeptic Nausea',
  'rabicip': 'Acid Reflux & Excessive Stomach Acid Secretion',
  'rabekind-dsr': 'Chronic Acid Reflux (GERD), Gas & Morning Nausea',
  'esomeprazole': 'Acid Reflux (GERD), Heartburn & NSAID-Induced Ulcer Prevention',
  'nexpro': 'Gastroesophageal Reflux Disease (GERD) & Esophageal Healing',
  'digene': 'Instant Neutralization of Acidity, Gas & Bloating',
  'gelusil': 'Quick Relief from Heartburn, Stomach Gas & Hyperacidity',
  'loperamide': 'Acute Diarrhea, Watery Loose Motions & Cramping',
  'imodium': 'Diarrhea Relief & Slowing Intestinal Motility',
  'eldoper': 'Diarrhea, Loose Stools & Acute Gastroenteritis',
  'ors': 'Dehydration Recovery & Electrolyte Replenishment',
  'electral': 'Dehydration Recovery & Electrolyte Balance in Diarrhea',
  'ondansetron': 'Nausea, Vomiting & Motion Sickness Relief',
  'vomikind': 'Nausea, Vomiting & Post-Chemotherapy Emesis Prevention',
  'emeset': 'Nausea & Severe Vomiting Suppression',
  'domperidone': 'Nausea, Vomiting, Bloating & Gastric Motility Stimulation',
  'liv52': 'Liver Protection, Hepatic Detoxification & Appetite Improvement',
  'udiliv': 'Cholesterol Gallstones & Chronic Liver Cirrhosis / Cholestasis',
  'ursodeoxycholic acid': 'Gallstone Dissolution & Primary Biliary Cholangitis',

  // Diabetes & Metabolic
  'metformin': 'Type 2 Diabetes Mellitus & Blood Glucose Regulation',
  'glycomet': 'Type 2 Diabetes Mellitus & High Blood Sugar Control',
  'glucophage': 'Type 2 Diabetes & Insulin Resistance Management',
  'glimepiride': 'Type 2 Diabetes Blood Sugar Lowering via Insulin Secretion',
  'amaryl': 'Type 2 Diabetes Mellitus (Pancreatic Insulin Secretion)',
  'gliclazide': 'Type 2 Diabetes Mellitus Glycemic Control',
  'januvia': 'Type 2 Diabetes (DPP-4 Inhibitor for Blood Sugar Control)',
  'sitagliptin': 'Type 2 Diabetes Post-Meal Glucose Control',
  'galvus': 'Type 2 Diabetes Mellitus (DPP-4 Glycemic Regulation)',
  'vildagliptin': 'Type 2 Diabetes Mellitus Blood Sugar Regulation',
  'dapagliflozin': 'Type 2 Diabetes, Heart Failure & Chronic Kidney Protection',
  'forxiga': 'Type 2 Diabetes, Heart Failure & Diabetic Nephropathy',
  'empagliflozin': 'Type 2 Diabetes, Cardiovascular Risk Reduction & Heart Failure',
  'jardiance': 'Type 2 Diabetes Mellitus & Cardiovascular Protection',
  'rybelsus': 'Type 2 Diabetes Mellitus (Oral GLP-1 Receptor Agonist)',
  'semaglutide': 'Type 2 Diabetes Mellitus & Chronic Weight Management',

  // Anti-Infectives, Antibiotics & Antivirals
  'augmentin': 'Bacterial Infections (Ear, Throat, Sinus, Chest, Skin & UTI)',
  'amoxicillin': 'Bacterial Infections (Ear, Dental, Throat & Respiratory tract)',
  'mox': 'Bacterial Infections & Dental Abscesses',
  'azithromycin': 'Bacterial Respiratory Infections, Throat Infections & Bronchitis',
  'azithral': 'Bacterial Throat, Chest & Sinus Infections',
  'zithromax': 'Bacterial Respiratory, Skin & Chlamydial Infections',
  'ciprofloxacin': 'Bacterial Infections, Typhoid, Diarrhea & Urinary Tract Infections',
  'cifran': 'Bacterial Infections, UTI & Traveler’s Diarrhea',
  'ofloxacin': 'Bacterial Infections, Diarrhea & Lower Respiratory Infections',
  'norflox-tz': 'Bacterial Diarrhea, Amoebiasis & Gastrointestinal Infections',
  'norflox': 'Urinary Tract Infections (UTI) & Bacterial Gastroenteritis',
  'doxycycline': 'Bacterial Infections, Acne, Lyme Disease & Malaria Prophylaxis',
  'dox': 'Bacterial Infections, Severe Acne & Respiratory Infections',
  'cefixime': 'Bacterial Infections (Typhoid, UTI, Ear & Throat Infections)',
  'zifi': 'Bacterial Infections (Typhoid, Bronchitis & Ear Infections)',
  'taxim-o': 'Bacterial Infections of Respiratory & Urinary Tract',
  'fluconazole': 'Fungal & Yeast Infections (Candidiasis, Dermatophytosis)',
  'forcan': 'Oral Thrush, Vaginal Candidiasis & Systemic Fungal Infections',
  'itraconazole': 'Stubborn Fungal Nail Infections & Systemic Aspergillosis',
  'canditral': 'Recurrent Fungal Infections & Dermatophytosis',

  // Neurology, Psychiatry & Sleep
  'amitriptyline': 'Neuropathic Nerve Pain, Depression, Anxiety & Chronic Migraine Prevention',
  'gabapentin': 'Neuropathic Nerve Pain, Diabetic Neuropathy & Post-Herpetic Neuralgia',
  'gabapin': 'Diabetic Nerve Pain & Post-Shingles Neuropathic Ache',
  'pregabalin': 'Neuropathic Pain, Fibromyalgia, Spinal Nerve Ache & Anxiety',
  'lyrica': 'Fibromyalgia, Diabetic Peripheral Neuropathy & Neuropathic Pain',
  'pregalin': 'Peripheral Neuropathic Nerve Pain & Fibromyalgia',
  'sertraline': 'Depression, Panic Disorder, OCD & Social Anxiety',
  'daxid': 'Major Depressive Disorder & Anxiety Relief',
  'escitalopram': 'Generalized Anxiety Disorder & Major Depression',
  'nexito': 'Anxiety Disorders, Depression & Panic Attacks',
  'clonazepam': 'Panic Attacks, Severe Anxiety & Seizure Disorders',
  'clona': 'Acute Anxiety, Panic Attacks & Sleep Disturbances',
  'alprazolam': 'Short-Term Relief from Severe Anxiety & Panic Attacks',
  'alprax': 'Acute Panic Disorder & Severe Anxiety Relief',
  'restyl': 'Short-Term Acute Anxiety Relief',
  'baclofen': 'Severe Muscle Spasms, Spinal Spasticity & Multiple Sclerosis',
  'thiocolchicoside': 'Painful Muscle Spasms, Backache & Stiff Neck Relief',
  'myoril': 'Muscle Spasms, Stiff Neck & Acute Musculoskeletal Pain',

  // Thyroid & Endocrine
  'levothyroxine': 'Hypothyroidism (Underactive Thyroid Hormone Replacement)',
  'thyronorm': 'Underactive Thyroid (Hypothyroidism) Hormone Replacement',
  'eltroxin': 'Hypothyroidism & Thyroid Hormone Stabilization',

  // Vitamins, Minerals & Nutritional
  'd3b12 plus': 'Vitamin B12 & D3 Deficiency, Nerve Health & Neuropathic Support',
  'neurobion': 'Nerve Health, Neuropathy, Tingling Sensation & Vitamin B12 Support',
  'neurobion forte': 'Nerve Health Regeneration & High-Potency Vitamin B Complex',
  'shelcal': 'Calcium & Vitamin D3 Deficiency, Bone Mineral Density & Osteoporosis',
  'shelcal 500': 'Calcium & Vitamin D3 Deficiency, Bone Strength & Osteopenia',
  'calcium': 'Calcium Deficiency, Bone Health & Osteoporosis Prevention',
  'vitamin d': 'Vitamin D Deficiency, Calcium Absorption & Bone Health',
  'vitamin d3': 'Vitamin D Deficiency, Calcium Absorption & Bone Health',
  'cholecalciferol': 'Severe Vitamin D Deficiency & Bone Mineralization',
  'uprise d3': 'Correction of Vitamin D3 Deficiency & Immune Health',
  'folic acid': 'Folate Deficiency Anemia, Red Blood Cell Formation & Prenatal Health',
  'becosules': 'Mouth Ulcers, Vitamin B-Complex Deficiency & Tissue Repair',
  'supradyn': 'Daily Multivitamin, Energy Metabolism & Immunity Boost',
  'evion': 'Vitamin E Deficiency, Muscle Cramps & Cellular Antioxidant Protection',
  'zinc': 'Immune Defense, Tissue Healing & Zinc Deficiency Correction',
  'iron': 'Iron Deficiency Anemia & Red Blood Cell Hemoglobin Support',
  'autrin': 'Iron Deficiency Anemia & Nutritional Blood Building',

  // Herbal & Ayurvedic Supplements
  'turmeric': 'Joint Inflammation, Antioxidant Support & General Wellness',
  'curcumin': 'Joint Inflammation, Cellular Antioxidant Support & Mobility',
  'ashwagandha': 'Stress Relief, Vitality, Cognitive Health & Immune Adaptation',
  'ginkgo biloba': 'Cognitive Health, Memory Function & Peripheral Blood Circulation',
  'ginkgo': 'Brain Function, Memory Enhancement & Peripheral Circulation',
  'ginseng': 'Physical Stamina, Fatigue Reduction & Immune Vitality',
  'st john': 'Mild Depressive Symptoms & Mood Balance Support',
  'fish oil': 'Heart Health, Triglyceride Support & Joint Flexibility',
};

// ─── Active Chemical Salt Combinations ─────────────────────────────────────────
const CHEMICAL_SALT_INDICATIONS = [
  // Double / Triple salt combinations
  {
    pattern: /levocetirizine.*montelukast|montelukast.*levocetirizine/i,
    indication: 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma',
  },
  {
    pattern: /naproxen.*domperidone|domperidone.*naproxen/i,
    indication: 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting',
  },
  {
    pattern: /pantoprazole.*domperidone|domperidone.*pantoprazole/i,
    indication: 'Acid Reflux (GERD), Heartburn, Gastric Ulcers & Acidity-related Nausea',
  },
  {
    pattern: /rabeprazole.*domperidone|domperidone.*rabeprazole/i,
    indication: 'Chronic Acid Reflux (GERD), Hyperacidity & Dyspeptic Nausea',
  },
  {
    pattern: /amoxicillin.*clavulan|clavulan.*amoxicillin/i,
    indication: 'Bacterial Infections (Respiratory tract, Ear, Sinus, Skin & UTI)',
  },
  {
    pattern: /ibuprofen.*paracetamol|paracetamol.*ibuprofen/i,
    indication: 'Severe Musculoskeletal Pain, Joint Inflammation & High Fever',
  },
  {
    pattern: /paracetamol.*phenylephrine|phenylephrine.*paracetamol/i,
    indication: 'Common Cold, Sinus Congestion, Headache & Fever',
  },
  {
    pattern: /norfloxacin.*tinidazole|tinidazole.*norfloxacin/i,
    indication: 'Bacterial Diarrhea, Amoebiasis & Gastrointestinal Infection',
  },
  {
    pattern: /methylcobalamin.*pyridoxine|methylcobalamin.*folic/i,
    indication: 'Vitamin B12 Deficiency, Nerve Health & Neuropathic Support',
  },
  {
    pattern: /calcium.*vitamin d3|calcium.*cholecalciferol/i,
    indication: 'Calcium & Vitamin D3 Deficiency, Bone Density & Osteoporosis',
  },

  // Single active chemical salts
  {
    pattern: /tofacitinib/i,
    indication: 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis',
  },
  {
    pattern: /amlodipine/i,
    indication: 'High Blood Pressure (Hypertension) & Angina (Chest Pain)',
  },
  {
    pattern: /telmisartan/i,
    indication: 'High Blood Pressure (Hypertension) & Cardiovascular Risk Reduction',
  },
  {
    pattern: /losartan/i,
    indication: 'High Blood Pressure & Diabetic Kidney Protection',
  },
  {
    pattern: /metoprolol|atenolol|bisoprolol|nebivolol/i,
    indication: 'High Blood Pressure, Angina & Heart Rate Regulation',
  },
  {
    pattern: /metformin/i,
    indication: 'Type 2 Diabetes Mellitus & Blood Glucose Regulation',
  },
  {
    pattern: /glimepiride|gliclazide/i,
    indication: 'Type 2 Diabetes Mellitus & Pancreatic Insulin Stimulation',
  },
  {
    pattern: /dapagliflozin|empagliflozin/i,
    indication: 'Type 2 Diabetes Mellitus, Heart Failure & Kidney Protection',
  },
  {
    pattern: /atorvastatin|rosuvastatin|simvastatin/i,
    indication: 'High Cholesterol (Hyperlipidemia) & Cardiovascular Protection',
  },
  {
    pattern: /warfarin/i,
    indication: 'Blood Clot Prevention (Deep Vein Thrombosis, PE) & Stroke Prevention in AFib',
  },
  {
    pattern: /aspirin/i,
    indication: 'Cardiovascular Protection, Blood Thinner / Antiplatelet & Mild Pain Relief',
  },
  {
    pattern: /clopidogrel/i,
    indication: 'Blood Clot Prevention, Heart Attack & Stroke Prophylaxis',
  },
  {
    pattern: /pantoprazole|omeprazole|rabeprazole|esomeprazole/i,
    indication: 'Acid Reflux (GERD), Heartburn & Peptic Ulcers',
  },
  {
    pattern: /levocetirizine|cetirizine/i,
    indication: 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Itching',
  },
  {
    pattern: /montelukast/i,
    indication: 'Asthma Maintenance & Allergic Rhinitis Prophylaxis',
  },
  {
    pattern: /paracetamol|acetaminophen/i,
    indication: 'Fever Reduction, Headache & Mild to Moderate Pain Relief',
  },
  {
    pattern: /naproxen/i,
    indication: 'Acute Migraine Headache, Arthritis & Musculoskeletal Pain',
  },
  {
    pattern: /diclofenac/i,
    indication: 'Severe Joint Pain, Osteoarthritis & Musculoskeletal Inflammation',
  },
  {
    pattern: /ibuprofen/i,
    indication: 'Inflammatory Pain, Dental Ache, Muscle Sprains & Fever',
  },
  {
    pattern: /azithromycin/i,
    indication: 'Bacterial Respiratory Infections, Throat Infections & Bronchitis',
  },
  {
    pattern: /amoxicillin/i,
    indication: 'Bacterial Infections (Ear, Dental, Throat & Chest Infections)',
  },
  {
    pattern: /ciprofloxacin|ofloxacin/i,
    indication: 'Bacterial Infections, Typhoid, Diarrhea & Urinary Tract Infections',
  },
  {
    pattern: /fluconazole|itraconazole/i,
    indication: 'Fungal & Yeast Infections (Candidiasis, Dermatophytosis)',
  },
  {
    pattern: /gabapentin|pregabalin/i,
    indication: 'Neuropathic Nerve Pain, Diabetic Neuropathy & Fibromyalgia',
  },
  {
    pattern: /amitriptyline/i,
    indication: 'Neuropathic Nerve Pain, Depression, Anxiety & Chronic Migraine Prevention',
  },
  {
    pattern: /levothyroxine/i,
    indication: 'Hypothyroidism (Underactive Thyroid Hormone Replacement)',
  },
  {
    pattern: /ondansetron/i,
    indication: 'Nausea, Vomiting & Motion Sickness Relief',
  },
  {
    pattern: /loperamide/i,
    indication: 'Acute Diarrhea, Watery Loose Motions & Cramping',
  },
  {
    pattern: /cholecalciferol|vitamin d3/i,
    indication: 'Vitamin D Deficiency, Calcium Absorption & Bone Health',
  },
  {
    pattern: /folic acid/i,
    indication: 'Folate Deficiency Anemia, Red Blood Cell Production & Prenatal Support',
  },
  {
    pattern: /curcumin|turmeric/i,
    indication: 'Joint Inflammation, Antioxidant Support & General Wellness',
  },
  {
    pattern: /ashwagandha/i,
    indication: 'Stress Reduction, Vitality, Cognitive Health & Immunity',
  },
  {
    pattern: /ginkgo/i,
    indication: 'Cognitive Health, Memory Function & Peripheral Circulation',
  },
];

// ─── Suffix / Root Class Heuristics ───────────────────────────────────────────
const SUFFIX_INDICATIONS = [
  { test: (s) => /statin$/i.test(s), text: 'High Cholesterol (Hyperlipidemia) & Cardiovascular Protection' },
  { test: (s) => /pril$/i.test(s), text: 'High Blood Pressure (Hypertension) & Heart Failure Management' },
  { test: (s) => /sartan$/i.test(s), text: 'High Blood Pressure (Hypertension) & Cardiovascular Protection' },
  { test: (s) => /olol$/i.test(s), text: 'High Blood Pressure, Angina & Heart Rate Regulation' },
  { test: (s) => /dipine$/i.test(s), text: 'High Blood Pressure (Hypertension) & Angina (Chest Pain)' },
  { test: (s) => /prazole$/i.test(s), text: 'Acid Reflux (GERD), Heartburn & Peptic Ulcers' },
  { test: (s) => /tidine$/i.test(s), text: 'Gastric Acidity, Heartburn & Acid Reflux' },
  { test: (s) => /gliflozin$/i.test(s), text: 'Type 2 Diabetes Mellitus, Heart Failure & Kidney Protection' },
  { test: (s) => /gliptin$/i.test(s), text: 'Type 2 Diabetes Mellitus & Blood Glucose Regulation' },
  { test: (s) => /tinib$/i.test(s), text: 'Autoimmune Inflammatory Disorders & Arthritis' },
  { test: (s) => /mab$/i.test(s), text: 'Targeted Immunotherapy & Autoimmune Conditions' },
  { test: (s) => /cillin$/i.test(s), text: 'Bacterial Infections Treatment' },
  { test: (s) => /mycin$/i.test(s), text: 'Bacterial Respiratory, Skin & Soft Tissue Infections' },
  { test: (s) => /cycline$/i.test(s), text: 'Bacterial Infections, Acne & Respiratory Infections' },
  { test: (s) => /floxacin$/i.test(s), text: 'Bacterial Infections, UTI & Gastrointestinal Infections' },
  { test: (s) => /zole$/i.test(s), text: 'Fungal or Parasitic Infection Treatment' },
  { test: (s) => /triptan$/i.test(s), text: 'Acute Migraine Attack & Severe Throbbing Headaches' },
  { test: (s) => /terol$/i.test(s), text: 'Asthma, Wheezing & Bronchial Airway Obstruction' },
  { test: (s) => /profen|fenac|coxib$/i.test(s), text: 'Pain Relief, Joint Inflammation, Arthritis & Musculoskeletal Aches' },
];

/**
 * getMedicineIndication(medOrName)
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary public utility to resolve "What this medicine is used for / which issue".
 *
 * @param {Object|string} medOrName - Medication object or medicine name string
 * @returns {string} Human-friendly clinical condition or indication
 */
export function getMedicineIndication(medOrName) {
  if (!medOrName) return 'Prescribed Medical Treatment';

  const med = typeof medOrName === 'string' ? { name: medOrName } : medOrName;

  // 1. Direct explicit purpose or indication from database/backend
  if (med.purpose && typeof med.purpose === 'string' && med.purpose.trim().length > 3) {
    return med.purpose.trim();
  }
  if (med.indication && typeof med.indication === 'string' && med.indication.trim().length > 3) {
    return med.indication.trim();
  }

  const rawName = String(med.name || '').toLowerCase().trim();
  const rawGeneric = String(med.generic || '').toLowerCase().trim();
  const rawDosage = String(med.dosage || '').toLowerCase();
  const rawCategory = String(med.category || '').toLowerCase();

  // Extract cleaned brand key (e.g., "Xyzal M" -> "xyzal m" or "xyzal")
  const cleanedName = rawName
    .replace(/\s+\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)?$/i, '')
    .trim();

  // Extract salts from dosage string if present: "salts: levocetirizine dihydrochloride + montelukast sodium"
  let saltsText = '';
  if (rawDosage.includes('salts:')) {
    const parts = rawDosage.split('•');
    const saltPart = parts.find((p) => p.includes('salts:'));
    if (saltPart) {
      saltsText = saltPart.replace('salts:', '').trim();
    }
  }

  const combinedSearchText = `${rawName} ${cleanedName} ${rawGeneric} ${saltsText} ${rawDosage}`.toLowerCase();

  // 2. Direct dictionary lookup by exact cleaned name or brand key
  if (MEDICINE_INDICATIONS[cleanedName]) {
    return MEDICINE_INDICATIONS[cleanedName];
  }
  if (MEDICINE_INDICATIONS[rawName]) {
    return MEDICINE_INDICATIONS[rawName];
  }

  // 3. Substring match across dictionary keys (e.g. "xyzal", "naxdom", "dolo", "pan-d")
  for (const [key, indication] of Object.entries(MEDICINE_INDICATIONS)) {
    if (key.length >= 4 && (rawName.includes(key) || cleanedName.includes(key))) {
      return indication;
    }
  }

  // 4. Chemical salt and active formulation pattern matching
  for (const item of CHEMICAL_SALT_INDICATIONS) {
    if (item.pattern.test(combinedSearchText)) {
      return item.indication;
    }
  }

  // 5. Chemical drug suffix / stem matching
  const words = `${cleanedName} ${rawGeneric}`.split(/\s+/).filter(Boolean);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/gi, '');
    for (const rule of SUFFIX_INDICATIONS) {
      if (rule.test(cleanWord)) {
        return rule.text;
      }
    }
  }

  // 6. Clinical category heuristics
  if (rawCategory.includes('antihypertensive') || rawCategory.includes('blood pressure')) {
    return 'High Blood Pressure (Hypertension) & Cardiovascular Health';
  }
  if (rawCategory.includes('antidiabetic') || rawCategory.includes('diabetes')) {
    return 'Type 2 Diabetes Mellitus & Blood Glucose Regulation';
  }
  if (rawCategory.includes('anticoagulant')) {
    return 'Blood Clot Prevention & Anticoagulation Therapy';
  }
  if (rawCategory.includes('antiplatelet')) {
    return 'Blood Thinner, Heart Attack & Stroke Prevention';
  }
  if (rawCategory.includes('analgesic') || rawCategory.includes('nsaid') || rawCategory.includes('pain')) {
    return 'Pain Relief, Fever & Inflammation Management';
  }
  if (rawCategory.includes('ppi') || rawCategory.includes('antacid') || rawCategory.includes('gerd')) {
    return 'Acid Reflux (GERD), Heartburn & Peptic Ulcers';
  }
  if (rawCategory.includes('antibiotic')) {
    return 'Bacterial Infections Treatment';
  }
  if (rawCategory.includes('antihistamine') || rawCategory.includes('allergy')) {
    return 'Allergic Rhinitis, Sneezing, Runny Nose & Itching';
  }
  if (rawCategory.includes('statin') || rawCategory.includes('cholesterol')) {
    return 'High Cholesterol & Cardiovascular Protection';
  }
  if (rawCategory.includes('supplement') || rawCategory.includes('vitamin') || rawCategory.includes('mineral')) {
    return 'Nutritional Supplementation & General Wellness';
  }
  if (med.type === 'HERBAL') {
    return 'Herbal Wellness & Natural Therapeutic Support';
  }

  return 'Prescribed Medical Treatment';
}
