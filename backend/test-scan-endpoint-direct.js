'use strict';
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function runDirectScanTest() {
  const token = jwt.sign(
    { userId: 'd07de7d4-b322-40d9-aefb-388e9d2a5f5a', role: 'PATIENT' },
    process.env.JWT_SECRET || 'fallback-secret-for-dev',
    { expiresIn: '1h' }
  );

  const imgPath = path.join(__dirname, 'fixtures/d3b12-test.webp');
  const form = new FormData();
  form.append('image', fs.createReadStream(imgPath), {
    filename: 'd3b12-test.webp',
    contentType: 'image/webp',
  });

  console.log('Sending scan request to http://localhost:5000/medicine/scan...');
  const res = await axios.post('http://localhost:5000/medicine/scan', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    timeout: 25000,
  });

  console.log('\n--- SCAN API RESPONSE ---');
  console.log(JSON.stringify(res.data, null, 2));
}

runDirectScanTest()
  .then(() => {
    console.log('\n✔ SCAN DIRECT TEST PASSED SUCCESSFULLY!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Scan test failed:', err.response?.data || err.message);
    process.exit(1);
  });
