const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function testEditName() {
  console.log('Testing Name Update Endpoints...');

  // 1. Patient Login
  const loginRes = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'demo@gmail.com',
    password: 'Meet@123',
    role: 'PATIENT',
  });
  const token = loginRes.data.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Test POST /patient/profile with name
  console.log('▶ Updating patient profile with name: "Ramesh K. Patel"...');
  const profRes = await axios.post(`${API_URL}/patient/profile`, {
    name: 'Ramesh K. Patel',
    age: 68,
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
  }, headers);

  console.log('✔ POST /patient/profile response:', profRes.data.name);
  if (profRes.data.name !== 'Ramesh K. Patel') throw new Error('Patient name not updated via /patient/profile');

  // Verify /auth/me returns updated name
  const meRes = await axios.get(`${API_URL}/auth/me`, headers);
  console.log('✔ GET /auth/me verified name:', meRes.data.user.name);
  if (meRes.data.user.name !== 'Ramesh K. Patel') throw new Error('/auth/me did not reflect new name');

  // 3. Test PATCH /auth/profile (works for all roles)
  console.log('▶ Testing PATCH /auth/profile with name: "Ramesh Patel"...');
  const patchRes = await axios.patch(`${API_URL}/auth/profile`, {
    name: 'Ramesh Patel',
  }, headers);
  console.log('✔ PATCH /auth/profile response:', patchRes.data.user.name);
  if (patchRes.data.user.name !== 'Ramesh Patel') throw new Error('Name not updated via /auth/profile');

  // 4. Doctor Login & test PATCH /auth/profile
  const docLogin = await axios.post(`${API_URL}/auth/patient/login`, {
    email: 'demodoc@gmail.com',
    password: 'Meet@123',
    role: 'DOCTOR',
  });
  const docHeaders = { headers: { Authorization: `Bearer ${docLogin.data.token}` } };
  const docPatch = await axios.patch(`${API_URL}/auth/profile`, {
    name: 'Dr. Priya Sharma, MD (Clinical Lead)',
  }, docHeaders);
  console.log('✔ Doctor PATCH /auth/profile updated:', docPatch.data.user.name);

  // Restore doctor name
  await axios.patch(`${API_URL}/auth/profile`, {
    name: 'Dr. Priya Sharma, MD',
  }, docHeaders);

  console.log('\n🎉 ALL EDIT NAME TESTS PASSED 100%!');
}

testEditName().catch((err) => {
  console.error('❌ Failed:', err.response?.data || err.message);
  process.exit(1);
});
