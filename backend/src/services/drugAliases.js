/**
 * services/drugAliases.js
 *
 * Centralized clinical drug aliases, brand name mappings, RxNorm CUI resolutions,
 * and parenthetical constituent parsers for Indian and international formulations.
 */

'use strict';

const BRAND_ALIASES = {
  'naxdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'nexdom':      { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 500':  { display: 'Naxdom 500 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 250':  { display: 'Naxdom 250 (Naproxen + Domperidone)', generic: 'Naproxen', rxcui: '7258', dosage: '250 mg', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'dolo':        { display: 'Dolo 650 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '650 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'dolo 650':    { display: 'Dolo 650 (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '650 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'crocin':      { display: 'Crocin (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Monitor total daily paracetamol intake across all cold/fever formulations.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'pan-d':       { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pand':        { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pan d':       { display: 'Pan-D (Pantoprazole + Domperidone)', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'augmentin':   { display: 'Augmentin (Amoxicillin + Clavulanate)', generic: 'Amoxicillin', rxcui: '723', dosage: '625 mg', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'augmentin 625': { display: 'Augmentin (Amoxicillin + Clavulanate)', generic: 'Amoxicillin', rxcui: '723', dosage: '625 mg', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ecosprin':    { display: 'Ecosprin (Aspirin)', generic: 'Aspirin', rxcui: '1191', dosage: '75 mg', category: 'Antiplatelet / Cardio', safetyTip: 'Low-dose cardio-protective. Take with food to minimize gastric bleeding risk.', dosageOptions: ['75 mg', '150 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'combiflam':   { display: 'Combiflam (Ibuprofen + Paracetamol)', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', category: 'NSAID / Pain Relief', safetyTip: 'Take after meals. Avoid if you have active peptic ulcer or renal impairment.', dosageOptions: ['400 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'telma':       { display: 'Telma (Telmisartan)', generic: 'Telmisartan', rxcui: '42355', dosage: '40 mg', category: 'Antihypertensive (ARB)', safetyTip: 'Take consistently at the same time each day; monitor blood pressure regularly.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'voveran':     { display: 'Voveran (Diclofenac)', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', category: 'NSAID / Anti-inflammatory', safetyTip: 'Potent anti-inflammatory. Take with food or antacid to avoid stomach irritation.', dosageOptions: ['50 mg', '75 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'shelcal':     { display: 'Shelcal 500 (Calcium + Vitamin D3)', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', category: 'Bone Health / Mineral', safetyTip: 'Take with or after lunch for optimal absorption; separate from iron supplements by 2 hours.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'warfarin':    { display: 'Warfarin', generic: 'Warfarin', rxcui: '11289', dosage: '5 mg', category: 'Anticoagulant (Blood Thinner)', safetyTip: 'CRITICAL: Maintain consistent Vitamin K intake. Regular INR blood tests required. Avoid NSAIDs.', dosageOptions: ['1 mg', '2 mg', '2.5 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aspirin':     { display: 'Aspirin', generic: 'Aspirin', rxcui: '1191', dosage: '81 mg', category: 'Antiplatelet / NSAID', safetyTip: 'Take with food or a full glass of water. Report any unusual bruising or bleeding immediately.', dosageOptions: ['75 mg', '81 mg', '100 mg', '325 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'metformin':   { display: 'Metformin', generic: 'Metformin', rxcui: '6809', dosage: '500 mg', category: 'Antidiabetic (Biguanide)', safetyTip: 'Take with or immediately after meals to reduce gastrointestinal upset.', dosageOptions: ['250 mg', '500 mg', '850 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'atorvastatin':{ display: 'Atorvastatin', generic: 'Atorvastatin', rxcui: '83367', dosage: '10 mg', category: 'Statin / Cholesterol', safetyTip: 'Usually taken at bedtime. Avoid excessive grapefruit juice. Report muscle pain.', dosageOptions: ['10 mg', '20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'lisinopril':  { display: 'Lisinopril', generic: 'Lisinopril', rxcui: '29046', dosage: '10 mg', category: 'Antihypertensive (ACEi)', safetyTip: 'Monitor for persistent dry cough or dizziness when standing up.', dosageOptions: ['2.5 mg', '5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'amlodipine':  { display: 'Amlodipine', generic: 'Amlodipine', rxcui: '17767', dosage: '5 mg', category: 'Calcium Channel Blocker', safetyTip: 'Check for ankle swelling (peripheral edema) or lightheadedness.', dosageOptions: ['2.5 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'simvastatin': { display: 'Simvastatin', generic: 'Simvastatin', rxcui: '36567', dosage: '20 mg', category: 'Statin / Cholesterol', safetyTip: 'Take in the evening. Avoid strong CYP3A4 inhibitors (e.g. fluconazole, clarithromycin).', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'omeprazole':  { display: 'Omeprazole', generic: 'Omeprazole', rxcui: '40790', dosage: '20 mg', category: 'PPI / Antacid', safetyTip: 'Take 30-60 minutes before the first meal of the day.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ibuprofen':   { display: 'Ibuprofen', generic: 'Ibuprofen', rxcui: '5640', dosage: '400 mg', category: 'NSAID / Pain Relief', safetyTip: 'Always take with food or milk. High risk of interaction with blood thinners (Warfarin/Aspirin).', dosageOptions: ['200 mg', '400 mg', '600 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'fluconazole': { display: 'Fluconazole', generic: 'Fluconazole', rxcui: '4450', dosage: '150 mg', category: 'Antifungal', safetyTip: 'Potent CYP enzyme inhibitor — significantly elevates statin and warfarin blood levels.', dosageOptions: ['50 mg', '150 mg', '200 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'losartan':    { display: 'Losartan', generic: 'Losartan', rxcui: '52175', dosage: '50 mg', category: 'Antihypertensive (ARB)', safetyTip: 'Avoid potassium supplements or salt substitutes containing potassium without consulting doctor.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'metoprolol':  { display: 'Metoprolol', generic: 'Metoprolol', rxcui: '6918', dosage: '50 mg', category: 'Beta Blocker', safetyTip: 'Take with or right after food. Do not stop abruptly — taper under medical guidance.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'prednisone':  { display: 'Prednisone', generic: 'Prednisone', rxcui: '8640', dosage: '10 mg', category: 'Corticosteroid', safetyTip: 'Take with morning food to mimic natural cortisol cycle and minimize insomnia.', dosageOptions: ['5 mg', '10 mg', '20 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'levothyroxine':{ display: 'Levothyroxine', generic: 'Levothyroxine', rxcui: '10582', dosage: '50 mcg', category: 'Thyroid Hormone', safetyTip: 'Take first thing in the morning on an empty stomach with a full glass of water, 30-60 min before breakfast.', dosageOptions: ['25 mcg', '50 mcg', '75 mcg', '100 mcg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'azithromycin':{ display: 'Azithromycin', generic: 'Azithromycin', rxcui: '18631', dosage: '500 mg', category: 'Macrolide Antibiotic', safetyTip: 'Take 1 hour before or 2 hours after food. Separate from aluminium/magnesium antacids.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'cetirizine':  { display: 'Cetirizine', generic: 'Cetirizine', rxcui: '20610', dosage: '10 mg', category: 'Antihistamine (Allergy)', safetyTip: 'May cause mild drowsiness. Best taken in the evening with water.', dosageOptions: ['5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'pantoprazole':{ display: 'Pantoprazole', generic: 'Pantoprazole', rxcui: '40790', dosage: '40 mg', category: 'PPI / Antacid', safetyTip: 'Swallow whole — do not crush or chew. Take 30-60 min before breakfast.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'ranitidine':  { display: 'Ranitidine', generic: 'Ranitidine', rxcui: '9143', dosage: '150 mg', category: 'H2 Blocker / Antacid', safetyTip: 'Can be taken with or without food. Used for short-term relief of acid indigestion.', dosageOptions: ['75 mg', '150 mg', '300 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'montelukast': { display: 'Montelukast', generic: 'Montelukast', rxcui: '88249', dosage: '10 mg', category: 'Leukotriene Inhibitor (Asthma)', safetyTip: 'Usually taken once daily in the evening for asthma and allergic rhinitis.', dosageOptions: ['4 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'gabapentin':  { display: 'Gabapentin', generic: 'Gabapentin', rxcui: '25480', dosage: '300 mg', category: 'Anticonvulsant / Neuropathic', safetyTip: 'May cause dizziness or sedation; avoid alcohol. Do not abruptly discontinue.', dosageOptions: ['100 mg', '300 mg', '600 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'clopidogrel': { display: 'Clopidogrel', generic: 'Clopidogrel', rxcui: '32968', dosage: '75 mg', category: 'Antiplatelet', safetyTip: 'Do not stop without cardiologist advice. Avoid taking with omeprazole unless directed.', dosageOptions: ['75 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'rosuvastatin':{ display: 'Rosuvastatin', generic: 'Rosuvastatin', rxcui: '301542', dosage: '10 mg', category: 'Statin / Cholesterol', safetyTip: 'Can be taken at any time of day, with or without food. Report unexplained muscle aches.', dosageOptions: ['5 mg', '10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
  'amoxicillin': { display: 'Amoxicillin', generic: 'Amoxicillin', rxcui: '723', dosage: '500 mg', category: 'Penicillin Antibiotic', safetyTip: 'Take at evenly spaced intervals and finish the entire prescription.', dosageOptions: ['250 mg', '500 mg', '875 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'ciprofloxacin':{ display: 'Ciprofloxacin', generic: 'Ciprofloxacin', rxcui: '2551', dosage: '500 mg', category: 'Fluoroquinolone Antibiotic', safetyTip: 'Do not take with dairy products or calcium-fortified juices alone. Drink plenty of fluids.', dosageOptions: ['250 mg', '500 mg', '750 mg'], commonFrequency: 'twice', foodInstruction: 'avoid_dairy' },
  'diclofenac':  { display: 'Diclofenac', generic: 'Diclofenac', rxcui: '3355', dosage: '50 mg', category: 'NSAID / Pain Relief', safetyTip: 'Take with food. Monitor for fluid retention, blood pressure changes, or GI distress.', dosageOptions: ['25 mg', '50 mg', '75 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naproxen':    { display: 'Naproxen', generic: 'Naproxen', rxcui: '7258', dosage: '500 mg', category: 'NSAID / Anti-inflammatory', safetyTip: 'Take with food or milk. Avoid taking multiple NSAIDs concurrently.', dosageOptions: ['250 mg', '375 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'tramadol':    { display: 'Tramadol', generic: 'Tramadol', rxcui: '10689', dosage: '50 mg', category: 'Opioid Analgesic', safetyTip: 'Risk of sedation and serotonin syndrome when taken with SSRI antidepressants.', dosageOptions: ['50 mg', '100 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_food' },
  'sertraline':  { display: 'Sertraline', generic: 'Sertraline', rxcui: '36437', dosage: '50 mg', category: 'SSRI Antidepressant', safetyTip: 'Take once daily in morning or evening. Takes 2-4 weeks for full therapeutic effect.', dosageOptions: ['25 mg', '50 mg', '100 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'fluoxetine':  { display: 'Fluoxetine', generic: 'Fluoxetine', rxcui: '4493', dosage: '20 mg', category: 'SSRI Antidepressant', safetyTip: 'Usually taken in the morning due to energizing effect. Long half-life.', dosageOptions: ['10 mg', '20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'clonazepam':  { display: 'Clonazepam', generic: 'Clonazepam', rxcui: '2598', dosage: '0.5 mg', category: 'Benzodiazepine / Sedative', safetyTip: 'HIGH SEDATION: Additive CNS depression when combined with opioids or antihistamines.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg', '2 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'alprazolam':  { display: 'Alprazolam', generic: 'Alprazolam', rxcui: '596', dosage: '0.25 mg', category: 'Benzodiazepine / Anxiolytic', safetyTip: 'Short-acting sedative. Avoid alcohol. May impair driving/machinery operation.', dosageOptions: ['0.25 mg', '0.5 mg', '1 mg'], commonFrequency: 'asneeded', foodInstruction: 'with_water' },
  'hydrochlorothiazide': { display: 'Hydrochlorothiazide', generic: 'Hydrochlorothiazide', rxcui: '5487', dosage: '25 mg', category: 'Thiazide Diuretic', safetyTip: 'Take in the morning to prevent nighttime urination. Stay hydrated.', dosageOptions: ['12.5 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'furosemide':  { display: 'Furosemide', generic: 'Furosemide', rxcui: '4603', dosage: '40 mg', category: 'Loop Diuretic', safetyTip: 'Take early in the day. Monitor potassium levels and blood pressure.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'paracetamol': { display: 'Paracetamol (Acetaminophen)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'acetaminophen':{ display: 'Acetaminophen (Paracetamol)', generic: 'Acetaminophen', rxcui: '161', dosage: '500 mg', category: 'Analgesic / Antipyretic', safetyTip: 'Maximum 4000mg/day. Watch for acetaminophen in combination cold/flu products.', dosageOptions: ['500 mg', '650 mg', '1000 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'turmeric':    { display: 'Turmeric (Curcumin)', generic: 'Turmeric', rxcui: null, dosage: '500 mg', category: 'Ayurvedic / Herbal Anti-inflammatory', safetyTip: 'Natural anticoagulant effect — moderate bleeding interaction risk with Warfarin/Aspirin.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'ashwagandha': { display: 'Ashwagandha (Withania somnifera)', generic: 'Ashwagandha', rxcui: null, dosage: '300 mg', category: 'Ayurvedic Adaptogen / Calming', safetyTip: 'May have additive sedative effect when combined with CNS depressants or thyroid meds.', dosageOptions: ['300 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginkgo':      { display: 'Ginkgo Biloba', generic: 'Ginkgo', rxcui: null, dosage: '120 mg', category: 'Herbal Supplement (Cognitive)', safetyTip: 'Inhibits platelet aggregation — increased bleeding risk when paired with blood thinners.', dosageOptions: ['60 mg', '120 mg', '240 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ginseng':     { display: 'Ginseng (Panax ginseng)', generic: 'Ginseng', rxcui: null, dosage: '200 mg', category: 'Herbal Energy / Adaptogen', safetyTip: 'May lower blood sugar; caution if on insulin or metformin. Can reduce Warfarin efficacy.', dosageOptions: ['100 mg', '200 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'st john':     { display: "St. John's Wort", generic: "St. John's Wort", rxcui: null, dosage: '300 mg', category: 'Herbal Mood Supplement', safetyTip: 'MAJOR CYP3A4 INDUCER: Lowers efficacy of statins, anticoagulants, oral contraceptives.', dosageOptions: ['300 mg', '600 mg', '900 mg'], commonFrequency: 'thrice', foodInstruction: 'with_food' },
  'fish oil':    { display: 'Fish Oil (Omega-3)', generic: 'Omega-3 Fatty Acids', rxcui: null, dosage: '1000 mg', category: 'Cardiovascular Supplement', safetyTip: 'High doses (>3g/day) have mild antiplatelet effects. Inform surgeon prior to procedures.', dosageOptions: ['500 mg', '1000 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin d':   { display: 'Vitamin D3 (Cholecalciferol)', generic: 'Cholecalciferol', rxcui: '11253', dosage: '1000 IU', category: 'Vitamin / Bone Health', safetyTip: 'Fat-soluble vitamin; best absorbed when taken with a meal containing dietary fat.', dosageOptions: ['400 IU', '1000 IU', '2000 IU', '60000 IU'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'vitamin c':   { display: 'Vitamin C (Ascorbic Acid)', generic: 'Ascorbic Acid', rxcui: '1151', dosage: '500 mg', category: 'Immune / Antioxidant', safetyTip: 'Water-soluble vitamin. Take with water. Enhances iron absorption.', dosageOptions: ['250 mg', '500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'calcium':     { display: 'Calcium Carbonate', generic: 'Calcium Carbonate', rxcui: '1895', dosage: '500 mg', category: 'Mineral Supplement', safetyTip: 'Take with meals for optimal absorption. Separate from thyroid meds and iron by 4 hours.', dosageOptions: ['250 mg', '500 mg', '600 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'iron':        { display: 'Ferrous Sulfate (Iron)', generic: 'Ferrous Sulfate', rxcui: '4471', dosage: '325 mg', category: 'Mineral / Antianemic', safetyTip: 'Best on empty stomach with Vitamin C. Do not take with calcium, tea, or antacids.', dosageOptions: ['65 mg', '200 mg', '325 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'melatonin':   { display: 'Melatonin', generic: 'Melatonin', rxcui: null, dosage: '3 mg', category: 'Sleep Aid Supplement', safetyTip: 'Take 30-60 minutes before desired bedtime in a darkened environment.', dosageOptions: ['1 mg', '3 mg', '5 mg', '10 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'multivitamin':{ display: 'Multivitamin', generic: 'Multivitamin', rxcui: null, dosage: '1 tablet', category: 'General Dietary Supplement', safetyTip: 'Take with breakfast or lunch to avoid mild stomach upset.', dosageOptions: ['1 tablet'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'zinc':        { display: 'Zinc Sulfate', generic: 'Zinc', rxcui: null, dosage: '50 mg', category: 'Immune / Mineral', safetyTip: 'Always take with food to prevent nausea. Separate from antibiotics by 2 hours.', dosageOptions: ['15 mg', '25 mg', '50 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'folic acid':  { display: 'Folic Acid', generic: 'Folic Acid', rxcui: '4511', dosage: '5 mg', category: 'Vitamin B9 Supplement', safetyTip: 'Essential for red blood cell production and prenatal health.', dosageOptions: ['400 mcg', '1 mg', '5 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'b12':         { display: 'Vitamin B12 (Methylcobalamin)', generic: 'Cyanocobalamin', rxcui: '11248', dosage: '1500 mcg', category: 'Nerve & Blood Health', safetyTip: 'Essential for neurological health, especially in vegetarians and patients on Metformin/PPIs.', dosageOptions: ['500 mcg', '1000 mcg', '1500 mcg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'aloe vera':   { display: 'Aloe Vera', generic: 'Aloe Vera', rxcui: null, dosage: '500 mg', category: 'Herbal Supplement', safetyTip: 'May lower blood glucose and potassium levels. Consult doctor if taking diuretics or insulin.', dosageOptions: ['500 mg', '1000 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
  'garlic':      { display: 'Garlic Extract (Allium sativum)', generic: 'Garlic', rxcui: null, dosage: '600 mg', category: 'Cardiovascular Herbal', safetyTip: 'Mild antiplatelet activity — monitor for bruising if taking anticoagulant drugs.', dosageOptions: ['300 mg', '600 mg', '1200 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'echinacea':   { display: 'Echinacea', generic: 'Echinacea', rxcui: null, dosage: '400 mg', category: 'Immune Herbal', safetyTip: 'Use for short-term support during colds (10-14 days). Caution in autoimmune conditions.', dosageOptions: ['200 mg', '400 mg', '800 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'valerian':    { display: 'Valerian Root', generic: 'Valerian', rxcui: null, dosage: '500 mg', category: 'Herbal Sleep & Calming', safetyTip: 'Additive central nervous system depression when taken with alcohol or sedatives.', dosageOptions: ['300 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'with_water' },
};

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
};
