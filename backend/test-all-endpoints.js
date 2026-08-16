const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

async function runFullSystemTest() {
  console.log('================================================================');
  console.log('       PolySafe Comprehensive System & End-to-End API Audit     ');
  console.log('================================================================\n');

  let patientToken = null;
  let doctorToken = null;
  let patientId = null;
  let testMed1Id = null;
  let testMed2Id = null;
  let shareCode = null;
  let connectionId = null;

  const testEmail = `audit_patient_${Date.now()}@example.com`;
  const doctorEmail = `audit_doctor_${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1. Patient Signup (Send OTP)
  console.log('[1/18] Testing POST /auth/patient/signup-send-otp...');
  const signupRes = await api.post('/auth/patient/signup-send-otp', {
    name: 'Audit Patient',
    email: testEmail,
    password,
    role: 'PATIENT',
  });
  console.log('  -> /auth/patient/signup-send-otp:', signupRes.status, signupRes.data?.message || signupRes.data?.error);
  if (signupRes.status !== 200) throw new Error('Signup Send OTP failed');

  // Grab OTP code from DB
  const otpRecord = await prisma.pendingSignup.findFirst({
    where: { email: testEmail },
    orderBy: { createdAt: 'desc' },
  });
  if (!otpRecord) throw new Error('OTP was not created in database');
  console.log(`  -> Retrieved OTP from DB: ${otpRecord.code}`);

  // 2. Patient Verify OTP
  console.log('\n[2/18] Testing POST /auth/patient/verify-signup-otp...');
  const verifyRes = await api.post('/auth/patient/verify-signup-otp', {
    email: testEmail,
    code: otpRecord.code,
  });
  console.log('  -> /auth/patient/verify-signup-otp:', verifyRes.status, verifyRes.data?.user?.name);
  if (verifyRes.status !== 201 || !verifyRes.data.token) throw new Error('Verify Signup OTP failed');
  patientToken = verifyRes.data.token;
  patientId = verifyRes.data.user?.patient?.id;

  // 3. Doctor Registration
  console.log('\n[3/18] Testing POST /auth/doctor/signup...');
  const docRegRes = await api.post('/auth/doctor/signup', {
    name: 'Dr. Sarah Wilson',
    email: doctorEmail,
    password,
    registrationNumber: 'MED-98421-IN',
  });
  console.log('  -> /auth/doctor/signup:', docRegRes.status, docRegRes.data?.user?.name);
  if (docRegRes.status !== 201 || !docRegRes.data.token) throw new Error('Doctor registration failed');
  doctorToken = docRegRes.data.token;

  // 4. Patient Login
  console.log('\n[4/18] Testing POST /auth/patient/login...');
  const patientLoginRes = await api.post('/auth/patient/login', {
    email: testEmail,
    password,
    role: 'PATIENT',
  });
  console.log('  -> /auth/patient/login:', patientLoginRes.status, patientLoginRes.data?.user?.email);
  if (patientLoginRes.status !== 200) throw new Error('Patient password login failed');

  // 5. Doctor Login
  console.log('\n[5/18] Testing POST /auth/doctor/login...');
  const docLoginRes = await api.post('/auth/doctor/login', {
    email: doctorEmail,
    password,
  });
  console.log('  -> /auth/doctor/login:', docLoginRes.status, docLoginRes.data?.user?.email);
  if (docLoginRes.status !== 200) throw new Error('Doctor login failed');

  // 6. Auth /me
  console.log('\n[6/18] Testing GET /auth/me...');
  const meRes = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  console.log('  -> /auth/me (Patient):', meRes.status, meRes.data?.user?.role, 'Patient ID:', meRes.data?.patient?.id);
  if (meRes.status !== 200) throw new Error('Patient /auth/me failed');
  if (!patientId) patientId = meRes.data.patient?.id;

  // 7. Patient Profile Onboarding
  console.log('\n[7/18] Testing POST /patient/profile (Onboarding)...');
  const profileRes = await api.post(
    '/patient/profile',
    {
      age: 68,
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      allergies: ['Penicillin'],
    },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> /patient/profile:', profileRes.status, 'Age:', profileRes.data?.patient?.age);
  if (profileRes.status !== 200) throw new Error('Patient profile update failed');

  // 8. Add Medicine 1 (Warfarin 5mg)
  console.log('\n[8/18] Testing POST /medicine (Warfarin 5mg)...');
  const med1Res = await api.post(
    '/medicine',
    {
      name: 'Warfarin',
      type: 'PRESCRIPTION',
      dosage: '5 mg',
    },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> POST /medicine (Warfarin):', med1Res.status, med1Res.data?.medicine?.name, 'RxCUI:', med1Res.data?.medicine?.standardizedCode);
  if (med1Res.status !== 201) throw new Error('Add Medicine Warfarin failed');
  testMed1Id = med1Res.data.medicine.id;

  // 9. Add Medicine 2 (Aspirin 81mg) - Trigger Major DDInter Flag
  console.log('\n[9/18] Testing POST /medicine (Aspirin 81mg - Trigger Major DDInter Flag)...');
  const med2Res = await api.post(
    '/medicine',
    {
      name: 'Aspirin',
      type: 'OTC',
      dosage: '81 mg',
    },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> POST /medicine (Aspirin):', med2Res.status, 'Flags:', med2Res.data?.interactionFlags?.length || 0);
  if (med2Res.status !== 201) throw new Error('Add Medicine Aspirin failed');
  testMed2Id = med2Res.data.medicine.id;

  // 10. Add Medicine 3 (Ginkgo Biloba - Herbal)
  console.log('\n[10/18] Testing POST /medicine (Ginkgo Biloba - Herbal)...');
  const med3Res = await api.post(
    '/medicine',
    {
      name: 'Ginkgo Biloba',
      type: 'HERBAL',
      dosage: '120 mg',
    },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> POST /medicine (Ginkgo):', med3Res.status, 'Type:', med3Res.data?.medicine?.type);
  if (med3Res.status !== 201) throw new Error('Add Medicine Ginkgo failed');

  // 11. Home Summary
  console.log('\n[11/18] Testing GET /patient/home-summary...');
  const homeRes = await api.get('/patient/home-summary', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  console.log('  -> /patient/home-summary:', homeRes.status, 'Status:', homeRes.data?.status, 'Medicines:', homeRes.data?.medicines?.length);
  if (homeRes.status !== 200 || homeRes.data.medicines.length < 3) throw new Error('Home summary failed');

  // 12. Patient Timeline
  console.log('\n[12/18] Testing GET /patient/timeline...');
  const timelineRes = await api.get('/patient/timeline', {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  console.log('  -> /patient/timeline count:', timelineRes.data?.medicines?.length);
  if (timelineRes.status !== 200) throw new Error('Timeline failed');

  // 13. Loose Pill Imprint Lookup
  console.log('\n[13/18] Testing POST /medicine/identify-pill (Imprint "L484")...');
  const pillRes = await api.post(
    '/medicine/identify-pill',
    { imprintCode: 'L484' },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> /medicine/identify-pill:', pillRes.status, 'Matches:', pillRes.data?.possibleMatches?.length, 'Drug:', pillRes.data?.possibleMatches?.[0]?.drugName);
  if (pillRes.status !== 200 || pillRes.data.possibleMatches.length === 0) throw new Error('Pill lookup failed');

  // 14. Log Symptom
  console.log('\n[14/18] Testing POST /symptom (Log Ankle Swelling)...');
  const sympRes = await api.post(
    '/symptom',
    { description: 'Persistent leg swelling and ankle edema' },
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> POST /symptom:', sympRes.status, 'Logged symptom:', sympRes.data?.symptom?.description);
  if (sympRes.status !== 201) throw new Error('Symptom log failed');

  // 15. Generate Doctor Share Code
  console.log('\n[15/18] Testing POST /connection/generate-code...');
  const genCodeRes = await api.post(
    '/connection/generate-code',
    {},
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  shareCode = genCodeRes.data?.shareCode;
  connectionId = genCodeRes.data?.connectionId;
  console.log('  -> Generated Share Code:', shareCode, 'Connection ID:', connectionId);
  if (genCodeRes.status !== 201 || !shareCode) throw new Error('Generate code failed');

  // 16. Doctor Claim Code
  console.log('\n[16/18] Testing POST /connection/claim-code (Doctor claims code)...');
  const claimRes = await api.post(
    '/connection/claim-code',
    { shareCode },
    { headers: { Authorization: `Bearer ${doctorToken}` } }
  );
  console.log('  -> POST /connection/claim-code:', claimRes.status, claimRes.data?.message);
  if (claimRes.status !== 200) throw new Error('Claim code failed');

  // Patient Approves Connection
  console.log('  -> Patient Approving Connection...');
  const approveRes = await api.post(
    `/connection/${connectionId}/approve`,
    {},
    { headers: { Authorization: `Bearer ${patientToken}` } }
  );
  console.log('  -> /connection/:id/approve:', approveRes.status, approveRes.data?.message);
  if (approveRes.status !== 200) throw new Error('Approve connection failed');

  // 17. Doctor View Connected Patients & Prescribing Check
  console.log('\n[17/18] Testing Doctor View Connections & Prescribe Safety Check...');
  const docMineRes = await api.get('/connection/mine', {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  console.log('  -> GET /connection/mine:', docMineRes.status, 'Connected patients count:', docMineRes.data?.connections?.length);
  if (docMineRes.status !== 200 || docMineRes.data.connections.length === 0) throw new Error('Doctor connections failed');

  const docCheckRes = await api.post(
    '/connection/doctor/prescribe-safety-check',
    {
      patientId: homeRes.data.patientId,
      proposedMedicineName: 'Ibuprofen',
    },
    { headers: { Authorization: `Bearer ${doctorToken}` } }
  );
  console.log('  -> Prescribing Safety Check (Ibuprofen vs Warfarin):', docCheckRes.status, 'Decision:', docCheckRes.data?.decision);
  if (docCheckRes.status !== 200) throw new Error('Doctor prescribing safety check failed');

  // 18. Discontinue Medicine (Soft-delete)
  console.log('\n[18/18] Testing DELETE /medicine/:id (Discontinue Aspirin)...');
  const delRes = await api.delete(`/medicine/${testMed2Id}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  console.log('  -> DELETE /medicine/:id:', delRes.status, delRes.data?.message);
  if (delRes.status !== 200) throw new Error('Delete medicine failed');

  console.log('\n================================================================');
  console.log('  ALL 18 CORE ENDPOINTS & SYSTEM WORKFLOWS VERIFIED (100% OK)   ');
  console.log('================================================================\n');

  process.exit(0);
}

runFullSystemTest().catch(async (err) => {
  console.error('\n❌ AUDIT FAILED:', err.message);
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Response Data:', err.response.data);
  }
  process.exit(1);
});
