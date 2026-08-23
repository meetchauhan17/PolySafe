/**
 * test-block1-auth.js — Comprehensive Automated Verification for BLOCK 1: AUTH & SESSION
 */
const axios = require('axios');
const prisma = require('./src/lib/prisma');
const API_URL = 'http://localhost:5000';

async function runBlock1Tests() {
  console.log('================================================================');
  console.log('       BLOCK 1: AUTH & SESSION AUTOMATED VERIFICATION           ');
  console.log('================================================================\n');

  const ts = Date.now();
  const testEmail = `patient_b1_${ts}@test.com`;
  const testDoctorEmail = `doctor_b1_${ts}@test.com`;
  const password = 'Password@123';
  let otpReceived = null;
  let patientToken = null;
  let doctorToken = null;

  try {
    // 1.1 Patient Signup (OTP once, password after)
    console.log('▶ [1.1] Testing Patient Signup & OTP...');
    const check1 = await axios.post(`${API_URL}/auth/check-email`, { email: testEmail, role: 'PATIENT' });
    if (check1.data.exists) throw new Error('New email should not exist!');
    console.log('  ✔ /auth/check-email correctly indicates email is new (exists: false)');

    await axios.post(`${API_URL}/auth/patient/signup-send-otp`, {
      email: testEmail,
      name: 'Test Patient',
      password: password,
      role: 'PATIENT'
    });
    
    const pendingRow = await prisma.pendingSignup.findFirst({
      where: { email: testEmail.toLowerCase().trim(), used: false },
      orderBy: { createdAt: 'desc' }
    });
    otpReceived = pendingRow?.code;
    console.log(`  ✔ OTP generated & dispatched (${otpReceived})`);

    const verifyRes = await axios.post(`${API_URL}/auth/patient/verify-signup-otp`, {
      email: testEmail,
      code: otpReceived
    });
    patientToken = verifyRes.data.token;
    if (!patientToken) throw new Error('Token not received on signup verification');
    console.log('  ✔ OTP verification succeeded, JWT token issued.');
    console.log('  ✔ PASS: 1.1 Patient Signup');

    // 1.2 Patient Login (password, no OTP)
    console.log('\n▶ [1.2] Testing Patient Login (Password, no OTP)...');
    const check2 = await axios.post(`${API_URL}/auth/check-email`, { email: testEmail, role: 'PATIENT' });
    if (!check2.data.exists) throw new Error('Existing email should exist!');
    console.log('  ✔ /auth/check-email correctly indicates email now exists (exists: true)');

    const loginRes = await axios.post(`${API_URL}/auth/patient/login`, {
      email: testEmail,
      password: password,
      role: 'PATIENT'
    });
    if (!loginRes.data.token) throw new Error('Token not received on login');
    console.log('  ✔ Password login succeeded directly with zero OTP step required');
    console.log('  ✔ PASS: 1.2 Patient Login');

    // 1.3 Wrong password lockout (5 attempts)
    console.log('\n▶ [1.3] Testing Wrong Password Lockout (5 attempts)...');
    const lockoutEmail = `lockout_b1_${ts}@test.com`;
    const sOtp = await axios.post(`${API_URL}/auth/patient/signup-send-otp`, {
      email: lockoutEmail,
      name: 'Lockout Test',
      password: password,
      role: 'PATIENT'
    });
    const pendingLockout = await prisma.pendingSignup.findFirst({
      where: { email: lockoutEmail.toLowerCase().trim(), used: false },
      orderBy: { createdAt: 'desc' }
    });
    await axios.post(`${API_URL}/auth/patient/verify-signup-otp`, {
      email: lockoutEmail,
      code: pendingLockout.code
    });

    let lockoutHit = false;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        await axios.post(`${API_URL}/auth/patient/login`, {
          email: lockoutEmail,
          password: 'WrongPassword999!',
          role: 'PATIENT'
        });
      } catch (err) {
        const errorData = err.response?.data;
        if (attempt >= 5) {
          if (errorData?.locked || errorData?.lockedUntil || err.response?.status === 429) {
            lockoutHit = true;
            console.log(`  ✔ Attempt #${attempt} correctly locked out: "${errorData?.error || 'Account locked'}" (lockedUntil: ${errorData?.lockedUntil})`);
          }
        }
      }
    }
    if (!lockoutHit) throw new Error('Lockout was not enforced after 5 failed attempts!');
    console.log('  ✔ PASS: 1.3 Wrong password lockout');

    // 1.5 Direct URL access (role guard API check)
    console.log('\n▶ [1.5] Testing Role Guard (Patient accessing Doctor endpoint)...');
    try {
      await axios.get(`${API_URL}/connection/mine`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      throw new Error('Patient was allowed to access Doctor endpoint!');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.log(`  ✔ Patient access correctly rejected with HTTP ${err.response.status} (Forbidden)`);
      } else {
        throw err;
      }
    }
    console.log('  ✔ PASS: 1.5 Direct URL access role guard');

    // 1.6 Doctor Signup (Email + Password, no OTP)
    console.log('\n▶ [1.6] Testing Doctor Signup...');
    const docSignupRes = await axios.post(`${API_URL}/auth/doctor/signup`, {
      email: testDoctorEmail,
      password: password,
      name: 'Dr. Robert Chen',
      registrationNumber: 'MCI-998822'
    });
    doctorToken = docSignupRes.data.token;
    if (!doctorToken || docSignupRes.data.user.role !== 'DOCTOR') throw new Error('Doctor signup failed');
    console.log('  ✔ Doctor registered and token issued without OTP step');
    console.log('  ✔ PASS: 1.6 Doctor signup');

    // 1.7 Doctor Login
    console.log('\n▶ [1.7] Testing Doctor Login...');
    const docLoginRes = await axios.post(`${API_URL}/auth/doctor/login`, {
      email: testDoctorEmail,
      password: password
    });
    if (!docLoginRes.data.token || docLoginRes.data.user.role !== 'DOCTOR') throw new Error('Doctor login failed');
    console.log('  ✔ Doctor login verified with DOCTOR role credentials');
    console.log('  ✔ PASS: 1.7 Doctor login');

    // 1.10 Session Verification /auth/me
    console.log('\n▶ [1.10] Testing Session Verification (/auth/me)...');
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (meRes.data.user.email !== testEmail) throw new Error('Session user mismatch');
    console.log(`  ✔ Validated active session for ${meRes.data.user.email}`);
    console.log('  ✔ PASS: 1.10 Session persistence');

    console.log('\n================================================================');
    console.log('   🎉 ALL API & LOGICAL REQUIREMENTS FOR BLOCK 1 PASSED (100%)  ');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Block 1 test error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runBlock1Tests();
