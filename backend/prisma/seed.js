/**
 * prisma/seed.js — DDInter bulk importer
 *
 * Usage:
 *   node prisma/seed.js
 *   npx prisma db seed        (after adding "prisma.seed" to package.json)
 *
 * Expects: backend/data/ddinter.csv
 *
 * DDInter CSV column auto-detection:
 *   The script inspects the header row and maps flexibly to handles several
 *   common column naming conventions seen across different DDInter exports:
 *
 *   Drug A:    "drug_name_a" | "Drug Name A" | "drug_a" | "drugA" | "Drug 1"
 *   Drug B:    "drug_name_b" | "Drug Name B" | "drug_b" | "drugB" | "Drug 2"
 *   Severity:  "level" | "severity" | "risk_level" | "Risk Level" | "Severity"
 *   ID:        "DDInter_id" | "id" | "ddinter_id"
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, '../data/ddinter.csv');
const BATCH_SIZE = 500; // rows per createMany call

// ─── Column name aliases ──────────────────────────────────────────────────────
// DDInter actual headers: DDInterID_A, Drug_A, DDInterID_B, Drug_B, Level
const DRUG_A_ALIASES = ['drug_a', 'drug name a', 'drug_name_a', 'druga', 'drug1', 'drug 1', 'name_a', 'name a', 'drug a'];
const DRUG_B_ALIASES = ['drug_b', 'drug name b', 'drug_name_b', 'drugb', 'drug2', 'drug 2', 'name_b', 'name b', 'drug b'];
const SEVERITY_ALIASES = ['level', 'severity', 'risk_level', 'risk level', 'interaction level', 'ddi_risk'];
const ID_ALIASES = ['ddinterid_a', 'ddinter_id', 'ddinter id', 'ddinterid', 'id', 'interaction_id'];

function findCol(headers, aliases) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx !== -1) return headers[idx]; // return original casing
  }
  return null;
}

// ─── Severity normalisation ───────────────────────────────────────────────────
// DDInter uses numeric levels in some exports (0-3) and text in others.
const SEVERITY_MAP = {
  '0': 'Unknown',
  '1': 'Minor',
  '2': 'Moderate',
  '3': 'Major',
  'unknown': 'Unknown',
  'minor': 'Minor',
  'moderate': 'Moderate',
  'major': 'Major',
  'contraindicated': 'Contraindicated',
  'severe': 'Major',
  'serious': 'Major',
};

function normalizeSeverity(raw) {
  if (!raw) return 'Unknown';
  const key = String(raw).trim().toLowerCase();
  return SEVERITY_MAP[key] ?? raw.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PolySafe — DDInter Reference Seeder        ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Verify CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  CSV not found at: ${CSV_PATH}`);
    console.error('    Place the DDInter CSV at backend/data/ddinter.csv and re-run.');
    process.exit(1);
  }

  const fileStats = fs.statSync(CSV_PATH);
  console.log(`📄  CSV file: ${CSV_PATH}`);
  console.log(`    Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB\n`);

  // 2. Parse CSV
  console.log('⏳  Parsing CSV...');
  const rawContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(rawContent, {
    columns: true,          // use first row as keys
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // allow ragged rows gracefully
  });

  console.log(`    ${records.length.toLocaleString()} rows parsed from CSV.\n`);

  if (records.length === 0) {
    console.error('❌  CSV appears empty. Check the file and retry.');
    process.exit(1);
  }

  // 3. Detect columns
  const headers = Object.keys(records[0]);
  console.log(`🔍  Detected columns: ${headers.join(', ')}`);

  const colA   = findCol(headers, DRUG_A_ALIASES);
  const colB   = findCol(headers, DRUG_B_ALIASES);
  const colSev = findCol(headers, SEVERITY_ALIASES);
  const colId  = findCol(headers, ID_ALIASES);

  if (!colA || !colB || !colSev) {
    console.error('\n❌  Could not identify required columns.');
    console.error(`    Drug A column found: ${colA ?? 'NOT FOUND'}`);
    console.error(`    Drug B column found: ${colB ?? 'NOT FOUND'}`);
    console.error(`    Severity column found: ${colSev ?? 'NOT FOUND'}`);
    console.error('\n    Available columns:', headers.join(', '));
    console.error('\n    Tip: Update DRUG_A_ALIASES / DRUG_B_ALIASES / SEVERITY_ALIASES');
    console.error('    in prisma/seed.js to match your CSV header names.\n');
    process.exit(1);
  }

  console.log(`\n✅  Column mapping:`);
  console.log(`    Drug A   → "${colA}"`);
  console.log(`    Drug B   → "${colB}"`);
  console.log(`    Severity → "${colSev}"`);
  if (colId) console.log(`    ID       → "${colId}"`);

  // 4. Clear old data for idempotent re-seeding
  console.log('\n🗑️   Clearing existing drug_interaction_reference rows...');
  const deleted = await prisma.drugInteractionReference.deleteMany({});
  console.log(`    Deleted ${deleted.count.toLocaleString()} old rows.`);

  // 5. Build batched payload — skip malformed rows
  let skipped = 0;
  const rows = [];

  for (const rec of records) {
    const a = rec[colA]?.trim();
    const b = rec[colB]?.trim();
    const sev = normalizeSeverity(rec[colSev]);

    if (!a || !b) {
      skipped++;
      continue;
    }

    rows.push({
      drugAName: a,
      drugBName: b,
      severity: sev,
      ddinterId: colId ? (rec[colId]?.trim() || null) : null,
    });
  }

  console.log(`\n📦  Preparing ${rows.length.toLocaleString()} rows for insert (${skipped} skipped — missing drug name)...`);

  // 6. Bulk insert in batches
  let inserted = 0;
  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await prisma.drugInteractionReference.createMany({
      data: batch,
      skipDuplicates: false, // DDInter has legitimate A-B pairs that differ from B-A
    });
    inserted += result.count;

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const pct = Math.round((batchNum / totalBatches) * 100);
    process.stdout.write(`\r    Batch ${batchNum}/${totalBatches} (${pct}%)  [${inserted.toLocaleString()} inserted]`);
  }

  console.log('\n');

  // 7. Final row count verification
  const finalCount = await prisma.drugInteractionReference.count();

  console.log('═══════════════════════════════════════════════');
  console.log(`✅  Seed complete!`);
  console.log(`    CSV rows:      ${records.length.toLocaleString()}`);
  console.log(`    Skipped:       ${skipped.toLocaleString()}`);
  console.log(`    Inserted:      ${inserted.toLocaleString()}`);
  console.log(`    DB row count:  ${finalCount.toLocaleString()}`);

  if (finalCount !== inserted) {
    console.warn(`\n⚠️   Row count mismatch! Expected ${inserted} but DB reports ${finalCount}.`);
    console.warn('    This can happen if the DB already had rows that weren\'t cleared.');
  } else {
    console.log('\n✨  DB row count matches insert count — seed verified.');
  }
  console.log('═══════════════════════════════════════════════\n');

  // 8. Seed additional reference datasets
  const { seedBurdenScores } = require('./seed-burden');
  await seedBurdenScores();

  const { seedCascadeReferences } = require('./seed-cascade');
  await seedCascadeReferences();

  const { seedHerbDrugReferences } = require('./seed-herb-drug');
  await seedHerbDrugReferences();

  console.log('🎉  All PolySafe reference tables successfully seeded!\n');
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
