'use strict';

/**
 * backend/tests/test-dose-tracking.js
 *
 * Automated Test Suite for Dose Tracking, Adherence, Caregiver Visibility & Reminders
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 * 1. POST /patient/dose (Mark a scheduled dose as TAKEN with timestamp)
 * 2. POST /patient/dose (Mark a scheduled dose as SKIPPED)
 * 3. GET /patient/doses?date=YYYY-MM-DD (Retrieve day's schedule & dose logs)
 * 4. GET /patient/adherence?days=7 (Compute adherence percentage & consecutive streak)
 * 5. GET /caregiver/patient-summary/:patientId (Validate adherence %, today's missed doses, and ZERO drug names exposed)
 * 6. POST /caregiver/remind-patient/:patientId (Caregiver pings patient with live dose reminder)
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API = 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('     PolySafe Dose Tracking & Live Caregiver Test Suite         ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // ── Setup: Create Patient & Caregiver ───────────────────────────────────
    const timestamp = Date.now();
    const patientEmail = `dose_patient_${timestamp}@example.com`;
    const caregiverEmail = `dose_caregiver_${timestamp}@example.com`;
    const password = 'Password123!';

    // Signup Patient
    await axios.post(`${API}/auth/patient/signup-send-otp`, {
      name: 'Kamala Sharma',
      email: patientEmail,
      password,
      role: 'PATIENT',
    });
    const pendingP = await prisma.pendingSignup.findFirst({
      where: { email: patientEmail },
      orderBy: { createdAt: 'desc' },
    });
    const pVerify = await axios.post(`${API}/auth/patient/verify-signup-otp`, {
      email: patientEmail,
      code: pendingP.code,
    });
    const patientToken = pVerify.data.token;
    const pHeaders = { Authorization: `Bearer ${patientToken}` };

    // Onboard Patient Profile
    await axios.post(
      `${API}/patient/profile`,
      { age: 72, conditions: ['Hypertension', 'Type 2 Diabetes'], allergies: ['Penicillin'] },
      { headers: pHeaders }
    );

    // Get Patient record
    const meRes = await axios.get(`${API}/auth/me`, { headers: pHeaders });
    const patientId = meRes.data.patient?.id || meRes.data.user?.patient?.id;

    // Add 2 test medicines
    const med1Res = await axios.post(
      `${API}/medicine`,
      { name: 'Metformin HCl', dosage: '500mg', type: 'PRESCRIPTION' },
      { headers: pHeaders }
    );
    const med1 = med1Res.data.medicine;

    const med2Res = await axios.post(
      `${API}/medicine`,
      { name: 'Telmisartan', dosage: '40mg', type: 'PRESCRIPTION' },
      { headers: pHeaders }
    );
    const med2 = med2Res.data.medicine;

    // Signup Caregiver
    await axios.post(`${API}/auth/patient/signup-send-otp`, {
      name: 'Rajesh Sharma',
      email: caregiverEmail,
      password,
      role: 'CAREGIVER',
    });
    const pendingC = await prisma.pendingSignup.findFirst({
      where: { email: caregiverEmail },
      orderBy: { createdAt: 'desc' },
    });
    const cVerify = await axios.post(`${API}/auth/patient/verify-signup-otp`, {
      email: caregiverEmail,
      code: pendingC.code,
    });
    const caregiverToken = cVerify.data.token;
    const cHeaders = { Authorization: `Bearer ${caregiverToken}` };

    // Patient generates invite code for Caregiver
    const codeRes = await axios.post(`${API}/connection/generate-code`, { role: 'CAREGIVER' }, { headers: pHeaders });
    const shareCode = codeRes.data.shareCode;

    // Caregiver claims invite code
    const claimRes = await axios.post(`${API}/connection/claim-code`, { code: shareCode }, { headers: cHeaders });
    const connectionId = claimRes.data.connectionId;

    // Patient approves caregiver connection
    await axios.post(`${API}/connection/${connectionId}/approve`, {}, { headers: pHeaders });
    console.log('-> Approved connection established between Caregiver and Patient.\n');

    const todayStr = new Date().toISOString().slice(0, 10);
    const scheduledMorning = new Date(`${todayStr}T08:00:00.000Z`).toISOString();
    const scheduledMidday = new Date(`${todayStr}T12:00:00.000Z`).toISOString();

    // ── Test 1: POST /patient/dose (TAKEN) ───────────────────────────────────
    console.log('[Test 1] Marking Med 1 as TAKEN...');
    const dose1Res = await axios.post(
      `${API}/patient/dose`,
      {
        medicineId: med1.id,
        scheduledFor: scheduledMorning,
        status: 'TAKEN',
        takenAt: new Date().toISOString(),
      },
      { headers: pHeaders }
    );

    assert(
      dose1Res.status === 200 && dose1Res.data.doseLog?.status === 'TAKEN',
      'POST /patient/dose (TAKEN)',
      `Status: ${dose1Res.data.doseLog?.status}, DoseLog ID: ${dose1Res.data.doseLog?.id}`
    );

    // ── Test 2: POST /patient/dose (SKIPPED) ─────────────────────────────────
    console.log('\n[Test 2] Marking Med 2 as SKIPPED...');
    const dose2Res = await axios.post(
      `${API}/patient/dose`,
      {
        medicineId: med2.id,
        scheduledFor: scheduledMidday,
        status: 'SKIPPED',
      },
      { headers: pHeaders }
    );

    assert(
      dose2Res.status === 200 && dose2Res.data.doseLog?.status === 'SKIPPED',
      'POST /patient/dose (SKIPPED)',
      `Status: ${dose2Res.data.doseLog?.status}, DoseLog ID: ${dose2Res.data.doseLog?.id}`
    );

    // ── Test 3: GET /patient/doses?date=YYYY-MM-DD ───────────────────────────
    console.log(`\n[Test 3] Querying doses for ${todayStr}...`);
    const dosesRes = await axios.get(`${API}/patient/doses?date=${todayStr}`, { headers: pHeaders });
    const dayData = dosesRes.data;

    assert(
      dosesRes.status === 200 &&
        Array.isArray(dayData.doses) &&
        dayData.doses.length >= 2 &&
        dayData.summary.taken >= 1 &&
        dayData.summary.skipped >= 1,
      'GET /patient/doses?date=YYYY-MM-DD',
      `Total doses: ${dayData.doses.length}, Taken: ${dayData.summary.taken}, Skipped: ${dayData.summary.skipped}`
    );

    // ── Test 4: GET /patient/adherence?days=7 ────────────────────────────────
    console.log('\n[Test 4] Computing 7-day adherence and streak...');
    const adhRes = await axios.get(`${API}/patient/adherence?days=7`, { headers: pHeaders });
    const adh = adhRes.data;

    assert(
      adhRes.status === 200 &&
        typeof adh.adherencePercentage === 'number' &&
        typeof adh.streakDays === 'number' &&
        Array.isArray(adh.dailyHistory) &&
        adh.dailyHistory.length === 7,
      'GET /patient/adherence?days=7',
      `Adherence: ${adh.adherencePercentage}%, Streak: ${adh.streakDays} days, Days returned: ${adh.dailyHistory.length}`
    );

    // ── Test 5: GET /caregiver/patient-summary/:patientId (Privacy Rule Check)
    console.log('\n[Test 5] Checking Caregiver Patient Summary (Privacy & Missed Doses)...');
    const careSumRes = await axios.get(`${API}/caregiver/patient-summary/${patientId}`, { headers: cHeaders });
    const careSum = careSumRes.data;

    // Strict privacy verification: Check that NO response key contains "Metformin" or "Telmisartan"
    const rawJson = JSON.stringify(careSum);
    const leaksDrugName = rawJson.toLowerCase().includes('metformin') || rawJson.toLowerCase().includes('telmisartan');

    assert(
      careSumRes.status === 200 &&
        typeof careSum.adherencePercentage === 'number' &&
        Array.isArray(careSum.todayMissedDoses) &&
        !leaksDrugName,
      'GET /caregiver/patient-summary/:patientId',
      `Adherence: ${careSum.adherencePercentage}%, Missed Doses: ${careSum.todayMissedCount}, Drug Names Leaked: ${leaksDrugName ? 'YES ❌' : 'NO (Protected) ✅'}`
    );

    // ── Test 6: POST /caregiver/remind-patient/:patientId ───────────────────
    console.log('\n[Test 6] Caregiver sending live dose reminder ping...');
    const remindRes = await axios.post(
      `${API}/caregiver/remind-patient/${patientId}`,
      {},
      { headers: cHeaders }
    );

    assert(
      remindRes.status === 200 && remindRes.data.success === true,
      'POST /caregiver/remind-patient/:patientId',
      remindRes.data.message
    );

  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`                TEST SUMMARY: ${passed} PASSED, ${failed} FAILED               `);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
