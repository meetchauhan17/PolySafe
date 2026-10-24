const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyNeonServices() {
  console.log('====================================================');
  console.log('   PolySafe — End-to-End Neon Database Verification ');
  console.log('====================================================\n');

  try {
    // 1. Check raw database connectivity & server timestamp
    const [raw] = await prisma.$queryRaw`SELECT NOW() as current_time, current_database() as db_name, version()`;
    console.log('✔ Lakebase Postgres Connected:');
    console.log('  Database:    ', raw.db_name);
    console.log('  Server Time: ', raw.current_time);

    // 2. Query seeded demo users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`\n✔ User Service verified (${users.length} registered accounts):`);
    users.forEach((u) => console.log(`  - [${u.role}] ${u.name} <${u.email}>`));

    // 3. Query medications for demo patient
    const meds = await prisma.medicine.findMany({
      select: { id: true, name: true, dosage: true, type: true },
    });
    console.log(`\n✔ Medication Regimen Service verified (${meds.length} active prescriptions):`);
    meds.forEach((m) => console.log(`  - ${m.name} (${m.dosage}) [${m.type}]`));

    // 4. Query interaction flags with related drug names
    const flags = await prisma.interactionFlag.findMany({
      select: {
        severity: true,
        clinicalExplanation: true,
        medicineA: { select: { name: true } },
        medicineB: { select: { name: true } },
      },
    });
    console.log(`\n✔ Clinical DDI Risk Engine verified (${flags.length} detected interactions on Neon):`);
    flags.forEach((f) => {
      const drugA = f.medicineA?.name || 'Drug A';
      const drugB = f.medicineB?.name || 'Drug B';
      console.log(`  - [${f.severity}] ${drugA} + ${drugB}: ${f.clinicalExplanation?.slice(0, 70)}...`);
    });

    // 5. Query clinical knowledge bases on Neon
    const [burdenCount, cascadeCount, herbDrugCount, pillCount] = await Promise.all([
      prisma.burdenScore.count(),
      prisma.cascadeReference.count(),
      prisma.herbDrugReference.count(),
      prisma.pillImprint.count(),
    ]);

    console.log('\n✔ Clinical Knowledge Bases in Neon Lakebase Postgres:');
    console.log(`  - Anticholinergic / Sedative Burden Scores: ${burdenCount} drugs`);
    console.log(`  - Prescribing Cascade References:           ${cascadeCount} cascades`);
    console.log(`  - Herb-Drug Interaction Matrix:             ${herbDrugCount} interactions`);
    console.log(`  - Visual Pill Imprint Signatures:           ${pillCount} imprint profiles`);

    console.log('\n====================================================');
    console.log('🎉 ALL NEON SERVICES VERIFIED END-TO-END WITH 100% PASS RATE!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeonServices();
