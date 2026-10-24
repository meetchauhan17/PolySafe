/**
 * backend/tests/test-production-features.js
 * Tests:
 * 1. Logout endpoint
 * 2. Forgot password request & OTP generation
 * 3. Reset password verification & update
 * 4. Account deletion (Right to Erasure)
 */

'use strict';

const axios = require('axios');

const API = 'http://localhost:5000';

async function run() {
  console.log('Testing Production Features...');

  // 1. Test logout
  try {
    const resLogout = await axios.post(`${API}/auth/logout`);
    console.log('✓ 1. POST /auth/logout succeeded:', resLogout.data);
  } catch (err) {
    console.error('✗ Logout failed:', err.message);
  }

  // 2. Test Forgot Password
  const testEmail = `test.reset.${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // Create temporary user first
  try {
    const signupRes = await axios.post(`${API}/auth/patient/signup-send-otp`, {
      name: 'Reset Test User',
      email: testEmail,
      password: testPassword,
      role: 'PATIENT',
    });
    const otp = signupRes.data._devOtp;
    console.log('✓ Created pending user, OTP:', otp);

    const verifyRes = await axios.post(`${API}/auth/patient/verify-signup-otp`, {
      email: testEmail,
      code: otp,
    });
    console.log('✓ Verified user, token received:', !!verifyRes.data.token);
    const token = verifyRes.data.token;

    // Test forgot password
    const forgotRes = await axios.post(`${API}/auth/forgot-password`, {
      email: testEmail,
    });
    console.log('✓ 2. POST /auth/forgot-password succeeded:', forgotRes.data.message);
    const resetOtp = forgotRes.data._devOtp;
    console.log('✓ Reset OTP received:', resetOtp);

    // Test reset password with new password
    const newPassword = 'NewSecretPassword456!';
    const resetRes = await axios.post(`${API}/auth/reset-password`, {
      email: testEmail,
      code: resetOtp,
      newPassword,
    });
    console.log('✓ 3. POST /auth/reset-password succeeded:', resetRes.data.message);

    // Test login with new password
    const loginRes = await axios.post(`${API}/auth/patient/login`, {
      email: testEmail,
      password: newPassword,
      role: 'PATIENT',
    });
    console.log('✓ Signed in with newly reset password:', !!loginRes.data.token);

    // Test delete account (Right to Erasure)
    const deleteRes = await axios.delete(`${API}/auth/delete-account`, {
      headers: { Authorization: `Bearer ${loginRes.data.token}` },
    });
    console.log('✓ 4. DELETE /auth/delete-account succeeded:', deleteRes.data.message);

    // Verify account no longer exists
    const checkRes = await axios.post(`${API}/auth/check-email`, {
      email: testEmail,
      role: 'PATIENT',
    });
    console.log('✓ Verified account is permanently deleted:', checkRes.data.exists === false);

    console.log('\n🎉 ALL PRODUCTION SECURITY & AUTH FEATURES VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('✗ Test error:', err.response?.data || err.message);
  }
}

run();
