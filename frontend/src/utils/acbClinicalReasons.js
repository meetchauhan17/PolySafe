/**
 * frontend/src/utils/acbClinicalReasons.js
 *
 * Anticholinergic Cognitive Burden (ACB) Clinical Explanations & Pharmacological Reasons
 * Based on the Anticholinergic Cognitive Burden Scale (Boustani et al.) and
 * the American Geriatrics Society (AGS) Beers Criteria 2023/2024.
 */

export const ACB_DRUG_REASONS = {
  amitriptyline: {
    score: 3,
    generic: 'Amitriptyline Hydrochloride',
    class: 'Tricyclic Antidepressant (TCA)',
    pharmacologicalMechanism: 'Potent non-selective competitive antagonist at central and peripheral muscarinic acetylcholine receptors (M1–M5). Readily crosses the blood-brain barrier.',
    clinicalReason: 'Directly suppresses acetylcholine transmission in the hippocampus and cerebral cortex. Strongly correlated with acute delirium, severe dry mouth, urinary retention, blurred vision, and high unprovoked fall risk in older adults.',
    associatedRisks: ['Acute Delirium & Confusion', 'Unprovoked Fall Risk', 'Severe Dry Mouth', 'Urinary Retention', 'Constipation', 'Memory Impairment'],
    prescriberAdvice: 'High risk in adults age 65+. Deprescribing or dosage reduction recommended. Evaluate non-anticholinergic alternatives (e.g. Duloxetine or Gabapentinoids for neuropathy, Trazodone or Melatonin for sleep).',
  },
  nortriptyline: {
    score: 3,
    generic: 'Nortriptyline Hydrochloride',
    class: 'Tricyclic Antidepressant (TCA)',
    pharmacologicalMechanism: 'Secondary amine TCA with high muscarinic receptor antagonism and central anticholinergic activity.',
    clinicalReason: 'Blocks central cholinergic pathways, causing memory impairment, sedation, urinary hesitancy, and increased risk of confusion.',
    associatedRisks: ['Delirium Risk', 'Daytime Sedation', 'Orthostatic Fall Risk', 'Dry Mouth'],
    prescriberAdvice: 'Monitor serum levels and cognitive function. Consider switching to an agent with negligible ACB score.',
  },
  doxepin: {
    score: 3,
    generic: 'Doxepin Hydrochloride',
    class: 'Tricyclic Compound',
    pharmacologicalMechanism: 'Very high muscarinic and H1 receptor affinity producing profound anticholinergic and sedative effects.',
    clinicalReason: 'Significantly impairs cognitive processing speed, causes morning confusion, and increases fall probability in geriatric patients.',
    associatedRisks: ['Profound Sedation', 'Memory Loss', 'Constipation', 'Fall Hazard'],
    prescriberAdvice: 'Avoid doses >6mg/day in older adults per Beers Criteria. Consider non-pharmacological sleep hygiene.',
  },
  imipramine: {
    score: 3,
    generic: 'Imipramine',
    class: 'Tricyclic Antidepressant',
    pharmacologicalMechanism: 'Potent central muscarinic blockade reducing acetylcholine tone.',
    clinicalReason: 'Induces significant peripheral and central anticholinergic adverse effects.',
    associatedRisks: ['Cognitive Slowing', 'Urinary Retention', 'Cardiovascular Tachycardia'],
    prescriberAdvice: 'High anticholinergic burden. Review indication and consider safer alternatives.',
  },
  diphenhydramine: {
    score: 3,
    generic: 'Diphenhydramine Hydrochloride (Benadryl)',
    class: '1st-Generation H1 Antihistamine / Sedative',
    pharmacologicalMechanism: 'Highly lipophilic competitive antagonist at central H1 and muscarinic M1 receptors.',
    clinicalReason: 'Rapidly penetrates the blood-brain barrier to shut down cholinergic transmission, producing acute confusion, prolonged morning sedation, hallucinations, and gait instability.',
    associatedRisks: ['Delirium & Hallucinations', 'Gait Instability & Falls', 'Severe Dry Mouth', 'Urinary Retention'],
    prescriberAdvice: 'Strongly avoid for insomnia or allergies in patients age 65+. Substitute with Fexofenadine/Loratadine for allergies, or non-pharmacological approaches for sleep.',
  },
  benadryl: {
    score: 3,
    generic: 'Diphenhydramine Hydrochloride',
    class: '1st-Generation Antihistamine',
    pharmacologicalMechanism: 'Potent central muscarinic M1 receptor antagonist.',
    clinicalReason: 'High anticholinergic burden that sharply elevates fall and delirium risk.',
    associatedRisks: ['Delirium', 'Memory Fog', 'Dry Mouth', 'Falls'],
    prescriberAdvice: 'Substitute with second-generation antihistamines (ACB 0).',
  },
  hydroxyzine: {
    score: 3,
    generic: 'Hydroxyzine Hydrochloride / Pamoate (Atarax)',
    class: '1st-Generation Piperazine Antihistamine',
    pharmacologicalMechanism: 'Strong central muscarinic receptor antagonist with marked CNS depression.',
    clinicalReason: 'Significantly impairs psychomotor performance, slows cognitive response times, and increases vulnerability to falls.',
    associatedRisks: ['Prolonged Daytime Drowsiness', 'Cognitive Fog', 'Anticholinergic Dryness'],
    prescriberAdvice: 'Avoid chronic use in older adults. For pruritus use topical emollients or 2nd-gen antihistamines; for anxiety consider SSRIs or Buspirone.',
  },
  atarax: {
    score: 3,
    generic: 'Hydroxyzine Hydrochloride',
    class: '1st-Generation Antihistamine',
    pharmacologicalMechanism: 'High central muscarinic receptor antagonism.',
    clinicalReason: 'Significant anticholinergic cognitive load and sedation.',
    associatedRisks: ['Confusion', 'Sedation', 'Falls'],
    prescriberAdvice: 'Avoid in elderly patients.',
  },
  chlorpheniramine: {
    score: 3,
    generic: 'Chlorpheniramine Maleate',
    class: '1st-Generation Alkylamine Antihistamine',
    pharmacologicalMechanism: 'High anticholinergic potency common in over-the-counter cold and cough preparations.',
    clinicalReason: 'Unintentional anticholinergic toxicity when taken for simple nasal congestion or allergies.',
    associatedRisks: ['Drowsiness', 'Urinary Hesitancy', 'Dry Mouth', 'Confusion'],
    prescriberAdvice: 'Avoid OTC "PM" or cold combinations containing chlorpheniramine. Switch to saline nasal sprays or Cetirizine.',
  },
  oxybutynin: {
    score: 3,
    generic: 'Oxybutynin Chloride',
    class: 'Antimuscarinic Urinary Antispasmodic',
    pharmacologicalMechanism: 'Non-selective M1/M2/M3 muscarinic receptor antagonist. Highly lipophilic with high brain penetration.',
    clinicalReason: 'Prescribed to relax detrusor muscle, but non-selectively blocks brain M1 receptors, accelerating cognitive decline, dementia symptoms, and memory loss.',
    associatedRisks: ['Accelerated Cognitive Decline', 'Severe Xerostomia', 'Constipation', 'Delirium'],
    prescriberAdvice: 'Strongly reconsider in older adults. Switch to Mirabegron (beta-3 adrenergic agonist with zero ACB score) or pelvic floor therapy.',
  },
  tolterodine: {
    score: 3,
    generic: 'Tolterodine Tartrate',
    class: 'Antimuscarinic Bladder Agent',
    pharmacologicalMechanism: 'Competitive muscarinic receptor antagonist affecting both bladder and central cholinergic pathways.',
    clinicalReason: 'Elevates cumulative anticholinergic burden and impairs short-term memory.',
    associatedRisks: ['Dry Mouth', 'Memory Impairment', 'Constipation'],
    prescriberAdvice: 'Evaluate bladder retraining or Mirabegron (ACB 0).',
  },
  paroxetine: {
    score: 3,
    generic: 'Paroxetine Hydrochloride',
    class: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    pharmacologicalMechanism: 'Unlike other SSRIs, Paroxetine possesses substantial affinity for muscarinic M3 receptors.',
    clinicalReason: 'Has the highest anticholinergic activity among modern antidepressants, carrying increased risk of constipation, sedation, and cognitive slowing.',
    associatedRisks: ['Constipation', 'Sedation', 'Cognitive Slowing', 'Sexual Dysfunction'],
    prescriberAdvice: 'Switch to Sertraline or Escitalopram which have much lower anticholinergic burden (ACB 0–1).',
  },
  promethazine: {
    score: 3,
    generic: 'Promethazine Hydrochloride (Phenergan)',
    class: 'Phenothiazine Antiemetic / 1st-Gen Antihistamine',
    pharmacologicalMechanism: 'Extensive muscarinic M1 and dopamine D2 receptor blockade.',
    clinicalReason: 'Potent sedation, extrapyramidal symptoms, and delirium induction in vulnerable patients.',
    associatedRisks: ['Delirium', 'Severe Sedation', 'Dry Mouth', 'Postural Instability'],
    prescriberAdvice: 'Substitute with Ondansetron for nausea (ACB 0).',
  },
  scopolamine: {
    score: 3,
    generic: 'Scopolamine (Hyoscine)',
    class: 'Belladonna Alkaloid Antimuscarinic',
    pharmacologicalMechanism: 'Potent central antimuscarinic blocking acetylcholine across all brain regions.',
    clinicalReason: 'Classic anticholinergic agent causing acute disorientation and memory amnesia.',
    associatedRisks: ['Amnesia', 'Severe Confusion', 'Urinary Retention', 'Mydriasis'],
    prescriberAdvice: 'Use with extreme caution in age 65+.',
  },
  escitalopram: {
    score: 1,
    generic: 'Escitalopram Oxalate',
    class: 'Selective Serotonin Reuptake Inhibitor (SSRI)',
    pharmacologicalMechanism: 'Selective Serotonin Reuptake Inhibitor with weak, trace muscarinic receptor affinity shown in radioligand binding assays.',
    clinicalReason: 'Minimal standalone cognitive impairment. Safe as single therapy, but contributes additively (+1 point) when combined with other anticholinergics in a multi-drug regimen.',
    associatedRisks: ['Mild Dry Mouth', 'Slight Nausea initially', 'Additive Regimen Burden (+1)'],
    prescriberAdvice: 'Safe first-line antidepressant. Monitor total regimen burden to ensure cumulative score stays under 3.',
  },
  citalopram: {
    score: 1,
    generic: 'Citalopram Hydrobromide',
    class: 'SSRI Antidepressant',
    pharmacologicalMechanism: 'Minimal in-vitro muscarinic receptor binding.',
    clinicalReason: 'Low anticholinergic contribution. Monitor QT interval at doses >20mg in elderly.',
    associatedRisks: ['Mild Dry Mouth', 'QT Prolongation at high doses'],
    prescriberAdvice: 'Keep total ACB under 3.',
  },
  sertraline: {
    score: 1,
    generic: 'Sertraline Hydrochloride',
    class: 'SSRI Antidepressant',
    pharmacologicalMechanism: 'Trace muscarinic receptor affinity with primary 5-HT reuptake inhibition.',
    clinicalReason: 'Favorable cognitive safety profile; minor additive anticholinergic contribution (+1).',
    associatedRisks: ['GI Upset', 'Low Anticholinergic Contribution'],
    prescriberAdvice: 'First-line choice in older adults and dementia patients.',
  },
  alergin: {
    score: 1,
    generic: 'Levocetirizine Dihydrochloride (Alergin-L)',
    class: '2nd-Generation H1 Antihistamine',
    pharmacologicalMechanism: 'Second-generation peripheral H1-antihistamine with minimal blood-brain barrier permeability and low muscarinic cross-reactivity.',
    clinicalReason: 'Significantly safer than 1st-generation antihistamines (like Benadryl/Hydroxyzine); possesses trace peripheral anticholinergic potential at higher doses.',
    associatedRisks: ['Mild Residual Dryness', 'Trace Sedation at high doses'],
    prescriberAdvice: 'Much safer than 1st-gen antihistamines. Ensure appropriate renal dose adjustment.',
  },
  levocetirizine: {
    score: 1,
    generic: 'Levocetirizine Dihydrochloride',
    class: '2nd-Generation Antihistamine',
    pharmacologicalMechanism: 'Enantiomer of cetirizine with high H1 selectivity and minimal central muscarinic receptor binding.',
    clinicalReason: 'Low cognitive impact compared to sedating antihistamines.',
    associatedRisks: ['Mild Dry Mouth', 'Low Cognitive Load'],
    prescriberAdvice: 'Preferred allergy treatment in elderly patients.',
  },
  cetirizine: {
    score: 1,
    generic: 'Cetirizine Hydrochloride',
    class: '2nd-Generation Antihistamine',
    pharmacologicalMechanism: 'Selectively blocks peripheral H1 receptors with low muscarinic receptor affinity.',
    clinicalReason: 'Produces low anticholinergic load. Mild sedation possible in sensitive individuals.',
    associatedRisks: ['Mild Sedation', 'Dry Eyes/Mouth'],
    prescriberAdvice: 'Consider Fexofenadine or Loratadine if patient experiences daytime drowsiness.',
  },
  ranitidine: {
    score: 1,
    generic: 'Ranitidine Hydrochloride',
    class: 'H2 Receptor Antagonist',
    pharmacologicalMechanism: 'Histamine H2 blocker with trace in-vitro anticholinergic activity.',
    clinicalReason: 'Mild additive cognitive load when stacked with other agents.',
    associatedRisks: ['Mild Confusion in renal impairment'],
    prescriberAdvice: 'Assess renal clearance.',
  },
  famotidine: {
    score: 1,
    generic: 'Famotidine',
    class: 'H2 Receptor Antagonist',
    pharmacologicalMechanism: 'Low-affinity H2 blocker with minimal cholinergic interference.',
    clinicalReason: 'Generally cognitively safe; can contribute +1 point in severe renal impairment.',
    associatedRisks: ['Mild Headache', 'Trace Anticholinergic Activity'],
    prescriberAdvice: 'Dose reduce in CKD.',
  },
  atenolol: {
    score: 1,
    generic: 'Atenolol',
    class: 'Beta-1 Selective Adrenergic Blocker',
    pharmacologicalMechanism: 'Beta-adrenergic blocker with trace muscarinic receptor interaction.',
    clinicalReason: 'Minor potential additive contribution to total ACB score.',
    associatedRisks: ['Bradycardia', 'Fatigue'],
    prescriberAdvice: 'Monitor heart rate and blood pressure.',
  },
  metoprolol: {
    score: 1,
    generic: 'Metoprolol Succinate / Tartrate',
    class: 'Beta-1 Adrenergic Blocker',
    pharmacologicalMechanism: 'Lipophilic beta-blocker with trace central muscarinic cross-talk.',
    clinicalReason: 'Minor additive score (+1) under Boustani ACB scale.',
    associatedRisks: ['Fatigue', 'Dizziness on standing'],
    prescriberAdvice: 'Safe cardiovascular profile.',
  },
  furosemide: {
    score: 1,
    generic: 'Furosemide',
    class: 'Loop Diuretic',
    pharmacologicalMechanism: 'Inhibits Na+/K+/2Cl- symporter in the loop of Henle; weak in-vitro cholinergic binding.',
    clinicalReason: 'Mild additive score (+1) under ACB scale, primarily through electrolyte and volume modulation.',
    associatedRisks: ['Electrolyte Imbalance', 'Orthostatic Dizziness'],
    prescriberAdvice: 'Monitor electrolytes and hydration.',
  },
  quetiapine: {
    score: 2,
    generic: 'Quetiapine Fumarate (Seroquel)',
    class: 'Atypical Antipsychotic',
    pharmacologicalMechanism: 'Moderate antagonist at muscarinic M1 and alpha-1 adrenergic receptors.',
    clinicalReason: 'Produces moderate anticholinergic burden leading to daytime sedation, cognitive blunting, constipation, and fall risk.',
    associatedRisks: ['Daytime Sedation', 'Cognitive Blunting', 'Constipation', 'Fall Hazard'],
    prescriberAdvice: 'Avoid using as a routine sleep aid in older adults. Monitor cognitive status regularly.',
  },
  olanzapine: {
    score: 2,
    generic: 'Olanzapine',
    class: 'Thienobenzodiazepine Antipsychotic',
    pharmacologicalMechanism: 'Moderate to high muscarinic M1/M2/M3 receptor blockade.',
    clinicalReason: 'Contributes significant anticholinergic load along with metabolic adverse effects.',
    associatedRisks: ['Sedation', 'Metabolic Changes', 'Dry Mouth', 'Cognitive Slowing'],
    prescriberAdvice: 'Use lowest effective dose; monitor for anticholinergic and metabolic toxicity.',
  },
  cyclobenzaprine: {
    score: 2,
    generic: 'Cyclobenzaprine Hydrochloride',
    class: 'Skeletal Muscle Relaxant',
    pharmacologicalMechanism: 'Structurally related to tricyclic antidepressants with pronounced antimuscarinic activity.',
    clinicalReason: 'Causes severe drowsiness, dry mouth, and confusion in patients age 65+.',
    associatedRisks: ['Confusion', 'Drowsiness', 'Dry Mouth', 'Falls'],
    prescriberAdvice: 'Avoid in older adults per Beers Criteria. Use heat, physiotherapy, or topical NSAIDs for muscle spasm.',
  },
  aspirin: {
    score: 0,
    generic: 'Acetylsalicylic Acid (Aspirin / Ecosprin)',
    class: 'Antiplatelet / Salicylate NSAID',
    pharmacologicalMechanism: 'Irreversible cyclooxygenase (COX-1/COX-2) inhibitor targeting platelet thromboxane A2. Has zero affinity for muscarinic acetylcholine receptors.',
    clinicalReason: 'Does not block acetylcholine receptors in the brain or peripheral nervous system. Completely safe regarding cognitive cholinergic burden, memory fog, or delirium.',
    associatedRisks: ['Zero Anticholinergic Impact (Monitor bleeding risk separately)'],
    prescriberAdvice: 'Cognitively neutral profile. Does not contribute to anticholinergic cognitive impairment.',
  },
  ecosprin: {
    score: 0,
    generic: 'Aspirin (Enteric Coated)',
    class: 'Antiplatelet Agent',
    pharmacologicalMechanism: 'Irreversible COX inhibitor with zero muscarinic receptor binding.',
    clinicalReason: 'Zero anticholinergic activity. Safe regarding cognitive load.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  warfarin: {
    score: 0,
    generic: 'Warfarin Sodium',
    class: 'Vitamin K Antagonist Anticoagulant',
    pharmacologicalMechanism: 'Inhibits vitamin K epoxide reductase complex subunit 1 (VKORC1). Operates exclusively on hepatic clotting factor synthesis with zero cholinergic activity.',
    clinicalReason: 'Zero affinity for muscarinic acetylcholine receptors. Does not cause memory fog, delirium, or anticholinergic fall risk.',
    associatedRisks: ['Zero Anticholinergic Risk (Monitor INR / bleeding)'],
    prescriberAdvice: 'Cognitively neutral medication. Does not elevate anticholinergic cognitive burden.',
  },
  metformin: {
    score: 0,
    generic: 'Metformin Hydrochloride',
    class: 'Biguanide Antidiabetic',
    pharmacologicalMechanism: 'Activates AMP-activated protein kinase (AMPK) to suppress hepatic gluconeogenesis. Has zero interaction with muscarinic receptors.',
    clinicalReason: 'Zero anticholinergic activity. Associated with neuroprotective metabolic profiles in type 2 diabetes.',
    associatedRisks: ['Zero Anticholinergic Impact'],
    prescriberAdvice: 'Cognitively safe profile.',
  },
  glycomet: {
    score: 0,
    generic: 'Metformin Hydrochloride',
    class: 'Antidiabetic Biguanide',
    pharmacologicalMechanism: 'Hepatic AMPK activator with zero muscarinic binding.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Cognitive Burden'],
    prescriberAdvice: 'Cognitively safe.',
  },
  atorvastatin: {
    score: 0,
    generic: 'Atorvastatin Calcium',
    class: 'HMG-CoA Reductase Inhibitor (Statin)',
    pharmacologicalMechanism: 'Competitive inhibitor of HMG-CoA reductase in the liver. Zero affinity for muscarinic acetylcholine receptors.',
    clinicalReason: 'Does not block cholinergic neurotransmission. Safe regarding cognitive cholinergic load.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  lipitor: {
    score: 0,
    generic: 'Atorvastatin Calcium',
    class: 'Statin / Lipid Lowering',
    pharmacologicalMechanism: 'HMG-CoA reductase inhibitor with zero muscarinic interaction.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  amlodipine: {
    score: 0,
    generic: 'Amlodipine Besylate',
    class: 'Dihydropyridine Calcium Channel Blocker',
    pharmacologicalMechanism: 'Blocks L-type calcium channels in vascular smooth muscle. Zero cholinergic receptor binding.',
    clinicalReason: 'Does not cross-react with muscarinic pathways. Safe regarding cognitive function and delirium.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively safe antihypertensive.',
  },
  lisinopril: {
    score: 0,
    generic: 'Lisinopril',
    class: 'ACE Inhibitor',
    pharmacologicalMechanism: 'Inhibits angiotensin-converting enzyme in the renin-angiotensin-aldosterone system. Zero muscarinic antagonism.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  pantoprazole: {
    score: 0,
    generic: 'Pantoprazole Sodium',
    class: 'Proton Pump Inhibitor (PPI)',
    pharmacologicalMechanism: 'Inhibits gastric H+/K+-ATPase pump in stomach parietal cells. Zero muscarinic receptor binding.',
    clinicalReason: 'Zero anticholinergic activity. Does not impair memory or cause anticholinergic delirium.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively safe regarding cholinergic burden.',
  },
  omeprazole: {
    score: 0,
    generic: 'Omeprazole',
    class: 'Proton Pump Inhibitor (PPI)',
    pharmacologicalMechanism: 'Gastric acid pump inhibitor with zero muscarinic affinity.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  dolo: {
    score: 0,
    generic: 'Paracetamol (Acetaminophen 650mg)',
    class: 'Analgesic & Antipyretic',
    pharmacologicalMechanism: 'Acts centrally via COX inhibition and cannabinoid/TRPA1 pathway modulation. Zero muscarinic receptor antagonism.',
    clinicalReason: 'Completely free of anticholinergic side effects. Safe for elderly patients without risk of cognitive blunting or dry mouth.',
    associatedRisks: ['Zero Anticholinergic Burden'],
    prescriberAdvice: 'Safe non-anticholinergic analgesic choice.',
  },
  paracetamol: {
    score: 0,
    generic: 'Paracetamol (Acetaminophen)',
    class: 'Analgesic & Antipyretic',
    pharmacologicalMechanism: 'Zero affinity for muscarinic acetylcholine receptors.',
    clinicalReason: 'Zero anticholinergic activity.',
    associatedRisks: ['Zero Anticholinergic Burden'],
    prescriberAdvice: 'Cognitively safe.',
  },
  losartan: {
    score: 0,
    generic: 'Losartan Potassium',
    class: 'Angiotensin II Receptor Blocker (ARB)',
    pharmacologicalMechanism: 'Blocks AT1 receptors with zero muscarinic antagonism.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  clopidogrel: {
    score: 0,
    generic: 'Clopidogrel Bisulfate',
    class: 'P2Y12 Platelet Inhibitor',
    pharmacologicalMechanism: 'Irreversible P2Y12 ADP receptor inhibitor. Zero muscarinic activity.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  levothyroxine: {
    score: 0,
    generic: 'Levothyroxine Sodium',
    class: 'Synthetic Thyroid Hormone (T4)',
    pharmacologicalMechanism: 'Exogenous thyroid hormone replacement. Zero muscarinic receptor interaction.',
    clinicalReason: 'Zero anticholinergic burden.',
    associatedRisks: ['Zero Anticholinergic Load'],
    prescriberAdvice: 'Cognitively neutral.',
  },
  gabapentin: {
    score: 0,
    generic: 'Gabapentin',
    class: 'Voltage-Gated Calcium Channel Alpha-2-Delta Ligand',
    pharmacologicalMechanism: 'Binds alpha-2-delta subunits of voltage-gated calcium channels. Zero affinity for muscarinic acetylcholine receptors.',
    clinicalReason: 'Does not exert anticholinergic receptor blockade (ACB 0). While mildly sedating, it does not induce anticholinergic delirium or dry mouth.',
    associatedRisks: ['Zero Anticholinergic Impact (May cause mild non-anticholinergic sedation)'],
    prescriberAdvice: 'Preferred neuropathic alternative over high-ACB tricyclic antidepressants.',
  },
};

/**
 * Resolves the clinical ACB explanation, pharmacological mechanism, and guidance for a medication.
 * @param {object|string} medicine
 * @param {number} fallbackScore
 * @returns {object}
 */
export function getAcbClinicalReason(medicine, fallbackScore = 0) {
  const name = typeof medicine === 'string' ? medicine : (medicine?.name || medicine?.brand || medicine?.generic || '');
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Look for exact or partial match in curated knowledge base
  let matched = null;
  for (const [key, profile] of Object.entries(ACB_DRUG_REASONS)) {
    const cleanKey = key.replace(/[^a-z0-9]/g, '');
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      matched = profile;
      break;
    }
  }

  const score = typeof medicine === 'object' && typeof medicine?.acbScore === 'number'
    ? medicine.acbScore
    : (matched?.score ?? fallbackScore ?? 0);

  if (matched) {
    return {
      ...matched,
      score,
      drugName: name,
      tierLabel: score >= 3 ? 'High Anticholinergic Risk' : score === 2 ? 'Moderate Burden' : score === 1 ? 'Mild Burden' : 'Zero Cognitive Burden (Safe)',
    };
  }

  // Fallback clinical profile based on score tier
  if (score >= 3) {
    return {
      score,
      drugName: name,
      tierLabel: 'High Anticholinergic Risk (ACB 3/3)',
      generic: name,
      class: 'High Anticholinergic Agent',
      pharmacologicalMechanism: 'Potent competitive antagonist at central and peripheral muscarinic acetylcholine receptors (M1–M5). Blocks acetylcholine in the hippocampus and cerebral cortex.',
      clinicalReason: `${name} has definite, high anticholinergic activity. Strongly associated with acute delirium, cognitive impairment, memory amnesia, blurred vision, severe dry mouth, and unprovoked falls in older adults (AGS Beers Criteria 2024).`,
      associatedRisks: ['Delirium & Acute Confusion', 'Unprovoked Fall Risk', 'Severe Dry Mouth', 'Urinary Retention', 'Constipation'],
      prescriberAdvice: 'Evaluate deprescribing or switching to safer alternatives with zero anticholinergic activity.',
    };
  }

  if (score === 2) {
    return {
      score,
      drugName: name,
      tierLabel: 'Moderate Anticholinergic Load (ACB 2/3)',
      generic: name,
      class: 'Moderate Anticholinergic Agent',
      pharmacologicalMechanism: 'Demonstrates moderate muscarinic receptor affinity at therapeutic concentrations.',
      clinicalReason: `${name} produces noticeable anticholinergic load. Clinically associated with reduced processing speed, daytime sedation, mild cognitive blunting, and dry mouth.`,
      associatedRisks: ['Daytime Sedation', 'Mild Cognitive Slowing', 'Dry Mouth', 'Additive Regimen Burden'],
      prescriberAdvice: 'Use lowest effective dose; avoid combining with other anticholinergics in patients age 65+.',
    };
  }

  if (score === 1) {
    return {
      score,
      drugName: name,
      tierLabel: 'Mild Anticholinergic Activity (ACB 1/3)',
      generic: name,
      class: 'Mild Cholinergic Modulator',
      pharmacologicalMechanism: 'Demonstrates low or trace in-vitro muscarinic receptor binding in radioligand assays.',
      clinicalReason: `${name} has potential but mild anticholinergic activity. Rarely causes overt confusion on its own, but contributes additively (+1 point) to cumulative regimen burden when combined with other drugs.`,
      associatedRisks: ['Mild Dry Mouth', 'Minor Additive Regimen Burden (+1)'],
      prescriberAdvice: 'Safe as monotherapy. Monitor total cumulative regimen score to ensure combined ACB remains under 3.',
    };
  }

  // Default Score 0 (Safe)
  return {
    score: 0,
    drugName: name,
    tierLabel: 'Zero Anticholinergic Load (Safe · ACB 0/3)',
    generic: name,
    class: 'Non-Anticholinergic Medication',
    pharmacologicalMechanism: 'Zero affinity for muscarinic acetylcholine receptors. Operates via non-cholinergic pharmacological pathways.',
    clinicalReason: `${name} does not block acetylcholine receptors in the brain or peripheral nervous system. Completely safe regarding cognitive cholinergic burden, memory fog, or delirium risk.`,
    associatedRisks: ['Zero Anticholinergic Risk (No cognitive blunting or fall hazard)'],
    prescriberAdvice: 'Cognitively safe profile. Excellent choice for older adults and patients with memory concerns.',
  };
}
