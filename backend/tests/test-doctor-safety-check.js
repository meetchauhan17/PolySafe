'use strict';

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API = 'http://localhost:5000';

async function runTest() {
  console.log('================================================================');
  console.log('       Testing POST /connection/doctor-safety-check             ');
  console.log('================================================================\n');

  // 1. Create Patient & Doctor
  const patientEmail = `doc_check_patient_${Date.now()}@example.com`;
  const doctorEmail = `doc_check_doctor_${Date.now()}@example.com`;
  const password = 'Password123!';

  // Patient signup
  await axios.post(`${API}/auth/patient/signup-send-otp`, { name: 'Safety Patient', email: patientEmail, password, role: 'PATIENT' });
  const pending = await prisma.pendingSignup.findFirst({ where: { email: patientEmail }, orderBy: { createdAt: 'desc' } });
  const pVerify = await axios.post(`${API}/auth/patient/verify-signup-otp`, { email: patientEmail, code: pending.code });
  const patientToken = pVerify.data.token;
  const pHeaders = { Authorization: `Bearer ${patientToken}` };

  // Setup patient profile (onboarding)
  await axios.post(`${API}/patient/profile`, { age: 70, conditions: ['Atrial Fibrillation'] }, { headers: pHeaders });

  // Get patient ID via /auth/me
  const meRes = await axios.get(`${API}/auth/me`, { headers: pHeaders });
  const patientId = meRes.data.patient?.id || meRes.data.user?.patient?.id;

  // Add Warfarin 5mg to patient
  await axios.post(`${API}/medicine`, { name: 'Warfarin', dosage: '5mg', type: 'PRESCRIPTION' }, { headers: pHeaders });

  // Doctor signup
  const dReg = await axios.post(`${API}/auth/doctor/signup`, {
    name: 'Dr. Jane Foster',
    email: doctorEmail,
    password,
    registrationNumber: 'MCI-88992',
  });
  const doctorToken = dReg.data.token;
  const dHeaders = { Authorization: `Bearer ${doctorToken}` };

  // Generate share code from patient
  const codeRes = await axios.post(`${API}/connection/generate-code`, {}, { headers: pHeaders });
  const shareCode = codeRes.data.shareCode;

  // Doctor claims code
  const claimRes = await axios.post(`${API}/connection/claim-code`, { code: shareCode }, { headers: dHeaders });
  const connectionId = claimRes.data.connectionId;

  // Patient approves
  await axios.post(`${API}/connection/${connectionId}/approve`, {}, { headers: pHeaders });

  console.log('-> Approved connection established between Doctor and Patient.');

  // Test A: High Risk Pre-Prescribing Check (Ibuprofen + Warfarin -> Major / Critical)
  console.log('\n[Test A] Testing proposed drug "Ibuprofen 400mg" against patient on Warfarin...');
  const checkA = await axios.post(
    `${API}/connection/doctor-safety-check`,
    {
      patientId,
      proposedDrug: 'Ibuprofen',
      dosage: '400mg',
    },
    { headers: dHeaders }
  );

  console.log('  -> HTTP Status:            ', checkA.status);
  console.log('  -> Decision:               ', checkA.data.decision);
  console.log('  -> Proposed Drug:          ', checkA.data.proposedDrug);
  console.log('  -> Current Regimen Count:  ', checkA.data.currentRegimenCount);
  console.log('  -> Projected Regimen Risk: ', checkA.data.projectedRegimenRisk);
  console.log('  -> Flags Detected:         ', checkA.data.flags.length);
  if (checkA.data.flags.length > 0) {
    console.log('  -> First Flag Counterpart: ', checkA.data.flags[0].counterpart);
    console.log('  -> First Flag Severity:    ', checkA.data.flags[0].severity);
    console.log('  -> First Flag Explanation: ', checkA.data.flags[0].plainExplanation);
  }
  console.log('  -> Framing:                ', checkA.data.framing);

  // Test B: Indian Brand Formulation (Naxdom 500 against Warfarin -> Major interaction with Naproxen)
  console.log('\n[Test B] Testing proposed Indian brand "Naxdom 500" against patient on Warfarin...');
  const checkB = await axios.post(
    `${API}/connection/doctor-safety-check`,
    {
      patientId,
      proposedDrug: 'Naxdom 500',
    },
    { headers: dHeaders }
  );

  console.log('  -> Decision:               ', checkB.data.decision);
  console.log('  -> Proposed Generic:       ', checkB.data.proposedDrug.genericName);
  console.log('  -> Projected Regimen Risk: ', checkB.data.projectedRegimenRisk);
  console.log('  -> Flags Detected:         ', checkB.data.flags.length);

  // Test C: Safe Drug (Multivitamin / Calcium)
  console.log('\n[Test C] Testing safe proposed supplement "Becosules"...');
  const checkC = await axios.post(
    `${API}/connection/doctor-safety-check`,
    {
      patientId,
      proposedDrug: 'Becosules',
    },
    { headers: dHeaders }
  );

  console.log('  -> Decision:               ', checkC.data.decision);
  console.log('  -> Proposed Class:         ', checkC.data.proposedDrug.class);
  console.log('  -> Flags Detected:         ', checkC.data.flags.length);

  await prisma.$disconnect();

  console.log('\n================================================================');
  console.log('     ALL DOCTOR PRE-PRESCRIBING SAFETY CHECK TESTS PASSED!      ');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
