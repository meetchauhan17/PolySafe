/**
 * prisma/seed-burden.js — Anticholinergic/Sedative Burden Score Seeder
 *
 * Usage:
 *   node prisma/seed-burden.js
 *
 * Populates the BurdenScore table from backend/data/burden-scores.json.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BURDEN_DATA_PATH = path.join(__dirname, '../data/burden-scores.json');

async function seedBurdenScores() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PolySafe — Burden Scores Seeder            ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!fs.existsSync(BURDEN_DATA_PATH)) {
    console.error(`❌ Burden scores data file not found at: ${BURDEN_DATA_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(BURDEN_DATA_PATH, 'utf-8');
  const parsed = JSON.parse(rawData);
  const drugs = parsed.drugs || [];

  console.log(`📦 Found ${drugs.length} drug entries in burden-scores.json`);

  let upsertedCount = 0;
  for (const item of drugs) {
    const drugName = item.drugName.trim().toLowerCase();
    const score = Number(item.score);

    await prisma.burdenScore.upsert({
      where: { drugName },
      update: { score },
      create: { drugName, score },
    });
    upsertedCount++;
  }

  const totalInDb = await prisma.burdenScore.count();

  console.log(`✅ Successfully seeded ${upsertedCount} burden score records.`);
  console.log(`📊 Total BurdenScore records in DB: ${totalInDb}\n`);
}

if (require.main === module) {
  seedBurdenScores()
    .catch((err) => {
      console.error('❌ Error seeding burden scores:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedBurdenScores };
