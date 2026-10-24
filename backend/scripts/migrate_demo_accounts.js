/**
 * backend/scripts/migrate_demo_accounts.js
 *
 * Migrates data to:
 * - Patient: demo@gmail.com (Meet@123) with full clinical data & medications from meetc8030@gmail.com
 * - Doctor:  demodoc@gmail.com (Meet@123) with approved clinical connection to demo patient
 * - Caregiver: democar@gmail.com (Meet@123) with approved caregiver connection to demo patient
 *
 * And resets to empty accounts:
 * - Patient: meetc8030@gmail.com (Meet@123) — empty (0 medicines, 0 flags, 0 dose logs)
 * - Doctor:  cse.230840131016@gmail.com (Meet@123) — empty (0 connections)
 * - Caregiver: meetc8031@gmail.com (Meet@123) — empty (0 connections)
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrate() {
  console.log('================================================================');
  console.log('       PolySafe — Account Migration & Demo Setup                ');
  console.log('================================================================\n');

  const hashedPassword = await bcrypt.hash('Meet@123', 10);

  // Clear any pending signups / OTPs for these emails
  const allEmails = [
    'demo@gmail.com',
    'demodoc@gmail.com',
    'democar@gmail.com',
    'meetc8030@gmail.com',
    'cse.230840131016@gmail.com',
    'meetc8031@gmail.com',
  ];

  await prisma.otpCode.deleteMany({ where: { email: { in: allEmails } } });
  await prisma.pendingSignup.deleteMany({ where: { email: { in: allEmails } } });
  console.log('✔ Cleaned up stale OTP codes and pending signups.');

  // ─── 1. PATIENT: Move meetc8030@gmail.com data to demo@gmail.com ─────────────
  let demoPatientUser = await prisma.user.findUnique({
    where: { email: 'demo@gmail.com' },
    include: { patient: true },
  });

  const oldPatientUser = await prisma.user.findUnique({
    where: { email: 'meetc8030@gmail.com' },
    include: { patient: true },
  });

  if (oldPatientUser && !demoPatientUser) {
    // Rename old user to demo@gmail.com so all relations (medicines, flags, logs) transfer seamlessly
    demoPatientUser = await prisma.user.update({
      where: { id: oldPatientUser.id },
      data: {
        email: 'demo@gmail.com',
        name: 'Ramesh Patel (Demo)',
        passwordHash: hashedPassword,
        role: 'PATIENT',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      include: { patient: true },
    });
    console.log('✔ Successfully transferred patient data from meetc8030@gmail.com to demo@gmail.com');
  } else if (!demoPatientUser) {
    // Create fresh demo patient
    demoPatientUser = await prisma.user.create({
      data: {
        email: 'demo@gmail.com',
        name: 'Ramesh Patel (Demo)',
        passwordHash: hashedPassword,
        role: 'PATIENT',
        patient: {
          create: {
            age: 68,
            conditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
            allergies: ['Penicillin', 'Sulfa drugs'],
          },
        },
      },
      include: { patient: true },
    });
    console.log('✔ Created fresh demo@gmail.com patient user.');
  } else {
    // Update existing demo patient user
    demoPatientUser = await prisma.user.update({
      where: { id: demoPatientUser.id },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
        role: 'PATIENT',
      },
      include: { patient: true },
    });
    console.log('✔ Updated existing demo@gmail.com patient user.');
  }

  // Ensure demo patient profile exists
  let demoPatient = demoPatientUser.patient;
  if (!demoPatient) {
    demoPatient = await prisma.patient.create({
      data: {
        userId: demoPatientUser.id,
        age: 68,
        conditions: ['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis'],
        allergies: ['Penicillin', 'Sulfa drugs'],
      },
    });
  }

  // Ensure demo patient has core demo medicines if none exist
  const existingMeds = await prisma.medicine.findMany({
    where: { patientId: demoPatient.id, removedAt: null },
  });

  if (existingMeds.length === 0) {
    const medsToSeed = [
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

    const created = [];
    for (const m of medsToSeed) {
      const med = await prisma.medicine.create({
        data: {
          patientId: demoPatient.id,
          name: m.name,
          type: m.type,
          dosage: m.dosage,
          purpose: m.purpose,
          standardizedCode: m.rxcui,
          addedBy: demoPatientUser.id,
          harmLevel: m.harmLevel,
          foodInstruction: m.foodInstruction,
          dateAdded: new Date(),
        },
      });
      created.push(med);
    }
    console.log(`✔ Seeded ${created.length} medications for demo@gmail.com`);

    // Add interaction flags
    const medMap = Object.fromEntries(created.map((m) => [m.name, m.id]));
    if (medMap['Warfarin'] && medMap['Turmeric (Curcumin)']) {
      await prisma.interactionFlag.create({
        data: {
          patientId: demoPatient.id,
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
          patientId: demoPatient.id,
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
          patientId: demoPatient.id,
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
    console.log('✔ Seeded interaction flags for demo@gmail.com');
  } else {
    console.log(`✔ demo@gmail.com has ${existingMeds.length} active medications.`);
  }

  // ─── 2. PATIENT: Ensure meetc8030@gmail.com exists and is EMPTY ──────────────
  let emptyPatientUser = await prisma.user.findUnique({
    where: { email: 'meetc8030@gmail.com' },
    include: { patient: true },
  });

  if (!emptyPatientUser) {
    emptyPatientUser = await prisma.user.create({
      data: {
        email: 'meetc8030@gmail.com',
        name: 'Meet Chauhan',
        passwordHash: hashedPassword,
        role: 'PATIENT',
        patient: {
          create: {
            age: 0,
            conditions: [],
            allergies: [],
          },
        },
      },
      include: { patient: true },
    });
    console.log('✔ Created empty patient account: meetc8030@gmail.com');
  } else {
    // If it exists, wipe any medicines, flags, symptoms, doseLogs, connections
    if (emptyPatientUser.patient) {
      const pid = emptyPatientUser.patient.id;
      await prisma.interactionFlag.deleteMany({ where: { patientId: pid } });
      await prisma.symptom.deleteMany({ where: { patientId: pid } });
      await prisma.doseLog.deleteMany({ where: { patientId: pid } });
      await prisma.connection.deleteMany({ where: { patientId: pid } });
      await prisma.medicine.deleteMany({ where: { patientId: pid } });
      await prisma.patient.update({
        where: { id: pid },
        data: { age: 0, conditions: [], allergies: [] },
      });
    }
    await prisma.user.update({
      where: { id: emptyPatientUser.id },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log('✔ Cleaned and emptied patient account: meetc8030@gmail.com');
  }

  // ─── 3. DOCTOR: Ensure demodoc@gmail.com exists with connection to demo patient
  let demodocUser = await prisma.user.findUnique({
    where: { email: 'demodoc@gmail.com' },
  });

  if (!demodocUser) {
    demodocUser = await prisma.user.create({
      data: {
        email: 'demodoc@gmail.com',
        name: 'Dr. Priya Sharma, MD',
        passwordHash: hashedPassword,
        role: 'DOCTOR',
      },
    });
    console.log('✔ Created doctor account: demodoc@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: demodocUser.id },
      data: {
        passwordHash: hashedPassword,
        role: 'DOCTOR',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log('✔ Updated doctor account: demodoc@gmail.com');
  }

  // Connect demodoc@gmail.com to demo patient
  const existingDocConnection = await prisma.connection.findFirst({
    where: {
      patientId: demoPatient.id,
      connectedUserId: demodocUser.id,
      role: 'DOCTOR',
    },
  });

  if (!existingDocConnection) {
    await prisma.connection.create({
      data: {
        patientId: demoPatient.id,
        connectedUserId: demodocUser.id,
        role: 'DOCTOR',
        status: 'APPROVED',
      },
    });
    console.log('✔ Connected demodoc@gmail.com to demo@gmail.com patient (APPROVED)');
  } else if (existingDocConnection.status !== 'APPROVED') {
    await prisma.connection.update({
      where: { id: existingDocConnection.id },
      data: { status: 'APPROVED' },
    });
    console.log('✔ Ensured demodoc@gmail.com connection status is APPROVED');
  }

  // ─── 4. DOCTOR: Ensure cse.230840131016@gmail.com exists and is EMPTY ────────
  let emptyDoctorUser = await prisma.user.findUnique({
    where: { email: 'cse.230840131016@gmail.com' },
  });

  if (!emptyDoctorUser) {
    emptyDoctorUser = await prisma.user.create({
      data: {
        email: 'cse.230840131016@gmail.com',
        name: 'Dr. Priya Sharma, MD',
        passwordHash: hashedPassword,
        role: 'DOCTOR',
      },
    });
    console.log('✔ Created doctor account: cse.230840131016@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: emptyDoctorUser.id },
      data: {
        passwordHash: hashedPassword,
        role: 'DOCTOR',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    // Remove all connections so this account is empty
    await prisma.connection.deleteMany({
      where: { connectedUserId: emptyDoctorUser.id },
    });
    console.log('✔ Cleaned and emptied doctor account: cse.230840131016@gmail.com');
  }

  // ─── 5. CAREGIVER: Ensure democar@gmail.com exists with connection to demo patient
  let democarUser = await prisma.user.findUnique({
    where: { email: 'democar@gmail.com' },
  });

  if (!democarUser) {
    democarUser = await prisma.user.create({
      data: {
        email: 'democar@gmail.com',
        name: 'Sunita Patel (Caregiver)',
        passwordHash: hashedPassword,
        role: 'CAREGIVER',
      },
    });
    console.log('✔ Created caregiver account: democar@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: democarUser.id },
      data: {
        passwordHash: hashedPassword,
        role: 'CAREGIVER',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log('✔ Updated caregiver account: democar@gmail.com');
  }

  // Connect democar@gmail.com to demo patient
  const existingCarConnection = await prisma.connection.findFirst({
    where: {
      patientId: demoPatient.id,
      connectedUserId: democarUser.id,
      role: 'CAREGIVER',
    },
  });

  if (!existingCarConnection) {
    await prisma.connection.create({
      data: {
        patientId: demoPatient.id,
        connectedUserId: democarUser.id,
        role: 'CAREGIVER',
        status: 'APPROVED',
      },
    });
    console.log('✔ Connected democar@gmail.com to demo@gmail.com patient (APPROVED)');
  } else if (existingCarConnection.status !== 'APPROVED') {
    await prisma.connection.update({
      where: { id: existingCarConnection.id },
      data: { status: 'APPROVED' },
    });
    console.log('✔ Ensured democar@gmail.com connection status is APPROVED');
  }

  // ─── 6. CAREGIVER: Ensure meetc8031@gmail.com exists and is EMPTY ────────────
  let emptyCaregiverUser = await prisma.user.findUnique({
    where: { email: 'meetc8031@gmail.com' },
  });

  if (!emptyCaregiverUser) {
    emptyCaregiverUser = await prisma.user.create({
      data: {
        email: 'meetc8031@gmail.com',
        name: 'Caregiver Meet',
        passwordHash: hashedPassword,
        role: 'CAREGIVER',
      },
    });
    console.log('✔ Created caregiver account: meetc8031@gmail.com');
  } else {
    await prisma.user.update({
      where: { id: emptyCaregiverUser.id },
      data: {
        passwordHash: hashedPassword,
        role: 'CAREGIVER',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    // Remove all connections so this account is empty
    await prisma.connection.deleteMany({
      where: { connectedUserId: emptyCaregiverUser.id },
    });
    console.log('✔ Cleaned and emptied caregiver account: meetc8031@gmail.com');
  }

  console.log('\n================================================================');
  console.log('🎉 MIGRATION & ACCOUNT SETUP COMPLETE!');
  console.log('ACTIVE DEMO ACCOUNTS (WITH FULL DATA & CONNECTIONS):');
  console.log('  • Patient:   demo@gmail.com    / Meet@123 (Full medications & risk profile)');
  console.log('  • Doctor:    demodoc@gmail.com / Meet@123 (Approved link to demo patient)');
  console.log('  • Caregiver: democar@gmail.com / Meet@123 (Approved link to demo patient)');
  console.log('\nEMPTY ACCOUNTS (CLEAN SLATE):');
  console.log('  • Patient:   meetc8030@gmail.com        / Meet@123 (Empty patient profile)');
  console.log('  • Doctor:    cse.230840131016@gmail.com / Meet@123 (0 patient connections)');
  console.log('  • Caregiver: meetc8031@gmail.com        / Meet@123 (0 patient connections)');
  console.log('================================================================\n');
}

migrate()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
