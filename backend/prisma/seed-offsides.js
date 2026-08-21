'use strict';

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOffsides() {
  console.log('[seed-offsides] Seeding DrugSideEffect from offsides-sample.json...');

  const filePath = path.join(__dirname, '../data/offsides-sample.json');
  if (!fs.existsSync(filePath)) {
    console.error('[seed-offsides] offsides-sample.json not found!');
    return;
  }

  const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Upsert or bulk insert
  let count = 0;
  for (const item of records) {
    const drugName = item.drugName.toLowerCase().trim();
    const sideEffect = item.sideEffect.trim();
    const prr = parseFloat(item.prr) || 2.0;
    const severity = item.severity || 'Moderate';
    const source = item.source || 'OFFSIDES';

    // Check if existing
    const existing = await prisma.drugSideEffect.findFirst({
      where: {
        drugName,
        sideEffect,
      },
    });

    if (!existing) {
      await prisma.drugSideEffect.create({
        data: {
          drugName,
          sideEffect,
          prr,
          severity,
          source,
          reportingFreq: 0.02,
        },
      });
      count++;
    }
  }

  console.log(`[seed-offsides] Successfully seeded ${count} new DrugSideEffect records (Total sample pool: ${records.length}).`);
}

seedOffsides()
  .catch((e) => console.error('[seed-offsides] Error:', e))
  .finally(() => prisma.$disconnect());
