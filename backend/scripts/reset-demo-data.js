/**
 * backend/scripts/reset-demo-data.js
 *
 * One-command reset of demo user profiles, medications, interactions, and directives.
 * Run via: npm run demo:reset
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDemoData() {
  console.log('================================================================');
  console.log('        PolySafe — Resetting Venue & Demo Data                  ');
  console.log('================================================================\n');

  const hashedPassword = await bcrypt.hash('Meet@123', 10);

  // 1. Ensure Patient User
  let patientUser = await prisma.user.findUnique({
    where: { email: 'meetc8030@gmail.com' },
  });

  if (!patientUser) {
    patientUser = await prisma.user.create({
      data: {
        email: 'meetc8030@gmail.com',
        passwordHash: hashedPassword,
        name: 'Ramesh Patel',
        role: 'PATIENT',
      },
    });
    console.log('✔ Created demo patient user: meetc8030@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { passwordHash: hashedPassword, name: 'Ramesh Patel' },
    });
    console.log('✔ Updated demo patient user: meetc8030@gmail.com');
  }

  // 2. Ensure Doctor User
  let doctorUser = await prisma.user.findUnique({
    where: { email: 'cse.230840131016@gmail.com' },
  });

  if (!doctorUser) {
    doctorUser = await prisma.user.create({
      data: {
        email: 'cse.230840131016@gmail.com',
        passwordHash: hashedPassword,
        name: 'Dr. Priya Sharma, MD',
        role: 'DOCTOR',
      },
    });
    console.log('✔ Created demo doctor user: cse.230840131016@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: doctorUser.id },
      data: { passwordHash: hashedPassword, name: 'Dr. Priya Sharma, MD' },
    });
    console.log('✔ Updated demo doctor user: cse.230840131016@gmail.com');
  }

  // 3. Upsert Patient Profile
  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    create: {
      userId: patientUser.id,
      age: 68,
      conditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
      allergies: ['Penicillin', 'Sulfa drugs'],
    },
    update: {
      age: 68,
      conditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
      allergies: ['Penicillin', 'Sulfa drugs'],
    },
  });
  console.log(`✔ Patient profile configured (ID: ${patient.id})`);

  // 4. Clean previous medicines & flags for this patient
  await prisma.interactionFlag.deleteMany({ where: { patientId: patient.id } });
  await prisma.symptom.deleteMany({ where: { patientId: patient.id } });
  await prisma.medicine.deleteMany({ where: { patientId: patient.id } });

  // 5. Seed Core Demo Medicines
  const meds = [
    {
      name: 'Warfarin',
      type: 'PRESCRIPTION',
      dosage: '5mg once daily (evening)',
      purpose: 'Blood thinner for stroke & thrombosis prevention',
      rxcui: '11289',
      harmLevel: 4,
      foodInstruction: 'after_food',
    },
    {
      name: 'Turmeric (Curcumin)',
      type: 'HERBAL',
      dosage: '500mg once daily',
      purpose: 'Joint inflammation & natural immunity booster',
      rxcui: null,
      harmLevel: 2,
      foodInstruction: 'with_food',
    },
    {
      name: 'Aspirin',
      type: 'OTC',
      dosage: '75mg once daily (morning)',
      purpose: 'Cardiovascular protection & antiplatelet therapy',
      rxcui: '1191',
      harmLevel: 3,
      foodInstruction: 'after_food',
    },
    {
      name: 'Amitriptyline',
      type: 'PRESCRIPTION',
      dosage: '25mg at bedtime',
      purpose: 'Neuropathic pain & sleep aid',
      rxcui: '704',
      harmLevel: 4,
      foodInstruction: 'before_sleep',
    },
    {
      name: 'Escitalopram',
      type: 'PRESCRIPTION',
      dosage: '10mg once daily (morning)',
      purpose: 'Anxiety & mood stability',
      rxcui: '32937',
      harmLevel: 3,
      foodInstruction: 'any',
    },
  ];

  const createdMeds = [];
  for (const m of meds) {
    const created = await prisma.medicine.create({
      data: {
        patientId: patient.id,
        name: m.name,
        type: m.type,
        dosage: m.dosage,
        purpose: m.purpose,
        standardizedCode: m.rxcui,
        addedBy: patientUser.id,
        harmLevel: m.harmLevel || 3,
        foodInstruction: m.foodInstruction || 'any',
        dateAdded: new Date(),
      },
    });
    createdMeds.push(created);
  }
  console.log(`✔ Seeded ${createdMeds.length} demo medications.`);

  // 6. Seed Interactive High-Severity Flags
  const medMap = Object.fromEntries(createdMeds.map((m) => [m.name, m.id]));

  if (medMap['Warfarin'] && medMap['Turmeric (Curcumin)']) {
    await prisma.interactionFlag.create({
      data: {
        patientId: patient.id,
        medicineAId: medMap['Warfarin'],
        medicineBId: medMap['Turmeric (Curcumin)'],
        severity: 'Major',
        plainExplanation:
          'Turmeric (curcumin) strongly enhances Warfarin blood-thinning effect, significantly elevating the risk of unexplained bruising and internal bleeding.',
        clinicalExplanation:
          'Curcumin inhibits hepatic CYP2C9 and suppresses platelet aggregation, synergistically amplifying warfarin anticoagulation.',
        generatedBy: 'demo-mock',
      },
    });
  }

  if (medMap['Aspirin'] && medMap['Warfarin']) {
    await prisma.interactionFlag.create({
      data: {
        patientId: patient.id,
        medicineAId: medMap['Warfarin'],
        medicineBId: medMap['Aspirin'],
        severity: 'Major',
        plainExplanation:
          'Taking Aspirin together with Warfarin compounds your anti-clotting load, sharply increasing the danger of stomach ulcers and gastrointestinal bleeding.',
        clinicalExplanation:
          'Additive hemostatic inhibition: dual inhibition of vitamin K clotting factors and COX-1 platelet thromboxane production.',
        generatedBy: 'demo-mock',
      },
    });
  }

  if (medMap['Amitriptyline'] && medMap['Escitalopram']) {
    await prisma.interactionFlag.create({
      data: {
        patientId: patient.id,
        medicineAId: medMap['Amitriptyline'],
        medicineBId: medMap['Escitalopram'],
        severity: 'Moderate',
        plainExplanation:
          'Combining Amitriptyline and Escitalopram can cause heart rhythm irregularity (QT prolongation) and extreme daytime drowsiness.',
        clinicalExplanation:
          'Pharmacodynamic synergism: additive serotonin elevation and increased anticholinergic burden (ACB Score: 4).',
        generatedBy: 'demo-mock',
      },
    });
  }
  console.log('✔ Seeded clinical interaction flags with deterministic explanations.');

  console.log('\n================================================================');
  console.log('🎉 DEMO DATA RESET COMPLETE!');
  console.log('Credentials:');
  console.log('  Patient: meetc8030@gmail.com / Meet@123');
  console.log('  Doctor:  cse.230840131016@gmail.com / Meet@123');
  console.log('================================================================\n');
}

resetDemoData()
  .catch((err) => {
    console.error('❌ Reset error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
