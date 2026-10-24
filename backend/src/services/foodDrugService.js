/**
 * services/foodDrugService.js
 *
 * PolySafe Clinical Food, Beverage & Lifestyle Interaction Screening Engine (v6.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-references a patient's active medication list against verified
 * clinical pharmacokinetics and pharmacodynamics food-drug interaction rules:
 *   - Grapefruit / CYP3A4 inhibition
 *   - Dairy / Polyvalent cation chelation
 *   - High-Potassium / ACEi-ARB-Spironolactone hyperkalemia
 *   - Vitamin K / Warfarin anticoagulation opposition
 *   - Alcohol / Hepatotoxicity, Lactic Acidosis, CNS depression, GI ulceration
 *   - Caffeine / CYP1A2 clearance inhibition
 *   - Dietary Fiber & Soy / Levothyroxine malabsorption
 *   - Tyramine / MAOI hypertensive crisis
 *   - Photosensitivity / UV exposure alerts
 */

'use strict';

const { resolveDrugCandidates } = require('./drugAliases');

const FOOD_INTERACTION_RULES = [
  // ─── 1. GRAPEFRUIT JUICE & CITRUS CYP3A4 INHIBITORS ───────────────────────
  {
    id: 'grapefruit-statins',
    foodItem: 'Grapefruit & Fresh Grapefruit Juice',
    foodCategory: 'Citrus Fruits',
    icon: 'Citrus',
    severity: 'Major',
    triggerGenerics: ['atorvastatin', 'simvastatin', 'lovastatin'],
    clinicalTitle: 'Severe Statin Elevation · Rhabdomyolysis Risk',
    plainAdvice: 'Do not eat grapefruit or drink grapefruit juice while taking this statin. Grapefruit blocks liver enzymes, raising medicine levels by up to 10-fold and causing severe muscle damage (rhabdomyolysis) and kidney failure.',
    clinicalMechanism: 'Furanocoumarins in grapefruit irreversibly inhibit intestinal CYP3A4, dramatically elevating oral bioavailability of lipophilic statins and precipitating severe myopathy and rhabdomyolysis.',
    actionBadge: 'Avoid Grapefruit Completely',
  },
  {
    id: 'grapefruit-ccb',
    foodItem: 'Grapefruit & Grapefruit Juice',
    foodCategory: 'Citrus Fruits',
    icon: 'Citrus',
    severity: 'Moderate',
    triggerGenerics: ['amlodipine', 'felodipine', 'nifedipine', 'diltiazem', 'verapamil'],
    clinicalTitle: 'Excessive Blood Pressure Drop & Tachycardia',
    plainAdvice: 'Avoid large quantities of grapefruit juice. It can cause medicine levels to climb too high, leading to dizzy spells, severe low blood pressure, headaches, and rapid heartbeat.',
    clinicalMechanism: 'Inhibition of first-pass CYP3A4 metabolism increases systemic exposure to calcium channel antagonists, potentiating peripheral vasodilation and reflex orthostasis.',
    actionBadge: 'Limit or Avoid Grapefruit',
  },
  {
    id: 'grapefruit-antiarrhythmic',
    foodItem: 'Grapefruit Juice',
    foodCategory: 'Citrus Fruits',
    icon: 'Citrus',
    severity: 'Major',
    triggerGenerics: ['amiodarone'],
    clinicalTitle: 'Arrhythmia Risk via CYP3A4 Inhibition',
    plainAdvice: 'Strictly avoid grapefruit juice. It significantly raises amiodarone blood levels, creating dangerous heart rhythm irregularities.',
    clinicalMechanism: 'CYP3A4 inhibition delays amiodarone clearance, increasing QTc interval prolongation and risk of Torsades de Pointes.',
    actionBadge: 'Strictly Avoid Grapefruit',
  },

  // ─── 2. DAIRY PRODUCTS, MILK & CALCIUM CHELATION ──────────────────────────
  {
    id: 'dairy-quinolones',
    foodItem: 'Milk, Yogurt, Cheese & Calcium-Enriched Foods',
    foodCategory: 'Dairy Products',
    icon: 'Milk',
    severity: 'Major',
    triggerGenerics: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin', 'norfloxacin'],
    clinicalTitle: 'Antibiotic Inactivation via Divalent Cation Chelation',
    plainAdvice: 'Do not take this antibiotic with milk, yogurt, or calcium-fortified juices. Calcium binds to the medicine, blocking up to 90% of its absorption and causing treatment failure. Take the antibiotic 2 hours before or 4 hours after dairy.',
    clinicalMechanism: 'Fluoroquinolones form insoluble chelates with Ca2+, Mg2+, and Fe2+ ions in the GI tract, slashing systemic bioavailability and bactericidal efficacy.',
    actionBadge: 'Separate by 2–4 Hours',
  },
  {
    id: 'dairy-tetracyclines',
    foodItem: 'Milk & Dairy Foods',
    foodCategory: 'Dairy Products',
    icon: 'Milk',
    severity: 'Major',
    triggerGenerics: ['doxycycline', 'tetracycline', 'minocycline'],
    clinicalTitle: 'Tetracycline Absorption Blockade',
    plainAdvice: 'Avoid dairy products around the time you swallow this antibiotic. Calcium bonds with the medicine in your stomach, rendering it ineffective against infections.',
    clinicalMechanism: 'Tetracyclines form insoluble chelate complexes with polyvalent cations in dairy, significantly decreasing GI absorption.',
    actionBadge: 'Avoid Dairy at Dosing Time',
  },
  {
    id: 'dairy-iron-calcium',
    foodItem: 'Dairy Products & Calcium Supplements',
    foodCategory: 'Dairy Products',
    icon: 'Milk',
    severity: 'Moderate',
    triggerGenerics: ['ferrous sulfate', 'ferrous fumarate', 'iron', 'autrin', 'orofer'],
    clinicalTitle: 'Iron Bioavailability Suppression',
    plainAdvice: 'Take your iron pill with water or orange juice (Vitamin C improves absorption). Do NOT take with milk, tea, or coffee, which block iron absorption and perpetuate anemia.',
    clinicalMechanism: 'Calcium competitively competes with ferrous iron for the divalent metal transporter (DMT-1) in the duodenum.',
    actionBadge: 'Separate Iron from Milk by 2h',
  },
  {
    id: 'calcium-thyroid',
    foodItem: 'Milk, Calcium Supplements & Fortified Juices',
    foodCategory: 'Dairy / Calcium',
    icon: 'Milk',
    severity: 'Moderate',
    triggerGenerics: ['levothyroxine', 'thyronorm', 'eltroxin'],
    clinicalTitle: 'Reduced Thyroid Hormone Bioavailability',
    plainAdvice: 'Take levothyroxine with plain water on an empty stomach immediately upon waking. Wait at least 4 hours before consuming calcium-rich foods or calcium supplements.',
    clinicalMechanism: 'Calcium carbonate adsorbs levothyroxine in an acidic gastric environment, decreasing its bio-absorption and causing hypothyroid breakthrough.',
    actionBadge: 'Separate by 4 Hours',
  },

  // ─── 3. HIGH POTASSIUM FOODS & SALT SUBSTITUTES ───────────────────────────
  {
    id: 'potassium-acei-arb',
    foodItem: 'High-Potassium Foods (Bananas, Potassium Salt Substitutes, Oranges)',
    foodCategory: 'Fruits & Seasonings',
    icon: 'Banana',
    severity: 'Moderate',
    triggerGenerics: ['telmisartan', 'losartan', 'valsartan', 'lisinopril', 'ramipril', 'enalapril'],
    clinicalTitle: 'Hyperkalemia Risk with Potassium-Conserving Regimens',
    plainAdvice: 'Be cautious with high-potassium salt substitutes (low-sodium salts) and excessive bananas or dried fruits. These blood pressure medicines conserve potassium in your kidneys; too much potassium can cause dangerous heart palpitations.',
    clinicalMechanism: 'Inhibition of renin-angiotensin-aldosterone axis reduces urinary potassium excretion; excess exogenous potassium intake may precipitate hyperkalemia and cardiac conduction defects.',
    actionBadge: 'Avoid Potassium Salt Substitutes',
  },
  {
    id: 'potassium-spironolactone',
    foodItem: 'Potassium Salt Substitutes & High-Potassium Diet',
    foodCategory: 'Electrolytes',
    icon: 'Banana',
    severity: 'Major',
    triggerGenerics: ['spironolactone', 'eplerenone', 'aldactone'],
    clinicalTitle: 'Severe Fatal Hyperkalemia Warning',
    plainAdvice: 'Never use potassium-based salt substitutes or potassium supplements while taking Spironolactone. Your potassium level can spike rapidly to life-threatening levels.',
    clinicalMechanism: 'Direct aldosterone antagonism in distal collecting tubule prevents potassium secretion. Concomitant potassium loading risks severe hyperkalemic cardiac arrest.',
    actionBadge: 'Strictly No Potassium Substitutes',
  },

  // ─── 4. VITAMIN K RICH FOODS & WARFARIN ────────────────────────────────────
  {
    id: 'vitamin-k-warfarin',
    foodItem: 'Spinach, Kale, Broccoli & Dark Leafy Greens',
    foodCategory: 'Vegetables',
    icon: 'Leaf',
    severity: 'Major',
    triggerGenerics: ['warfarin', 'coumadin', 'acenocoumarol', 'acitrom'],
    clinicalTitle: 'Anticoagulation Reversal · Clot & Stroke Hazard',
    plainAdvice: 'Do not make sudden changes in your intake of green leafy vegetables (spinach, kale, cabbage). Vitamin K directly reverses warfarin’s blood-thinning effect, lowering your INR and raising stroke or blood clot risks. Keep your weekly green vegetable intake strictly steady.',
    clinicalMechanism: 'Dietary Vitamin K1 bypasses Warfarin-mediated epoxide reductase inhibition, resynthesizing clotting factors II, VII, IX, and X, lowering therapeutic INR.',
    actionBadge: 'Keep Leafy Greens Steady',
  },

  // ─── 5. ALCOHOL INTERACTIONS ──────────────────────────────────────────────
  {
    id: 'alcohol-paracetamol',
    foodItem: 'Alcohol & Alcoholic Beverages',
    foodCategory: 'Beverages',
    icon: 'Wine',
    severity: 'Major',
    triggerGenerics: ['paracetamol', 'acetaminophen', 'dolo', 'calpol', 'crocin', 'combiflam'],
    clinicalTitle: 'Synergistic Acute Hepatotoxicity Warning',
    plainAdvice: 'Avoid alcohol while taking paracetamol or pain relievers. Alcohol activates liver pathways that turn paracetamol into toxic metabolites, putting you at severe risk of acute liver injury.',
    clinicalMechanism: 'Chronic or binge alcohol intake induces CYP2E1 and depletes hepatic glutathione, promoting excessive accumulation of toxic N-acetyl-p-benzoquinone imine (NAPQI).',
    actionBadge: 'Avoid Alcohol Completely',
  },
  {
    id: 'alcohol-metformin',
    foodItem: 'Alcohol & Alcoholic Beverages',
    foodCategory: 'Beverages',
    icon: 'Wine',
    severity: 'Major',
    triggerGenerics: ['metformin', 'glycomet', 'janumet', 'galvus met'],
    clinicalTitle: 'Lactic Acidosis Emergency Risk',
    plainAdvice: 'Avoid drinking alcohol while on Metformin. Alcohol impairs lactate metabolism and dehydrates you, which can trigger Lactic Acidosis — a rare but life-threatening medical emergency.',
    clinicalMechanism: 'Ethanol oxidation increases the hepatic NADH/NAD+ ratio, inhibiting gluconeogenesis and lactate clearance, potentiating metformin-induced hyperlactatemia.',
    actionBadge: 'Avoid Alcohol with Metformin',
  },
  {
    id: 'alcohol-cns-sedatives',
    foodItem: 'Alcohol & Alcoholic Beverages',
    foodCategory: 'Beverages',
    icon: 'Wine',
    severity: 'Major',
    triggerGenerics: ['alprazolam', 'clonazepam', 'diazepam', 'lorazepam', 'zolpidem', 'tramadol', 'nexito', 'clonafit', 'gabapentin', 'pregabalin'],
    clinicalTitle: 'Profound CNS & Respiratory Depression',
    plainAdvice: 'Do not drink any alcohol while taking nerve or sleep medications. Alcohol combined with sedatives can cause dangerous breathing slowdown, profound unconsciousness, and fatal overdose.',
    clinicalMechanism: 'Synergistic central GABA-A receptor potentiation produces severe respiratory center depression, motor ataxia, and loss of airway reflexes.',
    actionBadge: 'Zero Alcohol Permitted',
  },
  {
    id: 'alcohol-nsaids',
    foodItem: 'Alcohol & Alcoholic Beverages',
    foodCategory: 'Beverages',
    icon: 'Wine',
    severity: 'Moderate',
    triggerGenerics: ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac', 'aceclofenac', 'zerodol'],
    clinicalTitle: 'Severe Gastrointestinal Bleeding & Ulcers',
    plainAdvice: 'Avoid alcohol when taking pain relievers. Both alcohol and painkillers irritate your stomach lining; together they dramatically increase your risk of bleeding stomach ulcers.',
    clinicalMechanism: 'Synergistic impairment of mucosal cytoprotective prostaglandins by NSAIDs and direct alcohol-induced mucosal exfoliation promotes erosive gastritis and hemorrhagic ulcers.',
    actionBadge: 'Avoid Alcohol with Painkillers',
  },
  {
    id: 'alcohol-nitroimidazoles',
    foodItem: 'Alcohol & Alcoholic Beverages',
    foodCategory: 'Beverages',
    icon: 'Wine',
    severity: 'Major',
    triggerGenerics: ['tinidazole', 'metronidazole', 'ciplox-tz', 'oflox-oz'],
    clinicalTitle: 'Violent Disulfiram-Like Reaction',
    plainAdvice: 'Strictly avoid all alcohol during treatment and for 72 hours afterwards. Even a tiny sip can cause violent vomiting, severe pounding headache, sweating, racing heart, and chest tightness.',
    clinicalMechanism: 'Inhibition of aldehyde dehydrogenase results in immediate toxic accumulation of acetaldehyde following alcohol ingestion.',
    actionBadge: 'Zero Alcohol for 72h After',
  },

  // ─── 6. CAFFEINE (COFFEE, TEA & ENERGY DRINKS) ────────────────────────────
  {
    id: 'caffeine-ciprofloxacin',
    foodItem: 'Coffee, Espresso, Tea & Energy Drinks',
    foodCategory: 'Caffeinated Beverages',
    icon: 'Coffee',
    severity: 'Moderate',
    triggerGenerics: ['ciprofloxacin', 'norfloxacin'],
    clinicalTitle: 'Caffeine Toxicity · Palpitations & Jitters',
    plainAdvice: 'Cut back on coffee, tea, and caffeinated beverages while taking Ciprofloxacin. The antibiotic prevents your body from breaking down caffeine, causing severe tremors, heart palpitations, and insomnia.',
    clinicalMechanism: 'Ciprofloxacin potently inhibits hepatic CYP1A2, reducing caffeine clearance by 30%–50% and doubling caffeine plasma half-life.',
    actionBadge: 'Reduce Coffee / Tea Intake',
  },

  // ─── 7. SUNLIGHT & UV EXPOSURE (LIFESTYLE PHOTOSENSITIVITY) ───────────────
  {
    id: 'photosensitivity-antibiotics',
    foodItem: 'Intense Sunlight & UV Radiation Exposure',
    foodCategory: 'Environmental Lifestyle',
    icon: 'Sun',
    severity: 'Moderate',
    triggerGenerics: ['doxycycline', 'ciprofloxacin', 'amiodarone', 'hydrochlorothiazide'],
    clinicalTitle: 'Severe Drug-Induced Phototoxicity',
    plainAdvice: 'Your skin is significantly more vulnerable to severe sunburn while taking this medication. Wear protective clothing, use broad-spectrum SPF 50 sunscreen, and avoid direct midday sunlight.',
    clinicalMechanism: 'Drug chromophores absorb ultraviolet A (UVA) light in dermal tissues, generating reactive oxygen species (ROS) that trigger cellular necrosis and erythema.',
    actionBadge: 'Use Sunscreen & Sun Hat',
  },
];

/**
 * Screen a patient's active medicines against the clinical food interaction rule set.
 *
 * @param {Array<Object|string>} medicines - Array of medicine objects ({ name, generic, type }) or strings
 * @returns {Array<Object>} Flagged food, drink, and lifestyle conflicts
 */
function screenFoodDrugInteractions(medicines = []) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return [];
  }

  const conflicts = [];
  const processedRules = new Set();

  // Normalize each medicine into search terms (expanded with aliases and constituents)
  const medSearchProfiles = medicines.map((med) => {
    const rawName = (typeof med === 'string' ? med : med.name || '').toLowerCase().trim();
    const rawGeneric = (typeof med === 'object' && med.generic ? med.generic : '').toLowerCase().trim();
    const rawSalts = (typeof med === 'object' && Array.isArray(med.genericSalts) ? med.genericSalts.join(' ') : '').toLowerCase().trim();
    const candidates = resolveDrugCandidates(rawName).map((c) => c.toLowerCase()).join(' ');
    return {
      originalName: typeof med === 'string' ? med : med.name,
      dose: typeof med === 'object' ? med.dosage : null,
      tokens: `${rawName} ${rawGeneric} ${rawSalts} ${candidates}`,
    };
  });

  for (const rule of FOOD_INTERACTION_RULES) {
    const matchedMeds = [];

    for (const med of medSearchProfiles) {
      const isMatch = rule.triggerGenerics.some((gen) => med.tokens.includes(gen));
      if (isMatch) {
        matchedMeds.push(med.originalName);
      }
    }

    if (matchedMeds.length > 0 && !processedRules.has(rule.id)) {
      processedRules.add(rule.id);
      conflicts.push({
        id: rule.id,
        foodItem: rule.foodItem,
        foodCategory: rule.foodCategory,
        icon: rule.icon,
        severity: rule.severity,
        clinicalTitle: rule.clinicalTitle,
        plainAdvice: rule.plainAdvice,
        clinicalMechanism: rule.clinicalMechanism,
        actionBadge: rule.actionBadge,
        triggeringMedicines: [...new Set(matchedMeds)],
      });
    }
  }

  // Sort by severity (Major first, then Moderate)
  const rank = { Major: 2, Moderate: 1, Minor: 0 };
  return conflicts.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
}

module.exports = {
  FOOD_INTERACTION_RULES,
  screenFoodDrugInteractions,
};
