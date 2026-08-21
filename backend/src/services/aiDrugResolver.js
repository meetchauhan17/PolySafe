/**
 * services/aiDrugResolver.js
 *
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║          PolySafe — 5-Layer Hybrid Indian Brand & AI Drug Resolver       ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  Layer 1: Indian Formulary Dictionary (indianDrugs.js - 0ms exact match)  ║
 * ║  Layer 2: Self-Learning Disk Cache   (ai-resolved-drugs.json - 0ms)       ║
 * ║  Layer 3: Levenshtein Fuzzy Match    (catches OCR typos like Naxdum)      ║
 * ║  Layer 4: NLM RxNorm REST API        (universal clinical standard RxCUI)  ║
 * ║  Layer 5: Groq LLM Clinical Resolver (decomposes unlisted brand salts &    ║
 * ║           writes back to disk cache for future zero-latency hits)         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { INDIAN_DRUGS } = require('../../data/indianDrugs');
const { getDrugHarmLevel } = require('./regimenRisk');

// ─── Layer 2: Persistent Self-Learning Disk Cache ─────────────────────────────
const CACHE_FILE = path.join(__dirname, '../../data/ai-resolved-drugs.json');
let _cache = {};

(function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      _cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8') || '{}');
      console.log(`[aiDrugResolver] Loaded ${Object.keys(_cache).length} cached drug entries from disk.`);
    } else {
      _cache = {};
    }
  } catch (err) {
    console.warn('[aiDrugResolver] Failed to read disk cache:', err.message);
    _cache = {};
  }
})();

function persistCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache, null, 2), 'utf8');
  } catch (err) {
    console.warn('[aiDrugResolver] Disk cache write failed:', err.message);
  }
}

// ─── Levenshtein Distance Calculator for Layer 3 Fuzzy Matching ───────────────
function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b || '').length;
  const al = a.length;
  const bl = b.length;
  const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[al][bl];
}

// ─── Normalizer helper ────────────────────────────────────────────────────────
function cleanName(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\s+\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)?$/i, '') // strip trailing strength
    .replace(/[^\w\s-]/g, '') // remove special characters
    .trim();
}

// ─── Layer 4: NLM RxNorm REST API Lookup ──────────────────────────────────────
async function queryRxNorm(cleanDrug) {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(cleanDrug)}`;
    const { data } = await axios.get(url, { timeout: 3500 });
    const rxcui = data?.idGroup?.rxnormId?.[0] || null;
    return rxcui;
  } catch {
    return null;
  }
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Layer 5a: Gemini Flash LLM Clinical Decomposer ──────────────────────────
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

function getGeminiApiKeys() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const keys = raw
    .split(/[,;\s]+/)
    .map(k => k.trim())
    .filter(k => k.length > 10 && k !== 'your_gemini_api_key_here');
  return keys.length > 0 ? keys : [];
}

async function queryGeminiDecomposer(rawName) {
  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) return null;

  const prompt = `You are a clinical pharmacologist and pharmaceutical chemist. Decompose the pharmaceutical brand or drug name "${rawName}" into its exact active generic chemical salt composition.
Return ONLY valid JSON in this exact structure (no markdown formatting, no code block fences):
{
  "brandName": "${rawName}",
  "genericSalts": ["Primary Generic Salt", "Secondary Generic Salt if combination"],
  "genericName": "Primary Salt + Secondary Salt",
  "harmLevel": 3,
  "class": "Pharmacological Class",
  "foodInstruction": "after_food",
  "dosageOptions": ["Standard dose"],
  "safetyTip": "Brief clinical instruction"
}`;

  for (const apiKey of apiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);

    const promises = ACTIVE_GEMINI_MODELS.map(async (modelName) => {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini decomposer timeout (${modelName})`)), 5000)
        );
        const callPromise = model.generateContent(prompt);
        const res = await Promise.race([callPromise, timeoutPromise]);
        const text = res.response.text();
        const cleanJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed && Array.isArray(parsed.genericSalts) && parsed.genericSalts.length > 0) {
          return {
            brandName: parsed.brandName || rawName,
            genericSalts: parsed.genericSalts,
            genericName: parsed.genericName || parsed.genericSalts.join(' + '),
            harmLevel: parsed.harmLevel || getDrugHarmLevel(parsed.genericSalts[0]),
            class: parsed.class || 'Prescription Medicine',
            foodInstruction: parsed.foodInstruction || 'after_food',
            dosageOptions: Array.isArray(parsed.dosageOptions) ? parsed.dosageOptions : ['Standard dose'],
            safetyTip: parsed.safetyTip || 'Take as prescribed.',
            source: `gemini_${modelName}`,
          };
        }
        throw new Error(`Invalid JSON from ${modelName}`);
      } catch (err) {
        throw err;
      }
    });

    try {
      const result = await Promise.any(promises);
      if (result) return result;
    } catch {
      // Try next key
    }
  }

  return null;
}

// ─── Layer 5b: Groq LLM Clinical Decomposer ──────────────────────────────────
let _groqDisabled = false;

async function queryGroqDecomposer(rawName) {
  if (_groqDisabled) return null;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE' || apiKey.startsWith('gsk_your_') || apiKey.startsWith('gsk_demo')) {
    return null;
  }

  const prompt = `You are a clinical pharmacologist. Decompose the pharmaceutical brand or drug name "${rawName}" into its active generic chemical salt composition.
Return ONLY valid JSON in this exact structure:
{
  "brandName": "${rawName}",
  "genericSalts": ["Primary Generic Salt", "Secondary Generic Salt if combination"],
  "genericName": "Primary Salt + Secondary Salt",
  "harmLevel": 3,
  "class": "Pharmacological Class",
  "foodInstruction": "after_food",
  "dosageOptions": ["Standard dose"],
  "safetyTip": "Brief clinical instruction"
}`;

  try {
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 250,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 4000,
      }
    );

    const parsed = JSON.parse(data.choices[0].message.content);
    if (parsed && Array.isArray(parsed.genericSalts) && parsed.genericSalts.length > 0) {
      return {
        brandName: parsed.brandName || rawName,
        genericSalts: parsed.genericSalts,
        genericName: parsed.genericName || parsed.genericSalts.join(' + '),
        harmLevel: parsed.harmLevel || getDrugHarmLevel(parsed.genericSalts[0]),
        class: parsed.class || 'Prescription Medicine',
        foodInstruction: parsed.foodInstruction || 'after_food',
        dosageOptions: Array.isArray(parsed.dosageOptions) ? parsed.dosageOptions : ['Standard dose'],
        safetyTip: parsed.safetyTip || 'Take as prescribed.',
        source: 'groq_llama_3.3',
      };
    }
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      _groqDisabled = true;
    }
    console.warn('[aiDrugResolver] Groq LLM decomposition unavailable, using Gemini/local pipeline.');
  }

  return null;
}

// ─── Parallel LLM Decomposer Runner (Gemini + Groq raced) ────────────────────
async function queryParallelDecomposer(rawName) {
  const promises = [];
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    promises.push(queryGeminiDecomposer(rawName));
  }
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10 && !process.env.GROQ_API_KEY.startsWith('gsk_demo')) {
    promises.push(queryGroqDecomposer(rawName));
  }

  if (promises.length === 0) return null;

  try {
    // Return first non-null successful resolution
    const results = await Promise.allSettled(promises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        return r.value;
      }
    }
  } catch {
    // Ignore and fallback
  }

  return null;
}

/**
 * 5-Layer Master Resolver Pipeline
 *
 * @param {string} rawDrugName
 * @returns {Promise<{
 *   resolvedName: string,
 *   genericName: string,
 *   genericSalts: string[],
 *   constituents: string[],
 *   harmLevel: number,
 *   class: string,
 *   foodInstruction: string,
 *   dosageOptions: string[],
 *   safetyTip: string,
 *   standardizedCode: string | null,
 *   layer: string
 * }>}
 */
