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

  await prisma.pillImprint.deleteMany();

  const result = await prisma.pillImprint.createMany({
    data: pills.map((p) => ({
      imprintCode: p.imprintCode.trim(),
      drugName:    p.drugName.trim(),
      strength:    p.strength.trim(),
      shape:       p.shape.trim(),
      color:       p.color.trim(),
    })),
  });

  const total = await prisma.pillImprint.count();
  console.log(`[seed-pills] Done. Seeded ${result.count} pill imprints (${total} total in DB).`);
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
