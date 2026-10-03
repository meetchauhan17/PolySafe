/**
 * services/drugAliases.js
 *
 * Centralized clinical drug aliases, brand name mappings, RxNorm CUI resolutions,
 * and parenthetical constituent parsers for Indian and international formulations.
 */

'use strict';

const BRAND_ALIASES = {
  'xyzal':       { display: 'Xyzal M (Levocetirizine + Montelukast)', generic: 'Levocetirizine', rxcui: '20610', dosage: '5mg + 10mg', purpose: 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma', category: 'Antihistamine / Leukotriene Inhibitor', safetyTip: 'Usually taken once daily in the evening or morning. Low sedation risk.', dosageOptions: ['5mg', '5mg+10mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'xyzal m':     { display: 'Xyzal M (Levocetirizine + Montelukast)', generic: 'Levocetirizine', rxcui: '20610', dosage: '5mg + 10mg', purpose: 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma', category: 'Antihistamine / Leukotriene Inhibitor', safetyTip: 'Usually taken once daily in the evening or morning. Low sedation risk.', dosageOptions: ['5mg', '5mg+10mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'tfct-nib':    { display: 'TFCT-NIB (Tofacitinib Citrate)', generic: 'Tofacitinib', rxcui: '1359133', dosage: '5 mg', purpose: 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis', category: 'JAK Kinase Inhibitor / Immunosuppressant', safetyTip: 'High-alert immunosuppressant. Routine CBC, liver enzymes, and infection surveillance required.', dosageOptions: ['5 mg', '11 mg XR'], commonFrequency: 'twice', foodInstruction: 'with_or_without_food' },
  'tfct-nib 5 mg': { display: 'TFCT-NIB 5 mg (Tofacitinib)', generic: 'Tofacitinib', rxcui: '1359133', dosage: '5 mg', purpose: 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis', category: 'JAK Kinase Inhibitor / Immunosuppressant', safetyTip: 'High-alert immunosuppressant. Routine CBC, liver enzymes, and infection surveillance required.', dosageOptions: ['5 mg', '11 mg XR'], commonFrequency: 'twice', foodInstruction: 'with_or_without_food' },
  'tofacitinib': { display: 'Tofacitinib Citrate', generic: 'Tofacitinib', rxcui: '1359133', dosage: '5 mg', purpose: 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis', category: 'JAK Kinase Inhibitor / Immunosuppressant', safetyTip: 'High-alert immunosuppressant. Routine CBC, liver enzymes, and infection surveillance required.', dosageOptions: ['5 mg', '11 mg XR'], commonFrequency: 'twice', foodInstruction: 'with_or_without_food' },
  'd3b12 plus':  { display: 'D3B12 PLUS (Methylcobalamin + B6 + Folic Acid + D3)', generic: 'Methylcobalamin', rxcui: '11248', dosage: '1 tablet daily', purpose: 'Vitamin B12 & D3 Deficiency, Nerve Health & Neuropathic Support', category: 'Vitamin / Neuro-Supportive', safetyTip: 'Take after meals. Supports peripheral nerve regeneration and bone health.', dosageOptions: ['1 tablet daily'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'naxdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', purpose: 'Migraine, Severe Headache & Joint Pain', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'nexdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', purpose: 'Migraine, Severe Headache & Joint Pain', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 500':  { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', purpose: 'Migraine, Severe Headache & Joint Pain', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 250':  { display: 'Naxdom 250 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '250 mg', purpose: 'Migraine, Severe Headache & Joint Pain', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'dolo':        { display: 'Dolo 650 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '650 mg', purpose: 'Fever, Headache & Body Pain', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'dolo 650':    { display: 'Dolo 650 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '650 mg', purpose: 'Fever, Headache & Body Pain', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'crocin':      { display: 'Crocin (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', purpose: 'Fever & Mild Headache Relief', category: 'Analgesic / Antipyretic', safetyTip: 'Monitor total daily paracetamol intake across all cold/fever formulations.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'calpol':      { display: 'Calpol 500 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', purpose: 'Fever, Headache & Body Pain', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg daily total from all paracetamol sources.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'pan-d':       { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', purpose: 'Acidity, Gas & Acid Reflux (GERD)', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pand':        { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', purpose: 'Acidity, Gas & Acid Reflux (GERD)', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pan d':       { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', purpose: 'Acidity, Gas & Acid Reflux (GERD)', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pan 40':      { display: 'Pan 40 (Pantoprazole)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', purpose: 'Acidity, Heartburn & Stomach Ulcers', category: 'PPI / Antacid', safetyTip: 'Take 30 minutes before breakfast with water.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'augmentin':   { display: 'Augmentin (Amoxicillin + Clavulanate)', generic: 'Amoxicillin', rxcui: '723', dosage: '625 mg', purpose: 'Bacterial Infection (Antibiotic)', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'augmentin 625': { display: 'Augmentin (Amoxicillin + Clavulanate)', generic: 'Amoxicillin', rxcui: '723', dosage: '625 mg', purpose: 'Bacterial Infection (Antibiotic)', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ecosprin':    { display: 'Ecosprin (Aspirin)', generic: 'Aspirin', rxcui: '1191', dosage: '75 mg', purpose: 'Blood Thinner & Heart Protection', category: 'Antiplatelet / Cardio', safetyTip: 'Low-dose cardio-protective. Take with food to minimize gastric bleeding risk.', dosageOptions: ['75 mg', '150 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'combiflam':   { display: 'Combiflam (Ibuprofen + Paracetamol)', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', purpose: 'Body Pain, Headache & Joint Pain', category: 'NSAID / Pain Relief', safetyTip: 'Take after meals. Avoid if you have active peptic ulcer or renal impairment.', dosageOptions: ['400 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'loperamide':  { display: 'Loperamide (Imodium / Eldoper)', generic: 'Loperamide', rxcui: '6468', dosage: '2 mg', purpose: 'Diarrhea & Loose Motions', category: 'Antidiarrheal', safetyTip: 'Do not use if fever or blood in stool. Drink plenty of electrolyte fluids (ORS).', dosageOptions: ['2 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'imodium':     { display: 'Imodium (Loperamide)', generic: 'Loperamide', rxcui: '6468', dosage: '2 mg', purpose: 'Diarrhea & Loose Motions', category: 'Antidiarrheal', safetyTip: 'Slows gut transit. Replenish lost fluids continuously.', dosageOptions: ['2 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'eldoper':     { display: 'Eldoper (Loperamide)', generic: 'Loperamide', rxcui: '6468', dosage: '2 mg', purpose: 'Diarrhea & Loose Stools', category: 'Antidiarrheal', safetyTip: 'Take 1 capsule after each unformed stool. Max 8mg per day.', dosageOptions: ['2 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'ors':         { display: 'ORS (Electral / Oral Rehydration Salts)', generic: 'Oral Rehydration Salts', rxcui: null, dosage: '1 sachet', purpose: 'Dehydration & Diarrhea Recovery', category: 'Electrolyte Solution', safetyTip: 'Dissolve in 1 liter of clean drinking water. Discard unused solution after 24 hours.', dosageOptions: ['1 sachet (21.8g)'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'electral':    { display: 'Electral (WHO Formula ORS)', generic: 'Oral Rehydration Salts', rxcui: null, dosage: '1 sachet', purpose: 'Dehydration & Diarrhea Recovery', category: 'Electrolyte Solution', safetyTip: 'Drink throughout the day to replenish electrolytes lost from diarrhea or dehydration.', dosageOptions: ['1 sachet (21.8g)'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'norflox tz':  { display: 'Norflox-TZ (Norfloxacin + Tinidazole)', generic: 'Norfloxacin', rxcui: '7517', dosage: '1 tablet', purpose: 'Diarrhea, Loose Motions & Stomach Infection', category: 'Antibiotic / Antiprotozoal', safetyTip: 'Complete prescribed 3-5 day course. Avoid dairy products around ingestion time.', dosageOptions: ['1 tablet'], commonFrequency: 'twice', foodInstruction: 'avoid_dairy' },
  'norflox':     { display: 'Norflox-TZ (Norfloxacin + Tinidazole)', generic: 'Norfloxacin', rxcui: '7517', dosage: '1 tablet', purpose: 'Diarrhea, Loose Motions & Stomach Infection', category: 'Antibiotic / Antiprotozoal', safetyTip: 'Complete prescribed 3-5 day course. Avoid dairy products around ingestion time.', dosageOptions: ['1 tablet'], commonFrequency: 'twice', foodInstruction: 'avoid_dairy' },
  'digene':      { display: 'Digene (Antacid & Antigas)', generic: 'Magnesium + Aluminium Hydroxide + Simethicone', rxcui: null, dosage: '2 tablets', purpose: 'Acidity, Gas Relief & Indigestion', category: 'Antacid / Antiflatulent', safetyTip: 'Chew thoroughly before swallowing, 1 hour after meals and at bedtime.', dosageOptions: ['10 ml', '2 tablets'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'gelusil':     { display: 'Gelusil (Antacid & Gas Relief)', generic: 'Aluminium + Magnesium Hydroxide + Simethicone', rxcui: null, dosage: '2 tablets', purpose: 'Acidity, Heartburn & Gas Relief', category: 'Antacid', safetyTip: 'Take after meals. Separate from other oral medications by 2 hours.', dosageOptions: ['10 ml', '2 tablets'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'cheston cold':{ display: 'Cheston Cold (Cetirizine + Paracetamol + Phenylephrine)', generic: 'Cetirizine', rxcui: '20610', dosage: '1 tablet', purpose: 'Cold, Headache, Fever & Blocked Nose', category: 'Cold & Cough Combination', safetyTip: 'May cause drowsiness; avoid driving or alcohol after taking.', dosageOptions: ['1 tablet'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'sinarest':    { display: 'Sinarest (Paracetamol + Phenylephrine + Chlorpheniramine)', generic: 'Acetaminophen', rxcui: '161', dosage: '1 tablet', purpose: 'Common Cold, Headache & Runny Nose', category: 'Cold & Sinus Relief', safetyTip: 'Avoid taking other paracetamol formulations simultaneously.', dosageOptions: ['1 tablet'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'ascoril':     { display: 'Ascoril Expectorant / Ascoril-D', generic: 'Dextromethorphan / Guaifenesin', rxcui: null, dosage: '10 ml', purpose: 'Cough, Chest Congestion & Cold', category: 'Cough Expectorant', safetyTip: 'Measure with graduated cup. Drink warm water.', dosageOptions: ['5 ml', '10 ml'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'meftal spas': { display: 'Meftal-Spas (Mefenamic Acid + Dicyclomine)', generic: 'Mefenamic Acid', rxcui: '6754', dosage: '1 tablet', purpose: 'Stomach Cramps & Menstrual Pain', category: 'Antispasmodic / NSAID', safetyTip: 'Take after meals to prevent stomach discomfort.', dosageOptions: ['1 tablet'], commonFrequency: 'asneeded', foodInstruction: 'after_food' },
  'ondansetron': { display: 'Ondansetron (Vomikind / Emeset)', generic: 'Ondansetron', rxcui: '26225', dosage: '4 mg', purpose: 'Nausea & Vomiting Relief', category: 'Antiemetic', safetyTip: 'Take 30 minutes before food or as advised for acute nausea.', dosageOptions: ['4 mg', '8 mg'], commonFrequency: 'asneeded', foodInstruction: 'any' },
  'vomikind':    { display: 'Vomikind 4 (Ondansetron)', generic: 'Ondansetron', rxcui: '26225', dosage: '4 mg', purpose: 'Nausea & Vomiting Relief', category: 'Antiemetic', safetyTip: 'Fast-dissolving; dissolves on tongue without water.', dosageOptions: ['4 mg'], commonFrequency: 'asneeded', foodInstruction: 'any' },
  'telma':       { display: 'Telma (Telmisartan)', generic: 'Telmisartan', rxcui: '42355', dosage: '40 mg', purpose: 'High Blood Pressure (Hypertension)', category: 'Antihypertensive (ARB)', safetyTip: 'Take consistently at the same time each day; monitor blood pressure regularly.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'voveran':     { display: 'Voveran (Diclofenac)', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', purpose: 'Joint Pain & Severe Inflammation', category: 'NSAID / Anti-inflammatory', safetyTip: 'Potent anti-inflammatory. Take with food or antacid to avoid stomach irritation.', dosageOptions: ['50 mg', '75 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'shelcal':     { display: 'Shelcal 500 (Calcium + Vitamin D3)', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', purpose: 'Calcium Deficiency & Bone Strength', category: 'Bone Health / Mineral', safetyTip: 'Take with or after lunch for optimal absorption; separate from iron supplements by 2 hours.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'warfarin':    { display: 'Warfarin', generic: 'Warfarin', rxcui: '11289', dosage: '5 mg', purpose: 'Prevent Blood Clots & Stroke Risk', category: 'Anticoagulant (Blood Thinner)', safetyTip: 'CRITICAL: Maintain consistent Vitamin K intake. Regular INR blood tests required. Avoid NSAIDs.', dosageOptions: ['1 mg', '2 mg', '2.5 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aspirin':     { display: 'Aspirin', generic: 'Aspirin', rxcui: '1191', dosage: '81 mg', purpose: 'Pain, Fever & Heart Attack Prevention', category: 'Antiplatelet / NSAID', safetyTip: 'Take with food or a full glass of water. Report any unusual bruising or bleeding immediately.', dosageOptions: ['75 mg', '81 mg', '100 mg', '325 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'metformin':   { display: 'Metformin', generic: 'Metformin', rxcui: '6809', dosage: '500 mg', purpose: 'Type 2 Diabetes (Blood Sugar Control)', category: 'Antidiabetic (Biguanide)', safetyTip: 'Take with or immediately after meals to reduce gastrointestinal upset.', dosageOptions: ['250 mg', '500 mg', '850 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'glycomet':    { display: 'Glycomet 500 (Metformin)', generic: 'Metformin', rxcui: '6809', dosage: '500 mg', purpose: 'Type 2 Diabetes (Blood Sugar Control)', category: 'Antidiabetic (Biguanide)', safetyTip: 'Take with food. Reduces hepatic glucose production.', dosageOptions: ['500 mg', '850 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'atorvastatin':{ display: 'Atorvastatin', generic: 'Atorvastatin', rxcui: '83367', dosage: '10 mg', purpose: 'High Cholesterol & Heart Health', category: 'Statin / Cholesterol', safetyTip: 'Usually taken at bedtime. Avoid excessive grapefruit juice. Report muscle pain.', dosageOptions: ['10 mg', '20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'lisinopril':  { display: 'Lisinopril', generic: 'Lisinopril', rxcui: '29046', dosage: '10 mg', purpose: 'High Blood Pressure & Heart Failure', category: 'Antihypertensive (ACEi)', safetyTip: 'Monitor for persistent dry cough or dizziness when standing up.', dosageOptions: ['2.5 mg', '5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'amlodipine':  { display: 'Amlodipine', generic: 'Amlodipine', rxcui: '17767', dosage: '5 mg', purpose: 'High Blood Pressure & Chest Pain', category: 'Calcium Channel Blocker', safetyTip: 'Check for ankle swelling (peripheral edema) or lightheadedness.', dosageOptions: ['2.5 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'simvastatin': { display: 'Simvastatin', generic: 'Simvastatin', rxcui: '36567', dosage: '20 mg', purpose: 'High Cholesterol Management', category: 'Statin / Cholesterol', safetyTip: 'Take in the evening. Avoid strong CYP3A4 inhibitors (e.g. fluconazole, clarithromycin).', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'omeprazole':  { display: 'Omeprazole', generic: 'Omeprazole', rxcui: '40790', dosage: '20 mg', purpose: 'Heartburn, Ulcers & Acidity', category: 'PPI / Antacid', safetyTip: 'Take 30-60 minutes before the first meal of the day.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ibuprofen':   { display: 'Ibuprofen', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', purpose: 'Headache, Muscle Pain & Fever', category: 'NSAID / Pain Relief', safetyTip: 'Always take with food or milk. High risk of interaction with blood thinners (Warfarin/Aspirin).', dosageOptions: ['200 mg', '400 mg', '600 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'fluconazole': { display: 'Fluconazole', generic: 'Fluconazole', rxcui: '4450', dosage: '150 mg', purpose: 'Fungal & Yeast Infections', category: 'Antifungal', safetyTip: 'Potent CYP enzyme inhibitor — significantly elevates statin and warfarin blood levels.', dosageOptions: ['50 mg', '150 mg', '200 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'losartan':    { display: 'Losartan', generic: 'Losartan', rxcui: '52175', dosage: '50 mg', purpose: 'High Blood Pressure & Kidney Protection', category: 'Antihypertensive (ARB)', safetyTip: 'Avoid potassium supplements or salt substitutes containing potassium without consulting doctor.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'metoprolol':  { display: 'Metoprolol', generic: 'Metoprolol', rxcui: '6918', dosage: '50 mg', purpose: 'High Blood Pressure & Heart Rhythm', category: 'Beta Blocker', safetyTip: 'Take with or right after food. Do not stop abruptly — taper under medical guidance.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'prednisone':  { display: 'Prednisone', generic: 'Prednisone', rxcui: '8640', dosage: '10 mg', purpose: 'Inflammation, Allergies & Arthritis', category: 'Corticosteroid', safetyTip: 'Take with morning food to mimic natural cortisol cycle and minimize insomnia.', dosageOptions: ['5 mg', '10 mg', '20 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'levothyroxine':{ display: 'Levothyroxine', generic: 'Levothyroxine', rxcui: '10582', dosage: '50 mcg', purpose: 'Hypothyroidism (Thyroid Support)', category: 'Thyroid Hormone', safetyTip: 'Take first thing in the morning on an empty stomach with a full glass of water, 30-60 min before breakfast.', dosageOptions: ['25 mcg', '50 mcg', '75 mcg', '100 mcg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'azithromycin':{ display: 'Azithromycin', generic: 'Azithromycin', rxcui: '18631', dosage: '500 mg', purpose: 'Throat, Chest & Respiratory Infection', category: 'Macrolide Antibiotic', safetyTip: 'Take 1 hour before or 2 hours after food. Separate from aluminium/magnesium antacids.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'cetirizine':  { display: 'Cetirizine', generic: 'Cetirizine', rxcui: '20610', dosage: '10 mg', purpose: 'Allergy, Sneezing, Runny Nose & Itching', category: 'Antihistamine (Allergy)', safetyTip: 'May cause mild drowsiness. Best taken in the evening with water.', dosageOptions: ['5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'pantoprazole':{ display: 'Pantoprazole', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', purpose: 'Acidity, Heartburn & Peptic Ulcer', category: 'PPI / Antacid', safetyTip: 'Swallow whole — do not crush or chew. Take 30-60 min before breakfast.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ranitidine':  { display: 'Ranitidine', generic: 'Ranitidine', rxcui: '9143', dosage: '150 mg', purpose: 'Acid Indigestion & Stomach Ulcer', category: 'H2 Blocker / Antacid', safetyTip: 'Can be taken with or without food. Used for short-term relief of acid indigestion.', dosageOptions: ['75 mg', '150 mg', '300 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'montelukast': { display: 'Montelukast', generic: 'Montelukast', rxcui: '88249', dosage: '10 mg', purpose: 'Asthma Prevention & Allergic Rhinitis', category: 'Leukotriene Inhibitor (Asthma)', safetyTip: 'Usually taken once daily in the evening for asthma and allergic rhinitis.', dosageOptions: ['4 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'gabapentin':  { display: 'Gabapentin', generic: 'Gabapentin', rxcui: '25480', dosage: '300 mg', purpose: 'Nerve Pain & Neuropathy Relief', category: 'Anticonvulsant / Neuropathic', safetyTip: 'May cause dizziness or sedation; avoid alcohol. Do not abruptly discontinue.', dosageOptions: ['100 mg', '300 mg', '600 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'clopidogrel': { display: 'Clopidogrel', generic: 'Clopidogrel', rxcui: '32968', dosage: '75 mg', purpose: 'Stroke & Heart Attack Prevention', category: 'Antiplatelet', safetyTip: 'Do not stop without cardiologist advice. Avoid taking with omeprazole unless directed.', dosageOptions: ['75 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'rosuvastatin':{ display: 'Rosuvastatin', generic: 'Rosuvastatin', rxcui: '301542', dosage: '10 mg', purpose: 'High Cholesterol Reduction', category: 'Statin / Cholesterol', safetyTip: 'Can be taken at any time of day, with or without food. Report unexplained muscle aches.', dosageOptions: ['5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'amoxicillin': { display: 'Amoxicillin', generic: 'Amoxicillin', rxcui: '723', dosage: '500 mg', purpose: 'Bacterial Infection (Ear, Chest, Dental)', category: 'Penicillin Antibiotic', safetyTip: 'Take at evenly spaced intervals and finish the entire prescription.', dosageOptions: ['250 mg', '500 mg', '875 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'ciprofloxacin':{ display: 'Ciprofloxacin', generic: 'Ciprofloxacin', rxcui: '2551', dosage: '500 mg', purpose: 'Bacterial Infection & UTI Treatment', category: 'Fluoroquinolone Antibiotic', safetyTip: 'Do not take with dairy products or calcium-fortified juices alone. Drink plenty of fluids.', dosageOptions: ['250 mg', '500 mg', '750 mg'], commonFrequency: 'twice', foodInstruction: 'avoid_dairy' },
  'diclofenac':  { display: 'Diclofenac', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', purpose: 'Arthritis & Musculoskeletal Pain', category: 'NSAID / Pain Relief', safetyTip: 'Take with food. Monitor for fluid retention, blood pressure changes, or GI distress.', dosageOptions: ['25 mg', '50 mg', '75 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naproxen':    { display: 'Naproxen', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', purpose: 'Joint Pain, Tendonitis & Cramps', category: 'NSAID / Anti-inflammatory', safetyTip: 'Take with food or milk. Avoid taking multiple NSAIDs concurrently.', dosageOptions: ['250 mg', '375 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'tramadol':    { display: 'Tramadol', generic: 'Tramadol', rxcui: '10689', dosage: '50 mg', purpose: 'Moderate to Severe Pain Relief', category: 'Opioid Analgesic', safetyTip: 'Risk of sedation and serotonin syndrome when taken with SSRI antidepressants.', dosageOptions: ['50 mg', '100 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_food' },
  'sertraline':  { display: 'Sertraline', generic: 'Sertraline', rxcui: '36437', dosage: '50 mg', purpose: 'Depression, Anxiety & OCD Support', category: 'SSRI Antidepressant', safetyTip: 'Take once daily in morning or evening. Takes 2-4 weeks for full therapeutic effect.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'fluoxetine':  { display: 'Fluoxetine', generic: 'Fluoxetine', rxcui: '4493', dosage: '20 mg', purpose: 'Depression & Anxiety Disorders', category: 'SSRI Antidepressant', safetyTip: 'Usually taken in the morning due to energizing effect. Long half-life.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'clonazepam':  { display: 'Clonazepam', generic: 'Clonazepam', rxcui: '2598', dosage: '0.5 mg', purpose: 'Anxiety Panic Attacks & Seizures', category: 'Benzodiazepine / Sedative', safetyTip: 'HIGH SEDATION: Additive CNS depression when combined with opioids or antihistamines.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg', '2 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'alprazolam':  { display: 'Alprazolam', generic: 'Alprazolam', rxcui: '596', dosage: '0.25 mg', purpose: 'Acute Anxiety & Panic Attacks', category: 'Benzodiazepine / Anxiolytic', safetyTip: 'Short-acting sedative. Avoid alcohol. May impair driving/machinery operation.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'hydrochlorothiazide': { display: 'Hydrochlorothiazide', generic: 'Hydrochlorothiazide', rxcui: '5487', dosage: '25 mg', purpose: 'Fluid Retention & High Blood Pressure', category: 'Thiazide Diuretic', safetyTip: 'Take in the morning to prevent nighttime urination. Stay hydrated.', dosageOptions: ['12.5 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'furosemide':  { display: 'Furosemide', generic: 'Furosemide', rxcui: '4603', dosage: '40 mg', purpose: 'Fluid Overload (Edema) & Heart Failure', category: 'Loop Diuretic', safetyTip: 'Take early in the day. Monitor potassium levels and blood pressure.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'paracetamol': { display: 'Paracetamol (Acetaminophen)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', purpose: 'Fever, Headache & General Pain', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'acetaminophen':{ display: 'Acetaminophen (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', purpose: 'Fever & Mild Pain Relief', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'turmeric':    { display: 'Turmeric (Curcumin)', generic: 'Turmeric', rxcui: null, dosage: '500 mg', purpose: 'Joint Health & Herbal Anti-inflammatory', category: 'Ayurvedic / Herbal Anti-inflammatory', safetyTip: 'Natural anticoagulant effect — moderate bleeding interaction risk with Warfarin/Aspirin.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'ashwagandha': { display: 'Ashwagandha (Withania somnifera)', generic: 'Ashwagandha', rxcui: null, dosage: '300 mg', purpose: 'Stress Relief, Vitality & Calming', category: 'Ayurvedic Adaptogen / Calming', safetyTip: 'May have additive sedative effect when combined with CNS depressants or thyroid meds.', dosageOptions: ['300 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginkgo':      { display: 'Ginkgo Biloba', generic: 'Ginkgo', rxcui: null, dosage: '120 mg', purpose: 'Brain Health & Memory Support', category: 'Herbal Supplement (Cognitive)', safetyTip: 'Inhibits platelet aggregation — increased bleeding risk when paired with blood thinners.', dosageOptions: ['60 mg', '120 mg', '240 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginseng':     { display: 'Ginseng (Panax ginseng)', generic: 'Ginseng', rxcui: null, dosage: '200 mg', purpose: 'Energy, Stamina & Immune Support', category: 'Herbal Energy / Adaptogen', safetyTip: 'May lower blood sugar; caution if on insulin or metformin. Can reduce Warfarin efficacy.', dosageOptions: ['100 mg', '200 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'st john':     { display: "St. John's Wort", generic: "St. John's Wort", rxcui: null, dosage: '300 mg', purpose: 'Mild Depression & Mood Balance', category: 'Herbal Mood Supplement', safetyTip: 'MAJOR CYP3A4 INDUCER: Lowers efficacy of statins, anticoagulants, oral contraceptives.', dosageOptions: ['300 mg', '600 mg', '900 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'fish oil':    { display: 'Fish Oil (Omega-3)', generic: 'Omega-3 Fatty Acids', rxcui: null, dosage: '1000 mg', purpose: 'Heart Health & Joint Flexibility', category: 'Cardiovascular Supplement', safetyTip: 'High doses (>3g/day) have mild antiplatelet effects. Inform surgeon prior to procedures.', dosageOptions: ['500 mg', '1000 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin d':   { display: 'Vitamin D3 (Cholecalciferol)', generic: 'Cholecalciferol', rxcui: '11253', dosage: '1000 IU', purpose: 'Bone Density & Immune Strength', category: 'Vitamin / Bone Health', safetyTip: 'Fat-soluble vitamin; best absorbed when taken with a meal containing dietary fat.', dosageOptions: ['400 IU', '1000 IU', '2000 IU', '60000 IU'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin c':   { display: 'Vitamin C (Ascorbic Acid)', generic: 'Ascorbic Acid', rxcui: '1151', dosage: '500 mg', purpose: 'Immune Support & Antioxidant', category: 'Immune / Antioxidant', safetyTip: 'Water-soluble vitamin. Take with water. Enhances iron absorption.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'calcium':     { display: 'Calcium Carbonate', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', purpose: 'Bone Health & Calcium Deficiency', category: 'Mineral Supplement', safetyTip: 'Take with meals for optimal absorption. Separate from thyroid meds and iron by 4 hours.', dosageOptions: ['250 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'iron':        { display: 'Ferrous Sulfate (Iron)', generic: 'Ferrous Sulfate', rxcui: '4471', dosage: '325 mg', purpose: 'Anemia & Iron Deficiency', category: 'Mineral / Antianemic', safetyTip: 'Best on empty stomach with Vitamin C. Do not take with calcium, tea, or antacids.', dosageOptions: ['65 mg', '200 mg', '325 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'melatonin':   { display: 'Melatonin', generic: 'Melatonin', rxcui: null, dosage: '3 mg', purpose: 'Sleep Quality & Insomnia Relief', category: 'Sleep Aid Supplement', safetyTip: 'Take 30-60 minutes before desired bedtime in a darkened environment.', dosageOptions: ['1 mg', '3 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'multivitamin':{ display: 'Multivitamin', generic: 'Multivitamin', rxcui: null, dosage: '1 tablet', purpose: 'Daily Nutritional & Immune Support', category: 'General Dietary Supplement', safetyTip: 'Take with breakfast or lunch to avoid mild stomach upset.', dosageOptions: ['1 tablet'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'zinc':        { display: 'Zinc Sulfate', generic: 'Zinc', rxcui: null, dosage: '50 mg', purpose: 'Immune Defense & Wound Healing', category: 'Immune / Mineral', safetyTip: 'Always take with food to prevent nausea. Separate from antibiotics by 2 hours.', dosageOptions: ['15 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'folic acid':  { display: 'Folic Acid', generic: 'Folic Acid', rxcui: '4511', dosage: '5 mg', purpose: 'Red Blood Cells & Prenatal Health', category: 'Vitamin B9 Supplement', safetyTip: 'Essential for red blood cell production and prenatal health.', dosageOptions: ['400 mcg', '1 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'b12':         { display: 'Vitamin B12 (Methylcobalamin)', generic: 'Cyanocobalamin', rxcui: '11248', dosage: '1500 mcg', purpose: 'Nerve Function & Energy Production', category: 'Nerve & Blood Health', safetyTip: 'Essential for neurological health, especially in vegetarians and patients on Metformin/PPIs.', dosageOptions: ['500 mcg', '1000 mcg', '1500 mcg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aloe vera':   { display: 'Aloe Vera', generic: 'Aloe Vera', rxcui: null, dosage: '500 mg', purpose: 'Digestive Health & Skin Hydration', category: 'Herbal Supplement', safetyTip: 'May lower blood glucose and potassium levels. Consult doctor if taking diuretics or insulin.', dosageOptions: ['500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'garlic':      { display: 'Garlic Extract (Allium sativum)', generic: 'Garlic', rxcui: null, dosage: '600 mg', purpose: 'Heart Health & Cholesterol Balance', category: 'Cardiovascular Herbal', safetyTip: 'Mild antiplatelet activity — monitor for bruising if taking anticoagulant drugs.', dosageOptions: ['300 mg', '600 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'echinacea':   { display: 'Echinacea', generic: 'Echinacea', rxcui: null, dosage: '400 mg', purpose: 'Upper Respiratory & Immune Support', category: 'Immune Herbal', safetyTip: 'Use for short-term support during colds (10-14 days). Caution in autoimmune conditions.', dosageOptions: ['200 mg', '400 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'valerian':    { display: 'Valerian Root', generic: 'Valerian', rxcui: null, dosage: '500 mg', purpose: 'Deep Sleep & Relaxation', category: 'Herbal Sleep & Calming', safetyTip: 'Additive central nervous system depression when taken with alcohol or sedatives.', dosageOptions: ['300 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
};

/**
 * Derives a human-friendly clinical purpose / indication for a drug.
 *
 * @param {string} name
 * @param {string} generic
 * @param {string} category
 * @returns {string}
 */
function getDrugPurpose(name = '', generic = '', category = '') {
  const combined = `${name} ${generic} ${category}`.toLowerCase();

  if (combined.match(/\b(diarrh|diaria|loose stool|loose motion|loperamide|imodium|eldoper|electral|ors|norflox)\b/)) {
    return 'Diarrhea & Loose Motions';
  }
  if (combined.match(/\b(dolo|crocin|calpol|paracetamol|acetaminophen|fever|antipyretic)\b/)) {
    return 'Fever, Headache & Body Pain';
  }
  if (combined.match(/\b(migraine|naxdom|naproxen)\b/)) {
    return 'Migraine, Severe Headache & Joint Pain';
  }
  if (combined.match(/\b(combiflam|ibuprofen|analgesic|muscle pain)\b/)) {
    return 'Headache, Muscle Pain & Body Aches';
  }
  if (combined.match(/\b(voveran|diclofenac|arthritis|joint swelling|anti-inflammatory)\b/)) {
    return 'Joint Pain, Arthritis & Inflammation';
  }
  if (combined.match(/\b(pan|pantoprazole|omeprazole|omez|rabeprazole|razo|rantac|ranitidine|ppi|gerd|acid reflux|heartburn|antacid|digene|gelusil)\b/)) {
    return 'Acidity, Gas & Acid Reflux (GERD)';
  }
  if (combined.match(/\b(ondansetron|vomikind|emeset|nausea|vomit|domperidone|antiemetic)\b/)) {
    return 'Nausea & Vomiting Relief';
  }
  if (combined.match(/\b(metformin|glycomet|glimepiride|diabetes|antidiabetic|insulin|blood sugar|sugar)\b/)) {
    return 'Type 2 Diabetes (Blood Sugar Control)';
  }
  if (combined.match(/\b(telma|telmisartan|amlodipine|losartan|metoprolol|atenolol|hypertension|blood pressure|antihypertensive|bp)\b/)) {
    return 'High Blood Pressure (Hypertension)';
  }
  if (combined.match(/\b(atorvastatin|rosuvastatin|simvastatin|cholesterol|statin|lipid)\b/)) {
    return 'High Cholesterol & Heart Health';
  }
  if (combined.match(/\b(ecosprin|aspirin|warfarin|clopidogrel|anticoagulant|antiplatelet|blood thinner)\b/)) {
    return 'Blood Thinner & Heart Attack Prevention';
  }
  if (combined.match(/\b(augmentin|amoxicillin|azithromycin|ciprofloxacin|norfloxacin|cefixime|zifi|antibiotic|bacterial|infection)\b/)) {
    return 'Bacterial Infection (Antibiotic)';
  }
  if (combined.match(/\b(cheston|sinarest|cold|runny nose|nasal congestion|cough|ascoril|benadryl)\b/)) {
    return 'Cough, Cold & Blocked Nose';
  }
  if (combined.match(/\b(cetirizine|allegra|fexofenadine|levocetirizine|antihistamine|allergy|hives|itching)\b/)) {
    return 'Allergy, Sneezing & Itching Relief';
  }
  if (combined.match(/\b(shelcal|calcium|vitamin d|cholecalciferol|bone)\b/)) {
    return 'Calcium & Vitamin D3 (Bone Strength)';
  }
  if (combined.match(/\b(b12|neurobion|becosules|folic acid|multivitamin|zinc|vitamin)\b/)) {
    return 'Vitamins, Immunity & Nerve Health';
  }
  if (combined.match(/\b(meftal|spas|antispasmodic|cramp|period pain)\b/)) {
    return 'Stomach Cramps & Menstrual Pain';
  }
  if (combined.match(/\b(thyroid|levothyroxine|hypothyroid)\b/)) {
    return 'Hypothyroidism (Thyroid Hormone)';
  }
  if (combined.match(/\b(fluconazole|antifungal|fungal)\b/)) {
    return 'Fungal & Yeast Infection';
  }
  if (combined.match(/\b(clonazepam|alprazolam|sedative|anxiety|panic)\b/)) {
    return 'Anxiety, Panic Attacks & Sleep Support';
  }
  return category || 'Therapeutic Treatment';
}

/**
 * Extracts candidate drug names and generic constituents from compound name strings.
 * e.g. "Naxdom 500 (Naproxen + Domperidone)" -> ["Naxdom 500 (Naproxen + Domperidone)", "Naxdom", "Naproxen", "Domperidone"]
 *
 * @param {string} drugName
 * @returns {string[]}
 */
function resolveDrugCandidates(drugName) {
  if (!drugName || typeof drugName !== 'string') return [];
  const normalized = drugName.trim();
  const candidates = new Set([normalized]);

  // 1. Check parenthetical contents e.g. "Naxdom 500 (Naproxen + Domperidone)"
  const parenMatch = normalized.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inside = parenMatch[1];
    const parts = inside.split(/[\+,;/]/).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p) => {
      candidates.add(p);
      const cleanP = p.replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)?$/i, '').trim();
      if (cleanP) candidates.add(cleanP);
    });
  }

  // 2. Check brand prefix before parenthesis or dosage
  const beforeParen = normalized.replace(/\s*\(.*?\)/g, '').trim();
  if (beforeParen && beforeParen !== normalized) {
    candidates.add(beforeParen);
    const withoutDose = beforeParen.replace(/\s+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)?$/i, '').trim();
    if (withoutDose) candidates.add(withoutDose);
  }

  // 3. Check known aliases (e.g. naxdom -> Naproxen)
  const lower = normalized.toLowerCase();
  for (const [key, alias] of Object.entries(BRAND_ALIASES)) {
    if (lower.includes(key) || key.includes(lower)) {
      if (alias.generic) candidates.add(alias.generic);
      if (alias.genericName) candidates.add(alias.genericName);
    }
  }

  return Array.from(candidates).filter(c => c.length >= 2);
}

/**
 * Resolves standard RxNorm CUI for a drug name or brand alias.
 *
 * @param {string} drugName
 * @returns {string|null}
 */
function getRxCuiForDrug(drugName) {
  if (!drugName) return null;
  const lower = drugName.toLowerCase().trim();

  if (BRAND_ALIASES[lower]?.rxcui) {
    return BRAND_ALIASES[lower].rxcui;
  }

  for (const [key, alias] of Object.entries(BRAND_ALIASES)) {
    if (alias.rxcui && (lower.includes(key) || key.includes(lower))) {
      return alias.rxcui;
    }
  }

  const candidates = resolveDrugCandidates(drugName);
  for (const cand of candidates) {
    const candLower = cand.toLowerCase();
    if (BRAND_ALIASES[candLower]?.rxcui) {
      return BRAND_ALIASES[candLower].rxcui;
    }
  }

  return null;
}

// ─── Load and merge Indian drug aliases from generated formulary ──────────────
// Auto-merges entries from data/indian-aliases-generated.json (created by
// prisma/seedIndianDrugs.js). These are additive — existing curated entries
// take precedence if a key already exists.
(function mergeIndianAliases() {
  try {
    const fs   = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '../../data/indian-aliases-generated.json');
    if (!fs.existsSync(file)) return;
    const generated = JSON.parse(fs.readFileSync(file, 'utf8'));
    let added = 0;
    for (const [key, val] of Object.entries(generated)) {
      if (!BRAND_ALIASES[key]) {
        BRAND_ALIASES[key] = {
          display:         val.brandName || val.display || key,
          generic:         val.standardGeneric || val.generic || key,
          rxcui:           val.primaryRxCui || val.rxcui || null,
          dosage:          val.dosage || 'Standard dose',
          dosageOptions:   val.dosageOptions || [],
          category:        val.category || 'Prescription Medicine',
          safetyTip:       val.safetyTip || 'Take as prescribed by your doctor.',
          commonFrequency: val.commonFrequency || 'once',
          foodInstruction: val.foodInstruction || 'after_food',
        };
        added++;
      }
    }
    if (added > 0) console.log(`[drugAliases] Merged ${added} Indian formulary entries`);
  } catch (err) {
    // Non-critical — continue without Indian aliases
  }
})();

module.exports = {
  BRAND_ALIASES,
  resolveDrugCandidates,
  getRxCuiForDrug,
  getDrugPurpose,
};

