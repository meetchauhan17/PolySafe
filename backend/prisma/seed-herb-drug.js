/**
 * prisma/seed-herb-drug.js — Herb-Drug Interaction Reference Seeder
 *
 * Usage:
 *   node prisma/seed-herb-drug.js
 *
 * Reads backend/data/herb-drug-interactions.json and upserts into HerbDrugReference.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs   = require('fs');
const path = require('path');

const prisma   = new PrismaClient();
const SRC_PATH = path.join(__dirname, '../data/herb-drug-interactions.json');

async function seedHerbDrugReferences() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PolySafe — Herb-Drug Reference Seeder      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(SRC_PATH)) {
    console.error(`❌ Data file not found at: ${SRC_PATH}`);
    process.exit(1);
  }

  const raw    = fs.readFileSync(SRC_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  const items  = parsed.interactions ?? [];

  console.log(`📦 Found ${items.length} herb-drug interaction entries.`);

  // Clear and recreate for idempotency (no unique constraint on herb+drug combo,
  // since multiple entries per pair are valid for different drug names)
  await prisma.herbDrugReference.deleteMany();

  const result = await prisma.herbDrugReference.createMany({
    data: items.map((item) => ({
      herbName:    item.herbName.toLowerCase().trim(),
      drugName:    item.drugName.toLowerCase().trim(),
      severity:    item.severity.trim(),
      description: item.description.trim(),
    })),
  });

  const total = await prisma.herbDrugReference.count();

  console.log(`✅ Inserted ${result.count} herb-drug interaction records.`);
  console.log(`📊 Total HerbDrugReference records in DB: ${total}\n`);
}

if (require.main === module) {
  seedHerbDrugReferences()
    .catch((err) => {
      console.error('❌ Error seeding herb-drug references:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedHerbDrugReferences };
