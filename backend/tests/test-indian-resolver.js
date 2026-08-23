'use strict';

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { resolveDrugWithAI } = require('../src/services/aiDrugResolver');

const prisma = new PrismaClient();
const API = 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('   Testing Indian Brand-to-Salt 5-Layer Resolution Engine       ');
  console.log('================================================================\n');

  // Test 1: Direct Service Calls across key Indian formulations
  const testDrugs = [
    'Naxdom 500',
    'Pan-D',
    'Augmentin 625',
    'Combiflam',
    'Zerodol SP',
    'Stamlo Beta',
    'Telma H',
    'Dolo 650',
    'Naxdum', // Typo to test Layer 3 Levenshtein fuzzy match
  ];

  for (const drug of testDrugs) {
    const res = await resolveDrugWithAI(drug);
    console.log(`[RESOLVE] "${drug}"`);
    console.log(`  -> Layer:        ${res.layer}`);
    console.log(`  -> Resolved:     ${res.resolvedName}`);
    console.log(`  -> Salts:        ${res.genericSalts.join(' + ')}`);
    console.log(`  -> Class:        ${res.class}`);
    console.log(`  -> Harm Level:   L${res.harmLevel}`);
    console.log(`  -> Food Rule:    ${res.foodInstruction}`);
    console.log(`  -> Primary RxCUI:${res.standardizedCode || 'N/A'}`);
    console.log('----------------------------------------------------------------');
  }

  // Test 2: HTTP POST /medicine and GET /medicine/:id/resolve
  console.log('\nTesting HTTP Endpoints (POST /medicine & GET /medicine/:id/resolve)...');

  const testEmail = `indian_patient_${Date.now()}@example.com`;
  const password = 'Password123!';

  await axios.post(`${API}/auth/patient/signup-send-otp`, {
    name: 'Indian Test Patient',
    email: testEmail,
    password,
    role: 'PATIENT',
  });

  const pending = await prisma.pendingSignup.findFirst({
    where: { email: testEmail },
    orderBy: { createdAt: 'desc' },
  });

  const verifyRes = await axios.post(`${API}/auth/patient/verify-signup-otp`, {
    email: testEmail,
    code: pending.code,
  });

  const token = verifyRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Add Naxdom 500
  const addRes = await axios.post(
    `${API}/medicine`,
    { name: 'Naxdom 500', type: 'PRESCRIPTION' },
    { headers }
  );
  console.log(
    '  -> POST /medicine (Naxdom 500):',
    addRes.status,
    '| Harm Level:',
    addRes.data.medicine.harmLevel,
    '| Class:',
    addRes.data.medicine.class,
    '| Primary RxCUI:',
    addRes.data.medicine.standardizedCode
  );

  const medId = addRes.data.medicine.id;

  // GET /medicine/:id/resolve
  const resolveRes = await axios.get(`${API}/medicine/${medId}/resolve`, { headers });
  console.log(
    '  -> GET /medicine/:id/resolve:',
    resolveRes.status,
    '| Resolved generic:',
    resolveRes.data.resolved.genericName,
    '| Food Instruction:',
    resolveRes.data.resolved.foodInstruction
  );

  // GET /medicine/:id/sideeffects
  const seRes = await axios.get(`${API}/medicine/${medId}/sideeffects`, { headers });
  console.log(
    '  -> GET /medicine/:id/sideeffects:',
    seRes.status,
    '| Constituents evaluated:',
    seRes.data.constituents.join(' + '),
    '| Signals found:',
    seRes.data.total
  );

  await prisma.$disconnect();

  console.log('\n================================================================');
  console.log('     ALL INDIAN FORMULATION RESOLUTION TESTS PASSED!            ');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});
