'use strict';
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const GEMINI_STRUCTURED_PROMPT = `You are an expert clinical pharmacist and high-accuracy pharmaceutical OCR vision system.
Analyze this pharmaceutical image — which may be a blister strip, medicine carton/box, bottle, tube, or prescription slip.

Extract the EXACT medication details. Return ONLY valid JSON (no markdown formatting, no code block fences):
{
  "drug_name": "Primary brand or medication name (e.g. 'D3B12 PLUS', 'Augmentin 625', 'Naxdom 500')",
  "generic_name": "Full generic chemical salt composition (e.g. 'Methylcobalamin + Pyridoxine HCl + Folic Acid + Vitamin D3')",
  "composition": ["Active salt 1 with strength", "Active salt 2 with strength"],
  "strength": "Overall dosage strength (e.g. '1500mcg + 10mg + 5mg + 1000IU' or '500mg')",
  "form": "tablet",
  "category": "Pharmacological category (e.g. 'Multivitamin & Mineral Supplement', 'NSAID / Pain Relief', 'Antibiotic')",
  "frequency": "once",
  "foodInstruction": "after_food",
  "manufacturer": "Pharma manufacturer if visible, else null",
  "prescriber": "Doctor name if prescription slip, else null",
  "suggestedType": "PRESCRIPTION",
  "safetyTip": "Brief clinical guidance for this drug class",
  "confidence": "high"
}

If this image is clearly not a medicine or prescription, return: { "error": "not_a_medicine_image" }`;

async function testScan() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Using API key:', apiKey ? apiKey.slice(0, 8) + '...' : 'NONE');
  const genAI = new GoogleGenerativeAI(apiKey);

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
  ];

  const imgPath = path.join(__dirname, 'fixtures/d3b12-test.webp');
  const imgBuffer = fs.readFileSync(imgPath);
  const imagePart = {
    inlineData: {
      data: imgBuffer.toString('base64'),
      mimeType: 'image/webp',
    },
  };

  for (const modelName of candidateModels) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent([GEMINI_STRUCTURED_PROMPT, imagePart]);
      const text = res.response.text();
      console.log(`\n--- RESULT FROM ${modelName} ---`);
      console.log(text);
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      console.log('\nParsed JSON successfully:');
      console.log(JSON.stringify(parsed, null, 2));
      return parsed;
    } catch (err) {
      console.warn(`Model ${modelName} failed:`, err.message);
    }
  }
}

testScan().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
