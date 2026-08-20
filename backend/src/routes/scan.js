const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const tesseract = require('node-tesseract-ocr');
const { auth } = require('../middleware/auth');
const { isDemoMode, getMockOcrResult } = require('../lib/demo');

const router = express.Router();

// ─── Tesseract OCR Local Configuration ─────────────────────────────────────────
const tesseractConfig = {
  lang: 'eng',
  oem: 1,
  psm: 3,
};

// ─── Multer — temp disk storage, auto-cleaned after processing ───────────────
const upload = multer({
  dest: path.join(__dirname, '../../tmp/'),
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

// ─── Temp file cleanup helper ─────────────────────────────────────────────────
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[scan] cleanup failed:', err.message);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /medicine/scan
// Multi-layered OCR pipeline with RxNorm candidate verification:
// 1. DEMO_MODE: Mock fixture returns instantly
// 2. Local Tesseract OCR: Fast, offline, zero network dependency
// 3. Cloud OCR.space API: Secondary fallback if Tesseract gives low confidence
// 4. Boilerplate filter + candidate ranking + RxNorm verification
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/scan',
  auth,
  (req, res, next) => {
    // Run multer, handling errors cleanly
    upload.single('image')(req, res, (err) => {
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
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({
        error: 'No image file received. Please attach an image using the "image" field.',
      });
    }

    try {
      // ── 0. DEMO MODE: skip live OCR, return pre-set sample text ───────────
      if (isDemoMode()) {
        cleanupFile(filePath);
        const mock = getMockOcrResult();
        console.log('[scan] DEMO_MODE=true — returning mock OCR result (engines skipped)');
        return res.status(200).json({
          success:   true,
          candidate: mock.candidate,
          standardizedCode: '11289',
          verified:  true,
          fallbackCandidates: [mock.candidate],
          suggestedDosage: '5 mg',
          rawText:   mock.rawText,
          lineCount: mock.lineCount,
          note:      mock.note,
          engine:    'demo',
          _demoMock: true,
        });
      }

      // ── 1. LAYER 1: Try Local Tesseract OCR ──────────────────────────────
      let tesseractRawText = '';
      let tesseractError = null;

      try {
        console.log(`[scan] Attempting Layer 1 (Local Tesseract OCR) on ${filePath}...`);
        const result = await tesseract.recognize(filePath, tesseractConfig);
        tesseractRawText = (result || '').trim();
      } catch (tErr) {
        tesseractError = tErr;
        console.warn(`[scan] Local Tesseract OCR encountered an issue: ${tErr.message}`);
      }

      // Check if Tesseract returned substantial recognizable characters (>= 3 chars)
      const hasAlphanumeric = /[A-Za-z0-9]{3,}/.test(tesseractRawText);

      if (hasAlphanumeric && tesseractRawText.length >= 3) {
        cleanupFile(filePath);

        const extraction = extractAndRankCandidates(tesseractRawText);
        const verification = await verifyCandidatesWithRxNorm(
          extraction.rankedCandidates,
          extraction.suggestedDosage,
          extraction
        );

        console.log(`[scan] Layer 1 (Tesseract) succeeded: extracted ${extraction.lines.length} lines, verified candidate="${verification.candidate || 'none'}"`);

        return res.status(200).json({
          success: true,
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
          prescriber: verification.prescriber || null,
          rawText: tesseractRawText,
          lineCount: extraction.lines.length,
          engine: 'tesseract',
          note: verification.verified
            ? 'Drug name verified against standard drug database — please confirm details.'
            : 'Text recognized. Select a suggested name below or enter manually.',
        });
      }

      console.log(
        `[scan] Layer 1 (Tesseract) yielded insufficient text (${tesseractRawText.length} chars). Falling back to Layer 2 (OCR.space API)...`
      );

      // ── 2. LAYER 2: Cloud OCR.space API Fallback ─────────────────────────
      const apiKey = process.env.OCR_SPACE_API_KEY;

      if (!apiKey) {
        cleanupFile(filePath);
        if (tesseractRawText.length > 0) {
          const extraction = extractAndRankCandidates(tesseractRawText);
          const verification = await verifyCandidatesWithRxNorm(
            extraction.rankedCandidates,
            extraction.suggestedDosage,
            extraction
          );

          return res.status(200).json({
            success: true,
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
            prescriber: verification.prescriber || null,
            rawText: tesseractRawText,
            lineCount: extraction.lines.length,
            engine: 'tesseract',
            note: 'Partial text recognized via local OCR.',
          });
        }

        return res.status(422).json({
          error: 'Could not read text from this image. Please enter the medicine name manually.',
          fallback: true,
        });
      }

      const form = new FormData();
      form.append('file', fs.createReadStream(filePath), {
        filename: req.file.originalname || 'prescription.jpg',
        contentType: req.file.mimetype,
      });
      form.append('apikey', apiKey);
      form.append('language', 'eng');
      form.append('isOverlayRequired', 'false');
      form.append('detectOrientation', 'true');
      form.append('scale', 'true');
      form.append('OCREngine', '2'); // OCR.space Engine 2 for printed prescription labels

      let ocrResponse;
      try {
        ocrResponse = await axios.post('https://api.ocr.space/parse/image', form, {
          headers: form.getHeaders(),
          timeout: 15_000, // 15 s timeout
        });
      } catch (ocrErr) {
        cleanupFile(filePath);
        console.warn(`[scan] OCR.space cloud call failed: ${ocrErr.message}`);

        if (tesseractRawText.length > 0) {
          const extraction = extractAndRankCandidates(tesseractRawText);
          const verification = await verifyCandidatesWithRxNorm(
            extraction.rankedCandidates,
            extraction.suggestedDosage,
            extraction
          );

          return res.status(200).json({
            success: true,
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
            prescriber: verification.prescriber || null,
            rawText: tesseractRawText,
            lineCount: extraction.lines.length,
            engine: 'tesseract',
            note: 'Local OCR result used (cloud OCR unavailable).',
          });
        }

        return res.status(422).json({
          error: 'Both local OCR and cloud OCR could not parse this image. Please enter the medicine name manually.',
          fallback: true,
        });
      } finally {
        cleanupFile(filePath); // always delete temp file
      }

      const parsed = ocrResponse.data?.ParsedResults?.[0];
      const ocrExitCode = ocrResponse.data?.OCRExitCode;

      if (!parsed || ocrExitCode === 99 || parsed.FileParseExitCode < 0) {
        if (tesseractRawText.length > 0) {
          const extraction = extractAndRankCandidates(tesseractRawText);
          const verification = await verifyCandidatesWithRxNorm(
            extraction.rankedCandidates,
            extraction.suggestedDosage,
            extraction
          );

          return res.status(200).json({
            success: true,
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
            prescriber: verification.prescriber || null,
            rawText: tesseractRawText,
            lineCount: extraction.lines.length,
            engine: 'tesseract',
            note: 'Local OCR result used.',
          });
        }

        return res.status(422).json({
          error: 'The OCR engines could not read text from this image. Try better lighting or enter the name manually.',
          fallback: true,
        });
      }

      const cloudRawText = (parsed.ParsedText ?? '').trim();

      if (!cloudRawText) {
        return res.status(422).json({
          error: 'No text detected in the image. Try a clearer photo or enter the name manually.',
          fallback: true,
        });
      }

      // Parse candidate from OCR.space output
      const extraction = extractAndRankCandidates(cloudRawText);
      const verification = await verifyCandidatesWithRxNorm(
        extraction.rankedCandidates,
        extraction.suggestedDosage,
        extraction
      );

      console.log(`[scan] Layer 2 (OCR.space) succeeded: extracted ${extraction.lines.length} lines, verified candidate="${verification.candidate || 'none'}"`);

      return res.status(200).json({
        success: true,
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
        prescriber: verification.prescriber || null,
        rawText: cloudRawText,
        lineCount: extraction.lines.length,
        engine: 'ocrspace',
        note: verification.verified
          ? 'Drug name verified against standard drug database — please confirm details.'
          : 'Could not identify a drug name automatically. Select a suggested name or type manually.',
      });
    } catch (err) {
      cleanupFile(filePath);
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
// ALWAYS returns `possibleMatches` (plural), never a single definitive confirmation.
// Includes mandatory safety caveat.
// ═════════════════════════════════════════════════════════════════════════════
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        // Run OCR on the pill photo
        let ocrText = '';
        try {
          ocrText = await tesseract.recognize(filePath, tesseractConfig);
        } catch (tessErr) {
          console.warn('[identify-pill] Tesseract failed:', tessErr.message);
        }

        if (!ocrText || ocrText.trim().length === 0) {
          // Cloud OCR fallback
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

        // Tokenize OCR text into potential imprint code strings (2 to 12 chars)
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

      // Look up candidate imprint codes in PillImprint table
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

      // If manual code entered and no exact token match, return all fuzzy matches
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

module.exports = router;
