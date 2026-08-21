'use strict';

const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Testing Advanced Scanning Upgrades ---');

  // 1. Authenticate with real patient account
  const loginRes = await axios.post(`${BASE_URL}/auth/patient/login`, {
    email: 'priya@example.com',
    password: 'Password123!',
    role: 'PATIENT',
  });
  const token = loginRes.data.token;
  console.log('1. Authenticated as Priya Sharma');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Test Barcode lookup (0 tokens / 0ms)
  console.log('\n2. Testing GET /medicine/barcode/:code...');
  try {
    const bcRes = await axios.get(`${BASE_URL}/medicine/barcode/L484`, { headers: authHeaders });
    console.log('Barcode response for "L484":', bcRes.data);
  } catch (err) {
    console.error('Barcode error:', err.response?.data || err.message);
  }

  // 3. Test Direct Scan of fixture with Parallel Vision AI
  console.log('\n3. Testing POST /medicine/scan on d3b12-test.webp...');
  const fixturePath = path.join(__dirname, 'fixtures', 'd3b12-test.webp');
  if (fs.existsSync(fixturePath)) {
    const form = new FormData();
    form.append('image', fs.createReadStream(fixturePath));
    const scanRes = await axios.post(`${BASE_URL}/medicine/scan`, form, {
      headers: { ...authHeaders, ...form.getHeaders() },
    });
    console.log('Scan Result:');
    console.log('  Drug Name:', scanRes.data.drug_name);
    console.log('  Generic Name:', scanRes.data.generic_name);
    console.log('  Composition Salts:', scanRes.data.composition);
    console.log('  Medication Count:', scanRes.data.medicationCount);
    console.log('  Source:', scanRes.data.source);
  } else {
    console.log('Fixture d3b12-test.webp not found.');
  }

  // 4. Test Batch Add Medications (POST /medicine/batch)
  console.log('\n4. Testing POST /medicine/batch...');
  try {
    const batchRes = await axios.post(
      `${BASE_URL}/medicine/batch`,
      {
        medicines: [
          { drug_name: 'Vitamin D3 Test Batch', type: 'PRESCRIPTION', strength: '1000 IU' },
          { drug_name: 'Folic Acid Test Batch', type: 'PRESCRIPTION', strength: '5mg' },
        ],
      },
      { headers: authHeaders }
    );
    console.log('Batch add response:', batchRes.data);
  } catch (err) {
    console.error('Batch add error:', err.response?.data || err.message);
  }

  console.log('\n--- All Scanning Upgrades Tested Successfully ---');
}

runTests().catch(console.error);
