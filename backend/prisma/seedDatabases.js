/**
 * backend/prisma/seedDatabases.js
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║      PolySafe — Multi-Database Scientific Seeder                        ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Source 1: ChCh-Miner (DrugBank DDI pairs)  → DrugInteractionReference ║
 * ║  Source 2: OFFSIDES  (single-drug AEs)       → DrugSideEffect          ║
 * ║  Source 3: TWOSIDES  (drug-pair AEs)         → DrugInteractionReference ║
 * ║                                                                          ║
 * ║  Run: node prisma/seedDatabases.js [--source=chch|offsides|twosides]   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const zlib     = require('zlib');
const readline = require('readline');
const axios    = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ─── Config ──────────────────────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, '../../');
const CHCH_FILE = path.join(DATA_DIR, 'ChCh-Miner_durgbank-chem-chem.tsv.gz');
const OFFSIDES  = path.join(DATA_DIR, 'OFFSIDES.csv.gz');
const TWOSIDES  = path.join(DATA_DIR, 'TWOSIDES.csv.gz');
const BATCH     = 500;

// DrugBank ID -> name disk cache
const ID_CACHE_FILE = path.join(__dirname, '../data/drugbank-id-cache.json');
let idCache = {};

function loadIdCache() {
  try {
    if (fs.existsSync(ID_CACHE_FILE)) {
      idCache = JSON.parse(fs.readFileSync(ID_CACHE_FILE, 'utf8'));
      console.log(`  [cache] ${Object.keys(idCache).length} DrugBank IDs pre-loaded`);
    }
  } catch { idCache = {}; }
}

function saveIdCache() {
  try {
    const dir = path.dirname(ID_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ID_CACHE_FILE, JSON.stringify(idCache, null, 2));
  } catch (e) { console.warn('  [cache] Save failed:', e.message); }
}

// ─── Resolve DrugBank ID → Name via RxNorm NLM (free, no key) ────────────────
async function resolveDbId(dbId) {
  if (idCache[dbId] !== undefined) return idCache[dbId];
  try {
    const { data } = await axios.get(
      `https://rxnav.nlm.nih.gov/REST/rxcui.json?idtype=DrugBank&id=${dbId}`,
      { timeout: 5000 }
    );
    const rxcui = data?.idGroup?.rxnormId?.[0];
    if (rxcui) {
      const { data: nd } = await axios.get(
        `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`,
        { timeout: 4000 }
      );
      const name = nd?.propConceptGroup?.propConcept?.[0]?.propValue || null;
      if (name) { idCache[dbId] = name; return name; }
    }
  } catch { /* network issue */ }
  idCache[dbId] = null;
  return null;
}

// ─── gzip line reader ─────────────────────────────────────────────────────────
function gzipLines(filePath) {
  const gz = fs.createReadStream(filePath).pipe(zlib.createGunzip());
  return readline.createInterface({ input: gz, crlfDelay: Infinity });
}

// ─── PRR score → DDI severity ─────────────────────────────────────────────────
function prrSeverity(prr, freq) {
  if (prr >= 10 || freq >= 0.10) return 'Major';
  if (prr >= 5  || freq >= 0.05) return 'Moderate';
  return 'Minor';
}

// ─── CSV line parser (handles quoted commas) ──────────────────────────────────
function parseCSV(line) {
  const r = []; let inQ = false, cur = '';
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { r.push(cur); cur = ''; }
    else cur += ch;
  }
  r.push(cur);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE 1: ChCh-Miner — DrugBank ID pairs → DrugInteractionReference
// ─────────────────────────────────────────────────────────────────────────────
async function seedChch() {
  console.log('\n[1/3] ChCh-Miner DrugBank DDI pairs');
  if (!fs.existsSync(CHCH_FILE)) { console.log('  File missing, skipping.'); return; }
  loadIdCache();

  // Collect all pairs + unique IDs
  const pairs = [];
  const ids   = new Set();
  for await (const line of gzipLines(CHCH_FILE)) {
    const [a, b] = line.trim().split('\t');
    if (a?.startsWith('DB') && b?.startsWith('DB')) {
      pairs.push([a, b]); ids.add(a); ids.add(b);
    }
  }
  console.log(`  ${pairs.length} pairs, ${ids.size} unique DrugBank IDs`);

  // Resolve IDs not yet cached
  const toResolve = [...ids].filter(id => idCache[id] === undefined);
  console.log(`  Resolving ${toResolve.length} IDs via NLM RxNorm API...`);
  let done = 0;
  for (let i = 0; i < toResolve.length; i += 10) {
    await Promise.all(toResolve.slice(i, i + 10).map(resolveDbId));
    done += 10;
    if (done % 100 === 0) { saveIdCache(); process.stdout.write(`  ${Math.min(done, toResolve.length)}/${toResolve.length} IDs resolved\r`); }
    await new Promise(r => setTimeout(r, 100)); // rate limit
  }
  saveIdCache();
  console.log('\n  ID resolution done.');

  // Insert
  let inserted = 0, skipped = 0, batch = [];
  for (const [a, b] of pairs) {
    const na = idCache[a], nb = idCache[b];
    if (!na || !nb) { skipped++; continue; }
    batch.push({ drugAName: na, drugBName: nb, severity: 'Moderate', ddinterId: `CHCH_${a}_${b}` });
    if (batch.length >= BATCH) {
      await prisma.drugInteractionReference.createMany({ data: batch.splice(0), skipDuplicates: true });
      inserted += BATCH;
      process.stdout.write(`  ${inserted} rows inserted\r`);
    }
  }
  if (batch.length) { await prisma.drugInteractionReference.createMany({ data: batch, skipDuplicates: true }); inserted += batch.length; }
  console.log(`\n  Done: ${inserted} inserted, ${skipped} skipped (unresolved IDs)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE 2: OFFSIDES — single-drug adverse effects → DrugSideEffect
// Columns: drug_rxnorn_id, drug_concept_name, condition_meddra_id,
//          condition_concept_name, A, B, C, D, PRR, PRR_error, mean_reporting_freq
// ─────────────────────────────────────────────────────────────────────────────
async function seedOffsides() {
  console.log('\n[2/3] OFFSIDES single-drug side effects');
  if (!fs.existsSync(OFFSIDES)) { console.log('  File missing, skipping.'); return; }

  // Verify table exists
  let tableOK = true;
  try { await prisma.drugSideEffect.count(); }
  catch { tableOK = false; }

  if (!tableOK) {
    console.log('  DrugSideEffect table not found in schema.');
    console.log('  Add the model below to prisma/schema.prisma and run:');
    console.log('    npx prisma migrate dev --name add-drug-side-effects');
    console.log('');
    console.log('  model DrugSideEffect {');
    console.log('    id            Int    @id @default(autoincrement())');
    console.log('    rxcui         String?');
    console.log('    drugName      String');
    console.log('    sideEffect    String');
    console.log('    prr           Float');
    console.log('    reportingFreq Float');
    console.log('    severity      String');
    console.log('    source        String  @default("OFFSIDES")');
    console.log('    @@index([drugName])');
    console.log('    @@index([rxcui])');
    console.log('  }');
    return;
  }

  let header = true, batch = [], inserted = 0, lineNum = 0;
  for await (const line of gzipLines(OFFSIDES)) {
    if (header) { header = false; continue; }
    lineNum++;
    if (lineNum % 50000 === 0) process.stdout.write(`  Line ${lineNum}...\r`);

    const c = parseCSV(line);
    if (c.length < 11) continue;
    const drug = c[1]?.replace(/^"|"$/g, '').trim();
    const se   = c[3]?.replace(/^"|"$/g, '').trim();
    const prr  = parseFloat(c[8])  || 0;
    const freq = parseFloat(c[10]) || 0;
    if (!drug || !se || prr < 2) continue;

    batch.push({ rxcui: c[0]?.trim() || null, drugName: drug, sideEffect: se,
      prr, reportingFreq: freq, severity: prrSeverity(prr, freq), source: 'OFFSIDES' });

    if (batch.length >= BATCH) {
      await prisma.drugSideEffect.createMany({ data: batch.splice(0), skipDuplicates: true });
      inserted += BATCH;
    }
  }
  if (batch.length) { await prisma.drugSideEffect.createMany({ data: batch, skipDuplicates: true }); inserted += batch.length; }
  console.log(`\n  Done: ${inserted} side effects inserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE 3: TWOSIDES — drug-pair adverse effects → DrugInteractionReference
// Groups by (drug1, drug2), picks highest-PRR signal as severity
// ─────────────────────────────────────────────────────────────────────────────
async function seedTwosides() {
  console.log('\n[3/3] TWOSIDES drug-pair adverse effects');
  if (!fs.existsSync(TWOSIDES)) { console.log('  File missing, skipping.'); return; }

  console.log('  Streaming + aggregating 700MB file (may take 3-5 minutes)...');
  const pairMap = new Map();
  let header = true, lineNum = 0;

  for await (const line of gzipLines(TWOSIDES)) {
    if (header) { header = false; continue; }
    lineNum++;
    if (lineNum % 200000 === 0) process.stdout.write(`  Line ${lineNum} | ${pairMap.size} unique pairs\r`);

    const c = parseCSV(line);
    if (c.length < 13) continue;
    const d1  = c[1]?.replace(/^"|"$/g, '').trim();
    const d2  = c[3]?.replace(/^"|"$/g, '').trim();
    const prr = parseFloat(c[10]) || 0;
    const frq = parseFloat(c[12]) || 0;
    if (!d1 || !d2 || prr < 2) continue;

    const key  = [d1, d2].sort().join('|||');
    const prev = pairMap.get(key);
    if (!prev || prr > prev.prr) pairMap.set(key, { d1, d2, prr, frq });
  }

  console.log(`\n  ${pairMap.size} unique pairs from ${lineNum} records. Inserting...`);
  let inserted = 0, batch = [];

  for (const { d1, d2, prr, frq } of pairMap.values()) {
    batch.push({
      drugAName: d1, drugBName: d2,
      severity:  prrSeverity(prr, frq),
      ddinterId: `TS_${d1.slice(0,10)}_${d2.slice(0,10)}`.replace(/\s+/g, '_'),
    });
    if (batch.length >= BATCH) {
      await prisma.drugInteractionReference.createMany({ data: batch.splice(0), skipDuplicates: true });
      inserted += BATCH;
      process.stdout.write(`  ${inserted} pairs inserted\r`);
    }
  }
  if (batch.length) { await prisma.drugInteractionReference.createMany({ data: batch, skipDuplicates: true }); inserted += batch.length; }
  console.log(`\n  Done: ${inserted} drug-pair interactions inserted`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
async function summary() {
  const ddi = await prisma.drugInteractionReference.count();
  let se = 'N/A';
  try { se = await prisma.drugSideEffect.count(); } catch { /* table optional */ }
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         SEEDING COMPLETE                  ║');
  console.log(`║  DrugInteractionReference: ${String(ddi).padEnd(12)}║`);
  console.log(`║  DrugSideEffect:           ${String(se).padEnd(12)}║`);
  console.log('╚══════════════════════════════════════════╝\n');
}

// ─── Run ─────────────────────────────────────────────────────────────────────
(async () => {
  const src = process.argv.find(a => a.startsWith('--source='))?.split('=')?.[1] || 'all';
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   PolySafe — Scientific Database Seeder   ║');
  console.log(`║   Running: ${src.padEnd(30)}║`);
  console.log('╚══════════════════════════════════════════╝');
  try {
    if (src === 'all' || src === 'chch')     await seedChch();
    if (src === 'all' || src === 'offsides') await seedOffsides();
    if (src === 'all' || src === 'twosides') await seedTwosides();
    await summary();
  } catch (e) {
    console.error('\n✗ Fatal error:', e.message);
    process.exit(1);
  } finally {
    await prisma['$disconnect']();
  }
})();