async function resolveDrugWithAI(rawDrugName) {
  if (!rawDrugName) {
    return {
      resolvedName: 'Unknown',
      genericName: 'Unknown',
      genericSalts: ['Unknown'],
      constituents: ['Unknown'],
      harmLevel: 3,
      class: 'Unclassified',
      foodInstruction: 'after_food',
      dosageOptions: [],
      safetyTip: 'Verify with physician.',
      standardizedCode: null,
      layer: 'none',
    };
  }

  const raw = rawDrugName.trim();
  const cleaned = cleanName(raw);

  // ══════════════════════════════════════════════════════════════
  // Layer 1: Indian Formulary Dictionary (Exact Match)
  // ══════════════════════════════════════════════════════════════
  const l1Match = INDIAN_DRUGS.find((d) => {
    const bName = cleanName(d.brandName || d.brand);
    return bName === cleaned || cleanName(raw) === bName;
  });

  if (l1Match) {
    const genericSalts = l1Match.genericSalts || l1Match.salts || [l1Match.brandName];
    const primarySalt = genericSalts[0];
    const primaryCui = await queryRxNorm(primarySalt);

    return {
      resolvedName: l1Match.brandName || l1Match.brand,
      genericName: genericSalts.join(' + '),
      genericSalts,
      constituents: genericSalts,
      harmLevel: l1Match.harmLevel || getDrugHarmLevel(primarySalt, l1Match.class),
      class: l1Match.class || l1Match.category || 'Prescription Medicine',
      foodInstruction: l1Match.foodInstruction || 'after_food',
      dosageOptions: l1Match.dosageOptions || [l1Match.dosage || 'Standard dose'],
      safetyTip: l1Match.safetyTip || 'Take as prescribed.',
      standardizedCode: primaryCui,
      layer: 'Layer 1 (Indian Formulary Dictionary)',
    };
  }

  // ══════════════════════════════════════════════════════════════
  // Layer 2: Persistent Disk Cache (ai-resolved-drugs.json)
  // ══════════════════════════════════════════════════════════════
  if (_cache[cleaned]) {
    const cached = _cache[cleaned];
    return {
      ...cached,
      layer: 'Layer 2 (Disk Cache)',
    };
  }

  // ══════════════════════════════════════════════════════════════
  // Layer 3: Fuzzy Match (Levenshtein distance <= 2)
  // Catches OCR typos like "Naxdum" → "Naxdom 500"
  // ══════════════════════════════════════════════════════════════
  let closestMatch = null;
  let minDistance = 999;

  for (const d of INDIAN_DRUGS) {
    const bName = cleanName(d.brandName || d.brand);
    const dist = levenshteinDistance(cleaned, bName);
    if (dist <= 2 && dist < minDistance) {
      minDistance = dist;
      closestMatch = d;
    }
  }

  if (closestMatch) {
    const genericSalts = closestMatch.genericSalts || closestMatch.salts || [closestMatch.brandName];
    const primarySalt = genericSalts[0];
    const primaryCui = await queryRxNorm(primarySalt);

    const result = {
      resolvedName: closestMatch.brandName || closestMatch.brand,
      genericName: genericSalts.join(' + '),
      genericSalts,
      constituents: genericSalts,
      harmLevel: closestMatch.harmLevel || getDrugHarmLevel(primarySalt, closestMatch.class),
      class: closestMatch.class || closestMatch.category || 'Prescription Medicine',
      foodInstruction: closestMatch.foodInstruction || 'after_food',
      dosageOptions: closestMatch.dosageOptions || [closestMatch.dosage || 'Standard dose'],
      safetyTip: closestMatch.safetyTip || 'Take as prescribed.',
      standardizedCode: primaryCui,
      layer: `Layer 3 (Fuzzy Match: ${closestMatch.brandName})`,
    };

    // Store in cache for future instant hits
    _cache[cleaned] = result;
    persistCache();
    return result;
  }

  // ══════════════════════════════════════════════════════════════
  // Layer 4: Direct RxNorm NLM API Lookup
  // ══════════════════════════════════════════════════════════════
  const rxCui = await queryRxNorm(cleaned);
  if (rxCui) {
    const harmLevel = getDrugHarmLevel(cleaned);
    const result = {
      resolvedName: raw,
      genericName: raw,
      genericSalts: [raw],
      constituents: [raw],
      harmLevel,
      class: 'RxNorm Standard Drug',
      foodInstruction: 'after_food',
      dosageOptions: ['Standard dose'],
      safetyTip: 'RxNorm validated medication. Take as directed.',
      standardizedCode: rxCui,
      layer: 'Layer 4 (RxNorm REST API)',
    };

    _cache[cleaned] = result;
    persistCache();
    return result;
  }

  // ══════════════════════════════════════════════════════════════
  // Layer 5: Parallel Gemini + Groq AI Clinical Decomposer & Cache Writeback
  // ══════════════════════════════════════════════════════════════
  const aiResult = await queryParallelDecomposer(raw);
  if (aiResult) {
    const primarySalt = aiResult.genericSalts[0];
    const primaryCui = await queryRxNorm(primarySalt);

    const result = {
      resolvedName: aiResult.brandName,
      genericName: aiResult.genericName || aiResult.genericSalts.join(' + '),
      genericSalts: aiResult.genericSalts,
      constituents: aiResult.genericSalts,
      harmLevel: aiResult.harmLevel || getDrugHarmLevel(primarySalt, aiResult.class),
      class: aiResult.class,
      foodInstruction: aiResult.foodInstruction,
      dosageOptions: aiResult.dosageOptions,
      safetyTip: aiResult.safetyTip,
      standardizedCode: primaryCui,
      layer: `Layer 5 (${aiResult.source || 'AI Decomposer'})`,
    };

    _cache[cleaned] = result;
    persistCache();
    return result;
  }

  // Fallback if all layers pass
  const fallbackHarm = getDrugHarmLevel(raw);
  return {
    resolvedName: raw,
    genericName: raw,
    genericSalts: [raw],
    constituents: [raw],
    harmLevel: fallbackHarm,
    class: 'Unlisted Medication',
    foodInstruction: 'after_food',
    dosageOptions: ['Standard dose'],
    safetyTip: 'Verify administration instructions with your physician.',
    standardizedCode: null,
    layer: 'Fallback (Rule-Based)',
  };
}

/**
 * Returns array of all active generic constituent salts for interaction matching
 */
async function getConstituentGenerics(rawDrugName) {
  const res = await resolveDrugWithAI(rawDrugName);
  return res.genericSalts || [rawDrugName];
}

/**
 * Returns primary standardized RxCUI code
 */
async function getRxCuiWithAI(rawDrugName) {
  const res = await resolveDrugWithAI(rawDrugName);
  return res.standardizedCode || null;
}

module.exports = {
  resolveDrugWithAI,
  getConstituentGenerics,
  getRxCuiWithAI,
};
