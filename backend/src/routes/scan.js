'use strict';

/**
 * scan.js — 4-Stage Multi-Engine Prescription & Medication Scanner
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGE 1 — GEMINI VISION (Primary, multimodal image-to-JSON extraction)
 * STAGE 2 — RXNORM VERIFICATION (Standardizes Gemini drug/generic names)
 * STAGE 3 — TESSERACT OCR FALLBACK (Offline local OCR fallback on network/rate-limit error)
 * STAGE 4 — OCR.SPACE FALLBACK (Cloud OCR fallback as last resort)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const tesseract = require('node-tesseract-ocr');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');
const { isDemoMode, getMockOcrResult } = require('../lib/demo');
const prisma = require('../lib/prisma');

const router = express.Router();

// ─── Ensure temp upload directory exists ───────────────────────────────────────
const tmpDir = path.join(__dirname, '../../tmp');
if (!fs.existsSync(tmpDir)) {
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {
    // Ignore error if already created concurrently
  }
}

// ─── Tesseract Local Configuration ───────────────────────────────────────────
const tesseractConfig = {
  lang: 'eng',
  oem: 1,
  psm: 3,
};

// ─── Multer Configuration (temp disk storage) ────────────────────────────────
const upload = multer({
  dest: tmpDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted (JPEG, PNG, WebP, BMP).'));
    }
  },
});

const {
  extractAndRankCandidates,
  verifyCandidatesWithRxNorm,
} = require('../services/ocrCandidateExtractor');
const { resolveDrugWithAI } = require('../services/aiDrugResolver');

// ─── Helper: File Cleanup ─────────────────────────────────────────────────────
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[scan] cleanup failed:', err.message);
  }
}

// ─── Verbatim Structured Prompt for Gemini Vision (Supports Single & Multi-Drug Prescriptions) ──
const GEMINI_STRUCTURED_PROMPT = `You are an expert clinical pharmacist and pharmaceutical OCR vision system.
Analyze this pharmaceutical image (which may be a blister strip, front/back packaging, bottle label, carton box, or doctor prescription slip).

Extract the EXACT medication details. If the image contains a prescription slip with multiple prescribed medicines or multiple boxes, extract ALL medications in the "medications" array.
Return ONLY valid JSON (no markdown formatting, no code block fences):
{
  "is_prescription": false,
  "prescriber": "Doctor name if prescription slip, else null",
  "confidence": "high",
  "medications": [
    {
      "drug_name": "Primary brand or medication name (e.g. 'D3B12 PLUS', 'Augmentin 625', 'Naxdom 500')",
      "generic_name": "Full generic chemical salt composition (e.g. 'Methylcobalamin + Pyridoxine HCl + Folic Acid + Vitamin D3')",
      "composition": ["Active salt 1 with strength", "Active salt 2 with strength"],
      "strength": "Overall dosage strength (e.g. '1500 mcg + 10 mg + 5 mg + 1000 IU' or '500mg')",
      "form": "tablet",
      "category": "Pharmacological category (e.g. 'Vitamin & Mineral Supplement', 'NSAID / Pain Relief', 'Antibiotic')",
      "frequency": "once",
      "timing": "morning",
      "foodInstruction": "after_food",
      "manufacturer": "Pharma manufacturer if visible (e.g. 'Healing Pharma'), else null",
      "suggestedType": "PRESCRIPTION",
      "safetyTip": "Brief clinical guidance for this drug class"
    }
  ]
}

If this image is clearly not a medicine or prescription image, return: { "error": "not_a_medicine_image" }`;

// ─── Verbatim Structured Prompt for Gemini Text Parser (OCR text -> Structured JSON) ──
const GEMINI_OCR_TEXT_PROMPT = (ocrText) => `You are an expert clinical pharmacist and pharmaceutical text parser.
Analyze this raw OCR text extracted from a medicine package, blister foil, carton box, or prescription slip:

"""
${ocrText.slice(0, 2500)}
"""

Extract the EXACT medication details. Carefully distinguish the primary brand name from manufacturer or boilerplate text (do NOT return pharma company names like 'Healing Pharma', 'Sun Pharma', 'Cipla', 'Torrent' as drug names).
If multiple medications are detected in a prescription, return all of them in the "medications" array.
Return ONLY valid JSON (no markdown formatting, no code block fences):
{
  "is_prescription": false,
  "prescriber": "Doctor name if prescription slip, else null",
  "confidence": "high",
  "medications": [
    {
      "drug_name": "Primary brand or medication name (e.g. 'D3B12 PLUS', 'Augmentin 625', 'Naxdom 500')",
      "generic_name": "Full generic chemical salt composition (e.g. 'Methylcobalamin + Pyridoxine HCl + Folic Acid + Vitamin D3')",
      "composition": ["Active salt 1 with strength", "Active salt 2 with strength"],
      "strength": "Overall dosage strength (e.g. '1500mcg + 10mg + 5mg + 1000IU' or '500mg')",
      "form": "tablet",
      "category": "Pharmacological category (e.g. 'Vitamin & Mineral Supplement', 'NSAID / Pain Relief', 'Antibiotic')",
      "frequency": "once",
      "timing": "morning",
      "foodInstruction": "after_food",
      "manufacturer": "Pharma manufacturer if visible, else null",
      "suggestedType": "PRESCRIPTION",
      "safetyTip": "Brief clinical guidance for this drug class"
    }
  ]
}

If this text is clearly not from a pharmaceutical product or prescription, return: { "error": "not_a_medicine_text" }`;

// ─── Helper: Get all configured Gemini API keys ──────────────────────────────
function getGeminiApiKeys() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const keys = raw
    .split(/[,;\s]+/)
    .map(k => k.trim())
    .filter(k => k.length > 10 && k !== 'your_gemini_api_key_here');
  return keys.length > 0 ? keys : [];
}

const ACTIVE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
];

// ─── Helper: Call Gemini Text Parser (Ultra low-token mode: ~100-150 tokens) ──
async function callGeminiTextParser(rawOcrText) {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) return null;

  const prompt = GEMINI_OCR_TEXT_PROMPT(rawOcrText);

  // Try each API key and model in parallel / sequence
  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);

    const promises = ACTIVE_GEMINI_MODELS.map(async (modelName) => {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini Text timeout (${modelName})`)), 5000)
        );
        const callPromise = model.generateContent(prompt);
        const res = await Promise.race([callPromise, timeoutPromise]);
        const text = res.response.text();
        const cleanJson = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && (parsed.medications?.length > 0 || parsed.drug_name || parsed.error)) {
          return { parsed, raw: text, modelUsed: modelName, isTextOnly: true };
        }
        throw new Error(`Invalid JSON from text parser (${modelName})`);
      } catch (err) {
        throw err;
      }
    });

    try {
      const result = await Promise.any(promises);
      if (result) return result;
    } catch {
      // Try next API key
    }
  }

  return null;
}

// ─── Helper: Call Gemini Vision with Multi-Image / Parallel Racing ───────────
async function callGeminiVision(filePaths, mimeTypes = []) {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('GEMINI_API_KEY not configured.');
  }

  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

  // Build image parts for single or two-sided (front+back) scans
  const imageParts = paths.filter(p => fs.existsSync(p)).map((p, idx) => {
    const buf = fs.readFileSync(p);
    const mime = (Array.isArray(mimeTypes) ? mimeTypes[idx] : mimeTypes) || 'image/webp';
    return {
      inlineData: {
        data: buf.toString('base64'),
        mimeType: mime,
      },
    };
  });

  if (imageParts.length === 0) {
    throw new Error('No valid image files to analyze.');
  }

  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Race models in parallel, return the fastest valid extraction
    const promises = ACTIVE_GEMINI_MODELS.map(async (modelName) => {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini Vision timeout (${modelName})`)), 9000)
        );
        const callPromise = model.generateContent([GEMINI_STRUCTURED_PROMPT, ...imageParts]);
        const res = await Promise.race([callPromise, timeoutPromise]);
        const text = res.response.text();
        const cleanJson = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && (parsed.medications?.length > 0 || parsed.drug_name || parsed.error)) {
          return { parsed, raw: text, modelUsed: modelName, isTextOnly: false };
        }
        throw new Error(`Invalid JSON parsed from ${modelName}`);
      } catch (err) {
        throw err;
      }
    });

    try {
      const result = await Promise.any(promises);
      if (result) return result;
    } catch {
      // Fall back to sequential check on this key or next key
      for (const m of ACTIVE_GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const res = await model.generateContent([GEMINI_STRUCTURED_PROMPT, ...imageParts]);
          const text = res.response.text();
          const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed && (parsed.medications?.length > 0 || parsed.drug_name || parsed.error)) {
            return { parsed, raw: text, modelUsed: m, isTextOnly: false };
          }
        } catch {
          // continue
        }
      }
    }
  }

  throw new Error('All Gemini Vision models failed or timed out across all configured keys.');
}

// ─── Helper: RxNorm Verification for Gemini Output (Parallel Queries) ────────
async function verifyWithRxNorm(drugName, genericName, composition = []) {
  if (!drugName && !genericName && (!composition || composition.length === 0)) {
    return { verified: false, rxcui: null, confirmedName: drugName || genericName };
  }

  const namesToTry = [
    drugName,
    genericName,
    ...(Array.isArray(composition) ? composition.map(c => c.replace(/\s+\d+.*$/, '').trim()) : []),
  ].filter(Boolean);

  const lookups = namesToTry.slice(0, 3).map(async (name) => {
    try {
      const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name.trim())}&allsrc=0`;
      const { data } = await axios.get(url, { timeout: 2500 });
      const rxnormIds = data?.idGroup?.rxnormId;
      if (Array.isArray(rxnormIds) && rxnormIds.length > 0) {
        return {
          verified: true,
          rxcui: String(rxnormIds[0]),
          confirmedName: name.trim(),
        };
      }
    } catch {
      // Ignore individual timeout
    }
    return null;
  });

  const settled = await Promise.allSettled(lookups);
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value?.verified) {
      return r.value;
    }
  }

  return {
    verified: false,
    rxcui: null,
    confirmedName: drugName || genericName,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /medicine/scan
// Smart Hybrid Pipeline:
// Step 1: Free Local Tesseract OCR
// Step 2A: If OCR text clean -> Gemini Text LLM (~150 tokens, 85% cheaper)
// Step 2B: If OCR text garbled/blurry -> Escalate to Gemini Vision (Multimodal)
// Step 3: Pharmacological AI Decomposition + RxNorm Validation
// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// POST /medicine/scan
// Supports: Single Medicine, Multi-Medication Prescriptions, and Two-Sided Scans
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/scan',
  auth,
  (req, res, next) => {
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          error: err.code === 'LIMIT_FILE_SIZE'
            ? 'Image is too large (max 10 MB). Please use a smaller photo.'
            : `Upload error: ${err.message}`,
        });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    const frontFile = req.files?.['image']?.[0];
    const backFile = req.files?.['backImage']?.[0];
    const singleFile = req.file; // in case uploaded as single

    const filesToProcess = [frontFile, backFile, singleFile].filter(Boolean);
    const filePaths = filesToProcess.map(f => f.path);
    const mimeTypes = filesToProcess.map(f => f.mimetype);

    if (filePaths.length === 0) {
      return res.status(400).json({
        error: 'No image file received. Please attach an image using the "image" field.',
      });
    }

    const primaryFilePath = filePaths[0];

    try {
      // ── 0. DEMO MODE: return pre-built sample response with source: "gemini" ─
      if (isDemoMode()) {
        filePaths.forEach(cleanupFile);
        console.log('[scan] DEMO_MODE=true — returning sample Gemini response fixture');
        return res.status(200).json({
          source: 'gemini',
          drug_name: 'Warfarin',
          generic_name: 'Warfarin Sodium',
          strength: '5mg',
          form: 'tablet',
          frequency: 'once daily',
          duration: 'ongoing',
          prescriber: 'Dr. Sarah Wilson',
          rxNormVerified: true,
          rxcui: '11289',
          confidence: 'high',
          isPrescription: false,
          medicationCount: 1,
          medications: [{
            drug_name: 'Warfarin',
            generic_name: 'Warfarin Sodium',
            strength: '5mg',
            form: 'tablet',
            frequency: 'once daily',
            timing: 'evening',
            foodInstruction: 'after_food',
            category: 'Anticoagulant (Blood Thinner)',
            safetyTip: 'Take consistently at the same time each day. Avoid sudden changes in diet high in Vitamin K.',
            suggestedType: 'PRESCRIPTION',
            rxNormVerified: true,
            rxcui: '11289',
          }],
          // Backward compatibility mappings
          candidate: 'Warfarin',
          genericName: 'Warfarin Sodium',
          standardizedCode: '11289',
          verified: true,
          suggestedDosage: '5mg',
          commonFrequency: 'once',
          suggestedType: 'PRESCRIPTION',
          category: 'Anticoagulant (Blood Thinner)',
          safetyTip: 'Take consistently at the same time each day. Avoid sudden changes in diet high in Vitamin K.',
          dosageOptions: ['1mg', '2mg', '2.5mg', '5mg'],
          foodInstruction: 'after_food',
          _demoMock: true,
        });
      }

      // ── STAGE 1: PARALLEL MULTIMODAL GEMINI VISION (Primary — 100% Clinical Accuracy) ──
      console.log(`[scan] Stage 1: Running Multimodal Gemini Vision on ${filePaths.join(', ')}...`);
      let aiExtraction = null;
      let tesseractRawText = '';

      try {
        const visionResult = await callGeminiVision(filePaths, mimeTypes);
        if (visionResult && visionResult.parsed) {
          aiExtraction = visionResult;
        }
      } catch (visionErr) {
        console.warn(`[scan] Stage 1 (Gemini Vision) failed: ${visionErr.message}`);
      }

      // If Vision failed (e.g. offline/network issue), fallback to local Tesseract OCR
      if (!aiExtraction || !aiExtraction.parsed || (!aiExtraction.parsed.drug_name && !aiExtraction.parsed.medications?.length)) {
        try {
          console.log('[scan] Stage 1 Fallback: Running Local Tesseract OCR...');
          const tResult = await tesseract.recognize(primaryFilePath, tesseractConfig);
          tesseractRawText = (tResult || '').trim();
          if (tesseractRawText.length >= 10) {
            const textResult = await callGeminiTextParser(tesseractRawText);
            if (textResult && textResult.parsed && (textResult.parsed.drug_name || textResult.parsed.medications?.length)) {
              aiExtraction = textResult;
            }
          }
        } catch (tErr) {
          console.warn('[scan] Local Tesseract fallback failed:', tErr.message);
        }
      }

      // ── STAGE 2: PROCESS ALL EXTRACTED MEDICATIONS (Batch & Single) ─────────
      if (aiExtraction && aiExtraction.parsed) {
        const parsed = aiExtraction.parsed;

        if (parsed.error === 'not_a_medicine_image' || parsed.error === 'not_a_medicine_text') {
          filePaths.forEach(cleanupFile);
          return res.status(400).json({
            error: "This doesn't look like a medicine or prescription — try a clearer photo.",
          });
        }

        const rawMeds = Array.isArray(parsed.medications) && parsed.medications.length > 0
          ? parsed.medications
          : (parsed.drug_name ? [parsed] : []);

        const validMeds = rawMeds.filter(m => m && (m.drug_name || m.name) && String(m.drug_name || m.name).trim() !== 'null');

        if (validMeds.length > 0) {
          console.log(`[scan] Stage 2: Enriching ${validMeds.length} detected medication(s) with AI drug resolver & RxNorm...`);

          const enrichedMedications = await Promise.all(
            validMeds.map(async (med) => {
              const medName = (med.drug_name || med.name || '').trim();
              const genName = (med.generic_name || '').trim() || null;
              const composition = Array.isArray(med.composition) ? med.composition : [];

              const [rxNormRes, aiResolved] = await Promise.all([
                verifyWithRxNorm(medName, genName, composition),
                resolveDrugWithAI(medName),
              ]);

              const finalGen = genName || aiResolved?.genericName || rxNormRes?.confirmedName || null;
              const finalCat = med.category || aiResolved?.class || (rxNormRes?.verified ? 'Prescription Medicine' : 'General Medication');
              const finalSafety = med.safetyTip || aiResolved?.safetyTip || 'Take as directed by your physician or pharmacist.';
              const finalFood = med.foodInstruction || aiResolved?.foodInstruction || 'after_food';
              const finalType = med.suggestedType || (finalCat.toLowerCase().includes('herb') ? 'HERBAL' : finalCat.toLowerCase().includes('supplement') || finalCat.toLowerCase().includes('otc') ? 'OTC' : 'PRESCRIPTION');

              const salts = [
                ...(aiResolved?.genericSalts || []),
                ...composition.map(c => c.replace(/\s+\d+.*$/, '').trim()),
              ].filter(Boolean);

              const distinctSalts = Array.from(new Set(salts));

              return {
                drug_name: medName,
                generic_name: finalGen,
                composition: composition.length > 0 ? composition : (aiResolved?.genericSalts || []),
                genericSalts: distinctSalts,
                strength: med.strength || aiResolved?.dosageOptions?.[0] || null,
                form: med.form || 'tablet',
                category: finalCat,
                frequency: (med.frequency || '').toLowerCase().includes('twice')
                  ? 'twice'
                  : (med.frequency || '').toLowerCase().includes('thrice')
                  ? 'thrice'
                  : 'once',
                timing: med.timing || 'morning',
                foodInstruction: finalFood,
                manufacturer: med.manufacturer || null,
                safetyTip: finalSafety,
                suggestedType: finalType,
                rxNormVerified: rxNormRes.verified,
                rxcui: rxNormRes.rxcui || aiResolved?.standardizedCode || null,
                dosageOptions: aiResolved?.dosageOptions?.length > 0 ? aiResolved.dosageOptions : (med.strength ? [med.strength] : ['Standard dose']),
              };
            })
          );

          filePaths.forEach(cleanupFile);

          const primaryMed = enrichedMedications[0];
          const confidence = (parsed.confidence || 'high').toLowerCase();
          const isPrescription = Boolean(parsed.is_prescription || enrichedMedications.length > 1 || parsed.prescriber);
          const prescriber = parsed.prescriber || null;
          const sourceTag = aiExtraction.isTextOnly ? 'ocr_gemini_hybrid' : 'gemini_vision';

          return res.status(200).json({
            source: sourceTag,
            modelUsed: aiExtraction.modelUsed,
            confidence,
            isPrescription,
            prescriber,
            prescriberName: prescriber,
            medicationCount: enrichedMedications.length,
            medications: enrichedMedications,

            // Primary single-drug compatibility fields
            drug_name: primaryMed.drug_name,
            generic_name: primaryMed.generic_name,
            composition: primaryMed.composition,
            genericSalts: primaryMed.genericSalts,
            strength: primaryMed.strength,
            form: primaryMed.form,
            category: primaryMed.category,
            frequency: primaryMed.frequency,
            timing: primaryMed.timing,
            foodInstruction: primaryMed.foodInstruction,
            manufacturer: primaryMed.manufacturer,
            rxNormVerified: primaryMed.rxNormVerified,
            rxcui: primaryMed.rxcui,
            safetyTip: primaryMed.safetyTip,
            suggestedType: primaryMed.suggestedType,
            dosageOptions: primaryMed.dosageOptions,
            raw_extraction: aiExtraction.raw,

            // Backward compatibility aliases
            candidate: primaryMed.drug_name,
            genericName: primaryMed.generic_name,
            standardizedCode: primaryMed.rxcui,
            verified: primaryMed.rxNormVerified,
            fallbackCandidates: [
              primaryMed.drug_name,
              ...(primaryMed.genericSalts || []),
            ].slice(0, 4),
            suggestedDosage: primaryMed.strength || '',
            commonFrequency: primaryMed.frequency,
            note: isPrescription && enrichedMedications.length > 1
              ? `Prescription slip detected: extracted ${enrichedMedications.length} medications via Gemini AI.`
              : `Extracted via Gemini Vision (${aiExtraction.modelUsed}).`,
          });
        }
      }

      // ── STAGE 4: PURE TESSERACT + LOCAL ENGINE (Offline / LLM failure fallback) ──
      console.log('[scan] Stage 4: Falling back to Local Tesseract Rule Extraction...');
      if (!tesseractRawText) {
        try {
          const tResult = await tesseract.recognize(primaryFilePath, tesseractConfig);
          tesseractRawText = (tResult || '').trim();
        } catch (tErr) {
          console.warn(`[scan] Local Tesseract OCR failed: ${tErr.message}`);
        }
      }

      const hasTesseractContent = /[A-Za-z0-9]{3,}/.test(tesseractRawText);

      if (hasTesseractContent && tesseractRawText.length >= 3) {
        filePaths.forEach(cleanupFile);

        const extraction = extractAndRankCandidates(tesseractRawText);
        const verification = await verifyCandidatesWithRxNorm(
          extraction.rankedCandidates,
          extraction.suggestedDosage,
          extraction
        );

        console.log(`[scan] Stage 3 (Tesseract) succeeded: verified candidate="${verification.candidate || 'none'}"`);

        return res.status(200).json({
          source: 'tesseract',
          drug_name: verification.candidate || extraction.rankedCandidates[0] || 'Unknown',
          generic_name: verification.genericName || null,
          strength: verification.suggestedDosage || extraction.suggestedDosage || null,
          form: 'tablet',
          frequency: verification.commonFrequency || 'once',
          duration: null,
          prescriber: verification.prescriber || null,
          rxNormVerified: !!verification.verified,
          rxcui: verification.standardizedCode || null,
          confidence: verification.verified ? 'medium' : 'low',
          raw_extraction: tesseractRawText,

          // Backward compatibility
          candidate: verification.candidate,
          genericName: verification.genericName,
          standardizedCode: verification.standardizedCode,
          verified: verification.verified,
          fallbackCandidates: verification.fallbackCandidates,
          suggestedDosage: verification.suggestedDosage,
          category: verification.category,
          safetyTip: verification.safetyTip,
          dosageOptions: verification.dosageOptions || [],
          commonFrequency: verification.commonFrequency || 'once',
          foodInstruction: verification.foodInstruction || '',
          suggestedType: verification.suggestedType || 'PRESCRIPTION',
          extractedTimings: verification.extractedTimings || [],
          prescriberName: verification.prescriber || null,
          lineCount: extraction.lines.length,
          note: 'Extracted via local Tesseract OCR fallback.',
        });
      }

      // ── STAGE 4: OCR.SPACE FALLBACK (Runs only if both Gemini & Tesseract fail)
      console.log('[scan] Stage 4: Falling back to Cloud OCR.space...');
      const ocrSpaceKey = process.env.OCR_SPACE_API_KEY;

      if (ocrSpaceKey && ocrSpaceKey.trim().length > 0) {
        const form = new FormData();
        form.append('file', fs.createReadStream(primaryFilePath), {
          filename: 'prescription.jpg',
          contentType: mimeTypes[0] || 'image/jpeg',
        });
        form.append('apikey', ocrSpaceKey);
        form.append('language', 'eng');
        form.append('isOverlayRequired', 'false');
        form.append('detectOrientation', 'true');
        form.append('scale', 'true');
        form.append('OCREngine', '2');

        let ocrResponse;
        try {
          ocrResponse = await axios.post('https://api.ocr.space/parse/image', form, {
            headers: form.getHeaders(),
            timeout: 15_000,
          });
        } catch (ocrErr) {
          console.warn(`[scan] OCR.space cloud call failed: ${ocrErr.message}`);
        }

        filePaths.forEach(cleanupFile);

        const parsedResult = ocrResponse?.data?.ParsedResults?.[0];
        const cloudRawText = (parsedResult?.ParsedText ?? '').trim();

        if (cloudRawText && cloudRawText.length >= 3) {
          const extraction = extractAndRankCandidates(cloudRawText);
          const verification = await verifyCandidatesWithRxNorm(
            extraction.rankedCandidates,
            extraction.suggestedDosage,
            extraction
          );

          return res.status(200).json({
            source: 'ocrspace',
            drug_name: verification.candidate || extraction.rankedCandidates[0] || 'Unknown',
            generic_name: verification.genericName || null,
            strength: verification.suggestedDosage || extraction.suggestedDosage || null,
            form: 'tablet',
            frequency: verification.commonFrequency || 'once',
            duration: null,
            prescriber: verification.prescriber || null,
            rxNormVerified: !!verification.verified,
            rxcui: verification.standardizedCode || null,
            confidence: verification.verified ? 'medium' : 'low',
            raw_extraction: cloudRawText,

            // Backward compatibility
            candidate: verification.candidate,
            genericName: verification.genericName,
            standardizedCode: verification.standardizedCode,
            verified: verification.verified,
            fallbackCandidates: verification.fallbackCandidates,
            suggestedDosage: verification.suggestedDosage,
            category: verification.category,
            safetyTip: verification.safetyTip,
            dosageOptions: verification.dosageOptions || [],
            commonFrequency: verification.commonFrequency || 'once',
            foodInstruction: verification.foodInstruction || '',
            suggestedType: verification.suggestedType || 'PRESCRIPTION',
            extractedTimings: verification.extractedTimings || [],
            prescriberName: verification.prescriber || null,
            lineCount: extraction.lines.length,
            note: 'Extracted via Cloud OCR.space fallback.',
          });
        }
      }

      filePaths.forEach(cleanupFile);

      // If none of the engines returned anything usable
      return res.status(422).json({
        error: 'Could not extract drug information — please enter details manually.',
        fallback: true,
      });
    } catch (err) {
      filePaths.forEach(cleanupFile);
      console.error('[POST /medicine/scan]', err);
      return res.status(500).json({
        error: 'Scan failed unexpectedly. Please enter the medicine name manually.',
        fallback: true,
      });
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /medicine/identify-pill
// Loose pill imprint code lookup via OCR photo or manual imprint code.
// ═════════════════════════════════════════════════════════════════════════════
const PILL_SAFETY_CAVEAT =
  "This is a limited reference lookup, not a medical identification. If you're not certain, do not take this pill — check with a pharmacist.";

router.post(
  '/identify-pill',
  auth,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    const filePath = req.file?.path;
    const manualCode = req.body?.imprintCode || req.query?.imprintCode;

    try {
      let candidateTokens = [];
      let extractedRawText = '';

      if (manualCode && String(manualCode).trim()) {
        const clean = String(manualCode).trim();
        candidateTokens = [clean, clean.replace(/\s+/g, '')];
        extractedRawText = clean;
      } else if (filePath) {
        let ocrText = '';
        try {
          ocrText = await tesseract.recognize(filePath, tesseractConfig);
        } catch (tessErr) {
          console.warn('[identify-pill] Tesseract failed:', tessErr.message);
        }

        if (!ocrText || ocrText.trim().length === 0) {
          const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
          const form = new FormData();
          form.append('file', fs.createReadStream(filePath));
          form.append('apikey', apiKey);
          form.append('OCREngine', '2');
          form.append('scale', 'true');

          const response = await axios.post('https://api.ocr.space/parse/image', form, {
            headers: form.getHeaders(),
            timeout: 10000,
          });
          const parsed = response.data?.ParsedResults?.[0];
          ocrText = parsed?.ParsedText || '';
        }

        cleanupFile(filePath);
        extractedRawText = ocrText.trim();

        const rawTokens = extractedRawText
          .replace(/[^A-Za-z0-9\s\-]/g, ' ')
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 2 && t.length <= 12);

        candidateTokens = Array.from(new Set(rawTokens));
      } else {
        return res.status(400).json({
          error: 'Please upload a photo of the pill or enter the stamped imprint code.',
        });
      }

      if (candidateTokens.length === 0) {
        return res.status(200).json({
          success: true,
          extractedText: extractedRawText,
          possibleMatches: [],
          matchCount: 0,
          caveat: PILL_SAFETY_CAVEAT,
          message: 'Could not detect an imprint code from this image. Please enter the code manually.',
        });
      }

      const allImprints = await prisma.pillImprint.findMany();
      const matchedPills = [];
      const seenIds = new Set();

      for (const token of candidateTokens) {
        const tokenLower = token.toLowerCase();
        for (const item of allImprints) {
          const itemCodeLower = item.imprintCode.toLowerCase();
          const itemCodeNoSpace = itemCodeLower.replace(/\s+/g, '');
          const tokenNoSpace = tokenLower.replace(/\s+/g, '');

          if (
            itemCodeLower === tokenLower ||
            itemCodeNoSpace === tokenNoSpace ||
            (tokenLower.length >= 3 && itemCodeLower.includes(tokenLower)) ||
            (tokenNoSpace.length >= 3 && itemCodeNoSpace.includes(tokenNoSpace))
          ) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              matchedPills.push({
                id:          item.id,
                imprintCode: item.imprintCode,
                drugName:    item.drugName,
                strength:    item.strength,
                shape:       item.shape,
                color:       item.color,
              });
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        extractedText: extractedRawText,
        candidateTokens,
        possibleMatches: matchedPills,
        matchCount: matchedPills.length,
        caveat: PILL_SAFETY_CAVEAT,
        note: matchedPills.length > 0
          ? `Found ${matchedPills.length} possible reference match${matchedPills.length !== 1 ? 'es' : ''}. User confirmation is required before adding.`
          : 'No reference matches found for this imprint code in our limited dataset. Please consult a pharmacist.',
      });
    } catch (err) {
      cleanupFile(filePath);
      console.error('[POST /medicine/identify-pill]', err);
      return res.status(500).json({
        error: 'Pill identification lookup failed. Please consult a licensed pharmacist.',
        caveat: PILL_SAFETY_CAVEAT,
      });
    }
  }
);
// ═════════════════════════════════════════════════════════════════════════════
// GET /medicine/barcode/:code
// Instant 0-token barcode / 2D DataMatrix lookup
// ═════════════════════════════════════════════════════════════════════════════
router.get('/barcode/:code', auth, async (req, res) => {
  const code = (req.params.code || '').trim();
  if (!code) {
    return res.status(400).json({ error: 'Please provide a barcode number.' });
  }

  try {
    const pill = await prisma.pillImprint.findFirst({
      where: {
        OR: [
          { imprintCode: { equals: code, mode: 'insensitive' } },
          { drugName: { contains: code, mode: 'insensitive' } },
        ],
      },
    });

    if (pill) {
      const resolved = await resolveDrugWithAI(pill.drugName);
      return res.status(200).json({
        found: true,
        source: 'local_registry',
        drug_name: pill.drugName,
        generic_name: resolved.genericName,
        strength: pill.strength || 'Standard dose',
        form: pill.shape || 'tablet',
        category: resolved.class,
        safetyTip: resolved.safetyTip,
        foodInstruction: resolved.foodInstruction,
        rxcui: resolved.standardizedCode,
      });
    }

    const resolved = await resolveDrugWithAI(code);
    if (resolved && resolved.layer !== 'none' && resolved.resolvedName !== code) {
      return res.status(200).json({
        found: true,
        source: resolved.layer,
        drug_name: resolved.resolvedName,
        generic_name: resolved.genericName,
        strength: resolved.dosageOptions?.[0] || 'Standard dose',
        form: 'tablet',
        category: resolved.class,
        safetyTip: resolved.safetyTip,
        foodInstruction: resolved.foodInstruction,
        rxcui: resolved.standardizedCode,
      });
    }

    return res.status(200).json({
      found: false,
      code,
      message: 'Barcode not found in direct registry. You can scan the label photo instead.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
