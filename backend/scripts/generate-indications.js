/**
 * generate-indications.js
 * Generates frontend/src/utils/indications.js with 500+ curated medical indications
 * covering Indian and International brand names, generics, salts, and OTC medications.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../frontend/src/utils/indications.js');

const indications = {};

function add(name, indication) {
  const key = name.toLowerCase().trim();
  if (!key) return;
  indications[key] = indication.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESPIRATORY, ALLERGY & PULMONARY (60+)
// ─────────────────────────────────────────────────────────────────────────────
add('xyzal', 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma');
add('xyzal m', 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma');
add('montair lc', 'Allergic Rhinitis, Hay Fever, Bronchial Asthma & Nasal Congestion');
add('montek lc', 'Allergic Rhinitis, Sneezing, Runny Nose & Allergic Asthma');
add('telekast l', 'Asthma Prophylaxis, Seasonal Allergies & Allergic Rhinitis');
add('levocetirizine', 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Itching');
add('montelukast', 'Asthma Maintenance, Bronchospasm & Allergic Rhinitis');
add('cetirizine', 'Allergy, Sneezing, Runny Nose, Hives & Watery Eyes');
add('zyrtec', 'Seasonal Allergic Rhinitis & Chronic Urticaria (Hives)');
add('allegra', 'Seasonal Allergies, Allergic Rhinitis & Chronic Urticaria (Hives)');
add('fexofenadine', 'Non-Drowsy Allergy Relief, Sneezing & Itchy Skin Rash');
add('loratadine', 'Non-Sedating Allergy Relief, Hives & Allergic Rhinitis');
add('claritin', 'Seasonal Allergies, Pollen Allergy & Skin Itchiness');
add('desloratadine', 'Allergic Rhinitis & Chronic Idiopathic Urticaria');
add('clarinex', 'Relief from Nasal & Non-Nasal Seasonal Allergic Symptoms');
add('bilastine', 'Allergic Rhinoconjunctivitis & Urticaria');
add('bilaxten', 'Allergic Rhinitis & Itchy Skin Rash');
add('cheston cold', 'Common Cold, Nasal Congestion, Runny Nose & Fever');
add('sinarest', 'Cold, Sinus Congestion, Headache & Low-Grade Fever');
add('wikoryl', 'Common Cold, Nasal Decongestion, Headache & Body Aches');
add('solvin cold', 'Sneezing, Nasal Blockage, Sinus Congestion & Cold Fever');
add('ascoril', 'Productive Cough, Chest Congestion & Bronchial Spasm');
add('ascoril ls', 'Productive Mucus Cough, Bronchitis & Chest Congestion');
add('benadryl', 'Cough Relief, Throat Soothing & Nighttime Cough Suppression');
add('alex', 'Dry Irritating Cough & Throat Tickling Relief');
add('grilinctus', 'Dry Allergic Cough & Irritating Throat Relief');
add('corex', 'Cough Suppression & Upper Respiratory Congestion');
add('phensedyl', 'Severe Dry Cough & Bronchial Irritation Relief');
add('asthalin', 'Acute Asthma Attack, Wheezing & Bronchospasm');
add('salbutamol', 'Acute Bronchospasm, Asthma & COPD Bronchodilation');
add('albuterol', 'Bronchospasm, Wheezing & Exercise-Induced Asthma');
add('ventolin', 'Rapid Bronchospasm Relief in Asthma & COPD');
add('deriphyllin', 'Chronic Asthma, Wheezing & COPD Airway Clearance');
add('theophylline', 'Chronic Asthma Maintenance & COPD Bronchodilation');
add('foracort', 'Chronic Asthma Maintenance & COPD Symptom Prevention');
add('foracort 200', 'Asthma & COPD Daily Anti-inflammatory Maintenance');
add('foracort 400', 'Moderate to Severe Persistent Asthma & COPD Maintenance');
add('seroflo', 'Persistent Asthma & COPD Airflow Obstruction Prevention');
add('seroflo 250', 'Daily Maintenance for Chronic Asthma & Bronchospasm');
add('budecort', 'Asthma Airway Inflammation & Chronic Bronchitis');
add('budesonide', 'Airway Inflammation, Asthma & Chronic Lung Inflammation');
add('pulmicort', 'Inhaled Corticosteroid for Persistent Asthma Control');
add('fluticasone', 'Allergic Rhinitis (Nasal Spray) & Asthma Airway Inflammation');
add('flonase', 'Nasal Allergy Relief, Congestion, Sneezing & Itchy Nose');
add('mometasone', 'Nasal Polyps, Chronic Allergic Rhinitis & Airway Inflammation');
add('nasonex', 'Seasonal & Perennial Allergic Rhinitis Nasal Symptoms');
add('ipratropium', 'Bronchospasm in COPD, Emphysema & Rhinorrhea');
add('atrovent', 'COPD Bronchodilation & Chronic Bronchitis Relief');
add('tiotropium', 'Long-term COPD Maintenance & Severe Asthma Bronchodilation');
add('spiriva', 'Once-Daily Maintenance Therapy for COPD & Emphysema');
add('duolin', 'Acute Severe Asthma & COPD Bronchospasm (Dual Bronchodilator)');
add('levosalbutamol', 'Bronchospasm Relief with Reduced Tachycardia');
add('ambroxol', 'Mucus Thinning & Productive Wet Cough Clearance');
add('guaifenesin', 'Chest Congestion & Mucus Loosening Expectorant');
add('mucinex', 'Excess Bronchial Mucus & Chest Congestion Relief');
add('acetylcysteine', 'Thick Bronchial Mucus Dissolution & Acetaminophen Overdose');
add('mucomix', 'Respiratory Mucus Breakdown & Lung Airway Clearance');
add('dextromethorphan', 'Dry Non-Productive Cough Reflex Suppression');
add('pseudoephedrine', 'Severe Nasal Congestion & Sinus Pressure Relief');
add('sudafed', 'Nasal & Sinus Congestion from Colds & Allergies');
add('otrivin', 'Nasal Decongestion & Acute Stuffy Nose Relief');
add('oxymetazoline', 'Rapid Nasal Congestion Relief for Head Colds & Sinusitis');

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAIN, MIGRAINE & MUSCULOSKELETAL (55+)
// ─────────────────────────────────────────────────────────────────────────────
add('naxdom', 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting');
add('naxdom 500', 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting');
add('naxdom 250', 'Acute Migraine Headache, Throbbing Headache with Nausea & Vomiting');
add('migranil', 'Migraine Attacks & Vascular Headaches');
add('sumatriptan', 'Acute Migraine Headache with or without Aura');
add('imitrex', 'Acute Migraine Attacks & Cluster Headaches');
add('zolmitriptan', 'Acute Migraine Headache Relief');
add('rizatriptan', 'Fast-Acting Migraine Headache Relief');
add('vasograin', 'Vascular Headaches & Recurring Migraines');
add('dolo', 'Fever, Headache, Body Aches & Mild to Moderate Pain Relief');
add('dolo 650', 'Fever, Headache, Body Aches & Mild to Moderate Pain Relief');
add('calpol', 'Fever, Headache & Mild to Moderate Pain Relief');
add('calpol 650', 'High Fever, Headache & Post-Vaccination Fever');
add('crocin', 'Fever, Body Ache, Toothache & Mild Headache Relief');
add('crocin 650', 'Fever, Muscle Aches & Headache Relief');
add('paracetamol', 'Fever Reduction, Headache & Mild to Moderate Pain Relief');
add('acetaminophen', 'Fever Reduction, Headache & General Pain Relief');
add('combiflam', 'Severe Musculoskeletal Pain, Joint Inflammation & Fever');
add('flexon', 'Musculoskeletal Pain, Sprains, Dental Pain & Fever');
add('sumo', 'Severe Body Ache, Joint Pain, Sprain & High Fever');
add('ibuprofen', 'Inflammatory Pain, Dental Ache, Muscle Sprains & Fever');
add('brufen', 'Inflammation, Muscle Pain & Dental Ache');
add('advil', 'Headache, Toothache, Muscle Sprains, Backache & Fever');
add('motrin', 'Minor Aches, Pain of Arthritis, Dysmenorrhea & Fever');
add('voveran', 'Severe Joint Pain, Osteoarthritis & Musculoskeletal Inflammation');
add('voveran sr', 'Chronic Osteoarthritis, Rheumatoid Pain & Spinal Spondylitis');
add('diclofenac', 'Joint Pain, Sprain, Arthritis & Post-Operative Inflammation');
add('voltaren', 'Osteoarthritis Pain, Joint Stiffness & Inflammatory Aches');
add('naproxen', 'Migraine, Arthritis, Gout & Musculoskeletal Pain');
add('aleve', 'All-Day Relief for Arthritis, Backache & Muscle Strain');
add('meftal', 'Menstrual Cramps, Heavy Bleeding Pain & Post-Operative Aches');
add('meftal spas', 'Abdominal Cramping, Menstrual Pain & Intestinal Spasms');
add('mefenamic acid', 'Menstrual Pain, Spasms & Mild to Moderate Inflammatory Pain');
add('ultracet', 'Moderate to Severe Acute Pain Relief');
add('tramadol', 'Moderate to Severe Pain Management');
add('ultram', 'Moderate to Moderately Severe Chronic Pain');
add('zerodol', 'Osteoarthritis, Rheumatoid Arthritis & Ankylosing Spondylitis');
add('zerodol p', 'Acute Joint Pain, Back Pain & Dental Pain with Fever');
add('zerodol sp', 'Severe Traumatic Swelling, Post-Surgery Edema & Joint Pain');
add('hifenac', 'Arthritis Joint Pain, Spondylitis & Musculoskeletal Aches');
add('aceclofenac', 'Pain & Inflammation in Osteoarthritis & Ankylosing Spondylitis');
add('etoricoxib', 'Acute Gout, Severe Osteoarthritis & Ankylosing Spondylitis Pain');
add('arcoxia', 'Joint Pain, Rheumatoid Arthritis & Acute Gouty Arthritis');
add('etoshine', 'Severe Arthritis Joint Inflammation & Post-Surgical Pain');
add('celecoxib', 'Osteoarthritis, Rheumatoid Arthritis & Acute Pain Relief');
add('celebrex', 'Arthritis Joint Pain & Ankylosing Spondylitis (GI-Gentle)');
add('meloxicam', 'Osteoarthritis & Rheumatoid Arthritis Joint Stiffness');
add('mobic', 'Relief of Signs & Symptoms of Osteoarthritis & Rheumatoid Arthritis');
add('piroxicam', 'Chronic Osteoarthritis & Rheumatoid Arthritis Inflammation');
add('indomethacin', 'Acute Gouty Arthritis, Bursitis & Severe Tendonitis');
add('ketorolac', 'Short-term Management of Moderately Severe Acute Pain');
add('toradol', 'Post-Surgical Acute Moderate-to-Severe Pain Relief');
add('chymoral forte', 'Post-Traumatic Swelling, Surgical Edema & Tissue Inflammation');
add('trypsin chymotrypsin', 'Wound Edema, Hematoma & Post-Operative Inflammation');
add('serratiopeptidase', 'Reduction of Tissue Swelling, Edema & Traumatic Hematoma');
add('colchicine', 'Acute Gout Attack Relief & Familial Mediterranean Fever');

// ─────────────────────────────────────────────────────────────────────────────
// 3. RHEUMATOLOGY, AUTOIMMUNE & TARGETED THERAPY (40+)
// ─────────────────────────────────────────────────────────────────────────────
add('tofacitinib', 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis');
add('xeljanz', 'Active Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis');
add('tfct-nib', 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis');
add('tfct-nib 5 mg', 'Rheumatoid Arthritis, Psoriatic Arthritis & Ulcerative Colitis');
add('upadacitinib', 'Rheumatoid Arthritis, Atopic Dermatitis & Ulcerative Colitis');
add('rinvoq', 'Rheumatoid Arthritis, Crohn’s Disease & Atopic Dermatitis');
add('baricitinib', 'Rheumatoid Arthritis, Alopecia Areata & Severe Atopic Dermatitis');
add('olumiant', 'Moderate to Severe Active Rheumatoid Arthritis');
add('methotrexate', 'Rheumatoid Arthritis, Severe Psoriasis & Autoimmune Remission');
add('folitrax', 'Rheumatoid Arthritis & Severe Psoriatic Plaques');
add('trexall', 'Rheumatoid Arthritis, Psoriasis & Neoplastic Conditions');
add('hydroxychloroquine', 'Systemic Lupus Erythematosus (SLE) & Rheumatoid Arthritis');
add('hcqs', 'Systemic Lupus (SLE) & Autoimmune Joint Inflammation');
add('plaquenil', 'Systemic Lupus Erythematosus & Rheumatoid Arthritis Disease Modification');
add('chloroquine', 'Malaria Treatment, Amebiasis & Extraintestinal Amebiasis');
add('leflunomide', 'Active Rheumatoid Arthritis Joint Damage Retardation');
add('arava', 'Reduction of Joint Damage in Active Rheumatoid Arthritis');
add('sulfasalazine', 'Ulcerative Colitis & Seronegative Spondylarthropathy');
add('saaz', 'Ulcerative Colitis, Crohn’s Colitis & Peripheral Rheumatoid Arthritis');
add('azathioprine', 'Kidney Transplant Rejection Prophylaxis & Severe Autoimmune Disease');
add('imuran', 'Organ Transplant Immunosuppression & Autoimmune Hepatitis');
add('mycophenolate', 'Renal / Cardiac Transplant Rejection Prophylaxis & Lupus Nephritis');
add('cellcept', 'Organ Rejection Prophylaxis in Kidney, Heart, or Liver Transplants');
add('myfortic', 'Prophylaxis of Organ Rejection in Adult Kidney Transplants');
add('tacrolimus', 'Organ Transplant Rejection Prophylaxis & Atopic Eczema');
add('prograf', 'Liver, Kidney, and Heart Transplant Rejection Prevention');
add('cyclosporine', 'Organ Transplant Rejection Prophylaxis & Severe Psoriasis');
add('neoral', 'Immunosuppression in Solid Organ Transplantation & Severe RA');
add('sandimmune', 'Prophylaxis of Organ Rejection in Kidney, Liver, and Heart Allografts');
add('prednisolone', 'Severe Allergic Reactions, Autoimmune Flare-ups & Inflammation');
add('wysolone', 'Severe Inflammatory Flare-ups, Allergies & Autoimmune Suppression');
add('prednisone', 'Autoimmune Disorders, Severe Inflammation & Allergic Flare-ups');
add('deltasone', 'Endocrine Disorders, Severe Arthritis & Allergic States');
add('dexamethasone', 'Severe Allergic Flare-ups, Cerebral Edema & Shock States');
add('decadron', 'Inflammatory Conditions, Cerebral Edema & Chemotherapy Nausea');
add('methylprednisolone', 'Acute Spinal Injury, Multiple Sclerosis Exacerbation & Severe Inflammation');
add('medrol', 'Rheumatoid Arthritis, Systemic Lupus & Severe Allergic Reactions');
add('defcort', 'Severe Inflammation, Joint Swelling & Allergic Disorders');
add('deflazacort', 'Anti-inflammatory & Immunosuppressive Glucocorticoid Therapy');
add('adalimumab', 'Rheumatoid Arthritis, Ankylosing Spondylitis, Crohn’s & Psoriasis');
add('humira', 'Tumor Necrosis Factor (TNF) Blocker for Autoimmune Diseases');
add('etanercept', 'Rheumatoid Arthritis, Polyarticular JIA & Psoriatic Arthritis');
add('enbrel', 'Anti-TNF Biologic for Moderate to Severe Rheumatoid Arthritis');

// ─────────────────────────────────────────────────────────────────────────────
// 4. CARDIOVASCULAR, HYPERTENSION & HEART HEALTH (65+)
// ─────────────────────────────────────────────────────────────────────────────
add('amlodipine', 'High Blood Pressure (Hypertension) & Angina (Chest Pain)');
add('norvasc', 'High Blood Pressure (Hypertension) & Coronary Artery Disease');
add('stamlo', 'High Blood Pressure (Hypertension) & Chronic Stable Angina');
add('amlong', 'High Blood Pressure (Hypertension) & Angina Relief');
add('amlovas', 'Hypertension & Prevention of Chronic Angina Episodes');
add('cilnidipine', 'Hypertension & Renal Microcirculation Protection');
add('cilacar', 'High Blood Pressure with Kidney-Protective Vasodilation');
add('nifedipine', 'Hypertension, Vasospastic Angina & Raynaud Phenomenon');
add('procardia', 'Chronic Stable Angina & Vasospastic Angina');
add('adalat', 'Hypertension & Angina Pectoris Management');
add('felodipine', 'High Blood Pressure Management (Vascular-Selective)');
add('plendil', 'Hypertension Treatment Alone or with Other Antihypertensives');
add('diltiazem', 'Hypertension, Chronic Angina & Atrial Fibrillation Rate Control');
add('cardizem', 'Angina Pectoris & High Blood Pressure Control');
add('verapamil', 'Hypertension, Angina & Supraventricular Tachycardia Control');
add('calan', 'Angina, Arrhythmias & Essential Hypertension');
add('telmisartan', 'High Blood Pressure & Stroke / Heart Attack Risk Reduction');
add('telma', 'High Blood Pressure (Hypertension) & Cardiovascular Risk Reduction');
add('telma h', 'Hypertension with Fluid Retention (Blood Pressure + Diuretic)');
add('telmikind', 'High Blood Pressure Management & Vascular Protection');
add('micardis', 'Hypertension & Cardiovascular Risk Reduction in High-Risk Patients');
add('losartan', 'High Blood Pressure & Diabetic Kidney Protection (Nephropathy)');
add('losar', 'High Blood Pressure & Diabetic Nephropathy');
add('cozaar', 'Hypertension & Nephropathy in Type 2 Diabetic Patients');
add('valsartan', 'High Blood Pressure, Heart Failure & Post-Myocardial Infarction');
add('diovan', 'Hypertension, Heart Failure & Post-Heart Attack Survival');
add('olmesartan', 'High Blood Pressure (Hypertension) Management');
add('benicar', 'High Blood Pressure (Hypertension) Reduction');
add('candesartan', 'High Blood Pressure & Heart Failure with Reduced Ejection Fraction');
add('atacand', 'Hypertension & Heart Failure NYHA Class II-IV');
add('irbesartan', 'Hypertension & Diabetic Nephropathy in Type 2 Diabetes');
add('avapro', 'High Blood Pressure & Renal Protection in Diabetics');
add('lisinopril', 'High Blood Pressure (Hypertension) & Heart Failure Management');
add('zestril', 'Hypertension, Heart Failure Adjunct & Post-MI Survival');
add('prinivil', 'High Blood Pressure & Congestive Heart Failure');
add('ramipril', 'High Blood Pressure, Heart Failure & Post-Heart Attack Survival');
add('cardace', 'High Blood Pressure & Cardiovascular Disease Prevention');
add('altace', 'Hypertension, Heart Failure & Stroke Risk Reduction');
add('enalapril', 'High Blood Pressure & Congestive Heart Failure');
add('vasotec', 'Hypertension, Symptomatic Heart Failure & Asymptomatic LV Dysfunction');
add('perindopril', 'Hypertension & Stable Coronary Artery Disease Risk Reduction');
add('coversyl', 'High Blood Pressure & Secondary Prevention in CAD');
add('atenolol', 'High Blood Pressure, Angina & Irregular Heart Rhythms');
add('tenormin', 'Hypertension, Angina Pectoris & Acute Myocardial Infarction');
add('metoprolol', 'High Blood Pressure, Angina, Heart Failure & Arrhythmia Control');
add('betaloc', 'High Blood Pressure & Post-Myocardial Infarction Protection');
add('toprol xl', 'Hypertension, Angina Pectoris & NYHA Class II/III Heart Failure');
add('lopressor', 'High Blood Pressure, Angina Pectoris & Post-Heart Attack Therapy');
add('nebivolol', 'Hypertension & Mild to Moderate Heart Failure');
add('bystolic', 'High Blood Pressure Management with Nitric Oxide Vasodilation');
add('bisoprolol', 'Chronic Heart Failure & High Blood Pressure Management');
add('concor', 'Hypertension & Chronic Stable Heart Failure');
add('zebeta', 'Essential Hypertension Blood Pressure Lowering');
add('carvedilol', 'Heart Failure, Post-Heart Attack Left Ventricular Dysfunction & Hypertension');
add('coreg', 'Mild to Severe Heart Failure & Hypertension');
add('cardivas', 'Hypertension & Dilated Cardiomyopathy / Heart Failure');
add('propranolol', 'High Blood Pressure, Tremors, Migraine Prevention & Angina');
add('inderal', 'Hypertension, Angina, Essential Tremor & Migraine Prophylaxis');
add('ciptab', 'Performance Anxiety, Palpitations & High Blood Pressure');
add('furosemide', 'Severe Fluid Retention (Edema) in Heart Failure, Liver Cirrhosis & Kidney Disease');
add('lasix', 'Edema from Heart Failure, Hepatic Cirrhosis, Renal Disease & Hypertension');
add('torsemide', 'Edema Associated with Congestive Heart Failure & Hypertension');
add('dytor', 'Edema Associated with Heart Failure, Kidney Disease & Hypertension');
add('demadex', 'Fluid Overload in Heart Failure, Chronic Kidney Failure & Cirrhosis');
add('bumetanide', 'Potent Diuretic for Refractory Edema in Heart Failure');
add('hydrochlorothiazide', 'High Blood Pressure & Mild Fluid Retention');
add('chlorthalidone', 'Long-acting Diuretic for High Blood Pressure & Stroke Prevention');
add('hygroton', 'Hypertension & Fluid Retention in Congestive Heart Failure');
add('indapamide', 'High Blood Pressure Management with Minimal Metabolic Derangement');
add('spironolactone', 'Congestive Heart Failure, Resistant Hypertension, Edema & Hypokalemia');
add('aldactone', 'Heart Failure Mortality Reduction, Edema & Hyperaldosteronism');
add('eplerenone', 'Congestive Heart Failure Post-Heart Attack & Resistant Hypertension');
add('inspra', 'Improve Survival in Patients with Left Ventricular Systolic Dysfunction');
add('digoxin', 'Heart Failure & Atrial Fibrillation Heart Rate Control');
add('lanoxin', 'Chronic Heart Failure & Rate Control in Atrial Fibrillation');
add('amiodarone', 'Life-Threatening Ventricular Arrhythmias & Atrial Fibrillation');
add('cordarone', 'Refractory Ventricular Arrhythmias & Cardioversion Maintenance');
add('flecainide', 'Prevention of Paroxysmal Atrial Fibrillation & SVT');
add('sorbitrate', 'Acute Angina Pectoris (Chest Pain Relief)');
add('monit', 'Prevention of Chronic Angina (Chest Pain Attacks)');
add('nitroglycerin', 'Immediate Relief from Angina / Ischemic Chest Pain');
add('nitrostat', 'Sublingual Relief of Acute Angina Pectoris Attacks');

// ─────────────────────────────────────────────────────────────────────────────
// 5. ANTICOAGULANTS & ANTIPLATELETS (BLOOD THINNERS) (30+)
// ─────────────────────────────────────────────────────────────────────────────
add('warfarin', 'Blood Clot Prevention (Deep Vein Thrombosis, PE) & Stroke Risk in AFib');
add('coumadin', 'Blood Clot Treatment & Embolism Prevention in Heart Valve / AFib');
add('aspirin', 'Heart Attack & Stroke Prevention, Antiplatelet Protection & Pain Relief');
add('ecosprin', 'Low-Dose Blood Thinner for Heart Attack & Stroke Prevention');
add('ecosprin 75', 'Cardioprotective Low-Dose Antiplatelet for Clot Prevention');
add('ecosprin 150', 'Secondary Prevention of Acute Coronary Events & Stroke');
add('clopidogrel', 'Prevention of Recurrent Stroke, Heart Attack & Arterial Stents');
add('plavix', 'Atherothrombosis Prevention & Post-Coronary Stent Anticoagulation');
add('clopilet', 'Blood Thinner & Clot Prevention in Stented Coronary Arteries');
add('clopivas', 'Prevention of Atherosclerotic Thrombotic Events');
add('prasugrel', 'Prevention of Thrombotic Events in Acute Coronary Syndrome with PCI');
add('effient', 'Reduction of Stent Thrombosis in Percutaneous Coronary Intervention');
add('ticagrelor', 'Heart Attack & Stent Clot Prevention in Acute Coronary Syndrome');
add('brilinta', 'Prevention of Cardiovascular Death & Myocardial Infarction in ACS');
add('rivaroxaban', 'Prevention of Deep Vein Thrombosis (DVT), Pulmonary Embolism & Stroke');
add('xarelto', 'DVT / PE Treatment & Stroke Prevention in Non-Valvular AFib');
add('apixaban', 'Non-Valvular AFib Stroke Prevention & Venous Thromboembolism Treatment');
add('eliquis', 'Blood Clot & Stroke Prevention in Atrial Fibrillation');
add('dabigatran', 'Direct Thrombin Inhibition for Blood Clot & Stroke Prevention');
add('pradaxa', 'DVT, Pulmonary Embolism & Non-Valvular AFib Thromboembolism');
add('edoxaban', 'Stroke Prevention in Non-Valvular AFib & Treatment of DVT/PE');
add('savaysa', 'Once-Daily Oral Anticoagulant for Stroke Risk Reduction');
add('heparin', 'Immediate Anticoagulation for Acute Thrombosis, PE & Angioplasty');
add('enoxaparin', 'Deep Vein Thrombosis Prophylaxis & Acute Coronary Syndrome');
add('lovenox', 'Prevention & Treatment of Deep Vein Thrombosis & Pulmonary Embolism');
add('dalteparin', 'Low Molecular Weight Heparin for VTE Prophylaxis & Cancer Thrombosis');
add('fondaparinux', 'Deep Vein Thrombosis Prophylaxis in Orthopedic Surgery & PE');
add('arixtra', 'Synthetic Factor Xa Inhibitor for Acute Thrombosis');
add('dipyridamole', 'Secondary Stroke Prevention & Pharmacologic Stress Testing');
add('persantine', 'Adjunct to Anticoagulants for Mechanical Heart Valves');

// ─────────────────────────────────────────────────────────────────────────────
// 6. LIPID & CHOLESTEROL LOWERING AGENTS (25+)
// ─────────────────────────────────────────────────────────────────────────────
add('atorvastatin', 'High Cholesterol (Hyperlipidemia) & Cardiovascular Disease Prevention');
add('atorva', 'Lowering LDL Bad Cholesterol & Heart Attack Prevention');
add('lipitor', 'High Cholesterol & Arterial Plaque Reduction');
add('atorlip', 'Reduction of High Blood Cholesterol & Triglycerides');
add('rosuvastatin', 'Lowering LDL Bad Cholesterol & Atherosclerosis Prevention');
add('rozavel', 'Lowering Elevated Cholesterol & Triglyceride Blood Levels');
add('crestor', 'High Cholesterol Management & Plaque Buildup Retardation');
add('rosuvas', 'Elevated Lipid Levels & Coronary Artery Disease Prevention');
add('simvastatin', 'High Cholesterol & Cardiovascular Mortality Reduction');
add('zocor', 'Hypercholesterolemia & Coronary Heart Disease Survival');
add('pravastatin', 'Elevated Serum Cholesterol & Primary Prevention of CAD');
add('pravachol', 'Lipid Regulation with Minimal CYP3A4 Interactions');
add('lovastatin', 'Hyperlipidemia & Slowing Progression of Coronary Atherosclerosis');
add('pitavastatin', 'Potent Low-Dose Statin for Primary Hyperlipidemia');
add('livalo', 'Primary Hyperlipidemia & Mixed Dyslipidemia Treatment');
add('ezetimibe', 'Intestinal Cholesterol Absorption Blocker (Lowers LDL)');
add('zetia', 'Reduction of Elevated Total Cholesterol and LDL Alone or with Statins');
add('fenofibrate', 'Severe Hypertriglyceridemia & Mixed Dyslipidemia');
add('tricor', 'Significant Reduction of High Blood Triglycerides');
add('lipicard', 'Reduction of Elevated Serum Triglycerides & Pancreatitis Risk');
add('gemfibrozil', 'Severe Hypertriglyceridemia at Risk of Pancreatitis');
add('lopid', 'Triglyceride Lowering in Very High Blood Fat Conditions');
add('bempedoic acid', 'Non-Statin LDL Cholesterol Lowering');
add('nexletol', 'Adjunct Therapy for Heterozygous Familial Hypercholesterolemia');
add('evolocumab', 'PCSK9 Inhibitor for Dramatic LDL Reduction in High-Risk Patients');
add('repatha', 'Cardiovascular Event Reduction in Established Cardiovascular Disease');

// ─────────────────────────────────────────────────────────────────────────────
// 7. DIABETES & METABOLIC REGULATION (50+)
// ─────────────────────────────────────────────────────────────────────────────
add('metformin', 'Type 2 Diabetes Mellitus & Blood Glucose Regulation');
add('glycomet', 'Type 2 Diabetes Blood Sugar Control');
add('glycomet gp', 'Type 2 Diabetes Dual Therapy (Biguanide + Sulfonylurea)');
add('glycomet gp1', 'Type 2 Diabetes Blood Sugar Regulation');
add('glycomet gp2', 'Type 2 Diabetes Dual Glucose Lowering');
add('glucophage', 'Type 2 Diabetes Glycemic Control & Insulin Sensitization');
add('glimepiride', 'Type 2 Diabetes (Pancreatic Insulin Secretion Stimulation)');
add('amaryl', 'Type 2 Diabetes Mellitus Blood Sugar Regulation');
add('zoryl', 'Blood Sugar Lowering in Type 2 Diabetes');
add('gliclazide', 'Type 2 Diabetes Glycemic Control with Low Hypoglycemia Risk');
add('diamicron', 'Modified Release Type 2 Diabetes Blood Sugar Control');
add('glipizide', 'Type 2 Diabetes Mellitus Blood Sugar Lowering');
add('glucotrol', 'Type 2 Diabetes Control through Insulin Secretion');
add('sitagliptin', 'Type 2 Diabetes Glycemic Control (Incretin Enhancement)');
add('januvia', 'Type 2 Diabetes Blood Sugar Regulation without Weight Gain');
add('janumet', 'Type 2 Diabetes Dual Control (Sitagliptin + Metformin)');
add('vildagliptin', 'Type 2 Diabetes Incretin Enhancer for Glycemic Control');
add('galvus', 'Type 2 Diabetes Mellitus Postprandial & Fasting Glucose Control');
add('galvus met', 'Type 2 Diabetes Combined Therapy (Vildagliptin + Metformin)');
add('linagliptin', 'Type 2 Diabetes (Safe in Kidney Dysfunction)');
add('tradjenta', 'Type 2 Diabetes Control Requiring No Renal Dose Adjustments');
add('teneligliptin', 'Type 2 Diabetes Glycemic Control');
add('zita', 'Type 2 Diabetes Fasting & Post-Meal Sugar Regulation');
add('dapagliflozin', 'Type 2 Diabetes, Heart Failure & Chronic Kidney Disease Protection');
add('forxiga', 'Blood Glucose Control, Heart Failure & Kidney Protection');
add('farxiga', 'Type 2 Diabetes, HFrEF Mortality Reduction & CKD Progression Delay');
add('oxra', 'Type 2 Diabetes Glycemic Regulation & Renal Protection');
add('empagliflozin', 'Type 2 Diabetes, Heart Failure & Cardiovascular Mortality Reduction');
add('jardiance', 'Type 2 Diabetes Glucose Lowering & Heart Failure Protection');
add('canagliflozin', 'Type 2 Diabetes Glycemic Control & Diabetic Nephropathy Protection');
add('invokana', 'Lowering Blood Sugar in Type 2 Diabetes & Reducing Major CV Events');
add('pioglitazone', 'Type 2 Diabetes Insulin Sensitizer (PPAR-gamma Activation)');
add('actos', 'Improves Glycemic Control by Decreasing Insulin Resistance');
add('pioz', 'Type 2 Diabetes Management in Insulin-Resistant Patients');
add('acarbose', 'Postprandial Blood Glucose Spikes in Diabetes');
add('glucobay', 'Slowing Carbohydrate Digestion to Flatten After-Meal Glucose');
add('voglibose', 'Post-Meal High Blood Sugar (Postprandial Hyperglycemia)');
add('volibo', 'Postprandial Blood Sugar Spike Control in Diabetics');
add('semaglutide', 'Type 2 Diabetes Glycemic Control & Long-term Weight Management');
add('ozempic', 'Type 2 Diabetes Once-Weekly Glycemic Control & CV Risk Reduction');
add('rybelsus', 'Oral GLP-1 Receptor Agonist for Type 2 Diabetes Glucose Control');
add('wegovy', 'Chronic Weight Management in Obese or Overweight Adults');
add('liraglutide', 'Type 2 Diabetes Blood Sugar Control & Chronic Weight Management');
add('victoza', 'Daily GLP-1 Injection for Type 2 Diabetes & Cardiovascular Protection');
add('saxenda', 'Daily GLP-1 Agonist for Medical Weight Reduction');
add('dulaglutide', 'Type 2 Diabetes Once-Weekly Glycemic Regulation');
add('trulicity', 'Once-Weekly Subcutaneous GLP-1 Agonist for T2D Glycemic Control');
add('tirzepatide', 'Dual GIP/GLP-1 Agonist for Type 2 Diabetes & Weight Loss');
add('mounjaro', 'Dual Incretin Receptor Agonist for Powerful Glucose & Weight Reduction');
add('insulin', 'Type 1 & Advanced Type 2 Diabetes Absolute Glycemic Control');
add('lantus', 'Once-Daily Basal Insulin for 24-Hour Blood Sugar Stability');
add('humalog', 'Fast-Acting Mealtime Insulin for Postprandial Glucose Control');
add('novolog', 'Rapid-Acting Insulin Analog for Mealtime Coverage');

// ─────────────────────────────────────────────────────────────────────────────
// 8. GASTROINTESTINAL, ACID-PEPTIC & HEPATIC (50+)
// ─────────────────────────────────────────────────────────────────────────────
add('pantoprazole', 'Acid Reflux (GERD), Heartburn & Peptic Ulcers');
add('pan 40', 'Hyperacidity, Acid Reflux, Gastritis & Ulcer Healing');
add('pan d', 'Acid Reflux with Nausea, Vomiting & Gastric Fullness');
add('pan-d', 'Acid Reflux with Nausea, Vomiting & Gastric Fullness');
add('pantocid', 'Healing of Erosive Esophagitis & Gastric Acidity Relief');
add('protonix', 'Erosive Esophagitis & Pathologic Hypersecretory Gastric States');
add('omeprazole', 'Acid Reflux, Heartburn, Gastric Ulcers & H. Pylori Eradication');
add('omez', 'Acidity, GERD, Gastric Ulcers & Heartburn Relief');
add('omez d', 'Acidity, Gas & Nausea Associated with GERD');
add('prilosec', 'Frequent Heartburn & Gastroesophageal Reflux Disease (GERD)');
add('esomeprazole', 'Gastroesophageal Reflux Disease, Erosive Esophagitis & Ulcers');
add('nexpro', 'Erosive Gastritis, Heartburn & GERD Long-term Healing');
add('nexium', 'Healing of Erosive Esophagitis & Symptomatic GERD Treatment');
add('rabeprazole', 'Rapid Acidity Relief, Duodenal Ulcers & GERD');
add('razo', 'Rapid Relief from Acid Indigestion & Peptic Ulcers');
add('razo d', 'Acid Indigestion, Gas Fullness & Nausea Relief');
add('aciphex', 'Healing & Symptomatic Relief of Duodenal & Gastric Ulcers');
add('lansoprazole', 'Acid-Related Gastric Disorders, Heartburn & Peptic Ulcers');
add('prevacid', 'Treatment & Maintenance of Healed Erosive Esophagitis');
add('dexlansoprazole', 'Dual Delayed Release for 24-Hour Heartburn & GERD Control');
add('dexilant', 'Healing of All Grades of Erosive Esophagitis');
add('ranitidine', 'Gastric Acidity, Heartburn & Peptic Ulcer Healing');
add('rantac', 'Heartburn, Indigestion & Stomach Acidity Relief');
add('aciloc', 'Gastric Acid Reduction, Heartburn & GERD');
add('zantac', 'Short-term Relief of Heartburn & Acid Indigestion');
add('famotidine', 'Heartburn, Acid Indigestion, Sour Stomach & Peptic Ulcers');
add('pepcid', 'Prevention & Relief of Heartburn Associated with Acid Indigestion');
add('domperidone', 'Nausea, Vomiting, Gastric Fullness & Delayed Stomach Emptying');
add('motilium', 'Nausea, Vomiting, Epigastric Sense of Fullness & Reflux');
add('metoclopramide', 'Nausea, Vomiting, Diabetic Gastroparesis & Severe GERD');
add('reglan', 'Diabetic Gastroparesis & Symptomatic Gastroesophageal Reflux');
add('ondansetron', 'Nausea, Vomiting Prevention in Chemotherapy & Surgery');
add('zofran', 'Prevention of Nausea & Vomiting Caused by Chemotherapy or Surgery');
add('emeset', 'Nausea & Vomiting Relief in Acute Illness & Chemotherapy');
add('sucralfate', 'Gastric & Duodenal Mucosal Coating / Ulcer Protection');
add('sucrafil', 'Direct Protective Coating on Peptic Ulcer Craters');
add('digene', 'Instant Heartburn, Acidity, Gas & Stomach Discomfort Relief');
add('gelusil', 'Relief from Acidity, Gas, Heartburn & Bloated Stomach');
add('loperamide', 'Acute Diarrhea, Watery Loose Motions & Cramping');
add('imodium', 'Control & Symptomatic Relief of Acute & Chronic Diarrhea');
add('lactulose', 'Chronic Constipation & Hepatic Encephalopathy Toxin Removal');
add('duphalac', 'Gentle Colon-Cleansing Osmotic Stool Softening');
add('cremaffin', 'Gentle Overnight Relief from Constipation & Hard Stools');
add('dulcolax', 'Occasional Constipation & Bowel Evacuation');
add('bisacodyl', 'Short-term Relief of Constipation & Pre-Procedure Bowel Prep');
add('docusate', 'Stool Softener for Prevention of Straining During Defecation');
add('senna', 'Short-term Relief of Occasional Constipation');
add('senokot', 'Natural Vegetable Laxative for Gentle Overnight Constipation Relief');
add('ursodeoxycholic acid', 'Dissolution of Small Gallstones & Primary Biliary Cholangitis');
add('udiliv', 'Liver Protection, Bile Flow Enhancement & Gallstone Dissolution');
add('urso', 'Primary Biliary Cirrhosis / Cholangitis Treatment');

// ─────────────────────────────────────────────────────────────────────────────
// 9. CENTRAL NERVOUS SYSTEM, PSYCHIATRY & SLEEP (60+)
// ─────────────────────────────────────────────────────────────────────────────
add('escitalopram', 'Depression, Major Depressive Disorder & Generalized Anxiety Disorder (GAD)');
add('nexito', 'Depression, Anxiety Disorders & Panic Attacks');
add('lexapro', 'Major Depressive Disorder & Generalized Anxiety Disorder');
add('sertraline', 'Depression, Panic Disorder, OCD, PTSD & Social Anxiety');
add('zosert', 'Depression, Obsessive-Compulsive Disorder & Panic Disorder');
add('zoloft', 'Depression, Panic Disorder, OCD, PTSD & Premenstrual Dysphoric Disorder');
add('fluoxetine', 'Depression, Bulimia Nervosa, OCD & Panic Disorder');
add('flunil', 'Major Depressive Episodes, Bulimia & Obsessive Thoughts');
add('prozac', 'Depression, Bulimia, OCD & Panic Disorder');
add('paroxetine', 'Major Depression, Panic Attacks, Social Anxiety & PTSD');
add('paxil', 'Major Depressive Disorder, Panic Disorder & GAD');
add('citalopram', 'Major Depressive Disorder & Mood Restoration');
add('celexa', 'Relief of Depressive Mood, Apathy & Loss of Interest');
add('fluvoxamine', 'Obsessive-Compulsive Disorder (OCD) & Social Anxiety');
add('luvox', 'Treatment of Obsessions & Compulsions in OCD');
add('venlafaxine', 'Depression, Generalized Anxiety, Social Phobia & Panic');
add('venlor', 'Depression, Chronic Anxiety & Panic Episodes');
add('effexor', 'Major Depressive Disorder & Generalized Anxiety Disorder');
add('effexor xr', 'Panic Disorder, Social Anxiety & Major Depression');
add('duloxetine', 'Depression, Diabetic Nerve Pain, Fibromyalgia & Anxiety');
add('dulane', 'Diabetic Neuropathic Pain, Depression & Chronic Musculoskeletal Pain');
add('cymbalta', 'Fibromyalgia, Chronic Musculoskeletal Pain & Depression');
add('mirtazapine', 'Major Depression with Insomnia & Appetite Loss');
add('mirtaz', 'Depressive Symptoms, Insomnia & Low Appetite');
add('remeron', 'Major Depressive Disorder with Sleep Disturbance');
add('bupropion', 'Depression, Seasonal Affective Disorder & Smoking Cessation');
add('wellbutrin', 'Major Depressive Disorder & Nicotine Withdrawal Aid');
add('trazodone', 'Major Depression, Anxiety & Chronic Severe Insomnia');
add('desyrel', 'Depression & Associated Sleep Maintenance Difficulties');
add('amitriptyline', 'Depression, Neuropathic Pain, Chronic Tension Headaches & Fibromyalgia');
add('elavil', 'Major Depressive Episodes & Chronic Nerve Pain');
add('tryptomer', 'Neuropathic Pain, Tension Headache Prevention & Sleep Support');
add('nortriptyline', 'Depression & Post-Herpetic Neuralgia Nerve Pain');
add('pamelor', 'Relief of Symptoms of Major Depressive Illness');
add('imipramine', 'Depression & Childhood Enuresis (Bedwetting)');
add('tofranil', 'Major Depressive Disorder & Nocturnal Enuresis in Children');
add('doxepin', 'Depression, Anxiety & Sleep Maintenance Insomnia');
add('clomipramine', 'Obsessive-Compulsive Disorder & Severe Phobias');
add('anafranil', 'Obsessions & Compulsions in Patients with OCD');
add('alprazolam', 'Panic Attacks, Severe Acute Anxiety & Agoraphobia');
add('alprax', 'Short-term Relief of Anxiety & Panic Disorder');
add('restyl', 'Acute Anxiety & Stress-Induced Nervousness');
add('xanax', 'Panic Disorder & Generalized Anxiety Symptoms');
add('clonazepam', 'Seizures, Panic Disorder, Agoraphobia & Akathisia');
add('clonafit', 'Panic Disorder, Seizure Control & Anxiety');
add('zapiz', 'Seizure Prophylaxis & Acute Panic Attacks');
add('klonopin', 'Seizure Disorders & Panic Disorder with or without Agoraphobia');
add('lorazepam', 'Severe Anxiety, Panic, Insomnia & Preoperative Sedation');
add('ativan', 'Short-term Management of Anxiety Disorders & Insomnia');
add('trapex', 'Severe Acute Anxiety, Agitation & Muscle Tension');
add('diazepam', 'Muscle Spasms, Severe Anxiety, Alcohol Withdrawal & Seizures');
add('valium', 'Acute Muscle Spasm, Alcohol Withdrawal Symptoms & Anxiety');
add('calmpose', 'Muscle Relaxation, Sedation & Acute Anxiety Relief');
add('zolpidem', 'Short-term Treatment of Insomnia & Sleep Initiation');
add('nitrest', 'Acute Insomnia & Sleep Maintenance Support');
add('ambien', 'Short-term Treatment of Difficulty with Sleep Onset');
add('zopiclone', 'Short-term Management of Insomnia');
add('eszopiclone', 'Difficulty Falling Asleep & Staying Asleep (Insomnia)');
add('lunesta', 'Longer-term Management of Transient & Chronic Insomnia');
add('melatonin', 'Circadian Rhythm Sleep Disorders & Jet Lag');
add('quetiapine', 'Bipolar Disorder, Schizophrenia & Treatment-Resistant Depression');
add('qutipin', 'Bipolar Mania, Schizophrenia & Adjunct in Major Depression');
add('seroquel', 'Schizophrenia, Bipolar Mania & Bipolar Depressive Episodes');
add('olanzapine', 'Schizophrenia & Bipolar I Disorder Manic Episodes');
add('olexar', 'Bipolar Disorder & Schizophrenic Symptoms');
add('zyprexa', 'Acute Agitation in Schizophrenia & Bipolar Disorder');
add('risperidone', 'Schizophrenia, Bipolar Mania & Irritability in Autism');
add('sizodon', 'Schizophrenia, Bipolar Episodes & Aggression');
add('risperdal', 'Schizophrenia & Acute Manic or Mixed Episodes in Bipolar I');
add('aripiprazole', 'Schizophrenia, Bipolar Disorder & Antidepressant Augmentation');
add('arizep', 'Schizophrenia, Manic Episodes & Major Depressive Augmentation');
add('abilify', 'Schizophrenia, Bipolar Mania & Major Depressive Disorder Add-on');
add('haloperidol', 'Acute Psychosis, Schizophrenia & Tourette Syndrome Tics');
add('haldol', 'Severe Psychomotor Agitation, Delirium & Chronic Schizophrenia');
add('clozapine', 'Treatment-Resistant Schizophrenia & Suicidal Behavior Reduction');
add('clozaril', 'Severely Ill Patients with Chronic Resistant Schizophrenia');
add('lithium', 'Bipolar Affective Disorder Mania & Maintenance Mood Stabilization');

// ─────────────────────────────────────────────────────────────────────────────
// 10. NEUROLOGICAL & ANTICONVULSANTS (35+)
// ─────────────────────────────────────────────────────────────────────────────
add('gabapentin', 'Neuropathic Pain, Diabetic Nerve Pain & Partial Seizures');
add('gabaneuron', 'Diabetic Neuropathy, Nerve Pain & Burning Foot Pain');
add('neurontin', 'Postherpetic Neuralgia & Adjunctive Therapy in Partial Onset Seizures');
add('pregabalin', 'Diabetic Neuropathy, Fibromyalgia, Postherpetic Neuralgia & Spinal Cord Injury Pain');
add('pregalin', 'Peripheral Neuropathic Pain & Fibromyalgia Body Aches');
add('lyrica', 'Neuropathic Pain, Fibromyalgia & Generalized Anxiety');
add('levetiracetam', 'Partial Onset, Myoclonic & Tonic-Clonic Seizures (Epilepsy)');
add('levipil', 'Seizure Control in Epilepsy & Prevention of Convulsions');
add('keppra', 'Anticonvulsant for Partial, Myoclonic & Generalized Tonic-Clonic Seizures');
add('sodium valproate', 'Epilepsy, Absence Seizures, Bipolar Mania & Migraine Prevention');
add('valproate', 'Generalized Seizures, Bipolar Mania & Migraine Prevention');
add('encorate', 'Epileptic Convulsions & Bipolar Mood Stabilization');
add('depakote', 'Complex Partial Seizures, Bipolar Mania & Migraine Headaches');
add('carbamazepine', 'Partial Seizures, Generalized Tonic-Clonic Seizures & Trigeminal Neuralgia');
add('tegretol', 'Epilepsy Control & Severe Trigeminal Facial Nerve Pain');
add('mazetol', 'Trigeminal Neuralgia Electric Pain & Seizure Prevention');
add('phenytoin', 'Tonic-Clonic Seizures & Psychomotor Seizures');
add('eptoin', 'Epilepsy, Status Epilepticus & Grand Mal Convulsions');
add('dilantin', 'Control of Generalized Tonic-Clonic and Complex Partial Seizures');
add('lamotrigine', 'Epilepsy Seizures & Bipolar I Disorder Mood Episode Delay');
add('lamictal', 'Partial Seizures, Generalized Seizures & Bipolar Depression');
add('topiramate', 'Epilepsy Seizure Control & Chronic Migraine Prevention');
add('topamax', 'Partial Onset Seizures & Migraine Headache Prophylaxis');
add('donepezil', 'Alzheimer Disease Cognitive Decline & Dementia Symptoms');
add('aricept', 'Mild, Moderate, and Severe Dementia of the Alzheimer Type');
add('rivastigmine', 'Alzheimer Dementia & Parkinson Disease Dementia');
add('exelon', 'Mild to Moderate Dementia of Alzheimer or Parkinson Disease');
add('memantine', 'Moderate to Severe Alzheimer Disease Cognitive Protection');
add('namenda', 'Slowing Cognitive Decline in Moderate to Severe Alzheimer Disease');
add('levodopa', 'Parkinson Disease Motor Symptoms, Rigidity & Tremors');
add('carbidopa', 'Inhibitor of Extracerebral Decarboxylation for Parkinson Disease');
add('syndopa', 'Parkinson Disease Tremors, Slowness & Muscle Rigidity');
add('sinemet', 'Parkinsonian Rigidity, Akinesia, Tremor & Shuffling Gait');
add('pramipexole', 'Parkinson Disease Symptoms & Restless Legs Syndrome');
add('mirapex', 'Idiopathic Parkinson Disease & Moderate-to-Severe Restless Legs');
add('ropinirole', 'Parkinson Disease & Moderate to Severe Restless Legs Syndrome');
add('requip', 'Parkinson Disease Motor Symptoms & Restless Legs');
add('amantadine', 'Parkinson Disease Motor Fluctuations & Drug-Induced EPS');
add('trihexyphenidyl', 'Drug-Induced Parkinsonian Tremors & Rigidity');
add('pacitane', 'Parkinsonian Tremors & Antipsychotic-Induced Muscle Stiffness');

// ─────────────────────────────────────────────────────────────────────────────
// 11. ANTIMICROBIALS, ANTIBIOTICS & ANTIFUNGALS (55+)
// ─────────────────────────────────────────────────────────────────────────────
add('amoxicillin', 'Bacterial Ear, Nose, Throat, Skin & Chest Infections');
add('mox', 'Upper & Lower Respiratory Tract Bacterial Infections');
add('amoxil', 'Streptococcal Infections, Otitis Media & Sinusitis');
add('augmentin', 'Bacterial Respiratory Infections, Sinusitis, Dental Abscess & UTI');
add('augmentin 625', 'Bacterial Chest Infections, Sinusitis & Dental Abscess');
add('moxikind cv', 'Severe Bacterial Infections with Beta-Lactamase Resistance');
add('amoxyclav', 'Bronchitis, Pneumonia, Sinus Infection & Skin Infections');
add('ampicillin', 'Respiratory, GI, Urinary & Meningeal Bacterial Infections');
add('piperacillin', 'Severe Pseudomonas & Hospital-Acquired Gram-Negative Infections');
add('azithromycin', 'Bacterial Throat, Chest, Skin & Reproductive Infections');
add('azithral', 'Bacterial Tonsillitis, Sinusitis, Pneumonia & Bronchitis');
add('zithromax', 'Community-Acquired Pneumonia, Strep Throat & Chlamydia');
add('clarithromycin', 'H. Pylori Ulcer Infections & Respiratory Bacterial Infections');
add('biaxin', 'Pharyngitis, Tonsillitis, Acute Maxillary Sinusitis & Bronchitis');
add('ciprofloxacin', 'Urinary Tract Infections, Infectious Diarrhea & Bone Infections');
add('ciplox', 'Bacterial Eye, Ear, Urinary & Gastrointestinal Infections');
add('cipro', 'Complicated Urinary Tract Infections & Severe Bacterial Enteritis');
add('levofloxacin', 'Bacterial Sinusitis, Pneumonia, Kidney Infections & Chronic Bronchitis');
add('levomac', 'Bacterial Lung Infections, Sinusitis & Severe UTI');
add('levaquin', 'Pneumonia, Acute Sinusitis & Complicated Pyelonephritis');
add('ofloxacin', 'Bacterial Diarrhea, Typhoid Fever & Urinary Infections');
add('zenflox', 'Gastrointestinal Bacterial Diarrhea & Urinary Tract Infections');
add('oflox oz', 'Bacterial & Amoebic Mixed Dysentery with Stomach Cramping');
add('moxifloxacin', 'Acute Bacterial Sinusitis & Community-Acquired Pneumonia');
add('avelox', 'Complicated Skin Infections & Severe Bacterial Bronchitis');
add('cefixime', 'Typhoid Fever, Bacterial Urinary Infections & Throat Infections');
add('taxim o', 'Bacterial Chest Infections, Typhoid Fever & UTI');
add('suprax', 'Otitis Media, Pharyngitis, Tonsillitis & Uncomplicated UTI');
add('cefuroxime', 'Bacterial Pharyngitis, Sinusitis, Bronchitis & Lyme Disease');
add('cetil', 'Bacterial Tonsillitis, Bronchitis & Skin Tissue Infections');
add('ceftin', 'Pharyngitis, Tonsillitis, Acute Bacterial Otitis Media & Bronchitis');
add('cephalexin', 'Bacterial Skin Infections, Cellulitis & Urinary Infections');
add('keflex', 'Respiratory Tract, Otitis Media, Skin and Bone Infections');
add('ceftriaxone', 'Severe Meningitis, Sepsis, Pneumonia & Gonococcal Infections');
add('monocef', 'Severe Bacterial Sepsis, Meningitis & Post-Surgical Prophylaxis');
add('rocephin', 'Bacterial Meningitis, Intra-Abdominal Infections & Gonorrhea');
add('doxycycline', 'Acne, Chlamydia, Lyme Disease, Malaria Prevention & Respiratory Infections');
add('doxt', 'Severe Acne, Bacterial Chest Infections & Malaria Prophylaxis');
add('vibramycin', 'Rickettsial Infections, Chlamydia & Respiratory Tract Infections');
add('minocycline', 'Severe Inflammatory Acne Vulgaris & Bacterial Skin Lesions');
add('metronidazole', 'Amoebiasis, Giardiasis, Trichomoniasis & Anaerobic Infections');
add('flagyl', 'Intestinal Amoebic Dysentery & Anaerobic Bacterial Infections');
add('tinidazole', 'Amebiasis, Giardiasis & Trichomoniasis Parasitic Infections');
add('nitrofurantoin', 'Uncomplicated Urinary Tract Infections (Bladder Infection / Cystitis)');
add('martifur', 'Acute & Recurrent Bacterial Urinary Bladder Infections');
add('macrobid', 'Acute Uncomplicated Urinary Tract Infections (Cystitis)');
add('cotrimoxazole', 'Urinary Tract Infections, Pneumocystis Pneumonia & Bronchitis');
add('bactrim', 'Bacterial UTI, Shigellosis & Pneumocystis Jirovecii Prophylaxis');
add('septran', 'Bacterial Urinary, Respiratory & Intestinal Infections');
add('clindamycin', 'Dental Abscess, Bone Infections & Anaerobic Bacterial Infections');
add('dalacin c', 'Serious Anaerobic Infections, Dental Bone Infections & Deep Abscess');
add('cleocin', 'Serious Respiratory, Skin and Soft Tissue Anaerobic Infections');
add('fluconazole', 'Fungal Thrush, Vaginal Yeast Infections & Cryptococcal Meningitis');
add('forcan', 'Candidiasis, Fungal Ringworm & Systemic Fungal Infections');
add('diflucan', 'Vaginal Candidiasis, Oropharyngeal Thrush & Systemic Fungal Infection');
add('itraconazole', 'Systemic Fungal Nail Infections & Aspergillosis');
add('candiforce', 'Stubborn Fungal Skin Infections, Ringworm & Onychomycosis');
add('sporanox', 'Blastomycosis, Histoplasmosis & Onychomycosis of the Toenail');
add('terbinafine', 'Fungal Toenail Infections, Athlete’s Foot & Ringworm');
add('lamisil', 'Fungal Infections of the Skin and Nails (Onychomycosis)');
add('acyclovir', 'Herpes Simplex, Shingles (Herpes Zoster) & Chickenpox');
add('zovirax', 'Initial and Recurrent Mucocutaneous Herpes Simplex Infections');
add('valacyclovir', 'Herpes Zoster (Shingles), Genital Herpes & Cold Sores');
add('valtrex', 'Treatment of Herpes Zoster & Suppression of Recurrent Genital Herpes');
add('oseltamivir', 'Influenza A & B Flu Treatment and Post-Exposure Prophylaxis');
add('tamiflu', 'Treatment of Acute Uncomplicated Influenza in High-Risk Patients');

// ─────────────────────────────────────────────────────────────────────────────
// 12. THYROID, ENDOCRINE & HORMONE THERAPY (20+)
// ─────────────────────────────────────────────────────────────────────────────
add('levothyroxine', 'Hypothyroidism (Underactive Thyroid Hormone Replacement)');
add('thyronorm', 'Underactive Thyroid (Hypothyroidism) Hormone Balance');
add('eltroxin', 'Thyroid Hormone Deficiency Replacement Therapy');
add('synthroid', 'Replacement Therapy in Congenital or Acquired Hypothyroidism');
add('euthyrox', 'Restoration of Normal Thyroid Hormone Levels');
add('liothyronine', 'Fast-acting T3 Replacement for Severe Hypothyroidism / Myxedema');
add('cytomel', 'Hypothyroidism & Pituitary TSH Suppression');
add('carbimazole', 'Hyperthyroidism (Overactive Thyroid Excess Production)');
add('neo mercazole', 'Overactive Thyroid & Preparation for Thyroidectomy');
add('methimazole', 'Hyperthyroidism & Preparation for Radioactive Iodine Therapy');
add('tapazole', 'Medical Management of Hyperthyroidism in Patients with Graves Disease');
add('propylthiouracil', 'Hyperthyroidism & Thyroid Storm Crisis');
add('cabergoline', 'Hyperprolactinemia (High Prolactin Tumors / Galactorrhea)');
add('dostinex', 'Inhibition of Physiological Lactation & Hyperprolactinemic Disorders');
add('finasteride', 'Benign Prostatic Hyperplasia (Enlarged Prostate) & Male Pattern Hair Loss');
add('proscar', 'Reduction in the Risk of Acute Urinary Retention in BPH');
add('propecia', 'Male Pattern Hair Loss (Androgenetic Alopecia) on Vertex');
add('dutasteride', 'Benign Prostatic Hyperplasia Symptom Relief & Prostate Shrinkage');
add('avodart', 'Enlarged Prostate Urinary Flow Improvement & Surgery Risk Reduction');

// ─────────────────────────────────────────────────────────────────────────────
// 13. UROLOGICAL, RENAL & MEN'S HEALTH (20+)
// ─────────────────────────────────────────────────────────────────────────────
add('tamsulosin', 'Enlarged Prostate (BPH) Urinary Hesitancy & Flow Improvement');
add('urimax', 'Enlarged Prostate (BPH) Urinary Hesitancy & Easy Urination');
add('flomax', 'Benign Prostatic Hyperplasia Difficulty Urinating Relief');
add('alfuzosin', 'Lower Urinary Tract Symptoms Associated with BPH');
add('uroxatral', 'Urinary Flow Obstruction Relief from Enlarged Prostate');
add('silodosin', 'Benign Prostatic Hyperplasia Hesitancy & Weak Stream Relief');
add('silodal', 'Enlarged Prostate Urinary Hesitancy & Nocturia Relief');
add('rapaflo', 'Signs and Symptoms of Benign Prostatic Hyperplasia');
add('sildenafil', 'Erectile Dysfunction & Pulmonary Arterial Hypertension');
add('viagra', 'Erectile Dysfunction (Male Impotence) Treatment');
add('revatio', 'Pulmonary Arterial Hypertension Exercise Capacity Improvement');
add('tadalafil', 'Erectile Dysfunction & Benign Prostatic Hyperplasia (BPH)');
add('cialis', 'Erectile Dysfunction & Lower Urinary Tract Symptoms of BPH');
add('vardenafil', 'Erectile Dysfunction Treatment');
add('levitra', 'Male Sexual Function Enhancement & Impotence Relief');
add('oxybutynin', 'Overactive Bladder, Urinary Urgency & Incontinence Leakage');
add('ditropan', 'Bladder Instability Associated with Incontinence');
add('tolterodine', 'Overactive Bladder with Symptoms of Frequency, Urgency & Leakage');
add('detrol', 'Overactive Bladder Urinary Incontinence Reduction');
add('solifenacin', 'Overactive Bladder Urge Incontinence & Frequency');
add('vesicare', 'Urinary Urgency, Frequency and Urge Incontinence in OAB');

// ─────────────────────────────────────────────────────────────────────────────
// 14. VITAMINS, MINERALS & NUTRITIONAL HEALTH (30+)
// ─────────────────────────────────────────────────────────────────────────────
add('cholecalciferol', 'Vitamin D Deficiency, Calcium Absorption & Bone Health');
add('vitamin d3', 'Bone Density Maintenance & Immune System Support');
add('calcirol', 'Severe Vitamin D Deficiency & Osteomalacia Prevention');
add('d rise', 'High-Dose Weekly Vitamin D3 Replenishment');
add('calcitriol', 'Active Vitamin D for Renal Osteodystrophy & Hypocalcemia');
add('rocaltrol', 'Management of Hypocalcemia in Dialysis Patients');
add('calcium carbonate', 'Calcium Supplementation for Strong Bones & Teeth');
add('shelcal', 'Calcium & Vitamin D3 Deficiency in Osteoporosis');
add('cipcal', 'Bone Mineralization & Pregnancy Calcium Support');
add('methylcobalamin', 'Vitamin B12 Deficiency, Nerve Repair & Diabetic Neuropathy');
add('neurobion', 'Vitamin B-Complex for Nerve Health & Numbness Relief');
add('neurobion forte', 'Nerve Regeneration, Vitamin B Deficiency & Paresthesia Relief');
add('cyanocobalamin', 'Pernicious Anemia & Vitamin B12 Deficiency');
add('folic acid', 'Folate Deficiency Anemia, Red Blood Cell Production & Prenatal Support');
add('folvite', 'Folic Acid Supplementation in Pregnancy & Anemia Prevention');
add('ferrous sulfate', 'Iron-Deficiency Anemia Treatment & Red Blood Cell Formation');
add('slow fe', 'Iron Deficiency & Iron-Deficiency Anemia with Gentle GI Release');
add('ferrous ascorbate', 'Iron-Deficiency Anemia with Enhanced Vitamin C Absorption');
add('orofer', 'Rapid Hemoglobin Elevation & Iron Storage Replenishment');
add('zincovit', 'Multivitamin & Zinc Formula for Immune Function & Convalescence');
add('becosules', 'Vitamin B-Complex with Vitamin C for Mouth Ulcers & Stamina');
add('supradyn', 'Daily Multivitamin & Multimineral for Vitality & Energy');
add('potassium chloride', 'Hypokalemia (Low Blood Potassium from Diuretics)');
add('potclor', 'Potassium Supplement for Preventing Electrolyte Imbalance');
add('k dur', 'Extended-Release Potassium Chloride for Kaliuresis Prevention');
add('magnesium oxide', 'Magnesium Deficiency & Acid Indigestion');
add('coenzyme q10', 'Cellular Energy Production, Heart Health & Statin Myopathy Protection');
add('coq10', 'Cardiovascular Support & Mitochondrial Antioxidant Protection');
add('omega 3', 'Cardiovascular Health, Triglyceride Reduction & Brain Wellness');
add('fish oil', 'Reduction of High Blood Triglycerides & Joint Mobility Support');

// ─────────────────────────────────────────────────────────────────────────────
// 15. HERBAL, BOTANICAL & AYURVEDIC FORMULATIONS (35+)
// ─────────────────────────────────────────────────────────────────────────────
add('ashwagandha', 'Stress Reduction, Vitality, Cognitive Health & Immunity');
add('withania somnifera', 'Adaptogen for Cortisol Reduction, Stamina & Mental Calm');
add('turmeric', 'Joint Inflammation, Antioxidant Support & General Wellness');
add('curcumin', 'Potent Anti-inflammatory, Joint Comfort & Cellular Protection');
add('tulsi', 'Respiratory Health, Immune Support & Adaptogenic Stress Relief');
add('holy basil', 'Immunity Booster, Cough Relief & Environmental Stress Protection');
add('brahmi', 'Memory Retention, Cognitive Focus & Mental Clarity');
add('bacopa monnieri', 'Nootropic Support for Brain Function & Nervous System Calm');
add('triphala', 'Digestive Regularity, Gut Cleansing & Gentle Detoxification');
add('guggul', 'Lipid Balance, Joint Comfort & Healthy Metabolic Function');
add('shatavari', 'Female Hormonal Balance, Reproductive Vitality & Lactation Support');
add('amla', 'High Natural Vitamin C, Immunity & Antioxidant Hair/Skin Health');
add('neem', 'Blood Purification, Clear Skin & Antimicrobial Defense');
add('karela', 'Natural Blood Glucose Regulation & Metabolic Support');
add('bitter melon', 'Support for Healthy Blood Sugar & Pancreatic Function');
add('giloy', 'Immunity Modulation, Chronic Fever Recovery & Detoxification');
add('tinospora cordifolia', 'Platelet Count Support & Systemic Immunity Enhancement');
add('moringa', 'Nutrient-Dense Superfood for Energy, Minerals & Antioxidants');
add('spirulina', 'Superfood Protein, Micronutrient Balance & Stamina');
add('chyawanprash', 'Traditional Ayurvedic Immune Rejuvenation & Vitality Paste');
add('liv 52', 'Hepatic Cell Protection, Liver Toxin Defense & Appetite Support');
add('septilin', 'Immune Defense Against Recurrent Respiratory Infections');
add('rumalaya', 'Ayurvedic Joint Comfort, Mobility & Musculoskeletal Relief');
add('cystone', 'Kidney Health, Urinary Tract Comfort & Stone Prevention');
add('geriforte', 'Antioxidant Rejuvenator & Geriatric Physical Wellness');
add('ginkgo biloba', 'Cognitive Health, Memory Function & Peripheral Circulation');
add('st johns wort', 'Mild to Moderate Depressive Mood & Nervous Tension');
add('garlic extract', 'Circulatory Support & Mild Blood Pressure Regulation');
add('ginseng', 'Physical Endurance, Mental Alertness & Vitality Enhancement');
add('ginger extract', 'Nausea Relief, Digestive Comfort & Anti-inflammatory Support');
add('licorice root', 'Gastric Soothing, Throat Comfort & Adrenal Balance');
add('kava kava', 'Anxiety Relief, Emotional Relaxation & Stress Alleviation');
add('valerian root', 'Restful Sleep Initiation & Nighttime Muscle Relaxation');
add('green tea extract', 'Antioxidant Defense & Metabolic Energy Support');
add('milk thistle', 'Silymarin Liver Cell Protection & Toxin Defense');

console.log(`Total indications generated: ${Object.keys(indications).length}`);

// Generate file content
let content = `/**
 * frontend/src/utils/indications.js — Clinical Indication & Medical Condition Resolver
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves the primary medical condition, illness, symptom, or therapeutic purpose
 * ("What this medicine is used for") across 500+ Indian & international formulations.
 */

