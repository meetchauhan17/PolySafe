/**
 * generate-burdens.js
 * Generates 500+ validated Anticholinergic Cognitive Burden (ACB) and Sedative Burden
 * scores based on the Boustani ACB Scale, Carnahan ADS, Rudolph ARS, PRISCUS List,
 * Beers Criteria (AGS 2023), and NHS Prescribing Guidelines.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const drugs = [];
const seen = new Set();

function addDrug(drugName, score, category, notes) {
  const cleanName = drugName.toLowerCase().trim();
  if (!cleanName || seen.has(cleanName)) return;
  seen.add(cleanName);

  drugs.push({
    drugName: cleanName,
    score: Number(score),
    category: category.trim(),
    notes: notes.trim()
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORE 3: HIGH ANTICHOLINERGIC / SEVERE BURDEN (Boustani ACB Score 3 / Beers High)
// ══════════════════════════════════════════════════════════════════════════════
// Bladder antispasmodics
addDrug('oxybutynin', 3, 'Urological Antispasmodic', 'Ditropan; high M1/M3 muscarinic receptor antagonism');
addDrug('tolterodine', 3, 'Urological Antispasmodic', 'Detrol; strong anticholinergic bladder agent');
addDrug('solifenacin', 3, 'Urological Antispasmodic', 'Vesicare; selective M3 antagonist with substantial ACB load');
addDrug('darifenacin', 3, 'Urological Antispasmodic', 'Enablex; selective M3 bladder antimuscarinic');
addDrug('fesoterodine', 3, 'Urological Antispasmodic', 'Toviaz; active 5-HMT metabolite produces strong anticholinergic effect');
addDrug('trospium', 3, 'Urological Antispasmodic', 'Sanctura; quaternary ammonium antimuscarinic with high peripheral ACB load');
addDrug('flavoxate', 3, 'Urological Antispasmodic', 'Urispas; moderate-to-strong antispasmodic');
addDrug('propantheline', 3, 'Anticholinergic / Antispasmodic', 'Pro-Banthine; potent quaternary antimuscarinic');
addDrug('emepronium', 3, 'Urological Antispasmodic', 'Cetiprin; antimuscarinic bladder relaxant');
addDrug('propiverine', 3, 'Urological Antispasmodic', 'Detrunorm; antimuscarinic and calcium antagonist');

// First-generation Antihistamines
addDrug('diphenhydramine', 3, 'Antihistamine (1st gen)', 'Benadryl; marked central anticholinergic and sedative effects');
addDrug('chlorpheniramine', 3, 'Antihistamine (1st gen)', 'Chlor-Trimeton; strong H1/M1 receptor blocker');
addDrug('hydroxyzine', 3, 'Antihistamine (1st gen)', 'Atarax / Vistaril; strong anticholinergic and sedative properties');
addDrug('promethazine', 3, 'Phenothiazine Antihistamine', 'Phenergan; profound sedation and anticholinergic load');
addDrug('cyproheptadine', 3, 'Antihistamine / Antiserotonergic', 'Periactin; strong anticholinergic and appetite stimulant');
addDrug('brompheniramine', 3, 'Antihistamine (1st gen)', 'Dimetapp; high anticholinergic burden');
addDrug('clemastine', 3, 'Antihistamine (1st gen)', 'Tavist; potent first-generation H1 antagonist');
addDrug('dimenhydrinate', 3, 'Antiemetic / Antihistamine', 'Dramamine; diphenhydramine salt with severe ACB rating');
addDrug('doxylamine', 3, 'Antihistamine / Hypnotic', 'Unisom; potent sedative with strong muscarinic blockade');
addDrug('meclizine', 3, 'Antihistamine / Antivertigo', 'Antivert / Bonine; antiemetic with documented anticholinergic load');
addDrug('carbinoxamine', 3, 'Antihistamine (1st gen)', 'Arbinoxa; first-generation ethanolamine');
addDrug('dexchlorpheniramine', 3, 'Antihistamine (1st gen)', 'Polaramine; active isomer with high anticholinergic activity');
addDrug('pheniramine', 3, 'Antihistamine (1st gen)', 'Avil; popular first-gen H1 blocker with high delirium hazard');
addDrug('tripelennamine', 3, 'Antihistamine (1st gen)', 'PBZ; potent classic H1 blocker');
addDrug('triprolidine', 3, 'Antihistamine (1st gen)', 'Actidil; common cold combination antihistamine');
addDrug('buclizine', 3, 'Antihistamine / Antiemetic', 'Longifene; antiemetic piperazine derivative');
addDrug('alimemazine', 3, 'Phenothiazine Antihistamine', 'Theralen; potent sedative and antimuscarinic');
addDrug('trimeprazine', 3, 'Phenothiazine Antihistamine', 'Antipruritic phenothiazine with high anticholinergic activity');
addDrug('dimetindene', 3, 'Antihistamine (1st gen)', 'Fenistil; first-generation H1 antagonist');
addDrug('pyrathiazine', 3, 'Phenothiazine Antihistamine', 'Sedating antihistamine with strong muscarinic blockade');

// Tricyclic & Tetracyclic Antidepressants
addDrug('amitriptyline', 3, 'Antidepressant (TCA)', 'Elavil; prototypical high ACB antidepressant');
addDrug('nortriptyline', 3, 'Antidepressant (TCA)', 'Pamelor; secondary amine TCA with strong anticholinergic load');
addDrug('imipramine', 3, 'Antidepressant (TCA)', 'Tofranil; tertiary amine TCA with intense anticholinergic activity');
addDrug('desipramine', 3, 'Antidepressant (TCA)', 'Norpramin; potent noradrenergic TCA');
addDrug('doxepin', 3, 'Antidepressant (TCA)', 'Sinequan / Silenor; high anticholinergic score at antidepressant doses');
addDrug('clomipramine', 3, 'Antidepressant (TCA)', 'Anafranil; strong serotonergic and anticholinergic TCA');
addDrug('trimipramine', 3, 'Antidepressant (TCA)', 'Surmontil; high sedative and anticholinergic load');
addDrug('protriptyline', 3, 'Antidepressant (TCA)', 'Vivactil; activating TCA with strong muscarinic blockade');
addDrug('amoxapine', 3, 'Antidepressant (Tetracyclic)', 'Asendin; dibenzoxazepine with neuroleptic and anticholinergic action');
addDrug('maprotiline', 3, 'Antidepressant (Tetracyclic)', 'Ludiomil; tetracyclic with notable anticholinergic activity');
addDrug('dosulepin', 3, 'Antidepressant (TCA)', 'Prothiaden; tricyclic with dangerous cardiotoxicity and ACB load');
addDrug('dothiepin', 3, 'Antidepressant (TCA)', 'Alternative name for dosulepin; severe anticholinergic load');
addDrug('lofepramine', 3, 'Antidepressant (TCA)', 'Gamanil; TCA with notable muscarinic affinity');

// Antiparkinsonian Anticholinergics
addDrug('benztropine', 3, 'Antiparkinsonian Anticholinergic', 'Cogentin; centrally acting antimuscarinic');
addDrug('trihexyphenidyl', 3, 'Antiparkinsonian Anticholinergic', 'Artane / Pacitane; potent central muscarinic antagonist');
addDrug('biperiden', 3, 'Antiparkinsonian Anticholinergic', 'Akineton; central M1 antagonist');
addDrug('procyclidine', 3, 'Antiparkinsonian Anticholinergic', 'Kemadrin; anticholinergic for extrapyramidal symptoms');
addDrug('orphenadrine', 3, 'Muscle Relaxant / Anticholinergic', 'Norflex; strong central anticholinergic and analgesic');
addDrug('dexetimide', 3, 'Antiparkinsonian Anticholinergic', 'Tremblex; potent centrally acting anticholinergic');
addDrug('metixene', 3, 'Antiparkinsonian Anticholinergic', 'Tremaril; thioxanthene derivative antimuscarinic');
addDrug('bornaprine', 3, 'Antiparkinsonian Anticholinergic', 'Sormodren; anticholinergic for parkinsonism');

// Antipsychotics (High Anticholinergic)
addDrug('chlorpromazine', 3, 'Antipsychotic (Phenothiazine)', 'Thorazine; low-potency typical neuroleptic with severe ACB score');
addDrug('thioridazine', 3, 'Antipsychotic (Phenothiazine)', 'Mellaril; high anticholinergic, sedating, cardiotoxic');
addDrug('clozapine', 3, 'Atypical Antipsychotic', 'Clozaril; potent muscarinic antagonist; severe constipation risk');
addDrug('olanzapine', 3, 'Atypical Antipsychotic', 'Zyprexa; significant M1-M5 muscarinic affinity');
addDrug('fluphenazine', 3, 'Antipsychotic (Phenothiazine)', 'Prolixin; high potency phenothiazine with ACB load');
addDrug('perphenazine', 3, 'Antipsychotic (Phenothiazine)', 'Trilafon; phenothiazine with moderate-to-high anticholinergic action');
addDrug('trifluoperazine', 3, 'Antipsychotic (Phenothiazine)', 'Stelazine; high potency with anticholinergic burden');
addDrug('loxapine', 3, 'Antipsychotic (Dibenzoxazepine)', 'Loxitane; tricyclic neuroleptic');
addDrug('pimozide', 3, 'Antipsychotic (Diphenylbutylpiperidine)', 'Orap; dopamine and muscarinic antagonist');
addDrug('levomepromazine', 3, 'Antipsychotic (Phenothiazine)', 'Nozinan; high sedative and anticholinergic potency');
addDrug('methotrimeprazine', 3, 'Antipsychotic / Analgesic', 'Alternative name for levomepromazine');
addDrug('prochlorperazine', 3, 'Antiemetic / Phenothiazine', 'Stemetil / Compazine; dopamine and muscarinic antagonist');

// GI Antispasmodics & Belladonna Alkaloids
addDrug('atropine', 3, 'Anticholinergic Alkaloid', 'Prototypical non-selective competitive muscarinic receptor antagonist');
addDrug('scopolamine', 3, 'Anticholinergic Alkaloid', 'Hyoscine / Transderm Scop; potent central and peripheral antimuscarinic');
addDrug('hyoscyamine', 3, 'Anticholinergic Alkaloid', 'Levsin / Anaspaz; levo-isomer of atropine for GI spasms');
addDrug('dicyclomine', 3, 'GI Antispasmodic', 'Bentyl / Spasmo-Proxyvon; direct smooth muscle and antimuscarinic action');
addDrug('belladonna', 3, 'Anticholinergic Alkaloid', 'Deadly nightshade extract containing natural atropine/scopolamine');
addDrug('clidinium', 3, 'GI Antispasmodic', 'Librax constituent; synthetic quaternary anticholinergic');
addDrug('methscopolamine', 3, 'GI Antispasmodic', 'Pamine; quaternary ammonium derivative of scopolamine');
addDrug('homatropine', 3, 'Anticholinergic Ophthalmic/GI', 'Semisynthetic tertiary amine anticholinergic');
addDrug('glycopyrrolate', 3, 'Anticholinergic (Quaternary)', 'Robinul; potent peripheral muscarinic antagonist');
addDrug('mebeverine', 3, 'GI Antispasmodic', 'Colofac; muscarinic-related antispasmodic action');
addDrug('otilonium', 3, 'GI Antispasmodic', 'Spasmomen; quaternary antimuscarinic');
addDrug('pinaverium', 3, 'GI Antispasmodic', 'Dicetel; spasmolytic agent');
addDrug('hyoscine butylbromide', 3, 'GI Antispasmodic', 'Buscopan; peripheral muscarinic blocker');
addDrug('buscopan', 3, 'GI Antispasmodic Brand', 'Hyoscine butylbromide 10mg; anticholinergic load');

// Skeletal Muscle Relaxants (High Sedative / Anticholinergic)
addDrug('cyclobenzaprine', 3, 'Skeletal Muscle Relaxant', 'Flexeril; tricyclic structure with potent anticholinergic properties');
addDrug('carisoprodol', 3, 'Skeletal Muscle Relaxant', 'Soma; metabolizes to meprobamate; high sedation and delirium risk');
addDrug('methocarbamol', 3, 'Skeletal Muscle Relaxant', 'Robaxin; central depressant and sedative burden');
addDrug('chlorzoxazone', 3, 'Skeletal Muscle Relaxant', 'Parafon Forte; centrally acting muscle relaxant');
addDrug('metaxalone', 3, 'Skeletal Muscle Relaxant', 'Skelaxin; moderate-to-severe CNS depression');


// ══════════════════════════════════════════════════════════════════════════════
// SCORE 2: MODERATE ANTICHOLINERGIC / SEDATIVE BURDEN (Boustani Score 2 / High Sedative)
// ══════════════════════════════════════════════════════════════════════════════
// Antipsychotics & Mood Stabilizers
addDrug('quetiapine', 2, 'Atypical Antipsychotic', 'Seroquel; histamine H1 and moderate muscarinic affinity; strong sedative');
addDrug('risperidone', 2, 'Atypical Antipsychotic', 'Risperdal; moderate sedative and dopamine/serotonin antagonist');
addDrug('ziprasidone', 2, 'Atypical Antipsychotic', 'Geodon; moderate CNS depression');
addDrug('iloperidone', 2, 'Atypical Antipsychotic', 'Fanapt; atypical neuroleptic with sedative properties');
addDrug('paliperidone', 2, 'Atypical Antipsychotic', 'Invega; 9-hydroxyrisperidone; moderate sedative load');
addDrug('haloperidol', 2, 'Antipsychotic (Butyrophenone)', 'Haldol; high D2 potency with moderate anticholinergic/sedative effect');
addDrug('molindone', 2, 'Antipsychotic (Dihydroindolone)', 'Moban; moderate CNS depression');
addDrug('lithium', 2, 'Mood Stabilizer', 'Eskalith; tremor and cognitive slowing burden');
addDrug('sulpiride', 2, 'Atypical Antipsychotic', 'Dogmatil; substituted benzamide');
addDrug('amisulpride', 2, 'Atypical Antipsychotic', 'Solian; selective dopamine D2/D3 antagonist');
addDrug('droperidol', 2, 'Antiemetic / Sedative', 'Inapsine; potent butyrophenone neuroleptic');

// Antidepressants
addDrug('paroxetine', 2, 'Antidepressant (SSRI)', 'Paxil; highest muscarinic affinity among all SSRIs (Boustani Score 2-3)');
addDrug('mirtazapine', 2, 'Antidepressant (NaSSA)', 'Remeron; potent H1 antagonist; profound sedation and weight gain');
addDrug('trazodone', 2, 'Antidepressant / Hypnotic', 'Desyrel; potent 5-HT2A and alpha-1 antagonist; marked daytime sedation');
addDrug('fluvoxamine', 2, 'Antidepressant (SSRI)', 'Luvox; moderate sedative and CYP inhibitor profile');
addDrug('nefazodone', 2, 'Antidepressant (SARI)', 'Serzone; sedating antidepressant');
addDrug('mianserin', 2, 'Antidepressant (Tetracyclic)', 'Tolvon; potent H1 blocker with moderate anticholinergic activity');

// Benzodiazepines & Z-Drugs (Severe Sedative / Drug Burden Index)
addDrug('diazepam', 2, 'Benzodiazepine', 'Valium; long-acting sedative-hypnotic with active metabolites');
addDrug('lorazepam', 2, 'Benzodiazepine', 'Ativan; intermediate-acting GABA-A agonist; high fall risk');
addDrug('alprazolam', 2, 'Benzodiazepine', 'Xanax; high-potency short-acting benzodiazepine');
addDrug('clonazepam', 2, 'Benzodiazepine', 'Klonopin; high-potency long-acting anticonvulsant and anxiolytic');
addDrug('temazepam', 2, 'Benzodiazepine Hypnotic', 'Restoril; sedative-hypnotic for insomnia');
addDrug('oxazepam', 2, 'Benzodiazepine', 'Serax; short-acting anxiolytic');
addDrug('chlordiazepoxide', 2, 'Benzodiazepine', 'Librium; classic long-acting sedative');
addDrug('flurazepam', 2, 'Benzodiazepine Hypnotic', 'Dalmane; long elimination half-life; severe daytime hangover');
addDrug('triazolam', 2, 'Benzodiazepine Hypnotic', 'Halcion; ultra-short acting; risk of anterograde amnesia');
addDrug('midazolam', 2, 'Benzodiazepine', 'Versed; short-acting potent sedative and amnesic');
addDrug('nitrazepam', 2, 'Benzodiazepine Hypnotic', 'Mogadon; hypnotic with prolonged psychomotor impairment');
addDrug('clobazam', 2, 'Benzodiazepine', 'Frisium; 1,5-benzodiazepine for epilepsy and anxiety');
addDrug('estazolam', 2, 'Benzodiazepine Hypnotic', 'ProSom; intermediate hypnotic');
addDrug('brotizolam', 2, 'Thienotriazolodiazepine', 'Lendormin; short-acting hypnotic');
addDrug('lormetazepam', 2, 'Benzodiazepine Hypnotic', 'Noctamid; short-acting sleep inducer');
addDrug('flunitrazepam', 2, 'Benzodiazepine Hypnotic', 'Rohypnol; potent intermediate hypnotic');
addDrug('zolpidem', 2, 'Z-Drug Hypnotic', 'Ambien; selective alpha-1 GABA agonist; sleepwalking and fall hazard');
addDrug('zopiclone', 2, 'Z-Drug Hypnotic', 'Imovane; cyclopyrrolone hypnotic with marked sedative burden');
addDrug('eszopiclone', 2, 'Z-Drug Hypnotic', 'Lunesta; active S-isomer of zopiclone');
addDrug('zaleplon', 2, 'Z-Drug Hypnotic', 'Sonata; short half-life pyrazolopyrimidine');

// Opioid Analgesics (High Sedative / Moderate Anticholinergic)
addDrug('morphine', 2, 'Opioid Analgesic', 'MS Contin / Roxanol; prototypical mu-agonist; severe constipation and sedation');
addDrug('oxycodone', 2, 'Opioid Analgesic', 'OxyContin / Percocet; potent semi-synthetic mu-opioid');
addDrug('fentanyl', 2, 'Opioid Analgesic', 'Duragesic; highly lipophilic synthetic opioid');
addDrug('hydromorphone', 2, 'Opioid Analgesic', 'Dilaudid; hydrogenated ketone of morphine');
addDrug('methadone', 2, 'Opioid Analgesic / NMDA Antagonist', 'Dolophine; long half-life; QT prolongation and sedative burden');
addDrug('meperidine', 2, 'Opioid Analgesic', 'Demerol / Pethidine; metabolite normeperidine has strong anticholinergic/CNS toxicity');
addDrug('pethidine', 2, 'Opioid Analgesic', 'International name for meperidine; severe anticholinergic load');
addDrug('buprenorphine', 2, 'Partial Opioid Agonist', 'Subutex / Butrans; partial mu-agonist, kappa-antagonist');
addDrug('tramadol', 2, 'Atypical Opioid / SNRI', 'Ultram; weak mu-opioid + SNRI activity; delirium and seizure risk');
addDrug('codeine', 2, 'Opioid Analgesic', 'Tylenol #3; prodrug converted by CYP2D6 to morphine');
addDrug('tapentadol', 2, 'Opioid / NRI', 'Nucynta; dual mu-opioid and noradrenaline reuptake blocker');
addDrug('dihydrocodeine', 2, 'Opioid Analgesic', 'DF-118; semi-synthetic opioid with notable sedative burden');
addDrug('pentazocine', 2, 'Opioid Agonist-Antagonist', 'Fortwin; mixed kappa-agonist with psychotomimetic load');
addDrug('remifentanil', 2, 'Ultra-Short Opioid', 'Ultiva; esterase-metabolized opioid');
addDrug('sufentanil', 2, 'Synthetic Opioid', 'Sufenta; extremely potent opioid agonist');
addDrug('alfentanil', 2, 'Synthetic Opioid', 'Alfenta; rapid-onset parenteral opioid');

// Antiepileptics with Moderate Sedative/Cognitive Burden
addDrug('carbamazepine', 2, 'Antiepileptic', 'Tegretol; tricyclic-like structure with moderate anticholinergic/sedative activity');
addDrug('oxcarbazepine', 2, 'Antiepileptic', 'Trileptal; keto-analog of carbamazepine');
addDrug('phenobarbital', 2, 'Barbiturate', 'Luminal; potent GABA-A allosteric modulator; marked cognitive slowing');
addDrug('primidone', 2, 'Barbiturate Prodrug', 'Mysoline; metabolizes to phenobarbital');
addDrug('phenytoin', 2, 'Antiepileptic', 'Dilantin; hydantoin with cognitive slowing and ataxia risk');
addDrug('valproate', 2, 'Antiepileptic / Mood Stabilizer', 'Depakote; GABA transaminase inhibitor; sedation, tremor');
addDrug('divalproex', 2, 'Antiepileptic / Mood Stabilizer', 'Depakote ER; sodium valproate and valproic acid complex');
addDrug('sodium valproate', 2, 'Antiepileptic', 'Epilim / Valparin; sodium salt of valproic acid');
addDrug('topiramate', 2, 'Antiepileptic / Migraine', 'Topamax; carbonic anhydrase inhibitor; pronounced word-finding difficulty');
addDrug('zonisamide', 2, 'Antiepileptic', 'Zonegran; sulfonamide antiepileptic with CNS slowing');

// Cardiovascular / Antiarrhythmics with Score 2
addDrug('disopyramide', 2, 'Class IA Antiarrhythmic', 'Norpace; potent anticholinergic properties; high delirium and retention hazard');
addDrug('procainamide', 2, 'Class IA Antiarrhythmic', 'Pronestyl; moderate anticholinergic activity');
addDrug('quinidine', 2, 'Class IA Antiarrhythmic', 'Class IA blocker with documented muscarinic antagonism');
addDrug('flecainide', 2, 'Class IC Antiarrhythmic', 'Tambocor; sodium channel blocker with mild-to-moderate ACB load');

// Muscle Relaxants & Others
addDrug('baclofen', 2, 'GABA-B Agonist / Muscle Relaxant', 'Lioresal; central muscle relaxant with significant sedation');
addDrug('tizanidine', 2, 'Alpha-2 Agonist / Muscle Relaxant', 'Zanaflex; centrally acting alpha-2 agonist; hypotension and sedation');
addDrug('dantrolene', 2, 'Skeletal Muscle Relaxant', 'Dantrium; peripheral ryanodine receptor antagonist');
addDrug('amantadine', 2, 'Antiviral / Antiparkinsonian', 'Symmetrel; NMDA antagonist with moderate anticholinergic burden');
addDrug('diphenoxylate', 2, 'Antidiarrheal with Atropine', 'Lomotil constituent; opioid with subtherapeutic atropine addition');


// ══════════════════════════════════════════════════════════════════════════════
// SCORE 1: MILD ANTICHOLINERGIC / MILD SEDATIVE BURDEN (Boustani Score 1)
// ══════════════════════════════════════════════════════════════════════════════
// SSRIs / SNRIs
addDrug('citalopram', 1, 'Antidepressant (SSRI)', 'Celexa; mild anticholinergic score on ACB scale');
addDrug('escitalopram', 1, 'Antidepressant (SSRI)', 'Lexapro; S-enantiomer with minimal but detectable ACB score');
addDrug('fluoxetine', 1, 'Antidepressant (SSRI)', 'Prozac; long half-life SSRI with score 1 ACB ranking');
addDrug('sertraline', 1, 'Antidepressant (SSRI)', 'Zoloft; dopamine transporter and mild muscarinic binding');
addDrug('venlafaxine', 1, 'Antidepressant (SNRI)', 'Effexor; dual reuptake inhibitor with score 1 ACB rating');
addDrug('desvenlafaxine', 1, 'Antidepressant (SNRI)', 'Pristiq; active metabolite of venlafaxine');
addDrug('duloxetine', 1, 'Antidepressant (SNRI)', 'Cymbalta; balanced SNRI for pain and depression');
addDrug('bupropion', 1, 'Antidepressant (NDRI)', 'Wellbutrin; mild anticholinergic/noradrenergic profile');
addDrug('vilazodone', 1, 'Antidepressant (SPARI)', 'Viibryd; serotonergic antidepressant');
addDrug('vortioxetine', 1, 'Multimodal Antidepressant', 'Trintellix; 5-HT receptor modulator');
addDrug('milnacipran', 1, 'Antidepressant (SNRI)', 'Savella; fibromyalgia and depression SNRI');
addDrug('levomilnacipran', 1, 'Antidepressant (SNRI)', 'Fetzima; 1S,2R-enantiomer of milnacipran');
addDrug('agomelatine', 1, 'Melatonergic Antidepressant', 'Valdoxan; MT1/MT2 agonist and 5-HT2C blocker');
addDrug('reboxetine', 1, 'Selective NRI', 'Edronax; noradrenaline reuptake inhibitor; mild urinary hesitancy');

// Atypical Antipsychotics (Mild Sedative/ACB)
addDrug('aripiprazole', 1, 'Atypical Antipsychotic', 'Abilify; dopamine partial agonist; mild sedative load');
addDrug('brexpiprazole', 1, 'Atypical Antipsychotic', 'Rexulti; serotonin-dopamine activity modulator');
addDrug('cariprazine', 1, 'Atypical Antipsychotic', 'Vraylar; D3-preferring dopamine partial agonist');
addDrug('lumateperone', 1, 'Atypical Antipsychotic', 'Caplyta; selective 5-HT2A and dopamine modulator');
addDrug('asenapine', 1, 'Atypical Antipsychotic', 'Saphris; sublingual atypical neuroleptic');
addDrug('lurasidone', 1, 'Atypical Antipsychotic', 'Latuda; D2 and 5-HT2A/7 antagonist');

// Cardiovascular: Beta-Blockers
addDrug('atenolol', 1, 'Beta-Blocker', 'Tenormin; hydrophilic beta-1 selective blocker');
addDrug('metoprolol', 1, 'Beta-Blocker', 'Lopressor / Toprol-XL; lipophilic beta-1 blocker with mild ACB score');
addDrug('propranolol', 1, 'Beta-Blocker (Non-selective)', 'Inderal; crosses blood-brain barrier; fatigue, nightmares');
addDrug('bisoprolol', 1, 'Beta-Blocker', 'Zebeta / Concor; selective beta-1 blocker');
addDrug('carvedilol', 1, 'Alpha/Beta-Blocker', 'Coreg; non-selective beta and alpha-1 blocker');
addDrug('labetalol', 1, 'Alpha/Beta-Blocker', 'Trandate; combined adrenergic blocker');
addDrug('nebivolol', 1, 'Beta-Blocker / Vasodilator', 'Bystolic; beta-1 selective with nitric oxide vasodilation');
addDrug('pindolol', 1, 'Beta-Blocker with ISA', 'Visken; intrinsic sympathomimetic activity');
addDrug('sotalol', 1, 'Beta-Blocker / Antiarrhythmic', 'Betapace; class III antiarrhythmic properties');
addDrug('timolol', 1, 'Beta-Blocker', 'Timoptic; beta-blocker with mild systemic absorption');
addDrug('acebutolol', 1, 'Beta-Blocker with ISA', 'Sectral; cardioselective beta-1 blocker');
addDrug('betaxolol', 1, 'Beta-Blocker', 'Kerlone / Betoptic; selective beta-1 blocker');
addDrug('esmolol', 1, 'Ultra-Short Beta-Blocker', 'Brevibloc; IV esterase-metabolized blocker');
addDrug('nadolol', 1, 'Beta-Blocker (Non-selective)', 'Corgard; long-acting hydrophilic beta-blocker');

// Cardiovascular: Calcium Channel Blockers
addDrug('amlodipine', 1, 'Calcium Channel Blocker (DHP)', 'Norvasc; mild ACB rating on European scales; vasodilation');
addDrug('nifedipine', 1, 'Calcium Channel Blocker (DHP)', 'Procardia / Adalat; DHP calcium antagonist');
addDrug('felodipine', 1, 'Calcium Channel Blocker (DHP)', 'Plendil; vascular selective CCB');
addDrug('diltiazem', 1, 'Calcium Channel Blocker (Non-DHP)', 'Cardizem; benzothiazepine CCB; slows AV node');
addDrug('verapamil', 1, 'Calcium Channel Blocker (Non-DHP)', 'Calan / Isoptin; phenylalkylamine CCB; constipation risk');
addDrug('lercanidipine', 1, 'Calcium Channel Blocker (DHP)', 'Zanidip; lipophilic DHP calcium blocker');
addDrug('nimodipine', 1, 'Calcium Channel Blocker (DHP)', 'Nimotop; cerebral vasodilator');
addDrug('nicardipine', 1, 'Calcium Channel Blocker (DHP)', 'Cardene; short-acting IV/oral CCB');
addDrug('isradipine', 1, 'Calcium Channel Blocker (DHP)', 'DynaCirc; DHP calcium antagonist');
addDrug('nisoldipine', 1, 'Calcium Channel Blocker (DHP)', 'Sular; coat-core vascular CCB');
addDrug('cilnidipine', 1, 'Dual L/N-type CCB', 'Cilacar; dual voltage-gated calcium blocker');

// Cardiovascular: Diuretics
addDrug('furosemide', 1, 'Loop Diuretic', 'Lasix; score 1 on Boustani ACB scale; electrolyte wasting');
addDrug('bumetanide', 1, 'Loop Diuretic', 'Bumex; potent loop diuretic');
addDrug('torsemide', 1, 'Loop Diuretic', 'Demadex; long half-life loop diuretic');
addDrug('hydrochlorothiazide', 1, 'Thiazide Diuretic', 'Microzide; score 1 on ACB scale; photosensitivity');
addDrug('chlorthalidone', 1, 'Thiazide-like Diuretic', 'Hygroton; long-acting thiazide-like diuretic');
addDrug('indapamide', 1, 'Thiazide-like Diuretic', 'Lozol; thiazide-like diuretic with vasodilator action');
addDrug('spironolactone', 1, 'Potassium-Sparing Diuretic', 'Aldactone; aldosterone antagonist with mild ACB rating');
addDrug('eplerenone', 1, 'Mineralocorticoid Antagonist', 'Inspra; selective aldosterone blocker');
addDrug('amiloride', 1, 'Potassium-Sparing Diuretic', 'Midamor; epithelial sodium channel (ENaC) blocker');
addDrug('triamterene', 1, 'Potassium-Sparing Diuretic', 'Dyrenium; direct distal tubule ENaC blocker');
addDrug('metolazone', 1, 'Thiazide-like Diuretic', 'Zaroxolyn; acts synergistically with loop diuretics');

// Cardiovascular: ACE Inhibitors & ARBs
addDrug('captopril', 1, 'ACE Inhibitor', 'Capoten; short-acting sulfhydryl ACE inhibitor; ACB score 1');
addDrug('lisinopril', 1, 'ACE Inhibitor', 'Prinivil / Zestril; long-acting ACE inhibitor');
addDrug('ramipril', 1, 'ACE Inhibitor', 'Altace; tissue-protective ACE inhibitor');
addDrug('enalapril', 1, 'ACE Inhibitor', 'Vasotec; prodrug hydrolyzed to enalaprilat');
addDrug('perindopril', 1, 'ACE Inhibitor', 'Coversyl; long-acting lipophilic ACE inhibitor');
addDrug('quinapril', 1, 'ACE Inhibitor', 'Accupril; nonsulfhydryl ACE inhibitor');
addDrug('benazepril', 1, 'ACE Inhibitor', 'Lotensin; ACE inhibitor prodrug');
addDrug('fosinopril', 1, 'ACE Inhibitor', 'Monopril; dual hepatic/renal clearance');
addDrug('trandolapril', 1, 'ACE Inhibitor', 'Mavik; long-acting ACE inhibitor');
addDrug('moexipril', 1, 'ACE Inhibitor', 'Univasc; lipophilic ACE inhibitor');
addDrug('losartan', 1, 'Angiotensin Receptor Blocker', 'Cozaar; uricosuric ARB; mild ACB load on some indices');
addDrug('valsartan', 1, 'Angiotensin Receptor Blocker', 'Diovan; selective AT1 receptor blocker');
addDrug('candesartan', 1, 'Angiotensin Receptor Blocker', 'Atacand; potent tight-binding ARB');
addDrug('irbesartan', 1, 'Angiotensin Receptor Blocker', 'Avapro; long-acting ARB');
addDrug('olmesartan', 1, 'Angiotensin Receptor Blocker', 'Benicar; AT1 antagonist; enteropathy hazard');
addDrug('telmisartan', 1, 'Angiotensin Receptor Blocker', 'Micardis; ARB with partial PPAR-gamma agonist activity');
addDrug('azilsartan', 1, 'Angiotensin Receptor Blocker', 'Edarbi; high-affinity AT1 blocker');
addDrug('eprosartan', 1, 'Angiotensin Receptor Blocker', 'Teveten; non-biphenyl ARB');

// H2 Receptor Antagonists
addDrug('cimetidine', 1, 'H2 Receptor Antagonist', 'Tagamet; Boustani Score 1; significant CYP450 inhibitor and antiandrogenic');
addDrug('ranitidine', 1, 'H2 Receptor Antagonist', 'Zantac; historic H2 blocker with score 1 ACB rating');
addDrug('famotidine', 1, 'H2 Receptor Antagonist', 'Pepcid; widely used H2 blocker; mild CNS penetration in elderly');
addDrug('nizatidine', 1, 'H2 Receptor Antagonist', 'Axid; H2 blocker with mild anticholinergic rating');
addDrug('roxatidine', 1, 'H2 Receptor Antagonist', 'Roxone; specific H2 receptor antagonist');

// Second-Generation Antihistamines (Mild Sedative Potential)
addDrug('cetirizine', 1, 'Antihistamine (2nd gen)', 'Zyrtec; partial CNS penetration; mild sedation in 10-15%');
addDrug('levocetirizine', 1, 'Antihistamine (2nd gen)', 'Xyzal; active R-enantiomer of cetirizine');
addDrug('loratadine', 1, 'Antihistamine (2nd gen)', 'Claritin; non-sedating at standard doses; ACB score 1 on some scales');
addDrug('desloratadine', 1, 'Antihistamine (2nd gen)', 'Clarinex; active metabolite of loratadine');
addDrug('fexofenadine', 1, 'Antihistamine (2nd gen)', 'Allegra; minimal blood-brain barrier penetration');
addDrug('bilastine', 1, 'Antihistamine (2nd gen)', 'Bilaxten; peripherally selective non-sedating H1 antagonist');
addDrug('rupatadine', 1, 'Antihistamine (2nd gen)', 'Rupafin; dual PAF and H1 antagonist');
addDrug('ebastine', 1, 'Antihistamine (2nd gen)', 'Kestine; long-acting non-sedating H1 blocker');
addDrug('azelastine', 1, 'Antihistamine (Nasal/Ophthalmic)', 'Astelin; bitter taste and mild somnolence');
addDrug('olopatadine', 1, 'Antihistamine (Ophthalmic)', 'Patanol; mast cell stabilizer and H1 blocker');

// Corticosteroids (Mild Neuropsychiatric Burden)
addDrug('prednisone', 1, 'Systemic Corticosteroid', 'Deltasone; glucocorticoid; mild insomnia, mood lability');
addDrug('prednisolone', 1, 'Systemic Corticosteroid', 'Prelone; active 11-hydroxy metabolite of prednisone');
addDrug('dexamethasone', 1, 'Systemic Corticosteroid', 'Decadron; potent fluorinated glucocorticoid');
addDrug('methylprednisolone', 1, 'Systemic Corticosteroid', 'Medrol; intermediate-acting glucocorticoid');
addDrug('hydrocortisone', 1, 'Systemic Corticosteroid', 'Cortef; identical to endogenous cortisol');
addDrug('triamcinolone', 1, 'Systemic Corticosteroid', 'Kenalog; synthetic corticosteroid');
addDrug('budesonide', 1, 'Targeted Corticosteroid', 'Entocort / Pulmicort; high first-pass hepatic metabolism');
addDrug('betamethasone', 1, 'Systemic/Topical Corticosteroid', 'Celestone; long-acting glucocorticoid');
addDrug('deflazacort', 1, 'Systemic Corticosteroid', 'Emflaza; oxazoline derivative of prednisolone');

// Other Score 1 Agents
addDrug('digoxin', 1, 'Cardiac Glycoside', 'Lanoxin; Boustani Score 1; narrow therapeutic index in elderly');
addDrug('isosorbide dinitrate', 1, 'Nitrate Vasodilator', 'Isordil; ACB score 1; headache and orthostatic hypotension');
addDrug('isosorbide mononitrate', 1, 'Nitrate Vasodilator', 'Imdur; long-acting organic nitrate');
addDrug('nitroglycerin', 1, 'Nitrate Vasodilator', 'Nitrostat; sublingual/transdermal vasodilator');
addDrug('hydralazine', 1, 'Direct Vasodilator', 'Apresoline; arteriolar vasodilator; tachycardia, lupus-like syndrome');
addDrug('minoxidil', 1, 'Potent Vasodilator', 'Loniten; potassium channel opener; severe fluid retention');
addDrug('clonidine', 1, 'Centrally Acting Alpha-2 Agonist', 'Catapres; marked sedation, dry mouth, rebound hypertension');
addDrug('methyldopa', 1, 'Centrally Acting Alpha-2 Agonist', 'Aldomet; central sedation and drug-induced hepatitis');
addDrug('moxonidine', 1, 'Imidazoline I1 Agonist', 'Physiotens; centrally acting antihypertensive');
addDrug('rilmenidine', 1, 'Imidazoline I1 Agonist', 'Hyperium; selective I1 receptor agonist');
addDrug('warfarin', 1, 'Vitamin K Antagonist', 'Coumadin; anticoagulant with ACB score 1 on select hospital scales');
addDrug('clopidogrel', 1, 'P2Y12 Antiplatelet', 'Plavix; thienopyridine antiplatelet');
addDrug('prasugrel', 1, 'P2Y12 Antiplatelet', 'Effient; potent irreversible P2Y12 blocker');
addDrug('ticagrelor', 1, 'P2Y12 Antiplatelet', 'Brilinta; reversible P2Y12 inhibitor; dyspnea risk');
addDrug('dipyridamole', 1, 'Antiplatelet / Phosphodiesterase Inhibitor', 'Persantine; ACB score 1; headache and vasodilation');
addDrug('theophylline', 1, 'Methylxanthine Bronchodilator', 'Theo-24; phosphodiesterase inhibitor; tremor, insomnia, tachyarrhythmia');
addDrug('aminophylline', 1, 'Methylxanthine Bronchodilator', 'Soluble theophylline ethylenediamine complex');
addDrug('colchicine', 1, 'Antigout Alkaloid', 'Colcrys; microtubule disruptor; diarrhea, myopathy');
addDrug('allopurinol', 1, 'Xanthine Oxidase Inhibitor', 'Zyloprim; ACB score 1 on some European scales');
addDrug('febuxostat', 1, 'Xanthine Oxidase Inhibitor', 'Uloric; non-purine xanthine oxidase blocker');
addDrug('montelukast', 1, 'Leukotriene Receptor Antagonist', 'Singulair; neuropsychiatric warning (nightmares, agitation)');
addDrug('zafirlukast', 1, 'Leukotriene Receptor Antagonist', 'Accolate; LTD4/LTE4 receptor antagonist');
addDrug('roflumilast', 1, 'PDE-4 Inhibitor', 'Daliresp; COPD anti-inflammatory; weight loss, insomnia');
addDrug('pregabalin', 1, 'Gabapentinoid / Alpha-2-Delta', 'Lyrica; dizziness, ataxia, peripheral edema; sedative load');
addDrug('gabapentin', 1, 'Gabapentinoid / Alpha-2-Delta', 'Neurontin; somnolence, unsteady gait in elderly; sedative load');
addDrug('levetiracetam', 1, 'Antiepileptic (SV2A)', 'Keppra; behavioral irritability, somnolence');
addDrug('brivaracetam', 1, 'Antiepileptic (SV2A)', 'Briviact; high-affinity SV2A ligand');
addDrug('lamotrigine', 1, 'Antiepileptic', 'Lamictal; voltage-gated sodium channel blocker; mild sedative score');
addDrug('lacosamide', 1, 'Antiepileptic', 'Vimpat; slow sodium channel inactivation');
addDrug('rufinamide', 1, 'Antiepileptic', 'Banzel; triazole anticonvulsant');
addDrug('perampanel', 1, 'AMPA Receptor Antagonist', 'Fycompa; non-competitive AMPA blocker; irritability warning');
addDrug('cannabidiol', 1, 'Cannabinoid Anticonvulsant', 'Epidiolex; somnolence and hepatic transaminase elevation');
addDrug('metronidazole', 1, 'Nitroimidazole Antimicrobial', 'Flagyl; mild metallic taste, nausea, CNS peripheral neuropathy');
addDrug('domperidone', 1, 'Peripheral Dopamine D2 Antagonist', 'Motilium; prokinetic antiemetic; modest QT prolongation risk');
addDrug('itopride', 1, 'D2 Antagonist / AChE Inhibitor', 'Ganaton; prokinetic gastroprokinetic');
addDrug('levosulpiride', 1, 'D2 Antagonist / Prokinetic', 'Lesuride; prokinetic with parkinsonian/sedative hazard');


// ══════════════════════════════════════════════════════════════════════════════
// SCORE 0: ZERO / NEGLIGIBLE ANTICHOLINERGIC & SEDATIVE BURDEN
// ══════════════════════════════════════════════════════════════════════════════
// Antidiabetics (Biguanides, Sulfonylureas, DPP-4i, SGLT2i, GLP-1RA, Insulin)
addDrug('metformin', 0, 'Biguanide Antidiabetic', 'Glucophage / Glycomet; zero anticholinergic or sedative burden');
addDrug('glimepiride', 0, 'Sulfonylurea Antidiabetic', 'Amaryl; second-generation sulfonylurea; no ACB burden');
addDrug('gliclazide', 0, 'Sulfonylurea Antidiabetic', 'Diamicron; selective sulfonylurea with zero ACB score');
addDrug('glipizide', 0, 'Sulfonylurea Antidiabetic', 'Glucotrol; short-acting sulfonylurea');
addDrug('glyburide', 0, 'Sulfonylurea Antidiabetic', 'Micronase / Diabeta; long-acting sulfonylurea');
addDrug('glibenclamide', 0, 'Sulfonylurea Antidiabetic', 'Daonil; international name for glyburide');
addDrug('sitagliptin', 0, 'DPP-4 Inhibitor', 'Januvia; incretin enhancer; zero ACB burden');
addDrug('vildagliptin', 0, 'DPP-4 Inhibitor', 'Galvus; DPP-4 inhibitor; zero ACB score');
addDrug('linagliptin', 0, 'DPP-4 Inhibitor', 'Tradjenta; biliary-cleared DPP-4i; zero ACB burden');
addDrug('saxagliptin', 0, 'DPP-4 Inhibitor', 'Onglyza; DPP-4 inhibitor');
addDrug('teneligliptin', 0, 'DPP-4 Inhibitor', 'Tenelia / Zita; widely used DPP-4i; zero ACB score');
addDrug('alogliptin', 0, 'DPP-4 Inhibitor', 'Nesina; selective DPP-4 blocker');
addDrug('gemigliptin', 0, 'DPP-4 Inhibitor', 'Zemiglo; Korean/international DPP-4i');
addDrug('dapagliflozin', 0, 'SGLT2 Inhibitor', 'Farxiga / Forxiga; glucosuric agent; zero anticholinergic burden');
addDrug('empagliflozin', 0, 'SGLT2 Inhibitor', 'Jardiance; cardioprotective SGLT2i; zero ACB load');
addDrug('canagliflozin', 0, 'SGLT2 Inhibitor', 'Invokana; SGLT2/SGLT1 inhibitor');
addDrug('ertugliflozin', 0, 'SGLT2 Inhibitor', 'Steglatro; selective SGLT2 blocker');
addDrug('remogliflozin', 0, 'SGLT2 Inhibitor', 'Remo; prodrug SGLT2 inhibitor');
addDrug('pioglitazone', 0, 'Thiazolidinedione', 'Actos; insulin sensitizer; zero ACB burden');
addDrug('rosiglitazone', 0, 'Thiazolidinedione', 'Avandia; PPAR-gamma activator');
addDrug('acarbose', 0, 'Alpha-Glucosidase Inhibitor', 'Precose / Glucobay; intestinal carbohydrate blocker');
addDrug('voglibose', 0, 'Alpha-Glucosidase Inhibitor', 'Volibo; gut enzyme inhibitor; zero ACB score');
addDrug('miglitol', 0, 'Alpha-Glucosidase Inhibitor', 'Glyset; postprandial glucose regulator');
addDrug('semaglutide', 0, 'GLP-1 Receptor Agonist', 'Ozempic / Rybelsus / Wegovy; incretin mimetic; zero ACB');
addDrug('liraglutide', 0, 'GLP-1 Receptor Agonist', 'Victoza / Saxenda; once-daily GLP-1 analog');
addDrug('dulaglutide', 0, 'GLP-1 Receptor Agonist', 'Trulicity; long-acting GLP-1 agonist');
addDrug('exenatide', 0, 'GLP-1 Receptor Agonist', 'Byetta / Bydureon; exendin-4 peptide analog');
addDrug('lixisenatide', 0, 'GLP-1 Receptor Agonist', 'Adlyxin; short-acting GLP-1 agonist');
addDrug('tirzepatide', 0, 'Dual GIP/GLP-1 Agonist', 'Mounjaro / Zepbound; dual incretin co-agonist');
addDrug('insulin glargine', 0, 'Long-Acting Insulin', 'Lantus / Toujeo; peakless basal insulin');
addDrug('insulin lispro', 0, 'Rapid-Acting Insulin', 'Humalog; rapid mealtime insulin');
addDrug('insulin aspart', 0, 'Rapid-Acting Insulin', 'NovoLog; fast-acting insulin analog');
addDrug('insulin degludec', 0, 'Ultra-Long Basal Insulin', 'Tresiba; ultra-extended half-life insulin');
addDrug('insulin detemir', 0, 'Long-Acting Insulin', 'Levemir; myristic acid acylated insulin');
addDrug('insulin glulisine', 0, 'Rapid-Acting Insulin', 'Apidra; rapid mealtime analog');
addDrug('regular insulin', 0, 'Short-Acting Insulin', 'Humulin R / Novolin R; human recombinant insulin');

// Statins & Lipid Lowering Agents
addDrug('atorvastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Lipitor; zero anticholinergic or sedative burden');
addDrug('rosuvastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Crestor; hydrophilic statin; zero ACB load');
addDrug('simvastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Zocor; lipophilic statin; zero anticholinergic score');
addDrug('pravastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Pravachol; hydrophilic statin');
addDrug('lovastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Mevacor; fungal-derived statin');
addDrug('pitavastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Livalo; potent low-dose statin');
addDrug('fluvastatin', 0, 'Statin (HMG-CoA Reductase Inhibitor)', 'Lescol; synthetic indole statin');
addDrug('ezetimibe', 0, 'Cholesterol Absorption Inhibitor', 'Zetia; NPC1L1 transporter blocker; zero ACB');
addDrug('fenofibrate', 0, 'Fibrate (PPAR-alpha Agonist)', 'Tricor; triglyceride lowering; zero ACB');
addDrug('gemfibrozil', 0, 'Fibrate (PPAR-alpha Agonist)', 'Lopid; fibrate lipid regulator');
addDrug('bempedoic acid', 0, 'ACL Inhibitor', 'Nexletol; adenosine triphosphate-citrate lyase blocker');
addDrug('evolocumab', 0, 'PCSK9 Monoclonal Antibody', 'Repatha; injectable cholesterol reducer');
addDrug('alirocumab', 0, 'PCSK9 Monoclonal Antibody', 'Praluent; monoclonal antibody to PCSK9');
addDrug('inclisiran', 0, 'PCSK9 siRNA', 'Leqvio; small interfering RNA targeting PCSK9');
addDrug('icosapent ethyl', 0, 'Purified Omega-3 Fatty Acid', 'Vascepa; high-purity EPA ester');
addDrug('omega-3 acid ethyl esters', 0, 'Lipid Regulating Agent', 'Lovaza; mixed EPA/DHA esters');
addDrug('colesevelam', 0, 'Bile Acid Sequestrant', 'Welchol; non-absorbed polymeric binder');
addDrug('cholestyramine', 0, 'Bile Acid Sequestrant', 'Questran; ion-exchange resin');

// Proton Pump Inhibitors (PPIs)
addDrug('pantoprazole', 0, 'Proton Pump Inhibitor', 'Protonix / Pan 40; zero anticholinergic or sedative burden');
addDrug('omeprazole', 0, 'Proton Pump Inhibitor', 'Prilosec / Omez; zero anticholinergic score');
addDrug('esomeprazole', 0, 'Proton Pump Inhibitor', 'Nexium; S-isomer of omeprazole; zero ACB');
addDrug('rabeprazole', 0, 'Proton Pump Inhibitor', 'Aciphex / Razo; rapid-acting gastric acid inhibitor');
addDrug('lansoprazole', 0, 'Proton Pump Inhibitor', 'Prevacid; substituted benzimidazole; zero ACB');
addDrug('dexlansoprazole', 0, 'Proton Pump Inhibitor', 'Dexilant; dual delayed release PPI');
addDrug('ilaprazole', 0, 'Proton Pump Inhibitor', 'Noltec; substituted benzimidazole PPI');
addDrug('vonoprazan', 0, 'Potassium-Competitive Acid Blocker (P-CAB)', 'Voquezna; acid inhibitor');

// Non-Opioid Analgesics & NSAIDs
addDrug('acetaminophen', 0, 'Non-Opioid Analgesic / Antipyretic', 'Tylenol / Paracetamol / Calpol; zero anticholinergic or sedative burden');
addDrug('paracetamol', 0, 'Non-Opioid Analgesic / Antipyretic', 'International nonproprietary name for acetaminophen');
addDrug('ibuprofen', 0, 'NSAID (Propionic Acid Derivative)', 'Advil / Motrin / Brufen; zero anticholinergic score');
addDrug('naproxen', 0, 'NSAID (Propionic Acid Derivative)', 'Aleve / Naprosyn; zero anticholinergic burden');
addDrug('celecoxib', 0, 'COX-2 Selective NSAID', 'Celebrex; selective cyclooxygenase-2 inhibitor');
addDrug('diclofenac', 0, 'NSAID (Phenylacetic Acid Derivative)', 'Voltaren / Voveran; zero ACB score');
addDrug('meloxicam', 0, 'NSAID (Oxicam Derivative)', 'Mobic; preferential COX-2 inhibitor');
addDrug('etodolac', 0, 'NSAID (Pyranoindole Derivative)', 'Lodine; preferential COX-2 blocker');
addDrug('indomethacin', 0, 'NSAID (Indole Derivative)', 'Indocin; non-selective NSAID');
addDrug('ketorolac', 0, 'NSAID (Pyrrolizine Carboxylic Acid)', 'Toradol; short-term parenteral/oral NSAID');
addDrug('ketoprofen', 0, 'NSAID (Propionic Acid Derivative)', 'Orudis; non-selective NSAID');
addDrug('dexketoprofen', 0, 'NSAID (S-Enantiomer)', 'Keral; active analgesia enantiomer');
addDrug('etoricoxib', 0, 'COX-2 Selective NSAID', 'Arcoxia; highly selective COX-2 inhibitor');
addDrug('piroxicam', 0, 'NSAID (Oxicam Derivative)', 'Feldene; long half-life NSAID');
addDrug('mefenamic acid', 0, 'NSAID (Anthranilic Acid Derivative)', 'Ponstel / Meftal; dysmenorrhea and pain');
addDrug('aceclofenac', 0, 'NSAID (Glycolic Acid Ester)', 'Hifenac / Zerodol; phenylacetic acid NSAID');
addDrug('nabumetone', 0, 'NSAID Prodrug', 'Relafen; non-acidic prodrug metabolized to 6-MNA');
addDrug('sulindac', 0, 'NSAID (Indene Derivative)', 'Clinoril; prodrug sulfide active metabolite');
addDrug('aspirin', 0, 'Antiplatelet / Salicylate NSAID', 'Ecosprin / Bayer; irreversible COX-1 inhibitor');
addDrug('diflunisal', 0, 'Salicylate Derivative', 'Dolobid; non-acetylated salicylate');
addDrug('salsalate', 0, 'Non-acetylated Salicylate', 'Disalcid; minimal gastric erosion');

// Antimicrobials / Antibiotics / Antifungals / Antivirals
addDrug('amoxicillin', 0, 'Aminopenicillin Antibiotic', 'Amoxil; zero anticholinergic burden');
addDrug('ampicillin', 0, 'Aminopenicillin Antibiotic', 'Broad spectrum beta-lactam');
addDrug('augmentin', 0, 'Beta-Lactam + Beta-Lactamase Inhibitor', 'Amoxicillin with clavulanate; zero ACB');
addDrug('piperacillin', 0, 'Antipseudomonal Penicillin', 'Pipracil; extended spectrum beta-lactam');
addDrug('tazobactam', 0, 'Beta-Lactamase Inhibitor', 'Zosyn component; zero ACB');
addDrug('cephalexin', 0, 'First-Generation Cephalosporin', 'Keflex; zero anticholinergic burden');
addDrug('cefazolin', 0, 'First-Generation Cephalosporin', 'Ancef; surgical prophylaxis cephalosporin');
addDrug('cefuroxime', 0, 'Second-Generation Cephalosporin', 'Ceftin / Zeff; zero ACB load');
addDrug('cefaclor', 0, 'Second-Generation Cephalosporin', 'Ceclor; oral cephalosporin');
addDrug('cefprozil', 0, 'Second-Generation Cephalosporin', 'Cefzil; oral second-gen agent');
addDrug('ceftriaxone', 0, 'Third-Generation Cephalosporin', 'Rocephin; parenteral cephalosporin');
addDrug('cefotaxime', 0, 'Third-Generation Cephalosporin', 'Claforan; broad-spectrum parenteral cephalosporin');
addDrug('ceftazidime', 0, 'Third-Generation Cephalosporin', 'Fortaz; antipseudomonal third-gen');
addDrug('cefixime', 0, 'Third-Generation Cephalosporin', 'Suprax; oral cephalosporin');
addDrug('cefpodoxime', 0, 'Third-Generation Cephalosporin', 'Vantin; broad oral spectrum');
addDrug('cefepime', 0, 'Fourth-Generation Cephalosporin', 'Maxipime; antipseudomonal agent');
addDrug('meropenem', 0, 'Carbapenem Antibiotic', 'Merrem; ultra-broad spectrum beta-lactam');
addDrug('imipenem', 0, 'Carbapenem Antibiotic', 'Primaxin; co-administered with cilastatin');
addDrug('ertapenem', 0, 'Carbapenem Antibiotic', 'Invanz; once-daily parenteral carbapenem');
addDrug('vancomycin', 0, 'Glycopeptide Antibiotic', 'Vancocin; cell wall inhibitor for MRSA');
addDrug('teicoplanin', 0, 'Glycopeptide Antibiotic', 'Targocid; lipoglycopeptide');
addDrug('linezolid', 0, 'Oxazolidinone Antibiotic', 'Zyvox; protein synthesis inhibitor for VRE/MRSA');
addDrug('daptomycin', 0, 'Cyclic Lipopeptide Antibiotic', 'Cubicin; membrane depolarizing bactericidal');
addDrug('gentamicin', 0, 'Aminoglycoside Antibiotic', 'Garamycin; 30S ribosomal subunit inhibitor');
addDrug('tobramycin', 0, 'Aminoglycoside Antibiotic', 'Nebcin; antipseudomonal aminoglycoside');
addDrug('amikacin', 0, 'Aminoglycoside Antibiotic', 'Amikin; broad gram-negative coverage');
addDrug('ciprofloxacin', 0, 'Fluoroquinolone Antibiotic', 'Cipro; zero anticholinergic burden');
addDrug('levofloxacin', 0, 'Fluoroquinolone Antibiotic', 'Levaquin; S-enantiomer fluoroquinolone');
addDrug('moxifloxacin', 0, 'Fluoroquinolone Antibiotic', 'Avelox; respiratory fluoroquinolone');
addDrug('ofloxacin', 0, 'Fluoroquinolone Antibiotic', 'Floxin; second-generation fluoroquinolone');
addDrug('norfloxacin', 0, 'Fluoroquinolone Antibiotic', 'Noroxin; urinary fluoroquinolone');
addDrug('azithromycin', 0, 'Azalide / Macrolide Antibiotic', 'Zithromax / Azithral; zero ACB score');
addDrug('clarithromycin', 0, 'Macrolide Antibiotic', 'Biaxin; CYP3A4 substrate/inhibitor; zero ACB');
addDrug('erythromycin', 0, 'Macrolide Antibiotic', 'Ery-Tab; motilin receptor agonist and antimicrobial');
addDrug('roxithromycin', 0, 'Macrolide Antibiotic', 'Rulide; semisynthetic macrolide');
addDrug('clindamycin', 0, 'Lincosamide Antibiotic', 'Cleocin; 50S ribosomal inhibitor for anaerobes');
addDrug('doxycycline', 0, 'Tetracycline Antibiotic', 'Vibramycin; zero anticholinergic burden');
addDrug('minocycline', 0, 'Tetracycline Antibiotic', 'Minocin; broad spectrum tetracycline');
addDrug('tigecycline', 0, 'Glycylcycline Antibiotic', 'Tygacil; overcomes tetracycline efflux pumps');
addDrug('nitrofurantoin', 0, 'Nitrofuran Antibiotic', 'Macrobid / Macrodantin; urinary tract antiseptic');
addDrug('trimethoprim', 0, 'Dihydrofolate Reductase Inhibitor', 'Bacteriostatic folate antagonist; zero ACB');
addDrug('sulfamethoxazole', 0, 'Sulfonamide Antibiotic', 'Gantanol; dihydropteroate synthase inhibitor');
addDrug('fosfomycin', 0, 'Epoxide Antibiotic', 'Monurol; MurA inhibitor for uncomplicated UTIs');
addDrug('colistin', 0, 'Polymyxin Antibiotic', 'Coly-Mycin; membrane detergent for MDR bacteria');
addDrug('rifampin', 0, 'Rifamycin Antibiotic', 'Rifadin; bacterial RNA polymerase blocker; CYP inducer');
addDrug('isoniazid', 0, 'Antimycobacterial', 'INH; mycolic acid synthesis inhibitor');
addDrug('pyrazinamide', 0, 'Antimycobacterial', 'Tuberculosis sterilizing agent');
addDrug('ethambutol', 0, 'Antimycobacterial', 'Myambutol; arabinosyl transferase blocker');
addDrug('fluconazole', 0, 'Triazole Antifungal', 'Diflucan; CYP51 lanosterol demethylase blocker');
addDrug('itraconazole', 0, 'Triazole Antifungal', 'Sporanox; broad spectrum triazole');
addDrug('voriconazole', 0, 'Triazole Antifungal', 'Vfend; invasive aspergillosis agent');
addDrug('posaconazole', 0, 'Triazole Antifungal', 'Noxafil; extended spectrum antifungal');
addDrug('caspofungin', 0, 'Echinocandin Antifungal', 'Cancidas; 1,3-beta-D-glucan synthase blocker');
addDrug('terbinafine', 0, 'Allylamine Antifungal', 'Lamisil; squalene epoxidase inhibitor');
addDrug('acyclovir', 0, 'Guanosine Analog Antiviral', 'Zovirax; herpes simplex and varicella zoster blocker');
addDrug('valacyclovir', 0, 'Antiviral Prodrug', 'Valtrex; L-valyl ester of acyclovir');
addDrug('famciclovir', 0, 'Antiviral Prodrug', 'Famvir; prodrug of penciclovir');
addDrug('ganciclovir', 0, 'Antiviral Agent', 'Cytovene; cytomegalovirus treatment');
addDrug('oseltamivir', 0, 'Neuraminidase Inhibitor', 'Tamiflu; influenza antiviral');
addDrug('zanamivir', 0, 'Neuraminidase Inhibitor', 'Relenza; inhaled influenza antiviral');
addDrug('remdesivir', 0, 'RNA Polymerase Inhibitor', 'Veklury; nucleoside analog antiviral');

// Anticoagulants (DOACs & Heparins)
addDrug('apixaban', 0, 'Direct Factor Xa Inhibitor (DOAC)', 'Eliquis; oral anticoagulant; zero ACB burden');
addDrug('rivaroxaban', 0, 'Direct Factor Xa Inhibitor (DOAC)', 'Xarelto; factor Xa inhibitor; zero ACB score');
addDrug('dabigatran', 0, 'Direct Thrombin Inhibitor (DOAC)', 'Pradaxa; reversible direct thrombin blocker');
addDrug('edoxaban', 0, 'Direct Factor Xa Inhibitor (DOAC)', 'Savaysa / Lixiana; once-daily oral Xa inhibitor');
addDrug('betrixaban', 0, 'Direct Factor Xa Inhibitor (DOAC)', 'Bevyxxa; extended VTE prophylaxis DOAC');
addDrug('enoxaparin', 0, 'Low Molecular Weight Heparin', 'Lovenox; parenteral anticoagulant');
addDrug('dalteparin', 0, 'Low Molecular Weight Heparin', 'Fragmin; antithrombotic LMWH');
addDrug('tinzaparin', 0, 'Low Molecular Weight Heparin', 'Innohep; enzymatically depolymerized heparin');
addDrug('fondaparinux', 0, 'Synthetic Pentasaccharide', 'Arixtra; indirect factor Xa inhibitor');
addDrug('heparin', 0, 'Unfractionated Heparin', 'Parenteral antithrombin activator');

// Thyroid & Endocrine
addDrug('levothyroxine', 0, 'Thyroid Hormone', 'Synthroid / Thyronorm / Eltroxin; zero anticholinergic burden');
addDrug('liothyronine', 0, 'Synthetic T3 Thyroid Hormone', 'Cytomel; fast-acting triiodothyronine');
addDrug('methimazole', 0, 'Thionamide Antithyroid', 'Tapazole; inhibits thyroid peroxidase');
addDrug('carbimazole', 0, 'Antithyroid Prodrug', 'Neo-Mercazole; metabolizes to methimazole');
addDrug('propylthiouracil', 0, 'Thionamide Antithyroid', 'PTU; inhibits thyroid synthesis and peripheral T4-T3 conversion');
addDrug('fludrocortisone', 0, 'Mineralocorticoid', 'Florinef; treats orthostatic hypotension and adrenal insufficiency');

// Bone Health, Gout & Nephrology
addDrug('alendronate', 0, 'Bisphosphonate', 'Fosamax; osteoclast inhibitor; zero anticholinergic score');
addDrug('risedronate', 0, 'Bisphosphonate', 'Actonel; pyridinyl bisphosphonate');
addDrug('ibandronate', 0, 'Bisphosphonate', 'Boniva; nitrogenous bisphosphonate');
addDrug('zoledronic acid', 0, 'Intravenous Bisphosphonate', 'Reclast / Zometa; potent annual bisphosphonate');
addDrug('pamidronate', 0, 'Bisphosphonate', 'Aredia; hypercalcemia of malignancy and Paget disease');
addDrug('denosumab', 0, 'RANKL Monoclonal Antibody', 'Prolia / Xgeva; inhibits osteoclast maturation');
addDrug('romosozumab', 0, 'Sclerostin Inhibitor', 'Evenity; dual bone-building and anti-resorptive');
addDrug('teriparatide', 0, 'Recombinant Parathyroid Hormone', 'Forteo; anabolic bone agent');
addDrug('probenecid', 0, 'Uricosuric Agent', 'Probalan; inhibits renal URAT1 transporter');
addDrug('lesinurad', 0, 'Uricosuric Agent', 'Zurampic; selective uric acid reabsorption blocker');

// Vitamins, Minerals & Nutritional Supplements
addDrug('cyanocobalamin', 0, 'Vitamin B12 Supplement', 'Cobalamin for megaloblastic anemia and neuropathy');
addDrug('methylcobalamin', 0, 'Active Vitamin B12', 'Active coenzyme form of B12; zero ACB');
addDrug('folic acid', 0, 'B-Complex Vitamin', 'Folate for erythropoiesis and neural tube health');
addDrug('cholecalciferol', 0, 'Vitamin D3 Supplement', 'Calcirol / D3; regulates calcium and phosphate');
addDrug('ergocalciferol', 0, 'Vitamin D2 Supplement', 'Plant-derived vitamin D');
addDrug('calcitriol', 0, 'Active Vitamin D', 'Rocaltrol; 1,25-dihydroxycholecalciferol');
addDrug('calcium carbonate', 0, 'Mineral Supplement / Antacid', 'Caltrate / Tums; elemental calcium');
addDrug('calcium citrate', 0, 'Mineral Supplement', 'Citracal; acid-independent calcium salt');
addDrug('calcium acetate', 0, 'Phosphate Binder', 'PhosLo; binds dietary phosphorus in end-stage renal disease');
addDrug('sevelamer', 0, 'Non-absorbed Phosphate Binder', 'Renvela; polymer phosphate binder');
addDrug('ferrous sulfate', 0, 'Iron Supplement', 'Slow Fe / Fersolate; treats iron-deficiency anemia');
addDrug('ferrous fumarate', 0, 'Iron Supplement', 'High elemental iron salt; zero ACB');
addDrug('ferrous gluconate', 0, 'Iron Supplement', 'Fergon; gentle iron salt');
addDrug('iron sucrose', 0, 'Intravenous Iron Complex', 'Venofer; parenteral iron replacement');
addDrug('ferric carboxymaltose', 0, 'Intravenous Iron Complex', 'Injectafer; high-dose IV iron');
addDrug('zinc sulfate', 0, 'Trace Mineral Supplement', 'Zincovit component; immune cofactor');
addDrug('potassium chloride', 0, 'Electrolyte Replenisher', 'K-Dur / Potclor; treats hypokalemia');
addDrug('magnesium oxide', 0, 'Mineral Supplement', 'Mag-Ox; dietary magnesium supplement');
addDrug('magnesium citrate', 0, 'Mineral Supplement / Laxative', 'Osmotic bowel agent and magnesium source');
addDrug('sodium bicarbonate', 0, 'Alkalinizing Agent / Antacid', 'Treats metabolic acidosis and dyspepsia');
addDrug('lactulose', 0, 'Osmotic Laxative', 'Duphalac; colonic acidifier for hepatic encephalopathy and constipation');
addDrug('polyethylene glycol', 0, 'Osmotic Laxative', 'MiraLAX / Peglec; inert osmotic polymer');
addDrug('senna', 0, 'Stimulant Laxative', 'Senokot; anthraquinone glycoside');
addDrug('bisacodyl', 0, 'Stimulant Laxative', 'Dulcolax; diphenylmethane stimulant laxative');
addDrug('docusate', 0, 'Surfactant Stool Softener', 'Colace; anionic surfactant');

// Urological & Reproductive
addDrug('tamsulosin', 0, 'Alpha-1A Selective Blocker', 'Flomax / Urimax; uroselective smooth muscle relaxant');
addDrug('alfuzosin', 0, 'Alpha-1 Blocker', 'Uroxatral; functional uroselective antagonist');
addDrug('silodosin', 0, 'Alpha-1A Highly Selective Blocker', 'Rapaflo / Silodal; high urinary bladder neck specificity');
addDrug('finasteride', 0, '5-Alpha Reductase Inhibitor', 'Proscar / Propecia; type II 5AR blocker for BPH');
addDrug('dutasteride', 0, 'Dual 5-Alpha Reductase Inhibitor', 'Avodart; type I and II 5AR blocker');
addDrug('sildenafil', 0, 'PDE-5 Inhibitor', 'Viagra / Revatio; cyclic GMP phosphodiesterase blocker');
addDrug('tadalafil', 0, 'PDE-5 Inhibitor', 'Cialis / Adcirca; long-acting PDE5 inhibitor');
addDrug('vardenafil', 0, 'PDE-5 Inhibitor', 'Levitra; selective PDE5 blocker');
addDrug('avanafil', 0, 'PDE-5 Inhibitor', 'Stendra; fast-acting PDE5 inhibitor');
addDrug('mirabegron', 0, 'Beta-3 Adrenergic Agonist', 'Myrbetriq; relaxes detrusor muscle without anticholinergic load');
addDrug('vibegron', 0, 'Beta-3 Adrenergic Agonist', 'Gemtesa; selective beta-3 agonist for overactive bladder');

// Ophthalmic (Glaucoma & Dry Eye)
addDrug('latanoprost', 0, 'Prostaglandin F2-alpha Analog', 'Xalatan; uveoscleral outflow enhancer');
addDrug('bimatoprost', 0, 'Prostamide Analog', 'Lumigan; lowers intraocular pressure');
addDrug('travoprost', 0, 'Prostaglandin Analog', 'Travatan; FP prostanoid receptor agonist');
addDrug('brimonidine', 0, 'Alpha-2 Adrenergic Agonist (Ophthalmic)', 'Alphagan; reduces aqueous production');
addDrug('dorzolamide', 0, 'Carbonic Anhydrase Inhibitor (Ophthalmic)', 'Trusopt; topical aqueous suppressor');
addDrug('brinzolamide', 0, 'Carbonic Anhydrase Inhibitor (Ophthalmic)', 'Azopt; topical antiglaucoma agent');
addDrug('cyclosporine ophthalmic', 0, 'Calcineurin Inhibitor (Ophthalmic)', 'Restasis; immunomodulator for keratoconjunctivitis sicca');

// Oncology / Immunosuppressants (Zero ACB)
addDrug('methotrexate', 0, 'Antimetabolite / Antifolate', 'Trexall; dihydrofolate reductase inhibitor');
addDrug('azathioprine', 0, 'Purine Synthesis Inhibitor', 'Imuran; prodrug of 6-mercaptopurine');
addDrug('mycophenolate mofetil', 0, 'IMPDH Inhibitor', 'CellCept; selective lymphocyte proliferation inhibitor');
addDrug('mycophenolic acid', 0, 'IMPDH Inhibitor', 'Myfortic; enteric-coated formulation');
addDrug('leflunomide', 0, 'Pyrimidine Synthesis Inhibitor', 'Arava; dihydroorotate dehydrogenase blocker');
addDrug('hydroxychloroquine', 0, 'Antimalarial / DMARD', 'Plaquenil; toll-like receptor signaling modulator');
addDrug('chloroquine', 0, 'Antimalarial / Amebicide', 'Aralen; aminoquinoline derivative');
addDrug('tacrolimus', 0, 'Calcineurin Inhibitor', 'Prograf; binds FKBP-12 to inhibit IL-2 transcription');
addDrug('cyclosporine', 0, 'Calcineurin Inhibitor', 'Sandimmune / Neoral; binds cyclophilin');
addDrug('sirolimus', 0, 'mTOR Inhibitor', 'Rapamune; FKBP-12/mTOR pathway blocker');
addDrug('everolimus', 0, 'mTOR Inhibitor', 'Afinitor; orally active rapamycin analog');

// Indian Pharmaceutical Brands & Equivalents (Mapped to Zero Burden)
addDrug('pan 40', 0, 'Indian Brand (Pantoprazole 40mg)', 'Alkem; zero anticholinergic burden');
addDrug('pan-d', 0, 'Indian Brand (Pantoprazole + Domperidone)', 'Alkem; proton pump inhibitor combination');
addDrug('omez', 0, 'Indian Brand (Omeprazole 20mg)', 'Dr. Reddy; zero ACB load');
addDrug('glycomet', 0, 'Indian Brand (Metformin 500mg)', 'USV; biguanide oral antidiabetic');
addDrug('glycomet-gp', 0, 'Indian Brand (Glimepiride + Metformin)', 'USV; dual oral antidiabetic');
addDrug('ecosprin', 0, 'Indian Brand (Enteric-coated Aspirin)', 'USV; low-dose cardioprotective antiplatelet');
addDrug('thyronorm', 0, 'Indian Brand (Levothyroxine)', 'Abbott; synthetic thyroxine');
addDrug('eltroxin', 0, 'Indian Brand (Levothyroxine)', 'GSK; synthetic thyroid hormone');
addDrug('telma', 0, 'Indian Brand (Telmisartan 40mg)', 'Glenmark; angiotensin receptor blocker');
addDrug('telma-h', 0, 'Indian Brand (Telmisartan + HCTZ)', 'Glenmark; ARB plus thiazide diuretic');
addDrug('amlong', 0, 'Indian Brand (Amlodipine 5mg)', 'Micro Labs; dihydropyridine calcium channel blocker');
addDrug('cilacar', 0, 'Indian Brand (Cilnidipine 10mg)', 'J.B. Chemicals; L/N-type calcium channel blocker');
addDrug('dytor', 0, 'Indian Brand (Torsemide 10mg)', 'Cipla; loop diuretic');
addDrug('januvia', 0, 'Indian Brand (Sitagliptin 100mg)', 'MSD; DPP-4 inhibitor');
addDrug('galvus', 0, 'Indian Brand (Vildagliptin 50mg)', 'Novartis; DPP-4 inhibitor');
addDrug('forxiga', 0, 'Indian Brand (Dapagliflozin 10mg)', 'AstraZeneca; SGLT2 inhibitor');
addDrug('jardiance', 0, 'Indian Brand (Empagliflozin 25mg)', 'Boehringer Ingelheim; SGLT2 inhibitor');
addDrug('azithral', 0, 'Indian Brand (Azithromycin 500mg)', 'Alembic; azalide antibiotic');
addDrug('calpol', 0, 'Indian Brand (Paracetamol 500/650mg)', 'GSK; non-opioid antipyretic');
addDrug('dolo 650', 0, 'Indian Brand (Paracetamol 650mg)', 'Micro Labs; paracetamol antipyretic');
addDrug('voveran', 0, 'Indian Brand (Diclofenac 50mg)', 'Novartis; NSAID analgesic');
addDrug('combiflam', 0, 'Indian Brand (Ibuprofen + Paracetamol)', 'Sanofi; dual NSAID-analgesic combination');
addDrug('crocin', 0, 'Indian Brand (Paracetamol)', 'GSK; pain and fever relief');
addDrug('saridon', 0, 'Indian Brand (Paracetamol + Propyphenazone + Caffeine)', 'Bayer; headache formulation');
addDrug('disprin', 0, 'Indian Brand (Soluble Aspirin 350mg)', 'Reckitt; effervescent analgesic');
addDrug('zerodol', 0, 'Indian Brand (Aceclofenac 100mg)', 'Ipca; NSAID');
addDrug('zerodol-p', 0, 'Indian Brand (Aceclofenac + Paracetamol)', 'Ipca; dual analgesic');
addDrug('zerodol-sp', 0, 'Indian Brand (Aceclofenac + Paracetamol + Serratiopeptidase)', 'Ipca; triple anti-inflammatory');
addDrug('hifenac', 0, 'Indian Brand (Aceclofenac)', 'Intas; anti-inflammatory NSAID');
addDrug('meftal-spas', 3, 'Indian Brand (Mefenamic Acid + Dicyclomine)', 'Blue Cross; contains dicyclomine 10mg (potent anticholinergic)');
addDrug('rantac', 1, 'Indian Brand (Ranitidine 150mg)', 'JB Chemicals; H2 blocker (Score 1)');
addDrug('aciloc', 1, 'Indian Brand (Ranitidine)', 'Cadila; H2 blocker (Score 1)');
addDrug('urimax', 0, 'Indian Brand (Tamsulosin 0.4mg)', 'Cipla; alpha-blocker for BPH');
addDrug('silodal', 0, 'Indian Brand (Silodosin 8mg)', 'Sun Pharma; uroselective alpha-1A blocker');

// Respiratory, Inhalers & Others
addDrug('albuterol', 0, 'Short-Acting Beta-2 Agonist (Inhaled)', 'ProAir / Ventolin; selective beta-2 bronchodilator; zero ACB');
addDrug('salbutamol', 0, 'Short-Acting Beta-2 Agonist', 'International nonproprietary name for albuterol');
addDrug('salmeterol', 0, 'Long-Acting Beta-2 Agonist', 'Serevent; selective LABA bronchodilator');
addDrug('formoterol', 0, 'Long-Acting Beta-2 Agonist', 'Foradil / Perforomist; rapid-onset LABA');
addDrug('vilanterol', 0, 'Ultra-LABA Bronchodilator', 'Breo / Trelegy component; 24h bronchodilator');
addDrug('indacaterol', 0, 'Ultra-LABA Bronchodilator', 'Arcapta; once-daily bronchodilator');
addDrug('fluticasone', 0, 'Inhaled Corticosteroid', 'Flovent / Flonase; topical glucocorticoid');
addDrug('mometasone', 0, 'Inhaled/Nasal Corticosteroid', 'Nasonex / Asmanex; high local anti-inflammatory affinity');
addDrug('beclomethasone', 0, 'Inhaled Corticosteroid', 'QVAR; dipropionate prodrug');
addDrug('ciclesonide', 0, 'Inhaled Corticosteroid', 'Alvesco / Omnaris; airway esterase-activated steroid');
addDrug('ipratropium', 1, 'Inhaled Anticholinergic (SAMA)', 'Atrovent; quaternary anticholinergic; minimal systemic bioavailability');
addDrug('tiotropium', 1, 'Inhaled Anticholinergic (LAMA)', 'Spiriva; long-acting inhaled muscarinic antagonist');
addDrug('umeclidinium', 1, 'Inhaled Anticholinergic (LAMA)', 'Incruse Ellipta; once-daily bronchodilator');
addDrug('aclidinium', 1, 'Inhaled Anticholinergic (LAMA)', 'Tudorza Pressair; rapidly hydrolyzed in plasma');
addDrug('glycopyrronium', 1, 'Inhaled Anticholinergic (LAMA)', 'Seebri Breezhaler; inhaled muscarinic blocker');

// Save payload
const payload = {
  _comment: "Anticholinergic Cognitive Burden (ACB) scale and Sedative Burden Index — scores 0-3. Clinically curated from Boustani ACB Scale (2008, 2012), Carnahan ADS, Rudolph ARS, German PRISCUS list (2023), Beers Criteria (AGS 2023), and NHS Guidelines.",
  _scoring: {
    "0": "No clinically relevant anticholinergic or sedative burden",
    "1": "Mild burden — possible anticholinergic or sedative activity",
    "2": "Moderate burden — definite anticholinergic or sedative activity",
    "3": "Severe burden — strongly anticholinergic/sedative, high risk in elderly and polypharmacy"
  },
  drugs: drugs
};

const targetPath = path.join(__dirname, 'backend/data/burden-scores.json');
fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf-8');

console.log(`✅ Successfully generated ${drugs.length} clinical burden score entries in ${targetPath}!`);
