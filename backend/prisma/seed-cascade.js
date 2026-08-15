/**
 * prisma/seed-cascade.js — Prescribing Cascade Reference Seeder
 *
 * Usage:
 *   node prisma/seed-cascade.js
 *
 * Reads backend/data/cascade-references.json and upserts records into CascadeReference table.
 * Each cascade pair links a symptom keyword to a drug category with a description.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs   = require('fs');
const path = require('path');

const prisma   = new PrismaClient();
const SRC_PATH = path.join(__dirname, '../data/cascade-references.json');

async function seedCascadeReferences() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PolySafe — Cascade Reference Seeder        ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(SRC_PATH)) {
    console.error(`❌ Data file not found at: ${SRC_PATH}`);
    process.exit(1);
  }

  const raw    = fs.readFileSync(SRC_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  const items  = parsed.cascades ?? [];

  console.log(`📦 Found ${items.length} cascade reference entries.`);

  // Clear existing records so re-running stays idempotent without conflicts on
  // non-unique text fields.
  await prisma.cascadeReference.deleteMany();

  const result = await prisma.cascadeReference.createMany({
    data: items.map((item) => ({
      symptomKeyword:     item.symptomKeyword.toLowerCase().trim(),
      causingDrugCategory: item.causingDrugCategory.trim(),
      description:        item.description.trim(),
    })),
  });

  const total = await prisma.cascadeReference.count();

  console.log(`✅ Inserted ${result.count} cascade reference records.`);
  console.log(`📊 Total CascadeReference records in DB: ${total}\n`);
}

if (require.main === module) {
  seedCascadeReferences()
    .catch((err) => {
      console.error('❌ Error seeding cascade references:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedCascadeReferences };
