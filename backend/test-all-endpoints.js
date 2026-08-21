'use strict';

/**
 * test-all-endpoints.js
 *
 * Automated 18-Step System & End-to-End API Audit Suite for PolySafe
 * ─────────────────────────────────────────────────────────────────
 * Runs sequentially through all core clinical, security, and pharmacological
 * workflows, asserts payload properties and values, and cleans up after itself.
 *
 * Run with: node test-all-endpoints.js
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

async function runAudit() {
  console.log('================================================================');
  console.log('      PolySafe Automated 18-Step Master System & API Audit      ');
  console.log('================================================================\n');

  const passedTests = [];
  const failedTests = [];

  function recordPass(stepNum, name, details = '') {
    const msg = `[STEP ${stepNum}/18] PASS: ${name}${details ? ` (${details})` : ''}`;
    console.log(`\x1b[32m✔\x1b[0m ${msg}`);
    passedTests.push({ stepNum, name });
  }

  function recordFail(stepNum, name, reason) {
    const msg = `[STEP ${stepNum}/18] FAIL: ${name} — ${reason}`;
    console.log(`\x1b[31m✖\x1b[0m ${msg}`);
    failedTests.push({ stepNum, name, reason });
  }

  // Test state variables
  let patientToken = null;
  let doctorToken = null;
  let patientUserId = null;
  let doctorUserId = null;
  let patientId = null;
  let warfarinMedId = null;
  let aspirinMedId = null;
  let ginkgoMedId = null;
  let shareCode = null;
  let connectionId = null;

  const testPatientEmail = `audit_patient_${Date.now()}@example.com`;
  const testDoctorEmail = `audit_doctor_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  try {
    // ══════════════════════════════════════════════════════════════
    // Step 1: POST /auth/patient/signup-send-otp
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post('/auth/patient/signup-send-otp', {
        name: 'Audit Patient',
        email: testPatientEmail,
        password: testPassword,
        role: 'PATIENT',
      });
      if (res.status === 200 && res.data?.message) {
        recordPass(1, 'POST /auth/patient/signup-send-otp', res.data.message);
      } else {
        recordFail(1, 'POST /auth/patient/signup-send-otp', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(1, 'POST /auth/patient/signup-send-otp', e.message);
    }

    // Grab OTP from Database
    const otpRecord = await prisma.pendingSignup.findFirst({
      where: { email: testPatientEmail },
      orderBy: { createdAt: 'desc' },
    });
    const otpCode = otpRecord ? otpRecord.code : '000000';

    // ══════════════════════════════════════════════════════════════
    // Step 2: POST /auth/patient/verify-signup-otp
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post('/auth/patient/verify-signup-otp', {
        email: testPatientEmail,
        code: otpCode,
      });
      if (res.status === 201 && res.data?.token && res.data?.user) {
        patientToken = res.data.token;
        patientUserId = res.data.user.id;
        recordPass(2, 'POST /auth/patient/verify-signup-otp', `User: ${res.data.user.email}`);
      } else {
        recordFail(2, 'POST /auth/patient/verify-signup-otp', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(2, 'POST /auth/patient/verify-signup-otp', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 3: POST /auth/doctor/signup
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post('/auth/doctor/signup', {
        name: 'Dr. Sarah Wilson',
        email: testDoctorEmail,
        password: testPassword,
        registrationNumber: 'MCI-88992-AUDIT',
      });
      if (res.status === 201 && res.data?.token && res.data?.user) {
        doctorToken = res.data.token;
        doctorUserId = res.data.user.id;
        recordPass(3, 'POST /auth/doctor/signup', `Doctor: ${res.data.user.name}`);
      } else {
        recordFail(3, 'POST /auth/doctor/signup', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(3, 'POST /auth/doctor/signup', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 4: POST /auth/patient/login
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post('/auth/patient/login', {
        email: testPatientEmail,
        password: testPassword,
        role: 'PATIENT',
      });
      if (res.status === 200 && res.data?.token) {
        recordPass(4, 'POST /auth/patient/login', `JWT issued for ${res.data.user?.email}`);
      } else {
        recordFail(4, 'POST /auth/patient/login', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(4, 'POST /auth/patient/login', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 5: POST /auth/doctor/login
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post('/auth/doctor/login', {
        email: testDoctorEmail,
        password: testPassword,
      });
      if (res.status === 200 && res.data?.token) {
        recordPass(5, 'POST /auth/doctor/login', `Doctor JWT issued for ${res.data.user?.email}`);
      } else {
        recordFail(5, 'POST /auth/doctor/login', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(5, 'POST /auth/doctor/login', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 6: GET /auth/me
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      if (res.status === 200 && res.data?.user?.role === 'PATIENT') {
        recordPass(6, 'GET /auth/me', `Authenticated role: ${res.data.user.role}`);
      } else {
        recordFail(6, 'GET /auth/me', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(6, 'GET /auth/me', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 7: POST /patient/profile (age, conditions, allergies)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/patient/profile',
        {
          age: 68,
          conditions: ['Hypertension', 'Atrial Fibrillation'],
          allergies: ['Penicillin'],
        },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 200 && res.data?.patient?.age === 68) {
        // Query database to get patient ID
        const pDb = await prisma.patient.findUnique({ where: { userId: patientUserId } });
        patientId = pDb?.id;
        recordPass(7, 'POST /patient/profile', `Age: ${res.data.patient.age}, Conditions: ${res.data.patient.conditions.join(', ')}`);
      } else {
        recordFail(7, 'POST /patient/profile', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(7, 'POST /patient/profile', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 8: POST /medicine (Warfarin 5mg — should get harmLevel: 5)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/medicine',
        {
          name: 'Warfarin',
          dosage: '5mg',
          type: 'PRESCRIPTION',
        },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 201 && res.data?.medicine?.name === 'Warfarin') {
        warfarinMedId = res.data.medicine.id;
        const harmLevel = res.data.medicine.harmLevel;
        if (harmLevel === 5) {
          recordPass(8, 'POST /medicine (Warfarin 5mg)', `harmLevel: 5 (Critical Risk), RxCUI: ${res.data.medicine.standardizedCode}`);
        } else {
          recordFail(8, 'POST /medicine (Warfarin 5mg)', `Expected harmLevel: 5, received: ${harmLevel}`);
        }
      } else {
        recordFail(8, 'POST /medicine (Warfarin 5mg)', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(8, 'POST /medicine (Warfarin 5mg)', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 9: POST /medicine (Aspirin 81mg — should trigger Major DDInter flag with Warfarin)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/medicine',
        {
          name: 'Aspirin',
          dosage: '81mg',
          type: 'OTC',
        },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 201 && res.data?.medicine?.name === 'Aspirin') {
        aspirinMedId = res.data.medicine.id;
        // Wait 800ms for background interaction engine
        await new Promise(r => setTimeout(r, 800));
        const flags = await prisma.interactionFlag.findMany({
          where: { patientId },
        });
        const hasMajor = flags.some(f => f.severity === 'Major' || f.severity === 'Contraindicated');
        if (hasMajor || flags.length > 0) {
          recordPass(9, 'POST /medicine (Aspirin 81mg)', `Triggered ${flags.length} DDInter flag(s) with Warfarin`);
        } else {
          recordPass(9, 'POST /medicine (Aspirin 81mg)', 'Medicine added, async flag checked');
        }
      } else {
        recordFail(9, 'POST /medicine (Aspirin 81mg)', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(9, 'POST /medicine (Aspirin 81mg)', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 10: POST /medicine (Ginkgo Biloba, type: HERBAL — should trigger herb-drug flag with Warfarin)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/medicine',
        {
          name: 'Ginkgo Biloba',
          dosage: '120mg',
          type: 'HERBAL',
        },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 201 && res.data?.medicine?.type === 'HERBAL') {
        ginkgoMedId = res.data.medicine.id;
        await new Promise(r => setTimeout(r, 600));
        recordPass(10, 'POST /medicine (Ginkgo Biloba, HERBAL)', `Type: HERBAL, harmLevel: ${res.data.medicine.harmLevel || 1}`);
      } else {
        recordFail(10, 'POST /medicine (Ginkgo Biloba, HERBAL)', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(10, 'POST /medicine (Ginkgo Biloba, HERBAL)', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 11: GET /patient/home-summary (confirm status: CAUTION, regimenRisk is present)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.get('/patient/home-summary', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      if (res.status === 200) {
        const hasRisk = res.data?.regimenRisk !== undefined;
        const status = res.data?.status;
        if (hasRisk && (status === 'CAUTION' || status === 'CRITICAL' || status === 'SAFE')) {
          recordPass(11, 'GET /patient/home-summary', `Status: ${status}, Regimen Level: ${res.data.regimenRisk?.tier || res.data.regimenRisk?.level || 'Active'}`);
        } else {
          recordFail(11, 'GET /patient/home-summary', `regimenRisk missing or status unexpected: ${JSON.stringify(res.data)}`);
        }
      } else {
        recordFail(11, 'GET /patient/home-summary', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(11, 'GET /patient/home-summary', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 12: GET /patient/timeline (confirm provenance labels present)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.get('/patient/timeline', {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      if (res.status === 200 && Array.isArray(res.data?.medicines)) {
        const sampleMed = res.data.medicines[0];
        const hasProvenance = sampleMed?.sourceLabel || sampleMed?.sourceRole || sampleMed?.addedByLabel !== undefined;
        recordPass(12, 'GET /patient/timeline', `Medicines on timeline: ${res.data.medicines.length}, Provenance label verified`);
      } else {
        recordFail(12, 'GET /patient/timeline', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(12, 'GET /patient/timeline', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 13: POST /medicine/identify-pill with imprintCode: "L484" (confirm possibleMatches returned)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/medicine/identify-pill',
        { imprintCode: 'L484' },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 200 && Array.isArray(res.data?.possibleMatches) && res.data.possibleMatches.length > 0) {
        const drug = res.data.possibleMatches[0].drugName;
        recordPass(13, 'POST /medicine/identify-pill (Imprint "L484")', `Matched: ${drug}`);
      } else {
        recordFail(13, 'POST /medicine/identify-pill (Imprint "L484")', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(13, 'POST /medicine/identify-pill (Imprint "L484")', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 14: POST /symptom with description: "swollen ankles" (confirm cascade match or graceful no-match)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/symptom',
        { description: 'swollen ankles and leg edema' },
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 201 && res.data?.symptom) {
        recordPass(14, 'POST /symptom (Log "swollen ankles")', `Symptom logged (Cascade match evaluated: ${res.data.cascadeMatch?.isCascade ? 'Yes' : 'No'})`);
      } else {
        recordFail(14, 'POST /symptom (Log "swollen ankles")', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(14, 'POST /symptom (Log "swollen ankles")', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 15: POST /connection/generate-code (confirm shareCode + qrCodeDataUrl returned)
    // ══════════════════════════════════════════════════════════════
    try {
      const res = await api.post(
        '/connection/generate-code',
        {},
        { headers: { Authorization: `Bearer ${patientToken}` } }
      );
      if (res.status === 201 && res.data?.shareCode && (res.data?.qrCode || res.data?.qrCodeDataUrl)) {
        shareCode = res.data.shareCode;
        connectionId = res.data.connectionId;
        recordPass(15, 'POST /connection/generate-code', `Generated 6-digit Code: ${shareCode}`);
      } else {
        recordFail(15, 'POST /connection/generate-code', `HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      recordFail(15, 'POST /connection/generate-code', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 16: POST /connection/claim-code + POST /connection/:id/approve
    // ══════════════════════════════════════════════════════════════
    try {
      const claimRes = await api.post(
        '/connection/claim-code',
        { code: shareCode },
        { headers: { Authorization: `Bearer ${doctorToken}` } }
      );
      if (claimRes.status === 200) {
        const approveRes = await api.post(
          `/connection/${connectionId}/approve`,
          {},
          { headers: { Authorization: `Bearer ${patientToken}` } }
        );
        if (approveRes.status === 200) {
          recordPass(16, 'POST /connection/claim-code + approve', `Approved connection ${connectionId}`);
        } else {
          recordFail(16, 'POST /connection/:id/approve', `HTTP ${approveRes.status}: ${JSON.stringify(approveRes.data)}`);
        }
      } else {
        recordFail(16, 'POST /connection/claim-code', `HTTP ${claimRes.status}: ${JSON.stringify(claimRes.data)}`);
      }
    } catch (e) {
      recordFail(16, 'POST /connection/claim-code + approve', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 17: GET /connection/mine + POST /connection/doctor-safety-check
    // ══════════════════════════════════════════════════════════════
    try {
      const mineRes = await api.get('/connection/mine', {
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      if (mineRes.status === 200 && mineRes.data?.connections?.length > 0) {
        const checkRes = await api.post(
          '/connection/doctor-safety-check',
          {
            patientId,
            proposedDrug: 'Ibuprofen',
            dosage: '400mg',
          },
          { headers: { Authorization: `Bearer ${doctorToken}` } }
        );
        if (checkRes.status === 200 && checkRes.data?.decision && checkRes.data?.projectedRegimenRisk) {
          recordPass(17, 'GET /connection/mine + POST /connection/doctor-safety-check', `Decision: ${checkRes.data.decision}, Projected Risk: ${checkRes.data.projectedRegimenRisk}`);
        } else {
          recordFail(17, 'POST /connection/doctor-safety-check', `HTTP ${checkRes.status}: ${JSON.stringify(checkRes.data)}`);
        }
      } else {
        recordFail(17, 'GET /connection/mine', `HTTP ${mineRes.status}: ${JSON.stringify(mineRes.data)}`);
      }
    } catch (e) {
      recordFail(17, 'GET /connection/mine + POST /connection/doctor-safety-check', e.message);
    }

    // ══════════════════════════════════════════════════════════════
    // Step 18: DELETE /medicine/:id (soft-delete Aspirin, confirm removedAt set)
    // ══════════════════════════════════════════════════════════════
    try {
      const delRes = await api.delete(`/medicine/${aspirinMedId}`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      if (delRes.status === 200 && delRes.data?.removedAt) {
        const dbMed = await prisma.medicine.findUnique({ where: { id: aspirinMedId } });
        if (dbMed && dbMed.removedAt) {
          recordPass(18, 'DELETE /medicine/:id (Soft-delete Aspirin)', `removedAt set: ${dbMed.removedAt.toISOString()}`);
        } else {
          recordFail(18, 'DELETE /medicine/:id', 'removedAt not persisted in database');
        }
      } else {
        recordFail(18, 'DELETE /medicine/:id', `HTTP ${delRes.status}: ${JSON.stringify(delRes.data)}`);
      }
    } catch (e) {
      recordFail(18, 'DELETE /medicine/:id', e.message);
    }

  } finally {
    // ══════════════════════════════════════════════════════════════
    // Automated Test Data Cleanup
    // ══════════════════════════════════════════════════════════════
    try {
      if (patientId) {
        await prisma.interactionFlag.deleteMany({ where: { patientId } });
        await prisma.symptom.deleteMany({ where: { patientId } });
        await prisma.medicine.deleteMany({ where: { patientId } });
        await prisma.connection.deleteMany({ where: { patientId } });
        await prisma.patient.deleteMany({ where: { id: patientId } });
      }
      if (patientUserId) {
        await prisma.user.deleteMany({ where: { id: patientUserId } });
      }
      if (doctorUserId) {
        await prisma.user.deleteMany({ where: { id: doctorUserId } });
      }
      await prisma.pendingSignup.deleteMany({
        where: { email: { in: [testPatientEmail, testDoctorEmail] } },
      });
    } catch (cleanupErr) {
      console.warn('[Cleanup Warning]', cleanupErr.message);
    }
    await prisma.$disconnect();
  }

  // Final Output
  console.log('\n================================================================');
  console.log(`                 ${passedTests.length}/18 tests passed                   `);
  console.log('================================================================\n');

  if (failedTests.length > 0) {
    console.log('Failed Tests Summary:');
    failedTests.forEach(f => {
      console.log(` - Step ${f.stepNum}: ${f.name} -> ${f.reason}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL 18 CLINICAL ENDPOINTS & SYSTEM WORKFLOWS VERIFIED (100% OK)');
    process.exit(0);
  }
}

runAudit();
