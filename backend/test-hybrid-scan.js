'use strict';
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiTextParserDirect() {
  const ocrSample = `
  Augmentin 625 Duo
  Amoxycillin and Potassium Clavulanate Tablets I.P.
  Each film coated tablet contains:
  Amoxycillin Trihydrate IP equivalent to Amoxycillin 500 mg
  Potassium Clavulanate Diluted IP equivalent to Clavulanic Acid 125 mg
  Dosage: As directed by the Physician.
  Take with food at the start of a meal.
  Mfg. by: GlaxoSmithKline Pharmaceuticals Limited
  `;

  console.log('Testing Gemini Text parser (~150 tokens) on clear medicine label text...');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const prompt = `You are an expert clinical pharmacist and pharmaceutical text parser.
Analyze this raw OCR text extracted from a medicine carton or label:

"""
${ocrSample}
"""

Extract the EXACT medication details. Return ONLY valid JSON (no markdown formatting, no code block fences):
{
  "drug_name": "Primary brand or medication name",
  "generic_name": "Full generic chemical salt composition",
  "composition": ["Active salt 1 with strength", "Active salt 2 with strength"],
  "strength": "Overall dosage strength",
  "form": "tablet",
  "category": "Pharmacological category",
  "frequency": "twice",
  "foodInstruction": "with_food",
  "manufacturer": "Pharma manufacturer if visible, else null",
  "prescriber": null,
  "suggestedType": "PRESCRIPTION",
  "safetyTip": "Brief clinical guidance",
  "confidence": "high"
}`;

  const res = await model.generateContent(prompt);
  const text = res.response.text().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(text);
  console.log('Result (Text Mode ~150 tokens):', JSON.stringify(parsed, null, 2));
}

testGeminiTextParserDirect()
  .then(() => {
    console.log('\n✔ GEMINI TEXT PARSER TEST PASSED!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  });
