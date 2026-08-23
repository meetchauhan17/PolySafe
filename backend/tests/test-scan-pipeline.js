'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API = 'http://localhost:5000';

async function testScanPipeline() {
  console.log('================================================================');
  console.log('       Testing 4-Stage Multi-Engine Scan Pipeline               ');
  console.log('================================================================\n');

  // 1. Authenticate a test patient
  const email = `scan_test_${Date.now()}@example.com`;
  const password = 'Password123!';

  await axios.post(`${API}/auth/patient/signup-send-otp`, { name: 'Scan Tester', email, password, role: 'PATIENT' });
  const pending = await prisma.pendingSignup.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
  const verifyRes = await axios.post(`${API}/auth/patient/verify-signup-otp`, { email, code: pending.code });
  const token = verifyRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('-> Authenticated test patient token received.');

  // 2. Create a temporary synthetic prescription image using canvas/BMP
  const tmpImgPath = path.join(__dirname, 'tmp_test_prescription.png');

  // Minimal 1x1 PNG if no image exists, or generate sample test buffer
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  fs.writeFileSync(tmpImgPath, Buffer.from(samplePngBase64, 'base64'));

  // 3. Test POST /medicine/scan
  console.log('\n[Test 1] Testing POST /medicine/scan endpoint response structure...');
  const form = new FormData();
  form.append('image', fs.createReadStream(tmpImgPath));

  const scanRes = await axios.post(`${API}/medicine/scan`, form, {
    headers: {
      ...headers,
      ...form.getHeaders(),
    },
    validateStatus: () => true,
  });

  console.log('  -> HTTP Status:', scanRes.status);
  console.log('  -> Response Data Keys:', Object.keys(scanRes.data));
  console.log('  -> Source Engine:', scanRes.data.source || scanRes.data.engine);
  console.log('  -> Drug Name:', scanRes.data.drug_name || scanRes.data.candidate);
  console.log('  -> Confidence:', scanRes.data.confidence);
  console.log('  -> RxNorm Verified:', scanRes.data.rxNormVerified ?? scanRes.data.verified);

  if (fs.existsSync(tmpImgPath)) fs.unlinkSync(tmpImgPath);

  // Cleanup test user
  await prisma.user.deleteMany({ where: { email } });
  await prisma.pendingSignup.deleteMany({ where: { email } });
  await prisma.$disconnect();

  console.log('\n================================================================');
  console.log('       4-STAGE SCAN PIPELINE VALIDATION COMPLETE                ');
  console.log('================================================================');
}

testScanPipeline().catch(err => {
  console.error('Scan test error:', err.response?.data || err.message);
  process.exit(1);
});
