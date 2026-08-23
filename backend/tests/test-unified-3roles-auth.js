/**
 * test-unified-3roles-auth.js — Comprehensive verification of OTP once on signup, then ID+Password for all 3 roles
 */
const axios = require('axios');
const prisma = require('../src/lib/prisma');
const API_URL = 'http://localhost:5000';

async function testRoleAuth(role, name, regNum) {
  const ts = Date.now();
  const email = `${role.toLowerCase()}_unified_${ts}@test.com`;
  const password = 'Password@123';

  console.log(`\n================================================================`);
  console.log(`▶ TESTING UNIFIED AUTH FOR ROLE: ${role}`);
  console.log(`================================================================`);

  // 1. Check email -> should be new (exists: false)
  const check1 = await axios.post(`${API_URL}/auth/check-email`, { email, role });
  if (check1.data.exists) throw new Error(`${role} email should be new!`);
  console.log(`✔ [${role}] /auth/check-email correctly detected new email (exists: false)`);

  // 2. Signup -> Send OTP
  await axios.post(`${API_URL}/auth/patient/signup-send-otp`, {
    email,
    name,
    password,
    role,
    registrationNumber: regNum,
  });

  const pending = await prisma.pendingSignup.findFirst({
    where: { email: email.toLowerCase().trim(), used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!pending?.code) throw new Error(`${role} pending signup OTP code not found!`);
  console.log(`✔ [${role}] One-time OTP generated & dispatched (${pending.code})`);

  // 3. Verify OTP -> Issues JWT
  const verifyRes = await axios.post(`${API_URL}/auth/patient/verify-signup-otp`, {
    email,
    code: pending.code,
  });
  if (!verifyRes.data.token || verifyRes.data.user.role !== role) {
    throw new Error(`${role} OTP verification failed`);
  }
  console.log(`✔ [${role}] OTP verified, account created, JWT issued (Role: ${verifyRes.data.user.role})`);

  // 4. Subsequent Sign In -> Check email -> exists: true
  const check2 = await axios.post(`${API_URL}/auth/check-email`, { email, role });
  if (!check2.data.exists) throw new Error(`${role} email should now exist!`);
  console.log(`✔ [${role}] /auth/check-email correctly detected existing account (exists: true)`);

  // 5. Subsequent Sign In -> Password ONLY, ZERO OTP
  const loginRes = await axios.post(`${API_URL}/auth/patient/login`, {
    email,
    password,
    role,
  });
  if (!loginRes.data.token || loginRes.data.user.role !== role) {
    throw new Error(`${role} password login failed`);
  }
  console.log(`✔ [${role}] Password login successful with ZERO OTP required!`);
  console.log(`🎉 [${role}] FULL UNIFIED FLOW VERIFIED (OTP once on signup → Password forever after)`);
}

async function runAll() {
  try {
    await testRoleAuth('PATIENT', 'Aarav Patel');
    await testRoleAuth('CAREGIVER', 'Priya Patel (Family)');
    await testRoleAuth('DOCTOR', 'Dr. Vikram Seth', 'MCI-882299');

    console.log(`\n================================================================`);
    console.log(`🎉 ALL 3 ROLES PASSED: OTP ON REGISTRATION ONLY, PASSWORD FOR SIGN IN`);
    console.log(`================================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runAll();
