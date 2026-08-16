'use strict';

/**
 * seed-pills.js
 * Seeds the PillImprint reference table from backend/data/pill-imprints.json.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedPillImprints() {
  const filePath = path.join(__dirname, '..', 'data', 'pill-imprints.json');
  if (!fs.existsSync(filePath)) {
    console.error('[seed-pills] File not found:', filePath);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { pills } = JSON.parse(raw);

  console.log(`[seed-pills] Seeding ${pills.length} pill imprint reference records...`);

  let count = 0;
  for (const p of pills) {
    const existing = await prisma.pillImprint.findFirst({
      where: { imprintCode: p.imprintCode, drugName: p.drugName },
    });

    if (!existing) {
      await prisma.pillImprint.create({
        data: {
          imprintCode: p.imprintCode,
          drugName: p.drugName,
          strength: p.strength,
          shape: p.shape,
          color: p.color,
        },
      });
      count++;
    }
  }

  console.log(`[seed-pills] Done. Added ${count} new pill imprints (${pills.length} total in reference file).`);
}

if (require.main === module) {
  seedPillImprints()
    .catch((err) => {
      console.error('[seed-pills] Error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedPillImprints };
