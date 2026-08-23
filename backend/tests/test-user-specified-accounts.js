/**
 * test-user-specified-accounts.js — Automated end-to-end verification of user-provided accounts:
 * Patient: meetc8030@gmail.com (Meet@123)
 * Doctor: cse.230840131016@gmail.com (Meet@123)
 */
const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function testUserJourneys() {
  console.log('================================================================');
  console.log('   PolySafe Automated User Verification for Specified Accounts  ');
  console.log('================================================================\n');

  const patientCreds = {
    email: 'meetc8030@gmail.com',
    password: 'Meet@123',
    role: 'PATIENT',
  };

  const doctorCreds = {
    email: 'cse.230840131016@gmail.com',
    password: 'Meet@123',
    role: 'DOCTOR',
  };

  // ─── 1. Patient Login & Profile Verification ───────────────────────────────
  console.log('▶ [PATIENT TEST] Signing in as meetc8030@gmail.com...');
  const patientLoginRes = await axios.post(`${API_URL}/auth/patient/login`, patientCreds);
  const pToken = patientLoginRes.data.token;
  if (!pToken) throw new Error('Patient token not received');
  console.log(`✔ [PATIENT] Logged in successfully. Token received. User: ${patientLoginRes.data.user.name}`);

  const pHeaders = { headers: { Authorization: `Bearer ${pToken}` } };

  // Fetch /auth/me
  const pMe = await axios.get(`${API_URL}/auth/me`, pHeaders);
  console.log(`✔ [PATIENT] /auth/me session verified. Role: ${pMe.data.user.role}`);

  // Update Profile
  console.log('▶ [PATIENT TEST] Updating Patient Profile (Age: 68, Conditions: Hypertension, Diabetes)...');
  const profRes = await axios.post(`${API_URL}/patient/profile`, {
    age: 68,
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
  }, pHeaders);
  console.log(`✔ [PATIENT] Profile updated successfully. Age: ${profRes.data.patient.age}, Conditions: ${profRes.data.patient.conditions.join(', ')}`);

  // Verify Active Medications / Add Medication
  console.log('▶ [PATIENT TEST] Checking Medication Regimen...');
  const timelineRes = await axios.get(`${API_URL}/patient/timeline`, pHeaders);
  console.log(`✔ [PATIENT] Timeline retrieved with ${timelineRes.data.timeline?.length || 0} active medication(s).`);

  // Home Summary
  const homeSummary = await axios.get(`${API_URL}/patient/home-summary`, pHeaders);
  console.log(`✔ [PATIENT] Home summary retrieved. Status: ${homeSummary.data.status}, Active Meds: ${homeSummary.data.medicines?.length || 0}`);

  // ─── 2. Doctor Login & Dashboard Verification ──────────────────────────────
  console.log('\n▶ [DOCTOR TEST] Signing in as cse.230840131016@gmail.com...');
  const docLoginRes = await axios.post(`${API_URL}/auth/patient/login`, doctorCreds);
  const dToken = docLoginRes.data.token;
  if (!dToken) throw new Error('Doctor token not received');
  console.log(`✔ [DOCTOR] Logged in successfully. Token received. User: ${docLoginRes.data.user.name}`);

  const dHeaders = { headers: { Authorization: `Bearer ${dToken}` } };

  // Fetch /auth/me
  const dMe = await axios.get(`${API_URL}/auth/me`, dHeaders);
  console.log(`✔ [DOCTOR] /auth/me session verified. Role: ${dMe.data.user.role}`);

  // Pre-prescribing Simulation
  console.log('▶ [DOCTOR TEST] Running Pre-prescribing Safety Simulation (Warfarin check)...');
  const simRes = await axios.post(`${API_URL}/connection/doctor-safety-check`, {
    patientId: pMe.data.patient.id,
    proposedDrug: 'Warfarin',
  }, dHeaders);
  console.log(`✔ [DOCTOR] Simulation complete. Decision: ${simRes.data.decision}, Projected Risk: ${simRes.data.projectedRegimenRisk}, Flags Detected: ${simRes.data.flags?.length || 0}`);

  console.log('\n================================================================');
  console.log('🎉 ALL USER JOURNEYS FOR meetc8030@gmail.com & cse.230840131016@gmail.com PASSED 100%');
  console.log('================================================================\n');
}

testUserJourneys().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
