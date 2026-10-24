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

  // 1. Ensure Demo Patient User (demo@gmail.com)
  let patientUser = await prisma.user.findUnique({
    where: { email: 'demo@gmail.com' },
  });

  if (!patientUser) {
    patientUser = await prisma.user.create({
      data: {
        email: 'demo@gmail.com',
        passwordHash: hashedPassword,
        name: 'Ramesh Patel',
        role: 'PATIENT',
      },
    });
    console.log('✔ Created demo patient user: demo@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: patientUser.id },
      data: { passwordHash: hashedPassword, name: 'Ramesh Patel', failedLoginAttempts: 0, lockedUntil: null },
    });
    console.log('✔ Updated demo patient user: demo@gmail.com');
  }

  // 2. Ensure Demo Doctor User (demodoc@gmail.com)
  let doctorUser = await prisma.user.findUnique({
    where: { email: 'demodoc@gmail.com' },
  });

  if (!doctorUser) {
    doctorUser = await prisma.user.create({
      data: {
        email: 'demodoc@gmail.com',
        passwordHash: hashedPassword,
        name: 'Dr. Priya Sharma, MD',
        role: 'DOCTOR',
      },
    });
    console.log('✔ Created demo doctor user: demodoc@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: doctorUser.id },
      data: { passwordHash: hashedPassword, name: 'Dr. Priya Sharma, MD', failedLoginAttempts: 0, lockedUntil: null },
    });
    console.log('✔ Updated demo doctor user: demodoc@gmail.com');
  }

  // 3. Ensure Demo Caregiver User (democar@gmail.com)
  let caregiverUser = await prisma.user.findUnique({
    where: { email: 'democar@gmail.com' },
  });

  if (!caregiverUser) {
    caregiverUser = await prisma.user.create({
      data: {
        email: 'democar@gmail.com',
        passwordHash: hashedPassword,
        name: 'Sunita Patel (Caregiver)',
        role: 'CAREGIVER',
      },
    });
    console.log('✔ Created demo caregiver user: democar@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: caregiverUser.id },
      data: { passwordHash: hashedPassword, name: 'Sunita Patel (Caregiver)', failedLoginAttempts: 0, lockedUntil: null },
    });
    console.log('✔ Updated demo caregiver user: democar@gmail.com');
  }

  // 4. Upsert Patient Profile for demo@gmail.com
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

  // Ensure Doctor and Caregiver connections to demo patient
  await prisma.connection.upsert({
    where: {
      id: (await prisma.connection.findFirst({
        where: { patientId: patient.id, connectedUserId: doctorUser.id, role: 'DOCTOR' },
      }))?.id || 'doc-demo-connection-placeholder',
    },
    create: {
      patientId: patient.id,
      connectedUserId: doctorUser.id,
      role: 'DOCTOR',
      status: 'APPROVED',
    },
    update: { status: 'APPROVED' },
  });

  await prisma.connection.upsert({
    where: {
      id: (await prisma.connection.findFirst({
        where: { patientId: patient.id, connectedUserId: caregiverUser.id, role: 'CAREGIVER' },
      }))?.id || 'car-demo-connection-placeholder',
    },
    create: {
      patientId: patient.id,
      connectedUserId: caregiverUser.id,
      role: 'CAREGIVER',
      status: 'APPROVED',
    },
    update: { status: 'APPROVED' },
  });
  console.log('✔ Verified APPROVED doctor & caregiver connections to demo patient.');

  // 5. Clean previous medicines & flags for this patient
  await prisma.interactionFlag.deleteMany({ where: { patientId: patient.id } });
  await prisma.symptom.deleteMany({ where: { patientId: patient.id } });
  await prisma.medicine.deleteMany({ where: { patientId: patient.id } });

  // 6. Seed Core Demo Medicines
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

  // 7. Seed Interactive High-Severity Flags
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

  // 8. Ensure empty accounts are clean
  const emptyPatient = await prisma.user.upsert({
    where: { email: 'meetc8030@gmail.com' },
    create: {
      email: 'meetc8030@gmail.com',
      passwordHash: hashedPassword,
      name: 'Meet Chauhan',
      role: 'PATIENT',
      patient: {
        create: { age: 0, conditions: [], allergies: [] },
      },
    },
    update: {
      passwordHash: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    include: { patient: true },
  });
  if (emptyPatient.patient) {
    await prisma.medicine.deleteMany({ where: { patientId: emptyPatient.patient.id } });
    await prisma.interactionFlag.deleteMany({ where: { patientId: emptyPatient.patient.id } });
    await prisma.connection.deleteMany({ where: { patientId: emptyPatient.patient.id } });
  }

  const emptyDoc = await prisma.user.upsert({
    where: { email: 'cse.230840131016@gmail.com' },
    create: {
      email: 'cse.230840131016@gmail.com',
      passwordHash: hashedPassword,
      name: 'Dr. Priya Sharma, MD',
      role: 'DOCTOR',
    },
    update: {
      passwordHash: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  await prisma.connection.deleteMany({ where: { connectedUserId: emptyDoc.id } });

  const emptyCar = await prisma.user.upsert({
    where: { email: 'meetc8031@gmail.com' },
    create: {
      email: 'meetc8031@gmail.com',
      passwordHash: hashedPassword,
      name: 'Caregiver Meet',
      role: 'CAREGIVER',
    },
    update: {
      passwordHash: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  await prisma.connection.deleteMany({ where: { connectedUserId: emptyCar.id } });
  console.log('✔ Verified empty accounts meetc8030@gmail.com, cse.230840131016@gmail.com, meetc8031@gmail.com.');

  console.log('\n================================================================');
  console.log('🎉 DEMO DATA RESET COMPLETE!');
  console.log('Credentials:');
  console.log('  • Patient:   demo@gmail.com    / Meet@123 (Active clinical data)');
  console.log('  • Doctor:    demodoc@gmail.com / Meet@123 (Connected to demo patient)');
  console.log('  • Caregiver: democar@gmail.com / Meet@123 (Connected to demo patient)');
  console.log('Empty accounts:');
  console.log('  • meetc8030@gmail.com, cse.230840131016@gmail.com, meetc8031@gmail.com (Meet@123)');
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
