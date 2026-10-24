'use strict';

/**
 * backend/tests/test-safety-checks.js
 *
 * Test suite for the 5 deterministic safety check engines:
 * 1. DUPLICATE_INGREDIENT: Duplicate paracetamol via Dolo 650 + Combiflam
 * 2. DUPLICATE_CLASS: Two NSAIDs (Ibuprofen + Naproxen)
 * 3. ALLERGY: Penicillin allergy + Amoxicillin (CRITICAL)
 * 4. DISEASE_DRUG: NSAID (Ibuprofen) with kidney condition
 * 5. FOOD_SPACING: Warfarin food tip (Vitamin K / dark leafy greens)
 * 6. FOOD_SPACING: Spacing tip (Levothyroxine + Calcium carbonate separated by 4 hours)
 * 7. Clean regimen produces zero false alerts
 * 8. Doctor endpoint GET /connection/patient-safety-alerts/:patientId requires approved connection (403)
 */

const assert = require('assert');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { runSafetyChecks } = require('../src/services/safetyChecks');

const prisma = new PrismaClient();
const API = process.env.TEST_API_URL || 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('       PolySafe 5-Dimension Safety Check Test Suite            ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(testName, detail = '') {
    passed++;
    console.log(`✔ [PASS] ${testName}`);
    if (detail) console.log(`   └─ ${detail}`);
  }

  function recordFail(testName, err) {
    failed++;
    console.error(`✖ [FAIL] ${testName}`);
    console.error(`   └─ Error: ${err.message || err}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Duplicate Paracetamol via Dolo 650 + Combiflam
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 60, conditions: [], allergies: [] },
      medicines: [
        { id: 'm1', name: 'Dolo 650', dosage: '650mg' },
        { id: 'm2', name: 'Combiflam', dosage: '400mg/325mg' },
      ],
      enableAiRephrasing: false,
    });

    const dupAlert = alerts.find(
      (a) => a.type === 'DUPLICATE_INGREDIENT' && a.clinicalText.toLowerCase().includes('paracetamol')
    );

    assert(dupAlert, 'Expected DUPLICATE_INGREDIENT alert for paracetamol in Dolo 650 + Combiflam');
    assert(
      dupAlert.severity === 'CRITICAL' || dupAlert.severity === 'MAJOR',
      `Expected CRITICAL or MAJOR severity, got: ${dupAlert.severity}`
    );
    assert(dupAlert.source, 'Expected source field to be populated');
    recordPass(
      'Test 1: Duplicate paracetamol via Dolo + Combiflam',
      `Found alert: ${dupAlert.plainText.substring(0, 80)}... [Severity: ${dupAlert.severity}, Source: ${dupAlert.source}]`
    );
  } catch (err) {
    recordFail('Test 1: Duplicate paracetamol via Dolo + Combiflam', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Two NSAIDs (Duplicate Class)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 65, conditions: [], allergies: [] },
      medicines: [
        { id: 'm1', name: 'Ibuprofen', dosage: '400mg' },
        { id: 'm2', name: 'Naproxen', dosage: '250mg' },
      ],
      enableAiRephrasing: false,
    });

    const classAlert = alerts.find(
      (a) =>
        a.type === 'DUPLICATE_CLASS' &&
        (a.clinicalText.toLowerCase().includes('nsaid') || a.plainText.toLowerCase().includes('nsaid'))
    );

    assert(classAlert, 'Expected DUPLICATE_CLASS alert for two concurrent NSAIDs');
    assert(classAlert.source, 'Expected source field on duplicate class alert');
    recordPass(
      'Test 2: Two NSAIDs (Duplicate Class)',
      `Found alert: ${classAlert.plainText.substring(0, 80)}... [Severity: ${classAlert.severity}]`
    );
  } catch (err) {
    recordFail('Test 2: Two NSAIDs (Duplicate Class)', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Penicillin Allergy + Amoxicillin
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 55, conditions: [], allergies: ['Penicillin'] },
      medicines: [{ id: 'm1', name: 'Amoxicillin', dosage: '500mg' }],
      enableAiRephrasing: false,
    });

    const allergyAlert = alerts.find(
      (a) =>
        a.type === 'ALLERGY' &&
        (a.clinicalText.toLowerCase().includes('penicillin') || a.plainText.toLowerCase().includes('penicillin'))
    );

    assert(allergyAlert, 'Expected ALLERGY alert for Amoxicillin with Penicillin allergy');
    assert.strictEqual(
      allergyAlert.severity,
      'CRITICAL',
      `Expected CRITICAL severity for same-group penicillin allergen, got ${allergyAlert.severity}`
    );
    assert(allergyAlert.source, 'Expected source field on allergy alert');
    recordPass(
      'Test 3: Penicillin allergy + Amoxicillin',
      `Found CRITICAL alert: ${allergyAlert.plainText.substring(0, 80)}...`
    );
  } catch (err) {
    recordFail('Test 3: Penicillin allergy + Amoxicillin', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: NSAID with Kidney Condition (Beers / STOPP Caution)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 72, conditions: ['Chronic Kidney Disease Stage 3'], allergies: [] },
      medicines: [{ id: 'm1', name: 'Ibuprofen', dosage: '400mg' }],
      enableAiRephrasing: false,
    });

    const diseaseAlert = alerts.find(
      (a) =>
        a.type === 'DISEASE_DRUG' &&
        (a.clinicalText.toLowerCase().includes('kidney') || a.clinicalText.toLowerCase().includes('renal'))
    );

    assert(diseaseAlert, 'Expected DISEASE_DRUG alert for NSAID with kidney condition');
    assert(
      diseaseAlert.severity === 'CRITICAL' || diseaseAlert.severity === 'MAJOR',
      `Expected CRITICAL or MAJOR severity, got: ${diseaseAlert.severity}`
    );
    assert(diseaseAlert.source, 'Expected source field on disease-drug alert');
    recordPass(
      'Test 4: NSAID with kidney condition',
      `Found alert: ${diseaseAlert.plainText.substring(0, 80)}... [Source: ${diseaseAlert.source}]`
    );
  } catch (err) {
    recordFail('Test 4: NSAID with kidney condition', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: Warfarin Food Tip (Vitamin K consistency)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 68, conditions: [], allergies: [] },
      medicines: [{ id: 'm1', name: 'Warfarin', dosage: '5mg' }],
      enableAiRephrasing: false,
    });

    const foodAlert = alerts.find(
      (a) =>
        a.type === 'FOOD_SPACING' &&
        (a.plainText.toLowerCase().includes('vitamin k') || a.plainText.toLowerCase().includes('leafy green'))
    );

    assert(foodAlert, 'Expected FOOD_SPACING alert for Warfarin regarding Vitamin K intake');
    assert(foodAlert.source, 'Expected source field on food alert');
    recordPass(
      'Test 5: Warfarin food tip',
      `Found alert: ${foodAlert.plainText.substring(0, 80)}... [Source: ${foodAlert.source}]`
    );
  } catch (err) {
    recordFail('Test 5: Warfarin food tip', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6: Spacing Tip (Levothyroxine + Calcium carbonate 4 hours apart)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 62, conditions: [], allergies: [] },
      medicines: [
        { id: 'm1', name: 'Levothyroxine', dosage: '50mcg' },
        { id: 'm2', name: 'Calcium Carbonate', dosage: '500mg' },
      ],
      enableAiRephrasing: false,
    });

    const spacingAlert = alerts.find(
      (a) =>
        a.type === 'FOOD_SPACING' &&
        (a.plainText.toLowerCase().includes('4 hour') || a.clinicalText.toLowerCase().includes('4-hour') || a.plainText.toLowerCase().includes('calcium'))
    );

    assert(spacingAlert, 'Expected FOOD_SPACING alert for Levothyroxine and Calcium 4-hour separation');
    recordPass(
      'Test 6: Spacing tip (Levothyroxine + Calcium)',
      `Found alert: ${spacingAlert.plainText.substring(0, 80)}...`
    );
  } catch (err) {
    recordFail('Test 6: Spacing tip (Levothyroxine + Calcium)', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 7: No False Alert for Clean Regimen
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alerts = await runSafetyChecks({
      patient: { age: 30, conditions: [], allergies: [] },
      medicines: [{ id: 'm1', name: 'Vitamin C', dosage: '500mg' }],
      enableAiRephrasing: false,
    });

    assert.strictEqual(alerts.length, 0, `Clean regimen should produce zero alerts, but got ${alerts.length}`);
    recordPass(
      'Test 7: No false alert for a clean regimen',
      `Zero alerts generated for clean regimen (alerts count: 0).`
    );
  } catch (err) {
    recordFail('Test 7: No false alert for a clean regimen', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 8: Doctor Endpoint Requires Approved Connection (403)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    // Create an unapproved doctor and test GET /connection/patient-safety-alerts/:patientId
    const docEmail = `unapproved_doc_${Date.now()}@example.com`;
    const password = 'Password123!';

    // Register doctor
    const docRes = await axios.post(`${API}/auth/doctor/signup`, {
      name: 'Dr. Unapproved',
      email: docEmail,
      password,
      registrationNumber: `MCI-${Date.now().toString().slice(-6)}`,
    });
    const docToken = docRes.data.token;

    // Use a random or demo patient ID
    const samplePatient = await prisma.patient.findFirst();
    const targetPatientId = samplePatient ? samplePatient.id : 'non-existent-patient-id';

    let got403 = false;
    try {
      await axios.get(`${API}/connection/patient-safety-alerts/${targetPatientId}`, {
        headers: { Authorization: `Bearer ${docToken}` },
      });
    } catch (httpErr) {
      if (httpErr.response && httpErr.response.status === 403) {
        got403 = true;
      } else {
        throw new Error(`Expected HTTP 403, got: ${httpErr.response?.status || httpErr.message}`);
      }
    }

    assert(got403, 'Doctor without approved connection must receive HTTP 403 Forbidden');
    recordPass(
      'Test 8: Doctor endpoint requires approved connection',
      `GET /connection/patient-safety-alerts/:patientId returned HTTP 403 Forbidden as required.`
    );
  } catch (err) {
    recordFail('Test 8: Doctor endpoint requires approved connection', err);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (e) => {
  console.error('Test suite runner crashed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
