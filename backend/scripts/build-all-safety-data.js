/**
 * backend/scripts/build-all-safety-data.js
 *
 * Compiles and outputs:
 * 1. backend/data/allergy-groups.json
 * 2. backend/data/disease-drug.json    (50 entries, 40-60 target)
 * 3. backend/data/food-spacing.json    (40 entries, exact target)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// ═════════════════════════════════════════════════════════════════════════════
// 1. ALLERGY GROUPS
// ═════════════════════════════════════════════════════════════════════════════
const allergyGroups = [
  {
    id: "penicillin",
    name: "Penicillins & Aminopenicillins",
    synonyms: ["penicillin", "penicillins", "penicillin-v", "penicillin-g", "benzylpenicillin", "amoxicillin", "ampicillin", "augmentin", "moxikind", "co-amoxiclav", "amoxil", "amox"],
    members: ["penicillin", "penicillin v", "penicillin g", "amoxicillin", "ampicillin", "co-amoxiclav", "piperacillin", "ticarcillin", "oxacillin", "cloxacillin", "dicloxacillin", "nafcillin", "flucloxacillin"],
    crossReactivities: [
      {
        targetGroupId: "cephalosporin",
        targetGroupName: "Cephalosporins",
        risk: "LOW_MODERATE",
        severity: "MAJOR",
        clinicalNote: "Shared beta-lactam core. Cross-reactivity is historically ~1-3% with second- and third-generation cephalosporins, but higher with first-generation cephalosporins sharing similar R1 side-chains (e.g. cephalexin, cefadroxil, cefazolin).",
        plainNote: "You have a documented Penicillin allergy. Cephalosporin antibiotics share a related chemical structure with a low-to-moderate chance of cross-reaction. Consult your prescribing physician before taking.",
        source: "AAAAI / EAACI Beta-Lactam Hypersensitivity Parameters"
      }
    ],
    source: "AAAAI / EAACI Beta-Lactam Hypersensitivity Guidelines"
  },
  {
    id: "cephalosporin",
    name: "Cephalosporins",
    synonyms: ["cephalosporin", "cephalosporins", "cefa", "ceph", "cephalexin", "cefixime", "ceftriaxone", "cefuroxime"],
    members: ["cephalexin", "cefazolin", "cefadroxil", "cefuroxime", "cefaclor", "cefprozil", "cefixime", "ceftriaxone", "cefotaxime", "ceftazidime", "cefepime", "cefpodoxime", "cefdinir", "ceftaroline"],
    crossReactivities: [
      {
        targetGroupId: "penicillin",
        targetGroupName: "Penicillins",
        risk: "LOW_MODERATE",
        severity: "MAJOR",
        clinicalNote: "Cross-reactivity with penicillins exists due to shared beta-lactam pharmacophore. Surveillance for immediate-type IgE reactions or delayed T-cell exanthems is indicated.",
        plainNote: "You have a documented Cephalosporin allergy. Penicillins share related structure with a small risk of allergic cross-reaction.",
        source: "AAAAI Practice Parameters"
      }
    ],
    source: "AAAAI Beta-Lactam Allergy Consensus"
  },
  {
    id: "sulfa",
    name: "Sulfonamide Antibacterials",
    synonyms: ["sulfa", "sulfonamide", "sulfonamides", "sulpha", "bactrim", "septra", "cotrimoxazole", "co-trimoxazole"],
    members: ["sulfamethoxazole", "trimethoprim", "co-trimoxazole", "sulfasalazine", "sulfadiazine", "sulfisoxazole", "dapsone"],
    crossReactivities: [
      {
        targetGroupId: "sulfa_non_arylamine",
        targetGroupName: "Non-Antibiotic Sulfonamides",
        risk: "LOW",
        severity: "MODERATE",
        clinicalNote: "Non-arylamine sulfonamides (e.g., celecoxib, furosemide, hydrochlorothiazide, glimepiride) lack the N1 heterocyclic ring and N4 aromatic amine; immunologic cross-reactivity is extremely low, but clinical caution is recommended.",
        plainNote: "You have a sulfa antibiotic allergy. Other non-antibiotic medicines containing sulfur have very low cross-reaction risk, but inform your doctor.",
        source: "ACAAI / AAAAI Practice Parameters"
      }
    ],
    source: "Joint Task Force on Practice Parameters (AAAAI/ACAAI)"
  },
  {
    id: "nsaid_aspirin",
    name: "NSAIDs & Aspirin",
    synonyms: ["nsaid", "nsaids", "aspirin", "ibuprofen", "painkillers", "pain killer", "cox-1", "combiflam", "voveran"],
    members: ["aspirin", "ibuprofen", "naproxen", "diclofenac", "aceclofenac", "ketorolac", "indomethacin", "mefenamic acid", "piroxicam", "meloxicam", "etoricoxib", "celecoxib", "nabumetone", "sulindac", "ketoprofen", "flurbiprofen", "lornoxicam", "nimesulide"],
    crossReactivities: [],
    source: "EAACI Taskforce on NSAID Hypersensitivity"
  },
  {
    id: "iodine",
    name: "Iodine & Iodinated Compounds",
    synonyms: ["iodine", "iodinated", "contrast dye", "radiocontrast", "iodine contrast"],
    members: ["amiodarone", "povidone-iodine", "potassium iodide", "iopamidol", "iohexol", "iodixanol"],
    crossReactivities: [],
    source: "American College of Radiology (ACR) Contrast Manual"
  },
  {
    id: "latex_not_drug",
    name: "Natural Rubber Latex (Device / Non-Drug Allergen)",
    synonyms: ["latex", "natural rubber latex", "latex allergy"],
    members: [],
    crossReactivities: [],
    nonDrugAlert: "Alert medical staff to use latex-free gloves, needle-free vial stoppers, and silicone catheter equipment during any procedure or injection.",
    source: "CDC / NIOSH Latex Allergy Alert"
  },
  {
    id: "opioids",
    name: "Opioids & Opiates",
    synonyms: ["opioid", "opioids", "opiate", "opiates", "morphine", "codeine", "tramadol"],
    members: ["morphine", "codeine", "tramadol", "oxycodone", "fentanyl", "buprenorphine", "methadone", "hydromorphone", "tapentadol", "pethidine", "hydrocodone"],
    crossReactivities: [],
    source: "British National Formulary / AAAAI Opioid Hypersensitivity"
  },
  {
    id: "macrolides",
    name: "Macrolide Antibiotics",
    synonyms: ["macrolide", "macrolides", "azithromycin", "clarithromycin", "erythromycin"],
    members: ["azithromycin", "clarithromycin", "erythromycin", "roxithromycin", "spiramycin"],
    crossReactivities: [],
    source: "AAAAI Drug Allergy Guidelines"
  },
  {
    id: "fluoroquinolones",
    name: "Fluoroquinolones",
    synonyms: ["fluoroquinolone", "fluoroquinolones", "quinolone", "ciprofloxacin", "levofloxacin"],
    members: ["ciprofloxacin", "levofloxacin", "moxifloxacin", "norfloxacin", "ofloxacin", "gemifloxacin"],
    crossReactivities: [],
    source: "FDA Safety Alert / EAACI Quinolone Hypersensitivity"
  },
  {
    id: "tetracyclines",
    name: "Tetracycline Antibiotics",
    synonyms: ["tetracycline", "tetracyclines", "doxycycline", "minocycline"],
    members: ["doxycycline", "minocycline", "tetracycline", "tigecycline"],
    crossReactivities: [],
    source: "AAAAI Drug Allergy Guidelines"
  }
];

const allergyGroupsDoc = {
  "_comment": "needs clinical review",
  "meta": {
    "totalGroups": allergyGroups.length,
    "version": "1.0.0"
  },
  "groups": allergyGroups
};

fs.writeFileSync(path.join(DATA_DIR, 'allergy-groups.json'), JSON.stringify(allergyGroupsDoc, null, 2), 'utf8');
console.log(`✔ Generated allergy-groups.json with ${allergyGroups.length} allergen groups.`);

// ═════════════════════════════════════════════════════════════════════════════
// 2. DISEASE-DRUG RULES (50 entries)
// ═════════════════════════════════════════════════════════════════════════════
const diseaseDrugRules = [
  // Renal / Kidney Disease (1-8)
  {
    id: "dd-kidney-nsaid",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["ibuprofen", "naproxen", "diclofenac", "aceclofenac", "indomethacin", "ketorolac", "piroxicam", "meloxicam", "mefenamic acid", "etoricoxib", "celecoxib"],
    severity: "CRITICAL",
    title: "NSAID in Kidney Disease · Acute Renal Failure Risk",
    clinicalText: "NSAIDs inhibit renal prostaglandin E2 synthesis, precipitating pre-renal vasoconstriction, acute interstitial nephritis, and acceleration of chronic kidney disease.",
    plainText: "You have kidney issues and are taking an NSAID pain reliever. NSAIDs reduce blood flow to your kidneys and can cause acute kidney injury or worsening kidney disease.",
    rationale: "Inhibition of vasodilatory renal prostaglandins causes abrupt reduction in glomerular filtration rate.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-kidney-metformin",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["metformin"],
    severity: "MAJOR",
    title: "Metformin in Renal Impairment · Lactic Acidosis Caution",
    clinicalText: "Metformin is cleared primarily by renal tubular secretion. Impaired eGFR increases plasma metformin concentrations, elevating the risk of potentially fatal lactic acidosis.",
    plainText: "You have kidney issues and take Metformin. If kidney function drops (eGFR below 30 mL/min), Metformin can build up and cause severe lactic acidosis. Regular kidney blood tests are required.",
    rationale: "Decreased renal elimination leads to toxic accumulation and suppression of hepatic gluconeogenesis.",
    source: "FDA Black Box Warning / STOPP/START v3"
  },
  {
    id: "dd-kidney-spironolactone",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["spironolactone", "eplerenone", "amiloride", "triamterene"],
    severity: "CRITICAL",
    title: "Potassium-Sparing Diuretic in Kidney Disease · Severe Hyperkalemia",
    clinicalText: "Aldosterone antagonists inhibit renal potassium excretion; in existing renal impairment, severe life-threatening hyperkalemia (>6.0 mEq/L) and fatal cardiac arrhythmias can occur rapidly.",
    plainText: "Taking water pills that hold potassium (like Spironolactone) with kidney issues can cause potassium to spike dangerously high, risking sudden heart rhythm arrest.",
    rationale: "Impaired baseline glomerular filtration compounds drug-induced inhibition of distal tubular potassium secretion.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-kidney-digoxin",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["digoxin"],
    severity: "CRITICAL",
    title: "Digoxin in Renal Dysfunction · Digitalis Toxicity",
    clinicalText: "Digoxin has a narrow therapeutic index and 70-80% renal excretion. In renal impairment, accumulation triggers heart block, fatal ventricular arrhythmias, and visual disturbances.",
    plainText: "Digoxin is cleared by your kidneys. Because you have kidney issues, Digoxin can easily build up to toxic levels, causing heart rhythm disturbances and nausea.",
    rationale: "Clearance correlates directly with creatinine clearance; doses > 0.125 mg/day strongly discouraged in impaired renal function.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-kidney-sulfonylurea",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["glimepiride", "glyburide", "glibenclamide", "chlorpropamide"],
    severity: "MAJOR",
    title: "Sulfonylurea in Renal Impairment · Prolonged Hypoglycemia Risk",
    clinicalText: "Active metabolites of long-acting sulfonylureas accumulate in renal insufficiency, causing prolonged, severe, and potentially life-threatening hypoglycemia in older adults.",
    plainText: "Your diabetes medicine (sulfonylurea) takes longer to leave your body because of kidney impairment, causing sudden severe low blood sugar episodes.",
    rationale: "Decreased clearance of active metabolites causes sustained stimulation of pancreatic beta-cell insulin secretion.",
    source: "AGS Beers Criteria 2023 / STOPP v3"
  },
  {
    id: "dd-kidney-lithium",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["lithium"],
    severity: "CRITICAL",
    title: "Lithium in Renal Impairment · Acute Neurotoxicity",
    clinicalText: "Lithium is 100% renally excreted. Reduced renal filtration rapidly precipitates systemic lithium toxicity characterized by coarse tremor, ataxia, convulsions, and irreversible nephrotoxicity.",
    plainText: "Lithium levels depend entirely on kidney clearance. With kidney impairment, dangerous toxic levels build up quickly.",
    rationale: "Narrow therapeutic window and purely renal elimination.",
    source: "FDA / AGS Beers Criteria 2023"
  },
  {
    id: "dd-kidney-methotrexate",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["methotrexate"],
    severity: "CRITICAL",
    title: "Methotrexate in Renal Dysfunction · Bone Marrow Suppression",
    clinicalText: "Methotrexate clearance depends on glomerular filtration. In renal impairment, systemic exposure increases exponentially, causing profound myelosuppression and severe mucositis.",
    plainText: "Methotrexate can cause life-threatening blood and marrow toxicity if kidneys cannot clear it rapidly.",
    rationale: "Impaired excretion leads to sustained high free-drug levels inhibiting dihydrofolate reductase in non-target tissues.",
    source: "STOPP/START Criteria v3"
  },
  {
    id: "dd-kidney-sglt2",
    conditionKeywords: ["kidney", "renal", "ckd", "nephropathy"],
    drugMatch: ["dapagliflozin", "empagliflozin", "canagliflozin", "ertugliflozin"],
    severity: "MODERATE",
    title: "SGLT2 Inhibitor with Reduced Kidney Function · Glycemic Efficacy Alert",
    clinicalText: "SGLT2 inhibitors depend on filtered glucose load for glycemic efficacy; while renoprotective in CKD, blood-sugar lowering declines markedly when eGFR < 45 mL/min.",
    plainText: "Your SGLT2 diabetes medicine protects kidney and heart health, but its blood-sugar lowering strength weakens if kidney filtration is low.",
    rationale: "Mechanistic dependence on glomerular filtration for glucosuria.",
    source: "KDIGO 2023 Clinical Practice Guideline"
  },

  // Heart Failure / Heart Condition (9-16)
  {
    id: "dd-heart-nsaid",
    conditionKeywords: ["heart", "cardiac", "chf", "heart failure", "cad", "arrhythmia"],
    drugMatch: ["ibuprofen", "naproxen", "diclofenac", "aceclofenac", "indomethacin", "ketorolac", "piroxicam", "meloxicam", "etoricoxib", "celecoxib"],
    severity: "CRITICAL",
    title: "NSAID in Heart Failure · Acute Decompensation & Fluid Retention",
    clinicalText: "NSAIDs promote renal sodium and water retention, blunting loop diuretic responsiveness and triggering congestive heart failure exacerbation and hospitalizations.",
    plainText: "You have a heart condition and take an NSAID. NSAIDs cause your body to hold extra fluid, causing swollen legs and worsening shortness of breath or heart failure.",
    rationale: "Inhibition of renal prostaglandins results in sodium retention and systemic vascular resistance elevation.",
    source: "AHA Scientific Statement / AGS Beers 2023"
  },
  {
    id: "dd-heart-ccb-non-dhp",
    conditionKeywords: ["heart", "cardiac", "chf", "heart failure"],
    drugMatch: ["verapamil", "diltiazem"],
    severity: "CRITICAL",
    title: "Non-Dihydropyridine CCB in Heart Failure · Negative Inotropic Collapse",
    clinicalText: "Verapamil and diltiazem possess potent negative inotropic properties that significantly depress left ventricular contractility, precipitating acute cardiogenic decompensation in systolic heart failure.",
    plainText: "Verapamil or Diltiazem weakens the squeezing power of your heart muscle, which can severely worsen congestive heart failure.",
    rationale: "Negative inotropic effect on myocardium with compromised ejection fraction.",
    source: "ACC/AHA Heart Failure Guidelines / Beers 2023"
  },
  {
    id: "dd-heart-amiodarone",
    conditionKeywords: ["heart", "bradycardia", "heart block", "arrhythmia"],
    drugMatch: ["amiodarone"],
    severity: "CRITICAL",
    title: "Amiodarone with Conduction Disease · Severe Bradycardia Risk",
    clinicalText: "Amiodarone depresses sinus node automaticity and AV conduction; in pre-existing bradycardia or sick sinus syndrome without a pacemaker, complete AV block and asystole can occur.",
    plainText: "Amiodarone strongly slows your heart's electrical wiring. In patients with slow pulse or conduction defects, it can cause severe dizziness or fainting.",
    rationale: "Combined beta-blockade and calcium/potassium channel inhibition slows AV nodal conduction.",
    source: "ACC/AHA/HRS Arrhythmia Guidelines"
  },
  {
    id: "dd-heart-tca",
    conditionKeywords: ["heart", "cardiac", "arrhythmia", "cad"],
    drugMatch: ["amitriptyline", "imipramine", "clomipramine", "nortriptyline", "doxepin"],
    severity: "CRITICAL",
    title: "Tricyclic Antidepressant in Heart Disease · QTc Prolongation & Arrhythmia",
    clinicalText: "TCAs possess quinidine-like Class IA antiarrhythmic actions, prolonging the QTc interval and precipitating fatal ventricular arrhythmias, orthostatic syncope, and tachycardia.",
    plainText: "Amitriptyline and related antidepressants affect heart electrical rhythms. In heart disease, they increase the danger of fainting and abnormal heartbeats.",
    rationale: "Sodium and potassium channel blockade extends myocardial repolarization times.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-heart-decongestant",
    conditionKeywords: ["heart", "cardiac", "cad", "angina", "arrhythmia"],
    drugMatch: ["pseudoephedrine", "phenylephrine"],
    severity: "MAJOR",
    title: "Oral Decongestants in Heart Disease · Tachycardia & Ischemia",
    clinicalText: "Sympathomimetic vasoconstrictors cause reflex tachycardia and coronary vasoconstriction, increasing myocardial oxygen demand and precipitating angina or arrhythmias.",
    plainText: "Cold medicines with pseudoephedrine or phenylephrine stimulate the heart, causing fast palpitations and chest tightness in heart patients.",
    rationale: "Alpha-1 and beta-1 adrenergic stimulation elevates cardiac workload and myocardial oxygen consumption.",
    source: "AHA Advisory on OTC Cough/Cold Products"
  },
  {
    id: "dd-heart-donepezil",
    conditionKeywords: ["heart", "cardiac", "bradycardia", "syncope", "arrhythmia"],
    drugMatch: ["donepezil", "rivastigmine", "galantamine"],
    severity: "MAJOR",
    title: "Cholinesterase Inhibitor in Cardiac Conduction Disease · Syncope Alert",
    clinicalText: "Cholinesterase inhibitors enhance central and peripheral vagal tone, producing sinus bradycardia, sinoatrial block, syncope, and fall-related fractures in older adults.",
    plainText: "Dementia medications like Donepezil increase vagal nerve activity, which can slow your heart rate too much, causing lightheadedness and fainting spells.",
    rationale: "Vagomimetic action on sinoatrial and atrioventricular nodes.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-heart-fluoroquinolone",
    conditionKeywords: ["heart", "cardiac", "arrhythmia", "qtc"],
    drugMatch: ["moxifloxacin", "levofloxacin", "ciprofloxacin"],
    severity: "MAJOR",
    title: "Fluoroquinolone in Heart Disease · QTc Prolongation & Torsades",
    clinicalText: "Fluoroquinolones block the myocardial HERG potassium channel, prolonging ventricular repolarization and precipitating Torsades de Pointes, particularly in patients with baseline cardiac disease.",
    plainText: "This antibiotic can prolong the electrical reset of your heartbeat. In heart patients, this raises the risk of dangerous irregular heart rhythms.",
    rationale: "Blockade of rapid delayed rectifier potassium current (IKr).",
    source: "FDA Drug Safety Communication / Beers 2023"
  },
  {
    id: "dd-heart-macrolide",
    conditionKeywords: ["heart", "cardiac", "arrhythmia", "cad"],
    drugMatch: ["clarithromycin", "erythromycin", "azithromycin"],
    severity: "MAJOR",
    title: "Macrolide in Cardiovascular Disease · Cardiac Mortality Signal",
    clinicalText: "Macrolide antibiotics delay cardiac repolarization and carry an established epidemiological signal for sudden cardiac death and acute coronary syndromes in patients with baseline CAD.",
    plainText: "Macrolide antibiotics (like Clarithromycin or Azithromycin) require caution in heart disease due to potential heart rhythm irregularities.",
    rationale: "IKr potassium channel inhibition and post-market epidemiological cardiovascular safety signals.",
    source: "FDA Safety Alert / NEJM Cardiovascular Warning"
  },

  // Hypertension / High Blood Pressure (17-21)
  {
    id: "dd-htn-nsaid",
    conditionKeywords: ["hypertension", "high blood pressure", "htn"],
    drugMatch: ["ibuprofen", "naproxen", "diclofenac", "aceclofenac", "indomethacin", "etoricoxib", "celecoxib"],
    severity: "MAJOR",
    title: "NSAID in Hypertension · Blunted BP Control & Pressure Spikes",
    clinicalText: "NSAIDs antagonize the antihypertensive action of ACE inhibitors, ARBs, beta-blockers, and diuretics, producing an average 3 to 6 mmHg increase in mean arterial pressure.",
    plainText: "You have high blood pressure and take an NSAID. NSAIDs counteract your blood pressure medicines, causing blood pressure to rise.",
    rationale: "Renal prostaglandin inhibition promotes systemic vasoconstriction and blunts natriuresis.",
    source: "AGS Beers Criteria 2023 / AHA Hypertension Guidelines"
  },
  {
    id: "dd-htn-steroid",
    conditionKeywords: ["hypertension", "high blood pressure", "htn"],
    drugMatch: ["prednisolone", "methylprednisolone", "dexamethasone", "hydrocortisone", "deflazacort", "betamethasone"],
    severity: "MAJOR",
    title: "Systemic Corticosteroid in Hypertension · Sodium Retention Alert",
    clinicalText: "Glucocorticoids possess mineralocorticoid activity, stimulating distal tubular sodium reabsorption and volume expansion, destabilizing blood pressure control.",
    plainText: "Steroids make your body retain salt and water, which can push your blood pressure up significantly. Monitor your blood pressure daily.",
    rationale: "Mineralocorticoid receptor activation leading to intravascular volume expansion.",
    source: "AHA Hypertension Management Parameters"
  },
  {
    id: "dd-htn-decongestant",
    conditionKeywords: ["hypertension", "high blood pressure", "htn"],
    drugMatch: ["pseudoephedrine", "phenylephrine"],
    severity: "MAJOR",
    title: "Oral Decongestant in Hypertension · Acute Vasoconstriction",
    clinicalText: "Alpha-1 adrenergic stimulation produces arterial smooth muscle contraction and peripheral vascular resistance elevation, potentially precipitating hypertensive crisis.",
    plainText: "Over-the-counter decongestants tighten your blood vessels and can cause dangerous blood pressure spikes in people with hypertension.",
    rationale: "Direct peripheral alpha-1 vasoconstriction.",
    source: "ACC/AHA Guideline for Prevention & Treatment of High Blood Pressure"
  },
  {
    id: "dd-htn-licorice",
    conditionKeywords: ["hypertension", "high blood pressure", "htn"],
    drugMatch: ["licorice", "glycyrrhizin"],
    severity: "MAJOR",
    title: "Licorice Supplement in Hypertension · Pseudohyperaldosteronism",
    clinicalText: "Glycyrrhizin inhibits 11-beta-hydroxysteroid dehydrogenase type 2, allowing cortisol to bind mineralocorticoid receptors, causing severe hypokalemia, sodium retention, and severe hypertension.",
    plainText: "Licorice root supplements block the enzyme that protects your kidneys from stress hormones, driving blood pressure up and wasting potassium.",
    rationale: "Inhibition of 11-beta-HSD2 produces apparent mineralocorticoid excess.",
    source: "WHO / European Society of Hypertension"
  },
  {
    id: "dd-htn-stimulant",
    conditionKeywords: ["hypertension", "high blood pressure", "htn"],
    drugMatch: ["modafinil", "armodafinil"],
    severity: "MODERATE",
    title: "Wakefulness Promoters in Hypertension · Sympathomimetic BP Elevation",
    clinicalText: "Central wakefulness agents elevate circulating catecholamines, producing mild-to-moderate sustained increases in systolic blood pressure and resting heart rate.",
    plainText: "Stimulant or wakefulness medicines can increase your blood pressure and heart rate. Frequent blood pressure checks are advised.",
    rationale: "Central monoaminergic stimulation elevating adrenergic tone.",
    source: "FDA Prescribing Information"
  },

  // Diabetes (22-26)
  {
    id: "dd-diab-steroid",
    conditionKeywords: ["diabetes", "type 2 diabetes", "t2d", "t1d"],
    drugMatch: ["prednisolone", "methylprednisolone", "dexamethasone", "hydrocortisone", "deflazacort", "betamethasone"],
    severity: "MAJOR",
    title: "Systemic Corticosteroids in Diabetes · Severe Hyperglycemia Spikes",
    clinicalText: "Glucocorticoids induce acute peripheral insulin resistance, stimulate hepatic gluconeogenesis, and suppress pancreatic insulin release, causing severe steroid-induced hyperglycemia.",
    plainText: "Steroids dramatically raise blood sugar levels by making your body resist insulin. You will likely need to adjust your diabetes medication while on steroids.",
    rationale: "Up-regulation of phosphoenolpyruvate carboxykinase and glucose-6-phosphatase coupled with inhibition of GLUT4 translocation.",
    source: "American Diabetes Association (ADA) Standards of Care"
  },
  {
    id: "dd-diab-betablocker",
    conditionKeywords: ["diabetes", "type 2 diabetes", "t2d"],
    drugMatch: ["propranolol", "atenolol", "metoprolol"],
    severity: "MODERATE",
    title: "Non-Selective Beta-Blocker in Diabetes · Hypoglycemia Masking",
    clinicalText: "Beta-adrenergic antagonists blunt catecholamine-mediated warning symptoms of hypoglycemia (tremor, palpitations, anxiety), leaving diaphoresis as the sole identifiable sign.",
    plainText: "Beta-blockers can hide common warning signs of low blood sugar, such as shakiness and fast heartbeat, making low blood sugar harder to detect early.",
    rationale: "Sympathetic antagonism blunts physiological adrenergic response to falling blood glucose.",
    source: "ADA Standards of Care / STOPP Criteria"
  },
  {
    id: "dd-diab-quinolone",
    conditionKeywords: ["diabetes", "type 2 diabetes", "t2d"],
    drugMatch: ["levofloxacin", "ciprofloxacin", "moxifloxacin"],
    severity: "MAJOR",
    title: "Fluoroquinolone in Diabetes · Severe Dysglycemia Risk",
    clinicalText: "Fluoroquinolones interfere with pancreatic ATP-sensitive K+ channels, causing unpredictable, severe glycemic fluctuations ranging from profound hypoglycemia to diabetic ketoacidosis.",
    plainText: "This antibiotic can cause sudden severe drops or sharp spikes in blood sugar in diabetic patients. Monitor your glucose levels frequently.",
    rationale: "Direct modulation of pancreatic beta-cell potassium channels.",
    source: "FDA Drug Safety Communication on Fluoroquinolone Dysglycemia"
  },
  {
    id: "dd-diab-antipsychotic",
    conditionKeywords: ["diabetes", "type 2 diabetes", "t2d"],
    drugMatch: ["olanzapine", "clozapine", "quetiapine"],
    severity: "MAJOR",
    title: "Second-Generation Antipsychotic in Diabetes · Metabolic Decompensation",
    clinicalText: "Olanzapine and clozapine produce substantial metabolic adverse effects, including profound weight gain, marked insulin resistance, and diabetic ketoacidosis or hyperosmolar coma.",
    plainText: "Antipsychotic medications like Olanzapine can cause significant weight gain and make diabetes much harder to control.",
    rationale: "Central 5-HT2C and H1 antagonism coupled with peripheral impairment of insulin secretion and sensitivity.",
    source: "ADA / APA Consensus on Antipsychotic Drugs and Diabetes"
  },
  {
    id: "dd-diab-thiazide",
    conditionKeywords: ["diabetes", "type 2 diabetes", "t2d"],
    drugMatch: ["hydrochlorothiazide", "chlorthalidone"],
    severity: "MODERATE",
    title: "Thiazide Diuretics in Diabetes · Impaired Glycemic Control",
    clinicalText: "Thiazide-induced hypokalemia impairs insulin secretion from pancreatic beta cells, worsening HbA1c and glucose tolerance over long-term treatment.",
    plainText: "Thiazide water pills can slightly raise blood sugar by lowering potassium levels. Maintaining healthy potassium helps keep blood sugar steady.",
    rationale: "Hypokalemia blunts beta-cell membrane depolarization and insulin exocytosis.",
    source: "AHA/ADA Cardiometabolic Guidance"
  },

  // Dementia & Cognitive Impairment (27-33)
  {
    id: "dd-dementia-benzo",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["alprazolam", "clonazepam", "diazepam", "lorazepam", "midazolam", "temazepam", "chlordiazepoxide", "clobazam"],
    severity: "CRITICAL",
    title: "Benzodiazepine in Dementia · Delirium & Accelerated Decline",
    clinicalText: "Benzodiazepines exacerbate baseline cognitive impairment, induce delirium, produce anterograde amnesia, and significantly increase mortality and hospitalizations in patients with dementia.",
    plainText: "You or your family member has memory impairment or dementia. Benzodiazepines (calming pills) worsen confusion, memory loss, and can cause sudden delirium.",
    rationale: "GABA-A agonism worsens central cholinergic deficits in neurodegenerative disease.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-dementia-anticholinergic",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["amitriptyline", "chlorpheniramine", "dicyclomine", "hydroxyzine", "oxybutynin", "hyoscine", "promethazine", "tolterodine"],
    severity: "CRITICAL",
    title: "Potent Anticholinergic in Dementia · Severe Confusion & Toxidrome",
    clinicalText: "Dementia is characterized by profound central cholinergic deficits; anticholinergic medications directly antagonize remaining muscarinic receptors, causing acute delirium, hallucinations, and rapid cognitive deterioration.",
    plainText: "This medication has strong anticholinergic properties that block acetylcholine, the key chemical brain messenger for memory. In dementia, this causes severe confusion and hallucinations.",
    rationale: "Antagonism of central muscarinic receptors severely exacerbates cholinergic deficit.",
    source: "AGS Beers Criteria 2023 / STOPP Criteria v3"
  },
  {
    id: "dd-dementia-antipsychotic",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["olanzapine", "quetiapine", "risperidone", "haloperidol", "aripiprazole"],
    severity: "CRITICAL",
    title: "Antipsychotic in Dementia · Black Box Warning for Mortality & Stroke",
    clinicalText: "Antipsychotics carry an FDA Black Box warning in dementia-related psychosis due to a 1.6- to 1.7-fold increase in all-cause mortality, predominantly from cardiovascular events and pneumonia, alongside stroke risk.",
    plainText: "Antipsychotic drugs carry an FDA warning when used in dementia because they significantly increase the danger of stroke and overall mortality. They should only be used as a last resort.",
    rationale: "Increased cerebrovascular events, sedation-related aspiration pneumonia, and accelerated cognitive loss.",
    source: "FDA Black Box Warning / AGS Beers Criteria 2023"
  },
  {
    id: "dd-dementia-z-drug",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["zolpidem", "zopiclone", "eszopiclone"],
    severity: "CRITICAL",
    title: "Z-Hypnotic in Dementia · Nighttime Wandering & Confusion",
    clinicalText: "Non-benzodiazepine receptor agonists worsen sleep architecture, trigger paradoxical excitement, sleepwalking, delirium, and nocturnal wandering in cognitively impaired elders.",
    plainText: "Sleeping pills like Zolpidem can cause severe night-time confusion, wandering, and dangerous falls in people with memory impairment.",
    rationale: "Selective alpha-1 GABA-A subunit agonism produces psychomotor impairment and amnesia.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-dementia-tca",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["amitriptyline", "imipramine", "clomipramine", "doxepin"],
    severity: "CRITICAL",
    title: "Tricyclic Antidepressant in Dementia · High Cognitive Burden",
    clinicalText: "High anticholinergic and sedative properties of TCAs severely impair memory consolidation and cause prominent daytime sedation in patients with cognitive impairment.",
    plainText: "Tricyclic antidepressants (like Amitriptyline) heavily impair memory and should be avoided in patients with dementia in favor of safer alternatives.",
    rationale: "High Anticholinergic Cognitive Burden (ACB score = 3) directly counteracts cognitive functioning.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-dementia-muscle-relaxant",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["cyclobenzaprine", "carisoprodol", "chlorzoxazone"],
    severity: "CRITICAL",
    title: "Skeletal Muscle Relaxant in Dementia · Sedation & Delirium",
    clinicalText: "Muscle relaxants possess central anticholinergic and depressant properties that are poorly tolerated in older adults with cognitive impairment, precipitating profound disorientation.",
    plainText: "Muscle relaxant medications cause heavy brain sedation and disorientation in older adults with memory issues.",
    rationale: "Central nervous system depression combined with peripheral and central anticholinergic activity.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-dementia-antispasmodic",
    conditionKeywords: ["dementia", "alzheimer", "cognitive impairment", "memory loss"],
    drugMatch: ["dicyclomine", "hyoscine"],
    severity: "CRITICAL",
    title: "Antispasmodic in Dementia · Muscarinic Blockade Warning",
    clinicalText: "Tertiary amine antispasmodics readily cross the blood-brain barrier and cause acute delirium and severe constipation in patients with baseline dementia.",
    plainText: "Stomach cramp medicines like Dicyclomine easily cross into the brain and block memory function, causing acute confusion.",
    rationale: "Blood-brain barrier penetration with central antimuscarinic action.",
    source: "AGS Beers Criteria 2023"
  },

  // History of Falls / Fall Risk (34-40)
  {
    id: "dd-falls-benzo",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["alprazolam", "clonazepam", "diazepam", "lorazepam", "temazepam", "midazolam", "chlordiazepoxide"],
    severity: "CRITICAL",
    title: "Benzodiazepine with Fall History · High Fracture & Ataxia Risk",
    clinicalText: "Benzodiazepines cause psychomotor slowing, prolonged reaction times, vestibular dysfunction, and daytime drowsiness, increasing the risk of falls and hip fractures by 50-100% in older adults.",
    plainText: "You have a history of falls and take a calming medicine (Benzodiazepine). These medicines impair your balance and double the risk of severe falls and broken bones.",
    rationale: "Sedation, motor incoordination, and blunted postural reflex recovery.",
    source: "AGS Beers Criteria 2023 / CDC STEADI Fall Guidelines"
  },
  {
    id: "dd-falls-z-drug",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["zolpidem", "zopiclone", "eszopiclone"],
    severity: "CRITICAL",
    title: "Z-Hypnotic with Fall History · Nocturnal Awakening Fractures",
    clinicalText: "Z-drugs carry a fall risk hazard ratio comparable to long-acting benzodiazepines, especially upon nighttime awakening for micturition when residual ataxia is elevated.",
    plainText: "Sleeping pills (Z-drugs) cause residual morning unsteadiness and grogginess, leading to serious trips and falls when getting up at night.",
    rationale: "Rapid onset cerebellar-vestibular psychomotor slowing and nocturnal disorientation.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-falls-anticholinergic",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["amitriptyline", "hydroxyzine", "diphenhydramine", "chlorpheniramine", "oxybutynin"],
    severity: "CRITICAL",
    title: "Anticholinergic with Fall History · Sedation & Blurred Vision",
    clinicalText: "Anticholinergics cause pupillary dilation (mydriasis), blurred vision, orthostasis, and central sedation, directly contributing to trip-and-fall hazards in ambulatory older adults.",
    plainText: "This medication causes blurred vision, dizziness upon standing, and drowsiness, greatly increasing the danger of tripping and falling.",
    rationale: "Combination of cycloplegia, orthostatic hypotension, and central psychomotor impairment.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-falls-alpha-blocker",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["prazosin", "doxazosin", "terazosin"],
    severity: "MAJOR",
    title: "Non-Selective Alpha-1 Blocker with Fall History · Orthostatic Syncope",
    clinicalText: "Peripherally acting alpha-1 blockers produce prominent first-dose and maintenance orthostatic hypotension, causing transient cerebral hypoperfusion and syncopal falls.",
    plainText: "Alpha-blockers can cause a sudden blood pressure drop when you stand up from a bed or chair, leading to dizziness, blackouts, and falls.",
    rationale: "Sympathetic vascular tone inhibition preventing reflex vasoconstriction on standing.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-falls-antipsychotic",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["haloperidol", "risperidone", "olanzapine", "quetiapine"],
    severity: "CRITICAL",
    title: "Antipsychotic with Fall History · Extrapyramidal Gait Instability",
    clinicalText: "Antipsychotics cause dopamine receptor antagonism leading to drug-induced parkinsonism, muscle rigidity, akathisia, and orthostatic hypotension, compounding fall injury risk.",
    plainText: "Antipsychotic medications cause muscle stiffness, balance problems, and sudden lightheadedness that lead to dangerous falls in older adults.",
    rationale: "Extrapyramidal motor dysfunction combined with alpha-1 adrenergic blockade.",
    source: "AGS Beers Criteria 2023 / STOPP v3"
  },
  {
    id: "dd-falls-opioid",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["tramadol", "codeine", "morphine", "oxycodone", "fentanyl"],
    severity: "CRITICAL",
    title: "Opioid Analgesic with Fall History · Central Sedation & Balance Loss",
    clinicalText: "Opioids produce central nervous system depression, dizziness, blurred vision, and cognitive clouding, directly increasing fall-related trauma and fractures in older adults.",
    plainText: "Opioid painkillers slow reflexes and cause dizziness and drowsiness. In patients with past falls, they significantly increase the chance of another injury.",
    rationale: "Central mu-opioid stimulation impairs vestibular and motor reflexes.",
    source: "AGS Beers Criteria 2023"
  },
  {
    id: "dd-falls-gabapentinoid",
    conditionKeywords: ["history of falls", "falls", "balance", "fall risk", "ataxia"],
    drugMatch: ["gabapentin", "pregabalin"],
    severity: "MAJOR",
    title: "Gabapentinoid with Fall History · Ataxia & Vestibular Dizziness",
    clinicalText: "Gabapentin and pregabalin inhibit presynaptic voltage-gated calcium channels; dose-dependent somnolence, dizziness, and peripheral edema frequently precipitate falls in geriatric patients.",
    plainText: "Nerve pain medicines (Pregabalin / Gabapentin) commonly cause dizziness and unsteady walking. Extra caution and fall prevention measures are required.",
    rationale: "Presynaptic calcium channel modulation in cerebellar and vestibular pathways.",
    source: "AGS Beers Criteria 2023"
  },

  // Liver Disease / Cirrhosis (41-45)
  {
    id: "dd-liver-paracetamol",
    conditionKeywords: ["liver", "hepatic", "cirrhosis", "hepatitis", "fatty liver"],
    drugMatch: ["paracetamol", "acetaminophen"],
    severity: "MAJOR",
    title: "Paracetamol in Hepatic Impairment · Glutathione Depletion Caution",
    clinicalText: "In severe liver disease or cirrhosis, hepatic glutathione reserves are depleted, reducing detoxication of the reactive metabolite NAPQI and increasing hepatotoxicity risk at standard doses.",
    plainText: "You have a liver condition and take Paracetamol. Because your liver's protective antioxidants are reduced, do not exceed 2,000 mg (2 grams) per day across all medicines.",
    rationale: "Impaired glucuronidation and depleted glutathione shift paracetamol metabolism toward toxic CYP2E1 oxidation.",
    source: "FDA Hepatotoxicity Advisory / AASLD Guidelines"
  },
  {
    id: "dd-liver-statin",
    conditionKeywords: ["liver", "hepatic", "cirrhosis", "hepatitis"],
    drugMatch: ["atorvastatin", "simvastatin", "rosuvastatin", "lovastatin"],
    severity: "MODERATE",
    title: "Statin in Active Hepatic Dysfunction · Transaminase Monitoring",
    clinicalText: "Statins undergo extensive first-pass hepatic metabolism. While safe in stable NAFLD/NASH, active acute hepatitis or decompensated cirrhosis requires cautious dosing and LFT monitoring.",
    plainText: "Your statin cholesterol medication is processed by your liver. In active liver issues, routine liver function blood tests are needed to ensure safety.",
    rationale: "Altered hepatic uptake transporters (OATP) and reduced CYP metabolism increase systemic statin bioavailability.",
    source: "National Lipid Association Statin Safety Guidance"
  },
  {
    id: "dd-liver-sedative",
    conditionKeywords: ["liver", "hepatic", "cirrhosis", "hepatitis"],
    drugMatch: ["diazepam", "chlordiazepoxide", "flurazepam"],
    severity: "CRITICAL",
    title: "Long-Acting Benzodiazepine in Liver Disease · Hepatic Encephalopathy",
    clinicalText: "Long-acting benzodiazepines undergo hepatic oxidative metabolism (CYP) with prolonged elimination half-lives in cirrhosis, precipitating or worsening hepatic encephalopathy and coma.",
    plainText: "Long-acting sedatives take days to clear from an impaired liver, building up toxic levels that cause severe confusion, stupor, and hepatic encephalopathy.",
    rationale: "Severe clearance reduction of parent drug and active desmethyl metabolites.",
    source: "AASLD / EASL Hepatic Encephalopathy Guidelines"
  },
  {
    id: "dd-liver-methotrexate",
    conditionKeywords: ["liver", "hepatic", "cirrhosis", "hepatitis"],
    drugMatch: ["methotrexate"],
    severity: "CRITICAL",
    title: "Methotrexate in Hepatic Disease · Progressive Fibrosis & Cirrhosis",
    clinicalText: "Methotrexate possesses intrinsic hepatotoxic potential, inducing stellate cell activation, portal tract inflammation, and progressive liver fibrosis and cirrhosis.",
    plainText: "Methotrexate can cause progressive scarring and liver damage. It is strictly contraindicated in patients with significant pre-existing liver disease.",
    rationale: "Metabolic accumulation of polyglutamated metabolites in hepatocytes inducing fibrogenesis.",
    source: "ACR Rheumatoid Arthritis Practice Guidelines"
  },
  {
    id: "dd-liver-anticoagulant",
    conditionKeywords: ["liver", "hepatic", "cirrhosis", "hepatitis"],
    drugMatch: ["warfarin", "acenocoumarol", "rivaroxaban"],
    severity: "CRITICAL",
    title: "Oral Anticoagulant in Liver Disease · Supratherapeutic Bleeding Risk",
    clinicalText: "Impaired hepatic synthesis of baseline clotting factors (II, VII, IX, X) coupled with reduced drug clearance produces unpredictable, supratherapeutic anticoagulation and catastrophic bleeding.",
    plainText: "Your liver naturally produces the proteins that help your blood clot. Taking blood thinners with liver disease creates an extreme risk of severe internal bleeding.",
    rationale: "Additive synthetic liver failure and impaired pharmacological clearance.",
    source: "AASLD Coagulopathy in Cirrhosis Guidance"
  },

  // Peptic Ulcer / Gastrointestinal Bleed History (46-50)
  {
    id: "dd-ulcer-nsaid",
    conditionKeywords: ["peptic ulcer", "ulcer", "gi bleed", "gastric ulcer", "gastritis"],
    drugMatch: ["ibuprofen", "naproxen", "diclofenac", "aceclofenac", "indomethacin", "ketorolac", "piroxicam", "meloxicam", "mefenamic acid"],
    severity: "CRITICAL",
    title: "NSAID with Peptic Ulcer History · Severe Recurrent Perforation Risk",
    clinicalText: "Systemic COX-1 inhibition depletes cytoprotective gastric mucosal prostaglandins, leading to high rates of recurrent peptic ulceration, life-threatening gastrointestinal hemorrhage, and perforation.",
    plainText: "You have a history of stomach ulcers or gastrointestinal bleeding. NSAID pain relievers directly attack your stomach lining and can trigger severe bleeding ulcers.",
    rationale: "Depletion of gastric mucosal bicarbonate and mucus protective barriers.",
    source: "ACG Clinical Guideline: Bleeding Peptic Ulcer / AGS Beers 2023"
  },
  {
    id: "dd-ulcer-aspirin",
    conditionKeywords: ["peptic ulcer", "ulcer", "gi bleed", "gastric ulcer"],
    drugMatch: ["aspirin"],
    severity: "CRITICAL",
    title: "Aspirin with Peptic Ulcer History · Gastric Mucosal Erosion",
    clinicalText: "Aspirin produces direct topical chemical injury to gastric mucosa and irreversible platelet inhibition, dramatically elevating the risk of severe upper gastrointestinal bleeding.",
    plainText: "Aspirin irritates the stomach lining and prevents blood clotting. With your ulcer history, you must take stomach-protective medicine (PPI) alongside or consult your doctor.",
    rationale: "Dual topical acid injury and systemic irreversible platelet COX-1 inhibition.",
    source: "ACG / AGA Gastrointestinal Bleeding Guidelines"
  },
  {
    id: "dd-ulcer-steroid",
    conditionKeywords: ["peptic ulcer", "ulcer", "gi bleed", "gastric ulcer"],
    drugMatch: ["prednisolone", "dexamethasone", "methylprednisolone"],
    severity: "MAJOR",
    title: "Corticosteroid with Ulcer History · Impaired Mucosal Healing",
    clinicalText: "Glucocorticoids impair fibroblast proliferation and capillary endothelial growth, delaying ulcer healing and predisposing patients to ulcer reactivation and perforation.",
    plainText: "Steroids slow down your stomach lining's ability to heal and protect itself, increasing ulcer risk in patients with prior ulcer history.",
    rationale: "Anti-inflammatory suppression of tissue repair and angiogenesis.",
    source: "STOPP/START Criteria v3"
  },
  {
    id: "dd-ulcer-anticoagulant",
    conditionKeywords: ["peptic ulcer", "ulcer", "gi bleed", "gastric ulcer"],
    drugMatch: ["warfarin", "dabigatran", "rivaroxaban", "apixaban"],
    severity: "CRITICAL",
    title: "Anticoagulant with Ulcer History · Severe Gastrointestinal Hemorrhage",
    clinicalText: "Full-dose anticoagulation in patients with active or recent peptic ulceration produces severe, potentially fatal hemorrhage from unhealed vascular lesions in the stomach or duodenum.",
    plainText: "Blood thinners with an active or recent stomach ulcer can cause massive internal bleeding. Immediate medical evaluation and gastroprotection are critical.",
    rationale: "Systemic hemostatic suppression unmasks bleeding from underlying mucosal defects.",
    source: "AHA/ACC Antithrombotic Safety Guidelines"
  },
  {
    id: "dd-gout-thiazide",
    conditionKeywords: ["gout", "hyperuricemia", "urate"],
    drugMatch: ["hydrochlorothiazide", "chlorthalidone", "indapamide"],
    severity: "MAJOR",
    title: "Thiazide Diuretic in Gout · Hyperuricemia & Severe Flare Trigger",
    clinicalText: "Thiazide and thiazide-like diuretics compete with uric acid for organic anion transporters in the proximal tubule, reducing urate clearance and precipitating acute gouty flares.",
    plainText: "Thiazide water pills stop your kidneys from getting rid of uric acid, which can trigger painful acute gout attacks in your joints.",
    rationale: "Enhanced renal proximal tubular urate reabsorption secondary to volume contraction and OAT competition.",
    source: "ACR Guideline for the Management of Gout / STOPP Criteria v3"
  }
];

const diseaseDrugDoc = {
  "_comment": "needs clinical review",
  "meta": {
    "totalRules": diseaseDrugRules.length,
    "version": "1.0.0",
    "standards": ["AGS Beers Criteria 2023", "STOPP/START Criteria v3"]
  },
  "rules": diseaseDrugRules
};

fs.writeFileSync(path.join(DATA_DIR, 'disease-drug.json'), JSON.stringify(diseaseDrugDoc, null, 2), 'utf8');
console.log(`✔ Generated disease-drug.json with ${diseaseDrugRules.length} clinical rules.`);

// ═════════════════════════════════════════════════════════════════════════════
// 3. FOOD AND SPACING RULES (40 entries)
// ═════════════════════════════════════════════════════════════════════════════
const foodSpacingRules = [
  // 1. Grapefruit with Statins
  {
    id: "fs-grapefruit-statin",
    type: "FOOD_ADVICE",
    drugMatch: ["atorvastatin", "simvastatin", "lovastatin"],
    interactor: "Grapefruit & Grapefruit Juice",
    severity: "MAJOR",
    title: "Grapefruit Juice with Statins · Muscle Toxicity Risk",
    clinicalText: "Furanocoumarins in grapefruit irreversibly inhibit intestinal CYP3A4, raising systemic bioavailability of lipophilic statins up to 10-fold and precipitating severe rhabdomyolysis.",
    plainText: "Do not eat grapefruit or drink grapefruit juice while taking Atorvastatin or Simvastatin. Grapefruit blocks your liver enzymes, causing drug levels to soar and damaging muscles.",
    spacingRule: "Avoid grapefruit entirely while taking these statins.",
    rationale: "Mechanism-based irreversible inactivation of gut mucosal CYP3A4.",
    source: "FDA Consumer Health Advisory / BNF"
  },
  // 2. Grapefruit with CCBs
  {
    id: "fs-grapefruit-ccb",
    type: "FOOD_ADVICE",
    drugMatch: ["amlodipine", "felodipine", "nifedipine", "diltiazem", "verapamil"],
    interactor: "Grapefruit & Grapefruit Juice",
    severity: "MODERATE",
    title: "Grapefruit Juice with Calcium Channel Blockers · Hypotension Alert",
    clinicalText: "Intestinal CYP3A4 inhibition elevates plasma CCB concentrations, amplifying peripheral vasodilation, reflex tachycardia, headaches, and profound orthostasis.",
    plainText: "Avoid large amounts of grapefruit juice while taking blood pressure medicines like Amlodipine or Nifedipine. It can cause blood pressure to drop too low, leading to dizziness.",
    spacingRule: "Limit or completely avoid grapefruit products.",
    rationale: "Inhibition of first-pass gut metabolism increasing systemic exposure.",
    source: "FDA / Clinical Pharmacokinetics"
  },
  // 3. Grapefruit with Amiodarone
  {
    id: "fs-grapefruit-amiodarone",
    type: "FOOD_ADVICE",
    drugMatch: ["amiodarone"],
    interactor: "Grapefruit & Grapefruit Juice",
    severity: "CRITICAL",
    title: "Grapefruit Juice with Amiodarone · Arrhythmia & QTc Prolongation",
    clinicalText: "Grapefruit blocks CYP3A4 clearance of amiodarone, dramatically increasing serum concentrations and elevating the risk of Torsades de Pointes and fatal ventricular arrhythmias.",
    plainText: "Strictly avoid grapefruit juice while taking Amiodarone. Grapefruit dangerously increases medicine levels in your bloodstream, risking abnormal heartbeats.",
    spacingRule: "Complete avoidance of grapefruit required.",
    rationale: "CYP3A4 clearance inhibition extends already prolonged terminal elimination half-life.",
    source: "FDA Prescribing Information"
  },
  // 4. Vitamin K with Warfarin
  {
    id: "fs-vitamink-warfarin",
    type: "FOOD_ADVICE",
    drugMatch: ["warfarin", "acenocoumarol"],
    interactor: "Vitamin K Rich Foods (Spinach, Kale, Broccoli, Fenugreek / Methi)",
    severity: "CRITICAL",
    title: "Vitamin K Rich Foods with Warfarin · Anticoagulant Opposition",
    clinicalText: "Vitamin K acts as an essential cofactor for gamma-glutamyl carboxylase, directly overcoming warfarin's competitive inhibition of VKORC1 and reducing INR, predisposing to stroke or clot recurrence.",
    plainText: "Maintain a steady, consistent intake of green leafy vegetables (spinach, methi, kale, broccoli). Sudden increases in vitamin K reduce your blood thinner's protection and cause clots.",
    spacingRule: "Keep daily green vegetable intake steady; do not make drastic changes without INR testing.",
    rationale: "Physiological substrate competition with vitamin K epoxide reductase complex 1.",
    source: "Chest Antithrombotic Guidelines / BNF"
  },
  // 5. Dairy with Tetracyclines
  {
    id: "fs-dairy-tetracycline",
    type: "FOOD_ADVICE",
    drugMatch: ["doxycycline", "tetracycline", "minocycline"],
    interactor: "Dairy Products (Milk, Curd, Yogurt, Cheese)",
    severity: "MAJOR",
    title: "Dairy Products with Tetracyclines · Cation Chelation Inactivation",
    clinicalText: "Divalent calcium ions in milk and yogurt chelate tetracycline molecules, forming insoluble, non-absorbable complexes that reduce antibiotic absorption by 50-80%.",
    plainText: "Do not take Doxycycline or Tetracycline with milk, yogurt, or curd. Calcium binds the antibiotic in your stomach and prevents your body from absorbing it.",
    spacingRule: "Take 1 hour before or 2 hours after consuming dairy foods.",
    rationale: "Polyvalent metal ion chelation forming insoluble unabsorbable chelates.",
    source: "FDA Prescribing Information / BNF"
  },
  // 6. Dairy with Fluoroquinolones
  {
    id: "fs-dairy-fluoroquinolone",
    type: "FOOD_ADVICE",
    drugMatch: ["ciprofloxacin", "levofloxacin", "norfloxacin", "ofloxacin"],
    interactor: "Dairy Products (Milk, Curd, Paneer)",
    severity: "MAJOR",
    title: "Dairy Products with Fluoroquinolones · Chelation Malabsorption",
    clinicalText: "Calcium cations in dairy products bind fluoroquinolones in the gut lumen, causing up to a 70% decrease in peak serum concentrations and treatment failure.",
    plainText: "Avoid drinking milk or eating yogurt at the same time as Ciprofloxacin or Norfloxacin. Calcium blocks the antibiotic from entering your bloodstream.",
    spacingRule: "Separate antibiotic from dairy products by at least 2 hours.",
    rationale: "Chelation between polyvalent cations and the 4-keto and 3-carboxyl groups of quinolones.",
    source: "FDA Drug Safety / Clinical Pharmacokinetics"
  },
  // 7. Antacids with Fluoroquinolones
  {
    id: "fs-antacid-fluoroquinolone",
    type: "FOOD_ADVICE",
    drugMatch: ["ciprofloxacin", "levofloxacin", "norfloxacin", "moxifloxacin"],
    interactor: "Antacids (Digene, Gelusil, Magnesium & Aluminium Hydroxide)",
    severity: "MAJOR",
    title: "Antacids with Fluoroquinolones · Inactivation by Chelation",
    clinicalText: "Aluminium and magnesium hydroxide antacids form insoluble chelates with fluoroquinolones, virtually abolishing antibiotic bioavailability.",
    plainText: "Do not take antacids (like Digene or Gelusil) at the same time as Ciprofloxacin or Levofloxacin. Take the antibiotic 2 hours before or 4 hours after an antacid.",
    spacingRule: "Take antibiotic 2 hours before or 4 hours after taking any antacid.",
    rationale: "High-affinity binding of trivalent Al3+ and divalent Mg2+ ions.",
    source: "FDA Guidance / BNF"
  },
  // 8. Antacids with Tetracyclines
  {
    id: "fs-antacid-tetracycline",
    type: "FOOD_ADVICE",
    drugMatch: ["doxycycline", "tetracycline"],
    interactor: "Antacids containing Magnesium, Aluminium, or Calcium",
    severity: "MAJOR",
    title: "Antacids with Tetracyclines · Complete Absorption Blockade",
    clinicalText: "Metal cations in antacids bind tetracyclines in the gastric environment, creating unabsorbable precipitates and subtherapeutic antibiotic blood levels.",
    plainText: "Antacid syrups or tablets stop Doxycycline from working. Always separate taking your antibiotic and antacid by at least 2 to 3 hours.",
    spacingRule: "Separate by at least 2 hours before or 3 hours after antacids.",
    rationale: "Formation of insoluble non-ionizable metal chelate complexes.",
    source: "FDA Prescribing Information"
  },
  // 9. Levothyroxine + Calcium Spacing
  {
    id: "fs-levothyroxine-calcium",
    type: "TIMING_SPACING",
    drugMatch: ["levothyroxine"],
    interactor: "calcium carbonate",
    severity: "MAJOR",
    title: "Levothyroxine and Calcium Spacing · Adsorption & Hypothyroidism",
    clinicalText: "Calcium carbonate adsorbs levothyroxine in an acidic milieu, forming an insoluble precipitate and reducing T4 absorption by over 30%, destabilizing TSH control.",
    plainText: "Take Levothyroxine on an empty stomach in the morning, and wait at least 4 hours before taking your Calcium supplement (Shelcal). Calcium blocks thyroid hormone absorption.",
    spacingRule: "Separate Levothyroxine and Calcium by at least 4 hours.",
    rationale: "Physicochemical adsorption in gastric and upper small intestinal lumen.",
    source: "American Thyroid Association (ATA) Guidelines"
  },
  // 10. Levothyroxine + Iron Spacing
  {
    id: "fs-levothyroxine-iron",
    type: "TIMING_SPACING",
    drugMatch: ["levothyroxine"],
    interactor: "ferrous sulfate",
    severity: "MAJOR",
    title: "Levothyroxine and Oral Iron Spacing · Ferric Ion Chelation",
    clinicalText: "Oral ferrous and ferric ions bind levothyroxine directly to form a poorly soluble purple chelate complex, causing significant reduction in free thyroxine absorption.",
    plainText: "Separate your thyroid pill (Levothyroxine) from Iron tablets by at least 4 hours. Iron binds to the hormone and prevents absorption.",
    spacingRule: "Separate Levothyroxine and Iron supplements by at least 4 hours.",
    rationale: "Chelation between ferric iron and phenolic and amino groups of thyroxine.",
    source: "ATA Guidelines / Endocrine Society"
  },
  // 11. Calcium + Iron Spacing
  {
    id: "fs-calcium-iron",
    type: "TIMING_SPACING",
    drugMatch: ["calcium carbonate", "calcium citrate"],
    interactor: "ferrous sulfate",
    severity: "MODERATE",
    title: "Calcium and Iron Supplement Spacing · Competitive Absorption Inhibition",
    clinicalText: "Calcium and iron compete for the divalent metal transporter 1 (DMT1) on intestinal enterocytes; simultaneous intake reduces non-heme iron absorption by up to 50%.",
    plainText: "Take Calcium and Iron supplements at different times of the day (at least 2 hours apart). Calcium blocks your body from absorbing iron effectively.",
    spacingRule: "Separate Calcium and Iron supplements by at least 2 hours.",
    rationale: "Competitive antagonism at enterocyte divalent metal transporter 1 (DMT1).",
    source: "WHO Iron Supplementation Guidelines / BNF"
  },
  // 12. Alcohol + Metformin
  {
    id: "fs-alcohol-metformin",
    type: "FOOD_ADVICE",
    drugMatch: ["metformin"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "CRITICAL",
    title: "Alcohol with Metformin · Fatal Lactic Acidosis Risk",
    clinicalText: "Ethanol metabolism increases the hepatic NADH/NAD+ ratio, converting pyruvate to lactate while inhibiting hepatic gluconeogenesis, synergistically amplifying metformin-associated lactic acidosis risk.",
    plainText: "Do not consume alcohol while taking Metformin. Alcohol severely disrupts how your liver processes lactate, creating a dangerous risk of lactic acidosis.",
    spacingRule: "Avoid excessive or binge alcohol consumption completely.",
    rationale: "Redox shift increasing lactate production coupled with suppressed clearance.",
    source: "FDA Black Box Warning"
  },
  // 13. Alcohol + Benzodiazepines
  {
    id: "fs-alcohol-benzo",
    type: "FOOD_ADVICE",
    drugMatch: ["alprazolam", "clonazepam", "diazepam", "lorazepam", "temazepam", "chlordiazepoxide"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "CRITICAL",
    title: "Alcohol with Benzodiazepines · Fatal Respiratory Depression",
    clinicalText: "Ethanol and benzodiazepines exert synergistic allosteric modulation on GABA-A receptor chloride channels, producing profound central nervous system depression, respiratory arrest, and coma.",
    plainText: "Never drink alcohol while taking calming medications (Benzodiazepines). The combination can severely slow or stop your breathing.",
    spacingRule: "Strictly avoid alcohol while taking benzodiazepines.",
    rationale: "Synergistic positive allosteric GABA-A receptor modulation.",
    source: "FDA Black Box Warning / CDC"
  },
  // 14. Alcohol + Sedatives (Z-drugs)
  {
    id: "fs-alcohol-zdrug",
    type: "FOOD_ADVICE",
    drugMatch: ["zolpidem", "zopiclone", "eszopiclone"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "CRITICAL",
    title: "Alcohol with Z-Hypnotics · Profound Sedation & Complex Behaviors",
    clinicalText: "Co-ingestion of ethanol with z-hypnotics dramatically increases the risk of severe CNS depression, respiratory compromise, and hazardous complex sleep behaviors (sleep-driving, sleepwalking).",
    plainText: "Do not drink alcohol on evenings you take sleeping pills like Zolpidem. Combining them causes severe amnesia, sleepwalking, and breathing trouble.",
    spacingRule: "Zero alcohol intake on nights when sleeping pills are taken.",
    rationale: "Potentiation of alpha-1 GABA-A subunit-mediated psychomotor depression.",
    source: "FDA Safety Announcement"
  },
  // 15. Alcohol + Paracetamol
  {
    id: "fs-alcohol-paracetamol",
    type: "FOOD_ADVICE",
    drugMatch: ["paracetamol", "acetaminophen"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "MAJOR",
    title: "Alcohol with Paracetamol · Acute Hepatotoxicity Hazard",
    clinicalText: "Chronic alcohol ingestion induces hepatic CYP2E1 while depleting liver glutathione stores, dramatically shifting paracetamol metabolism into the hepatotoxic intermediate NAPQI.",
    plainText: "Avoid alcohol when taking Paracetamol. Alcohol strains liver enzymes and depletes protective antioxidants, increasing the risk of liver damage from standard pain doses.",
    spacingRule: "Do not combine alcohol with paracetamol; limit daily dose to under 2,000 mg.",
    rationale: "CYP2E1 induction and hepatic glutathione depletion.",
    source: "FDA Overdose Advisory / AASLD"
  },
  // 16. Alcohol + NSAIDs
  {
    id: "fs-alcohol-nsaid",
    type: "FOOD_ADVICE",
    drugMatch: ["aspirin", "ibuprofen", "naproxen", "diclofenac", "aceclofenac"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "MAJOR",
    title: "Alcohol with NSAIDs · Severe Gastrointestinal Bleeding Hazard",
    clinicalText: "Ethanol produces direct mucosal irritation and microvascular disruption; combined with NSAID-induced prostaglandin depletion, the risk of acute gastric erosions and hemorrhage quadruples.",
    plainText: "Avoid drinking alcohol while taking painkillers like Ibuprofen or Aspirin. Both irritate your stomach lining and together greatly raise the risk of stomach ulcers and internal bleeding.",
    spacingRule: "Avoid alcohol consumption during NSAID therapy.",
    rationale: "Additive mucosal barrier breakdown and impaired hemostatic response.",
    source: "FDA NSAID Warning / ACG Guidelines"
  },
  // 17. Alcohol + Opioids
  {
    id: "fs-alcohol-opioid",
    type: "FOOD_ADVICE",
    drugMatch: ["tramadol", "codeine", "morphine", "oxycodone", "fentanyl"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "CRITICAL",
    title: "Alcohol with Opioids · Black Box Warning for Fatal Overdose",
    clinicalText: "Ethanol significantly accelerates extended-release opioid dissolution ('dose dumping') and exerts synergistic depression of brainstem medullary respiratory centers, causing fatal hypoxia.",
    plainText: "Never consume alcohol while taking opioid painkillers. Alcohol can cause fatal respiratory depression and accidental overdose.",
    spacingRule: "Absolute prohibition of alcohol.",
    rationale: "Dose dumping and profound brainstem respiratory depressant synergy.",
    source: "FDA Black Box Warning"
  },
  // 18. Alcohol + Nitroimidazoles
  {
    id: "fs-alcohol-metronidazole",
    type: "FOOD_ADVICE",
    drugMatch: ["metronidazole", "tinidazole"],
    interactor: "Alcohol & Alcoholic Beverages",
    severity: "MAJOR",
    title: "Alcohol with Metronidazole · Disulfiram-Like Reaction",
    clinicalText: "Metronidazole inhibits acetaldehyde dehydrogenase, leading to toxic acetaldehyde accumulation upon ethanol intake, characterized by severe facial flushing, throbbing headache, nausea, and tachycardia.",
    plainText: "Do not drink any alcohol while taking Metronidazole or Tinidazole, and for 48 hours after finishing. It triggers severe throbbing headaches, vomiting, chest pounding, and flushing.",
    spacingRule: "Avoid alcohol during treatment and for at least 48 hours after the last dose.",
    rationale: "Inhibition of hepatic aldehyde dehydrogenase causing acetaldehyde accumulation.",
    source: "FDA Prescribing Information / BNF"
  },
  // 19. Bisphosphonates with Food/Water
  {
    id: "fs-bisphosphonate-food",
    type: "FOOD_ADVICE",
    drugMatch: ["alendronate", "risedronate", "ibandronate"],
    interactor: "Any Food, Coffee, Juice, or Mineral Water",
    severity: "CRITICAL",
    title: "Bisphosphonates Administration · Strict Fasting & Posture Protocol",
    clinicalText: "Oral bioavailability of bisphosphonates is <1% and virtually eliminated if taken with food or beverages other than plain water. Standing upright prevents severe chemical esophagitis and esophageal perforation.",
    plainText: "Take your bone medicine (Alendronate) first thing in the morning with a full glass of plain tap water only, 30 minutes before any food or coffee. Remain standing or sitting upright for 30 minutes to protect your esophagus.",
    spacingRule: "Take with 200ml plain water 30 minutes before any food; stay upright for 30 minutes.",
    rationale: "Negligible oral bioavailability and severe esophageal mucosal corrosiveness.",
    source: "FDA Prescribing Information / NOF Osteoporosis Guidelines"
  },
  // 20. Carbidopa/Levodopa with Dietary Protein
  {
    id: "fs-levodopa-protein",
    type: "FOOD_ADVICE",
    drugMatch: ["levodopa"],
    interactor: "High-Protein Meals (Eggs, Meat, Dal / Lentils, Paneer)",
    severity: "MAJOR",
    title: "Levodopa with High-Protein Meals · Large Neutral Amino Acid Competition",
    clinicalText: "Dietary amino acids compete with levodopa for transport across the intestinal mucosa and blood-brain barrier via the L-type amino acid transporter 1 (LAT1), resulting in sudden 'off' motor fluctuations.",
    plainText: "High-protein foods (like lentils, eggs, or paneer) compete with Levodopa for entry into your brain, making the medication feel ineffective. Take Levodopa at least 30-45 minutes before meals.",
    spacingRule: "Take 30 to 45 minutes before high-protein meals or 1-2 hours after.",
    rationale: "Competitive transport antagonism at enterocyte and blood-brain barrier LAT1 transporters.",
    source: "Movement Disorder Society Clinical Practice Guidelines"
  },
  // 21. High-Potassium with ACE-Inhibitors
  {
    id: "fs-potassium-acei",
    type: "FOOD_ADVICE",
    drugMatch: ["ramipril", "enalapril", "lisinopril", "perindopril"],
    interactor: "High-Potassium Foods (Bananas, Coconut Water, Salt Substitutes)",
    severity: "MAJOR",
    title: "Potassium Foods with ACE Inhibitors · Hyperkalemia Alert",
    clinicalText: "ACE inhibitors suppress angiotensin II and subsequent aldosterone secretion, reducing renal potassium excretion. Excessive intake of coconut water or potassium-chloride salt substitutes can trigger dangerous hyperkalemia.",
    plainText: "Your blood pressure medication (ACE inhibitor) reduces how much potassium your kidneys flush out. Avoid excessive coconut water and potassium salt substitutes to prevent dangerous heart rhythm problems.",
    spacingRule: "Avoid potassium salt substitutes and excessive coconut water; monitor serum K+.",
    rationale: "Hypoaldosteronism induced by suppression of renin-angiotensin system.",
    source: "AHA/ACC Hypertension Guidelines"
  },
  // 22. High-Potassium with ARBs
  {
    id: "fs-potassium-arb",
    type: "FOOD_ADVICE",
    drugMatch: ["telmisartan", "losartan", "valsartan", "olmesartan"],
    interactor: "High-Potassium Foods & Salt Substitutes (Potassium Chloride)",
    severity: "MAJOR",
    title: "Potassium Foods with ARBs · Elevated Blood Potassium Alert",
    clinicalText: "Angiotensin II receptor blockade blunts distal tubular potassium secretion. High dietary potassium or salt substitutes increase the risk of hyperkalemia, especially with borderline kidney function.",
    plainText: "ARBs like Telmisartan or Losartan raise your body's potassium levels. Be cautious with potassium-based salt substitutes and large amounts of high-potassium drinks.",
    spacingRule: "Avoid potassium supplements and salt substitutes unless specifically prescribed.",
    rationale: "Blockade of AT1-mediated aldosterone release.",
    source: "European Society of Cardiology (ESC) Guidelines"
  },
  // 23. High-Potassium with Spironolactone
  {
    id: "fs-potassium-spironolactone",
    type: "FOOD_ADVICE",
    drugMatch: ["spironolactone", "eplerenone"],
    interactor: "Potassium Supplements & Potassium Salt Substitutes",
    severity: "CRITICAL",
    title: "Potassium Supplements with Aldosterone Antagonists · Fatal Arrhythmia Risk",
    clinicalText: "Concurrent administration of potassium supplements or potassium-enriched salt substitutes with aldosterone antagonists produces rapidly escalating hyperkalemia and ventricular fibrillation.",
    plainText: "Strictly avoid potassium supplements and potassium-based low-sodium salts while taking Spironolactone. Combining them can cause your heart's electrical system to stop.",
    spacingRule: "Never take potassium supplements with potassium-sparing diuretics without close laboratory monitoring.",
    rationale: "Direct distal renal tubular blockade of sodium-potassium exchange.",
    source: "FDA Warning / Heart Failure Society of America"
  },
  // 24. Tyramine with MAOIs
  {
    id: "fs-tyramine-maoi",
    type: "FOOD_ADVICE",
    drugMatch: ["linezolid", "selegiline", "moclobemide"],
    interactor: "Tyramine-Rich Foods (Aged Cheese, Fermented Soy, Cured Meats, Red Wine)",
    severity: "CRITICAL",
    title: "Tyramine Foods with MAOIs · Hypertensive Crisis Alert",
    clinicalText: "Inhibition of gastrointestinal monoamine oxidase allows dietary tyramine to enter systemic circulation and displace norepinephrine from sympathetic nerve terminals, triggering life-threatening hypertensive crisis.",
    plainText: "Avoid aged cheese, soy sauce, fermented foods, and red wine while taking Linezolid or MAOI medicines. Tyramine in these foods can trigger a sudden, dangerous spike in blood pressure.",
    spacingRule: "Strictly restrict high-tyramine dietary foods during therapy.",
    rationale: "Massive catecholamine surge via displacement from presynaptic storage vesicles.",
    source: "FDA Warning / BNF"
  },
  // 25. Dietary Fiber with Digoxin
  {
    id: "fs-fiber-digoxin",
    type: "FOOD_ADVICE",
    drugMatch: ["digoxin"],
    interactor: "High Dietary Fiber / Wheat Bran",
    severity: "MODERATE",
    title: "Dietary Fiber with Digoxin · Insoluble Binding & Malabsorption",
    clinicalText: "Large amounts of bran and dietary insoluble fiber physically bind digoxin molecules in the intestinal lumen, significantly decreasing cardiac glycoside absorption.",
    plainText: "Taking large amounts of high-fiber cereal or wheat bran at the exact same time as Digoxin reduces how much medicine your body absorbs. Separate by at least 2 hours.",
    spacingRule: "Separate Digoxin from high-fiber bran meals by 2 hours.",
    rationale: "Luminal adsorption to non-digestible polysaccharides.",
    source: "Clinical Pharmacokinetics"
  },
  // 26. Dietary Fiber & Soy with Levothyroxine
  {
    id: "fs-fiber-levothyroxine",
    type: "FOOD_ADVICE",
    drugMatch: ["levothyroxine"],
    interactor: "Soy Products & High-Fiber Foods",
    severity: "MODERATE",
    title: "Soy Products & Fiber with Levothyroxine · Intestinal Binding",
    clinicalText: "Soybean flour and concentrated dietary fiber bind levothyroxine within the gastrointestinal tract, necessitating increased thyroid hormone replacement doses.",
    plainText: "Soy milk, edamame, and high-fiber foods interfere with how well your body absorbs thyroid medicine. Take Levothyroxine with water 30-60 minutes before breakfast.",
    spacingRule: "Take Levothyroxine 30-60 minutes before morning meals.",
    rationale: "Soy isoflavone and fiber binding in the proximal gut.",
    source: "ATA Guidelines / Endocrine Practice"
  },
  // 27. Caffeine with Ciprofloxacin
  {
    id: "fs-caffeine-ciprofloxacin",
    type: "FOOD_ADVICE",
    drugMatch: ["ciprofloxacin"],
    interactor: "Caffeine (Coffee, Tea, Energy Drinks, Colas)",
    severity: "MODERATE",
    title: "Caffeine with Ciprofloxacin · CYP1A2 Inhibition & Nervousness",
    clinicalText: "Ciprofloxacin potently inhibits hepatic CYP1A2, reducing caffeine clearance by over 60% and leading to exaggerated caffeine levels, tremors, palpitations, and severe insomnia.",
    plainText: "Ciprofloxacin stops your body from breaking down caffeine. Drinking coffee or energy drinks while taking this antibiotic can cause severe jitters, rapid heartbeat, and anxiety.",
    spacingRule: "Reduce or eliminate coffee and caffeinated drinks during ciprofloxacin treatment.",
    rationale: "Competitive and mechanism-based inhibition of hepatic CYP1A2 clearance.",
    source: "FDA Prescribing Information / Clinical Pharmacology"
  },
  // 28. Tea / Coffee with Oral Iron
  {
    id: "fs-tea-iron",
    type: "FOOD_ADVICE",
    drugMatch: ["ferrous sulfate", "ferrous ascorbate"],
    interactor: "Tea & Coffee (Tannins & Polyphenols)",
    severity: "MODERATE",
    title: "Tea & Coffee with Iron Supplements · Tannin Precipitation",
    clinicalText: "Tannins and polyphenols in black tea and coffee bind non-heme iron to form insoluble ferric tannate complexes, reducing oral iron absorption by up to 60-70%.",
    plainText: "Do not drink tea or coffee within 1 to 2 hours of taking your Iron tablet. The tannins in tea bind to iron and stop your body from absorbing it to fix anemia.",
    spacingRule: "Wait at least 1 to 2 hours between tea/coffee and taking iron supplements.",
    rationale: "Complexation of iron with phenolic compounds preventing enterocyte uptake.",
    source: "WHO Nutritional Anemia Guidance / BNF"
  },
  // 29. Green Tea with Atorvastatin
  {
    id: "fs-greentea-statin",
    type: "FOOD_ADVICE",
    drugMatch: ["atorvastatin", "simvastatin", "rosuvastatin"],
    interactor: "Green Tea (Concentrated Epigallocatechin Gallate)",
    severity: "MINOR",
    title: "High-Dose Green Tea with Statins · OATP Transport Alteration",
    clinicalText: "Epigallocatechin gallate (EGCG) in large quantities of green tea modulates OATP1B1 and OATP1B3 hepatic uptake transporters, altering statin pharmacokinetics.",
    plainText: "Drinking moderate green tea is fine, but avoid concentrated green tea extract supplements when taking statins.",
    spacingRule: "Avoid concentrated green tea extract capsules; moderate tea is acceptable.",
    rationale: "In vitro and in vivo inhibition of organic anion transporting polypeptides.",
    source: "Natural Medicines Database / NIH ODS"
  },
  // 30. Licorice with Antihypertensives
  {
    id: "fs-licorice-antihypertensive",
    type: "FOOD_ADVICE",
    drugMatch: ["telmisartan", "amlodipine", "losartan", "ramipril"],
    interactor: "Licorice (Glycyrrhizin / Mulethi)",
    severity: "MAJOR",
    title: "Licorice Root with Blood Pressure Drugs · Sodium Retention Paradox",
    clinicalText: "Glycyrrhizin inhibits 11-beta-HSD2, precipitating cortisol-mediated mineralocorticoid activation that directly counteracts antihypertensive treatment.",
    plainText: "Avoid herbal licorice root (mulethi) supplements. Licorice causes your body to hold onto salt and water, driving up blood pressure and defeating your medication.",
    spacingRule: "Avoid herbal licorice supplements during blood pressure therapy.",
    rationale: "Apparent mineralocorticoid excess secondary to 11-beta-HSD2 inhibition.",
    source: "European Society of Cardiology / WHO"
  },
  // 31. Licorice with Digoxin
  {
    id: "fs-licorice-digoxin",
    type: "FOOD_ADVICE",
    drugMatch: ["digoxin"],
    interactor: "Licorice (Glycyrrhizin)",
    severity: "CRITICAL",
    title: "Licorice with Digoxin · Hypokalemic Arrhythmia Trigger",
    clinicalText: "Licorice-induced urinary potassium wasting produces hypokalemia, which dramatically potentiates digoxin binding to myocardial Na+/K+ ATPase, triggering fatal digitalis toxicity.",
    plainText: "Do not consume natural licorice root with Digoxin. Licorice lowers potassium in your blood, making Digoxin dangerously toxic to your heart.",
    spacingRule: "Strictly avoid licorice root products.",
    rationale: "Hypokalemia amplifies digitalis glycoside affinity for myocardial sodium-potassium pump.",
    source: "FDA Warning / American Heart Association"
  },
  // 32. Antacids / PPIs with Iron Supplements
  {
    id: "fs-antacid-iron",
    type: "FOOD_ADVICE",
    drugMatch: ["ferrous sulfate", "ferrous ascorbate"],
    interactor: "Antacids & Acid Reducers (Pantoprazole, Omeprazole, Digene)",
    severity: "MODERATE",
    title: "Antacids with Iron Supplements · Reduced Acid Solubility",
    clinicalText: "Gastric acid is required to reduce ferric iron to the more absorbable ferrous state; hypochlorhydria induced by PPIs and antacids significantly reduces oral iron absorption.",
    plainText: "Stomach acid helps your body absorb iron. Taking antacids or PPIs at the exact same time as your iron pill reduces iron absorption. Separate by at least 2 hours.",
    spacingRule: "Take iron 2 hours before or after taking antacids.",
    rationale: "Elevation of gastric pH impairs dissolution and ferric-to-ferrous ion reduction.",
    source: "British Society of Gastroenterology Iron Deficiency Guidelines"
  },
  // 33. Antacids with Azole Antifungals
  {
    id: "fs-antacid-ketoconazole",
    type: "FOOD_ADVICE",
    drugMatch: ["ketoconazole", "itraconazole"],
    interactor: "Antacids & Acid Blockers (Pantoprazole, Digene, Gelusil)",
    severity: "MAJOR",
    title: "Antacids with Azole Antifungals · Severe Bioavailability Loss",
    clinicalText: "Ketoconazole and itraconazole are weak bases requiring an acidic intragastric environment for dissolution; antacid-induced pH elevation reduces absorption by up to 80%.",
    plainText: "Antifungal pills like Itraconazole need stomach acid to dissolve properly. Antacids stop them from absorbing. Take antifungal pills 2 hours before or after antacids.",
    spacingRule: "Separate antacids from azole antifungals by at least 2 hours.",
    rationale: "pH-dependent dissolution failure.",
    source: "FDA Prescribing Information"
  },
  // 34. Ampicillin with Food
  {
    id: "fs-ampicillin-food",
    type: "FOOD_ADVICE",
    drugMatch: ["ampicillin"],
    interactor: "Any Meals & Solid Food",
    severity: "MODERATE",
    title: "Ampicillin with Food · Decreased Antibiotic Bioavailability",
    clinicalText: "Gastric contents and food delay gastric emptying and physically adsorb ampicillin, reducing peak plasma concentration and bioavailability by over 50%.",
    plainText: "Ampicillin must be taken on an empty stomach with a full glass of water, either 1 hour before a meal or 2 hours after, to ensure proper infection fighting.",
    spacingRule: "Take on an empty stomach: 1 hour before or 2 hours after meals.",
    rationale: "Food-induced delay in gastric emptying and impaired mucosal dissolution.",
    source: "FDA Prescribing Information / BNF"
  },
  // 35. Griseofulvin with High-Fat Meals
  {
    id: "fs-griseofulvin-fat",
    type: "FOOD_ADVICE",
    drugMatch: ["griseofulvin"],
    interactor: "High-Fat Meals (Milk, Ghee, Butter)",
    severity: "INFO",
    title: "Griseofulvin Administration · Fat-Enhanced Absorption Protocol",
    clinicalText: "Griseofulvin is highly lipophilic; administration with fatty meals (e.g. milk, butter, fatty food) stimulates biliary secretions and enhances absorption up to twofold.",
    plainText: "Take Griseofulvin with a meal containing some fat or milk. Fat in food helps your body absorb this antifungal medicine much better.",
    spacingRule: "Take with or immediately after a meal containing fat.",
    rationale: "Lipid micellar solubilization and enhanced lymphatic/portal absorption.",
    source: "FDA Prescribing Information"
  },
  // 36. Cefuroxime with Food
  {
    id: "fs-cefuroxime-food",
    type: "FOOD_ADVICE",
    drugMatch: ["cefuroxime"],
    interactor: "Food / Post-Meal Administration",
    severity: "INFO",
    title: "Cefuroxime Axetil Administration · Food-Enhanced Bioavailability",
    clinicalText: "Cefuroxime axetil bioavailability increases from 37% in the fasting state to 52% when taken immediately following food, while reducing upper gastrointestinal irritation.",
    plainText: "Always take your Cefuroxime antibiotic immediately after a meal. Taking it with food helps your body absorb it better and prevents stomach upset.",
    spacingRule: "Take immediately after meals.",
    rationale: "Postprandial gastric residence time promotes ester hydrolysis and optimal dissolution.",
    source: "FDA Prescribing Information / BNF"
  },
  // 37. Nitrofurantoin with Food
  {
    id: "fs-nitrofurantoin-food",
    type: "FOOD_ADVICE",
    drugMatch: ["nitrofurantoin"],
    interactor: "Meals or Milk",
    severity: "INFO",
    title: "Nitrofurantoin Administration · Food-Enhanced Urinary Excretion",
    clinicalText: "Taking macrocrystalline nitrofurantoin with food or milk doubles its gastrointestinal transit time, increasing therapeutic urinary concentrations by up to 40% and minimizing nausea.",
    plainText: "Take Nitrofurantoin with meals or a glass of milk. Food helps reduce nausea and boosts the amount of medicine reaching your urinary bladder.",
    spacingRule: "Take with or immediately after meals or milk.",
    rationale: "Delayed transit promotes dissolution and increases urinary therapeutic recovery.",
    source: "FDA Prescribing Information / BNF"
  },
  // 38. Sodium Intake with Lithium
  {
    id: "fs-lithium-sodium",
    type: "FOOD_ADVICE",
    drugMatch: ["lithium"],
    interactor: "Low-Sodium Diets or Sudden Salt Restriction",
    severity: "MAJOR",
    title: "Sodium Balance with Lithium · Renal Reabsorption & Toxicity Alert",
    clinicalText: "Lithium is handled identically to sodium in the proximal renal tubule. Hyponatremia or sudden dietary salt restriction stimulates compensatory lithium reabsorption, causing severe lithium toxicity.",
    plainText: "Maintain a normal, steady salt intake while taking Lithium. Suddenly cutting salt or becoming dehydrated makes your kidneys hold onto Lithium, causing dangerous toxic levels.",
    spacingRule: "Maintain consistent dietary sodium and fluid intake; avoid crash low-salt diets.",
    rationale: "Competitive proximal tubular reabsorption via sodium-hydrogen exchanger 3 (NHE3).",
    source: "FDA Prescribing Information / APA Guidelines"
  },
  // 39. St. John's Wort with Immunosuppressants
  {
    id: "fs-stjohnswort-immunosuppressant",
    type: "FOOD_ADVICE",
    drugMatch: ["cyclosporine", "tacrolimus"],
    interactor: "St. John's Wort (Hypericum Perforatum)",
    severity: "CRITICAL",
    title: "St. John's Wort with Immunosuppressants · Organ Rejection Risk",
    clinicalText: "Hyperforin in St. John's Wort is a potent activator of the pregnane X receptor (PXR), profoundly inducing hepatic/intestinal CYP3A4 and P-glycoprotein, precipitating acute organ graft rejection.",
    plainText: "Never take St. John's Wort herbal supplements with transplant or immunosuppressive drugs. It rapidly cleans the medicine out of your blood, leading to organ rejection.",
    spacingRule: "Strictly avoid St. John's Wort supplements.",
    rationale: "PXR-mediated induction of intestinal and hepatic CYP3A4 and ABCB1 efflux pump.",
    source: "FDA Public Health Advisory"
  },
  // 40. High-Dose Garlic & Ginger with Anticoagulants
  {
    id: "fs-garlic-anticoagulant",
    type: "FOOD_ADVICE",
    drugMatch: ["warfarin", "aspirin", "clopidogrel", "rivaroxaban", "apixaban"],
    interactor: "High-Dose Garlic & Ginger Dietary Supplements",
    severity: "MODERATE",
    title: "High-Dose Garlic & Ginger with Antithrombotics · Antiplatelet Synergy",
    clinicalText: "Ajoene in garlic and gingerols in ginger inhibit platelet cyclooxygenase and thromboxane synthetase; high-dose herbal concentrates synergize with antithrombotics, increasing spontaneous bleeding risk.",
    plainText: "Normal culinary amounts in cooked food are safe, but avoid high-dose garlic or ginger dietary extract pills while taking blood thinners due to bleeding risk.",
    spacingRule: "Culinary cooking quantities are safe; avoid high-dose medicinal extract pills.",
    rationale: "Additive inhibition of platelet aggregation and thromboxane A2 production.",
    source: "Natural Medicines Database / American Society of Anesthesiologists"
  }
];

const foodSpacingDoc = {
  "_comment": "needs clinical review",
  "meta": {
    "totalRules": foodSpacingRules.length,
    "version": "1.0.0"
  },
  "rules": foodSpacingRules
};

fs.writeFileSync(path.join(DATA_DIR, 'food-spacing.json'), JSON.stringify(foodSpacingDoc, null, 2), 'utf8');
console.log(`✔ Generated food-spacing.json with ${foodSpacingRules.length} food & spacing rules.`);