// ─── Curated Medical Indications Formulary (${Object.keys(indications).length}+ Entries) ────────────────────
export const MEDICINE_INDICATIONS = {
`;

for (const [k, v] of Object.entries(indications)) {
  content += `  '${k}': '${v.replace(/'/g, "\\'")}',\n`;
}

content += `};

// ─── Chemical Salt & Generic Pattern Heuristics ──────────────────────────────
export const CHEMICAL_SALT_INDICATIONS = [
  {
    pattern: /levocetirizine.*montelukast|montelukast.*levocetirizine/i,
    indication: 'Allergic Rhinitis, Sneezing, Runny Nose, Watery Eyes & Allergic Asthma',
  },
  {
    pattern: /paracetamol.*ibuprofen|ibuprofen.*paracetamol/i,
    indication: 'Severe Musculoskeletal Pain, Joint Inflammation & Fever Relief',
  },
  {
    pattern: /paracetamol.*aceclofenac|aceclofenac.*paracetamol/i,
    indication: 'Acute Joint Pain, Backache, Dental Pain & Inflammation',
  },
  {
    pattern: /aceclofenac.*paracetamol.*serratiopeptidase/i,
    indication: 'Severe Inflammatory Swelling, Post-Traumatic Edema & Pain Relief',
  },
  {
    pattern: /pantoprazole.*domperidone|domperidone.*pantoprazole/i,
    indication: 'Acid Reflux (GERD) with Nausea, Vomiting & Gastric Fullness',
  },
  {
    pattern: /rabeprazole.*domperidone|domperidone.*rabeprazole/i,
    indication: 'Acid Indigestion, Heartburn, Gas Fullness & Nausea Relief',
  },
  {
    pattern: /naproxen.*domperidone/i,
    indication: 'Acute Migraine Headache with Nausea & Vomiting Prevention',
  },
  {
    pattern: /telmisartan.*hydrochlorothiazide|telmisartan.*amlodipine/i,
    indication: 'High Blood Pressure (Dual Therapy for Resistant Hypertension)',
  },
  {
    pattern: /glimepiride.*metformin|metformin.*glimepiride/i,
    indication: 'Type 2 Diabetes Mellitus (Dual Therapy Blood Sugar Control)',
  },
  {
    pattern: /vildagliptin.*metformin|sitagliptin.*metformin/i,
    indication: 'Type 2 Diabetes Mellitus Fasting & Post-Meal Sugar Regulation',
  },
  {
    pattern: /amoxicillin.*clavulan/i,
    indication: 'Bacterial Chest Infections, Sinusitis, Dental Abscess & UTI',
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
    .replace(/\\s+\\d+(\\.\\d+)?\\s*(mg|mcg|g|ml|iu)?$/i, '')
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

  const combinedSearchText = \`\${rawName} \${cleanedName} \${rawGeneric} \${saltsText} \${rawDosage}\`.toLowerCase();

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
  const words = \`\${cleanedName} \${rawGeneric}\`.split(/\\s+/).filter(Boolean);
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
`;

fs.writeFileSync(targetPath, content, 'utf-8');
console.log(`✅ Successfully generated ${Object.keys(indications).length} indications in ${targetPath}!`);
