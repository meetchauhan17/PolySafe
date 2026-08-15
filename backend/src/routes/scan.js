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

// ─── Drug name heuristic parser ───────────────────────────────────────────────
/**
 * Extracts a candidate drug name from raw OCR text.
 *
 * Heuristic rules (ordered by confidence):
 *   1. Common prescription label patterns — "Rx:", "Drug:", "Medicine:", "Tablet:", etc.
 *   2. Dose-number proximity — word immediately before a dose like "10mg", "5 mg"
 *   3. All-caps word that's at least 4 characters long (labels often print drug name in caps)
 *   4. First substantial word on the first non-blank line (fallback)
 *
 * Intentionally simple — the user always confirms before saving.
 *
 * @param {string} rawText  Full OCR output text
 * @returns {{ candidate: string|null, rawText: string, lines: string[] }}
 */
function parseDrugName(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const text = rawText.trim();

  // Rule 1: explicit label patterns
  const labelPattern = /(?:drug|medicine|medication|rx|tablet|capsule|syrup|injection|tab|cap)\s*[:\-]?\s*([A-Za-z][A-Za-z\s\-]{1,40}?)(?:\s+\d|\n|$)/i;
  const labelMatch = text.match(labelPattern);
  if (labelMatch?.[1]?.trim()) {
    return { candidate: labelMatch[1].trim(), rawText, lines };
  }

  // Rule 2: word immediately before a dosage string (e.g. "Warfarin 5mg")
  const dosePattern = /([A-Za-z][A-Za-z\-]{2,30})\s+\d+\s*(?:mg|mcg|ml|g|iu|unit)/i;
  const doseMatch = text.match(dosePattern);
  if (doseMatch?.[1]?.trim()) {
    return { candidate: doseMatch[1].trim(), rawText, lines };
  }

  // Rule 3: first ALL-CAPS token ≥ 4 chars (common on printed prescription labels)
  const capsPattern = /\b([A-Z]{4,})\b/;
  const capsMatch = text.match(capsPattern);
  if (capsMatch?.[1]) {
    // Exclude common non-drug all-caps words
    const stopWords = ['TAKE', 'DAILY', 'DOSE', 'ONCE', 'TWICE', 'REFILL', 'DATE', 'NAME', 'PATIENT'];
    if (!stopWords.includes(capsMatch[1])) {
      return { candidate: capsMatch[1], rawText, lines };
    }
  }

  // Rule 4: first substantial word from the first non-blank line (fallback)
  for (const line of lines) {
    const words = line.split(/\s+/);
    for (const word of words) {
      const clean = word.replace(/[^A-Za-z\-]/g, '');
      if (clean.length >= 4) {
        return { candidate: clean, rawText, lines };
      }
    }
  }

  return { candidate: null, rawText, lines };
}

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
// Multi-layered OCR pipeline:
// 1. DEMO_MODE: Mock fixture returns instantly
// 2. Local Tesseract OCR: Fast, offline, zero network dependency
// 3. Cloud OCR.space API: Secondary fallback if Tesseract gives low confidence
// 4. Fallback: Clear manual entry prompt
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
      // ⚠ DEMO MOCK — controlled by DEMO_MODE=true in .env.
      if (isDemoMode()) {
        cleanupFile(filePath);
        const mock = getMockOcrResult();
        console.log('[scan] DEMO_MODE=true — returning mock OCR result (engines skipped)');
        return res.status(200).json({
          success:   true,
          candidate: mock.candidate,
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
        const { candidate, lines } = parseDrugName(tesseractRawText);
        console.log(`[scan] Layer 1 (Tesseract) succeeded: extracted ${lines.length} lines, candidate="${candidate || 'none'}"`);

        return res.status(200).json({
          success: true,
          candidate,
          rawText: tesseractRawText,
          lineCount: lines.length,
          engine: 'tesseract',
          note: candidate
            ? 'Drug name extracted via local OCR — please verify before saving.'
            : 'Text recognized. Please review and confirm the medicine name.',
        });
      }

      console.log(
        `[scan] Layer 1 (Tesseract) yielded insufficient text (${tesseractRawText.length} chars). Falling back to Layer 2 (OCR.space API)...`
      );

      // ── 2. LAYER 2: Cloud OCR.space API Fallback ─────────────────────────
      const apiKey = process.env.OCR_SPACE_API_KEY;

      if (!apiKey) {
        cleanupFile(filePath);
        // If Tesseract produced any partial text, return it as best-effort before failing
        if (tesseractRawText.length > 0) {
          const { candidate, lines } = parseDrugName(tesseractRawText);
          return res.status(200).json({
            success: true,
            candidate,
            rawText: tesseractRawText,
            lineCount: lines.length,
            engine: 'tesseract',
            note: 'Partial text recognized via local OCR. Please verify medicine name.',
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

        // If Tesseract had partial text, return it
        if (tesseractRawText.length > 0) {
          const { candidate, lines } = parseDrugName(tesseractRawText);
          return res.status(200).json({
            success: true,
            candidate,
            rawText: tesseractRawText,
            lineCount: lines.length,
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
          const { candidate, lines } = parseDrugName(tesseractRawText);
          return res.status(200).json({
            success: true,
            candidate,
            rawText: tesseractRawText,
            lineCount: lines.length,
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
      const { candidate, lines } = parseDrugName(cloudRawText);
      console.log(`[scan] Layer 2 (OCR.space) succeeded: extracted ${lines.length} lines, candidate="${candidate || 'none'}"`);

      return res.status(200).json({
        success: true,
        candidate,
        rawText: cloudRawText,
        lineCount: lines.length,
        engine: 'ocrspace',
        note: candidate
          ? 'Drug name extracted via cloud OCR — please verify before saving.'
          : 'Could not identify a drug name automatically. Please type it in manually.',
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

module.exports = router;
