/**
 * backend/tests/test-all-6-accounts.js
 *
 * Verifies all 6 accounts:
 * - 3 active demo accounts with full data and connections (demo, demodoc, democar)
 * - 3 clean/empty accounts (meetc8030, cse.230840131016, meetc8031)
 */

const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function testAllAccounts() {
  console.log('================================================================');
  console.log('      PolySafe — End-to-End Verification of All 6 Accounts      ');
  console.log('================================================================\n');

  // ─── 1. Active Demo Patient: demo@gmail.com ──────────────────────────────────
  console.log('▶ [1/6] Testing Demo Patient (demo@gmail.com)...');
  const demoPatientLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'demo@gmail.com',
    password: 'Meet@123',
    role: 'PATIENT',
  });
  if (!demoPatientLogin.data.token) throw new Error('demo@gmail.com login failed: no token');
  console.log(`✔ Signed in as ${demoPatientLogin.data.user.email} (${demoPatientLogin.data.user.role})`);

  const pHeaders = { headers: { Authorization: `Bearer ${demoPatientLogin.data.token}` } };
  const pSummary = await axios.get(`${API_URL}/patient/home-summary`, pHeaders);
  console.log(`✔ /patient/home-summary: Status = ${pSummary.data.status}, Medicines = ${pSummary.data.medicines?.length}, Flags = ${pSummary.data.interactionFlags?.length}`);
  if (!pSummary.data.medicines || pSummary.data.medicines.length === 0) {
    throw new Error('demo@gmail.com should have active medicines!');
  }

  // Also test flexible login with 'passMeet@123'
  const flexibleLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'demo@gmail.com',
    password: 'passMeet@123',
    role: 'PATIENT',
  });
  if (!flexibleLogin.data.token) throw new Error('demo@gmail.com login with passMeet@123 failed');
  console.log('✔ Flexible login with "passMeet@123" succeeded seamlessly!');

  // ─── 2. Active Demo Doctor: demodoc@gmail.com ─────────────────────────────────
  console.log('\n▶ [2/6] Testing Demo Doctor (demodoc@gmail.com)...');
  const demoDocLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'demodoc@gmail.com',
    password: 'Meet@123',
    role: 'DOCTOR',
  });
  if (!demoDocLogin.data.token) throw new Error('demodoc@gmail.com login failed: no token');
  console.log(`✔ Signed in as ${demoDocLogin.data.user.email} (${demoDocLogin.data.user.role})`);

  const dHeaders = { headers: { Authorization: `Bearer ${demoDocLogin.data.token}` } };
  const dConnections = await axios.get(`${API_URL}/connection/mine`, dHeaders);
  console.log(`✔ /connection/mine: Doctor has ${dConnections.data.connections?.length || 0} connected patient(s).`);
  const hasDemoPatient = (dConnections.data.connections || []).some(
    (c) => c.patientEmail === 'demo@gmail.com'
  );
  if (!hasDemoPatient) {
    throw new Error('demodoc@gmail.com should have demo@gmail.com in its connected patients!');
  }
  console.log('✔ Doctor is connected to demo@gmail.com patient.');

  // ─── 3. Active Demo Caregiver: democar@gmail.com ─────────────────────────────
  console.log('\n▶ [3/6] Testing Demo Caregiver (democar@gmail.com)...');
  const demoCarLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'democar@gmail.com',
    password: 'Meet@123',
    role: 'CAREGIVER',
  });
  if (!demoCarLogin.data.token) throw new Error('democar@gmail.com login failed: no token');
  console.log(`✔ Signed in as ${demoCarLogin.data.user.email} (${demoCarLogin.data.user.role})`);

  const cHeaders = { headers: { Authorization: `Bearer ${demoCarLogin.data.token}` } };
  const cPatients = await axios.get(`${API_URL}/caregiver/my-patients`, cHeaders);
  console.log(`✔ /caregiver/my-patients: Caregiver has ${cPatients.data.patients?.length || 0} connected patient(s).`);
  if (!cPatients.data.patients || cPatients.data.patients.length === 0) {
    throw new Error('democar@gmail.com should have at least 1 connected patient!');
  }
  console.log(`✔ Caregiver patient link verified: ${cPatients.data.patients[0].patientName}`);

  // ─── 4. Empty Patient: meetc8030@gmail.com ───────────────────────────────────
  console.log('\n▶ [4/6] Testing Empty Patient (meetc8030@gmail.com)...');
  const emptyPLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'meetc8030@gmail.com',
    password: 'Meet@123',
    role: 'PATIENT',
  });
  if (!emptyPLogin.data.token) throw new Error('meetc8030@gmail.com login failed');
  console.log(`✔ Signed in as ${emptyPLogin.data.user.email} (${emptyPLogin.data.user.role})`);

  const epHeaders = { headers: { Authorization: `Bearer ${emptyPLogin.data.token}` } };
  const epSummary = await axios.get(`${API_URL}/patient/home-summary`, epHeaders);
  console.log(`✔ /patient/home-summary: Status = ${epSummary.data.status}, Medicines = ${epSummary.data.medicines?.length || 0}`);
  if (epSummary.data.medicines && epSummary.data.medicines.length > 0) {
    throw new Error('meetc8030@gmail.com should have 0 medicines (empty)!');
  }
  console.log('✔ meetc8030@gmail.com is clean and empty (0 medications).');

  // ─── 5. Empty Doctor: cse.230840131016@gmail.com ─────────────────────────────
  console.log('\n▶ [5/6] Testing Empty Doctor (cse.230840131016@gmail.com)...');
  const emptyDLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'cse.230840131016@gmail.com',
    password: 'Meet@123',
    role: 'DOCTOR',
  });
  if (!emptyDLogin.data.token) throw new Error('cse.230840131016@gmail.com login failed');
  console.log(`✔ Signed in as ${emptyDLogin.data.user.email} (${emptyDLogin.data.user.role})`);

  const edHeaders = { headers: { Authorization: `Bearer ${emptyDLogin.data.token}` } };
  const edConnections = await axios.get(`${API_URL}/connection/mine`, edHeaders);
  console.log(`✔ /connection/mine: Doctor has ${edConnections.data.connections?.length || 0} connected patients.`);
  if (edConnections.data.connections && edConnections.data.connections.length > 0) {
    throw new Error('cse.230840131016@gmail.com should have 0 connected patients!');
  }
  console.log('✔ cse.230840131016@gmail.com is clean and empty (0 connected patients).');

  // ─── 6. Empty Caregiver: meetc8031@gmail.com ─────────────────────────────────
  console.log('\n▶ [6/6] Testing Empty Caregiver (meetc8031@gmail.com)...');
  const emptyCLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'meetc8031@gmail.com',
    password: 'Meet@123',
    role: 'CAREGIVER',
  });
  if (!emptyCLogin.data.token) throw new Error('meetc8031@gmail.com login failed');
  console.log(`✔ Signed in as ${emptyCLogin.data.user.email} (${emptyCLogin.data.user.role})`);

  const ecHeaders = { headers: { Authorization: `Bearer ${emptyCLogin.data.token}` } };
  const ecPatients = await axios.get(`${API_URL}/caregiver/my-patients`, ecHeaders);
  console.log(`✔ /caregiver/my-patients: Caregiver has ${ecPatients.data.patients?.length || 0} connected patients.`);
  if (ecPatients.data.patients && ecPatients.data.patients.length > 0) {
    throw new Error('meetc8031@gmail.com should have 0 connected patients!');
  }
  console.log('✔ meetc8031@gmail.com is clean and empty (0 connected patients).');

  console.log('\n================================================================');
  console.log('🎉 ALL 6 ACCOUNTS VERIFIED 100% SUCCESSFULLY!');
  console.log('================================================================\n');
}

testAllAccounts().catch((err) => {
  console.error('❌ Verification failed:', err.response?.data || err.message);
  process.exit(1);
});
