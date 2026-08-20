const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { isDemoMode, getMockRxCui } = require('../lib/demo');

const prisma = new PrismaClient();

// ─── Boilerplate patterns to filter out ────────────────────────────────────────
const BOILERPLATE_PATTERNS = [
  /keep\s+out\s+of\s+(?:the\s+)?reach(?:\s+of\s+children)?/i,
  /read\s+(?:the\s+)?(?:enclosed\s+)?instructions/i,
  /read\s+(?:the\s+)?(?:enclosed\s+)?leaflet/i,
  /package\s+insert/i,
  /store\s+(?:at|below|in|between)/i,
  /room\s+temperature/i,
  /protect\s+from\s+(?:light|moisture|heat)/i,
  /excipients?/i,
  /inactive\s+ingredients?/i,
  /manufactured\s+by/i,
  /mfg(?:\.|\s+)?by/i,
  /marketed\s+by/i,
  /mkt(?:\.|\s+)?by/i,
  /registered\s+trade\s*mark/i,
  /trade\s*mark/i,
  /dosage\s*[:\-]/i,
  /as\s+directed\s+by/i,
  /physician/i,
  /doctor/i,
  /pharmacist/i,
  /subsidiary\s+of/i,
  /for\s+oral\s+use/i,
  /for\s+external\s+use/i,
  /batch\s+(?:no|number)/i,
  /b(?:\.|\s+)?no/i,
  /lot\s+(?:no|number)/i,
  /mfg(?:\.|\s+)?date/i,
  /exp(?:\.|\s+)?date/i,
  /expiry\s+date/i,
  /net\s+contents?/i,
  /contains\s*[:\-]/i,
  /composition/i,
  /film\s+coated/i,
  /coated\s+tablet/i,
  /warnings?/i,
  /caution/i,
  /schedule\s+[a-z]/i,
  /prescription\s+only/i,
  /each\s+tablet\s+contains/i,
  /each\s+capsule\s+contains/i,
  /each\s+film\s+coated/i,
  /pharmacopoeia/i,
  /pharmaceutical/i,
  /laboratories/i,
  /healthcare/i,
  /remedies/i,
  /private\s+limited/i,
  /ltd\.?/i,
  /pvt\.?/i,
  /inc\.?/i,
  /corp\.?/i,
  /gmp\s+certified/i,
  /who\s+gmp/i,
  /fssai/i,
  /regd/i,
  /refill/i,
  /take\s+\d/i,
  /times\s+daily/i,
  /every\s+\d+\s+hours/i,
  /with\s+water/i,
  /before\s+meals/i,
  /after\s+meals/i,
  /plot\s+no/i,
  /sector/i,
  /industrial\s+area/i,
  /haridwar/i,
  /sidcul/i,
  /ranipur/i,
  /uttarakhand/i,
  /himachal/i,
  /baddi/i,
  /solan/i,
  /mumbai/i,
  /gujarat/i,
  /ahmedabad/i,
  /india/i,
  /m\.?l\.?\s*[:\-]?\s*\w+/i,
  /lic\.?\s*(?:no|number)/i,
  /licence/i,
  /license/i,
  /equivalent\s+to/i,
  /eq\.\s*to/i,
  /colours?\s*[:\-]/i,
  /red\s+oxide/i,
  /titanium\s+dioxide/i,
  /iron\s+oxide/i,
  /lake\s+of/i,
  /schedule\s+[a-z]\s+prescription/i,
  /not\s+to\s+be\s+sold\s+by\s+retail/i,
  /registered\s+medical\s+practitioner/i,
];

// Stop words and short boilerplate tokens
const STOP_WORDS = new Set([
  'let', 'the', 'and', 'for', 'with', 'from', 'not', 'use', 'take', 'each',
  'daily', 'oral', 'tab', 'cap', 'mg', 'ml', 'mcg', 'usp', 'bp', 'ip',
  'tablets', 'capsules', 'tablet', 'capsule', 'syrup', 'drops', 'ointment',
  'cream', 'solution', 'suspension', 'injection', 'gel', 'lotion', 'patch',
  'warning', 'caution', 'keep', 'reach', 'children', 'store', 'room',
  'temperature', 'protect', 'light', 'moisture', 'batch', 'expiry', 'date',
  'mfg', 'exp', 'dosage', 'directed', 'physician', 'doctor', 'patient',
  'name', 'rx', 'only', 'prescribed', 'quantity', 'refills', 'contains',
  'composition', 'coated', 'film', 'color', 'colours', 'titanium', 'dioxide',
  'yellow', 'red', 'blue', 'lake', 'oxide', 'iron', 'silicon', 'stearate',
  'magnesium', 'talc', 'cellulose', 'starch', 'glycolate', 'sodium',
  'maleate', 'tartrate', 'hydrochloride', 'hcl', 'mesylate', 'succinate', 'hydrate',
  'equivalent', 'pure', 'cure', 'akums', 'sidcul', 'ranipur', 'haridwar',
  'uttarakhand', 'india', 'pvt', 'ltd', 'limited', 'private', 'plot', 'sector',
  'hours', 'daily', 'times', 'meals', 'water', 'food', 'day', 'night', 'morning',
  'evening', 'noon', 'bedtime', 'as', 'needed', 'prn', 'stat', 'label', 'instructions'
]);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract dosage string if present in raw text.
 */
function extractDosage(text) {
  // 1. Check if a drug/brand name has a number attached (e.g. "Naxdom 500", "Naxdom’500", "Naxdom® 500", "Augmentin 625")
  const brandNumberMatches = [...text.matchAll(/\b[A-Za-z]{3,}[’'*®™]?\s*(\d{2,4})\b/g)];
  if (brandNumberMatches.length > 0) {
    const validNums = brandNumberMatches
      .map(m => parseInt(m[1], 10))
      .filter(n => n >= 50 && n <= 2000);
    if (validNums.length > 0) {
      // Prioritize primary strength (e.g. 500 mg over 10 mg)
      const maxNum = Math.max(...validNums);
      return `${maxNum} mg`;
    }
  }

  // 2. Look for explicit dosage units (mg, mcg, g, ml) and pick primary strength
  const allDoses = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?)\b/gi)];
  if (allDoses.length > 0) {
    // Prioritize standard clinical tablet strengths (50mg-1000mg)
    const tabletDoses = allDoses.filter(d => d[2].toLowerCase() === 'mg' && parseFloat(d[1]) >= 50);
    if (tabletDoses.length > 0) {
      return `${tabletDoses[0][1]} mg`;
    }
    return `${allDoses[0][1]} ${allDoses[0][2]}`;
  }

  const numberDoseRegex = /\b(\d{2,4})\b/;
  const numMatch = text.match(numberDoseRegex);
  if (numMatch && parseInt(numMatch[1], 10) >= 10 && parseInt(numMatch[1], 10) <= 2000) {
    return `${numMatch[1]} mg`;
  }
  return null;
}

/**
 * Checks if a candidate token or line matches boilerplate.
 */
function isBoilerplate(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;

  // Single word in stop words
  const lower = trimmed.toLowerCase();
  if (STOP_WORDS.has(lower)) return true;

  // Check regex patterns
  for (const pattern of BOILERPLATE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Pure numbers or symbols
  if (/^[\d\s.,\-+*/#()]+$/.test(trimmed)) return true;

  return false;
}

/**
 * Generates and ranks candidate drug name phrases from raw OCR text.
 *
 * @param {string} rawText
 * @returns {{ rankedCandidates: string[], suggestedDosage: string|null, lines: string[] }}
 */
function extractAndRankCandidates(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { rankedCandidates: [], suggestedDosage: null, lines: [] };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const suggestedDosage = extractDosage(rawText);
  const candidateScores = new Map(); // candidateString -> score

  // 1. Explicit Rx / Drug pattern regex matching
  const explicitPatterns = [
    /(?:rx|drug|medicine|medication)\s*[:\-]?\s*([A-Za-z0-9\s\-]{2,35})/gi,
    /([A-Za-z][A-Za-z0-9\-]{2,30})\s+(?:\d+(?:\.\d+)?\s*(?:mg|mcg|ml|g|iu|unit))/gi,
  ];

  for (const pat of explicitPatterns) {
    let match;
    while ((match = pat.exec(rawText)) !== null) {
      const matchText = (match[1] || match[0]).trim();
      if (!isBoilerplate(matchText)) {
        const clean = matchText.replace(/^(?:rx|drug|medicine|medication)\s*[:\-]?\s*/i, '').trim();
        if (clean.length >= 3 && !STOP_WORDS.has(clean.toLowerCase())) {
          candidateScores.set(clean, (candidateScores.get(clean) || 0) + 15);
        }
      }
    }
  }

  // 2. Line by line n-gram generation (1-gram, 2-gram, 3-gram)
  lines.forEach((line, lineIndex) => {
    // If the entire line is obvious boilerplate, skip n-gram generation from it
    if (isBoilerplate(line)) return;

    // Clean line of non-alphanumeric punctuation at ends
    const words = line
      .split(/\s+/)
      .map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
      .filter((w) => w.length >= 2);

    const linePositionBonus = Math.max(0, (lines.length - lineIndex) / lines.length) * 5;

    // Generate 1-word, 2-word, 3-word n-grams
    for (let len = 1; len <= 3; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const nGramWords = words.slice(i, i + len);
        const phrase = nGramWords.join(' ').trim();

        if (phrase.length < 3) continue;
        if (isBoilerplate(phrase)) continue;

        // Check if all words in nGram are stop words
        const allStop = nGramWords.every((w) => STOP_WORDS.has(w.toLowerCase()) || /^\d+$/.test(w));
        if (allStop) continue;

        // First word must start with an alphabetic character
        if (!/^[A-Za-z]/.test(phrase)) continue;

        // Frequency count across rawText
        const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
        const matches = rawText.match(regex);
        const frequency = matches ? matches.length : 1;

        // Prominence bonuses
        let formattingBonus = 0;
        if (phrase[0] === phrase[0].toUpperCase()) formattingBonus += 2; // Title Case
        if (phrase === phrase.toUpperCase() && phrase.length >= 4) formattingBonus += 3; // ALL CAPS

        // Proximity to dosage
        let doseBonus = 0;
        if (/\d+/.test(phrase)) doseBonus += 3;

        const totalScore = (frequency * 10) + linePositionBonus + formattingBonus + doseBonus;

        const existingScore = candidateScores.get(phrase) || 0;
        if (totalScore > existingScore) {
          candidateScores.set(phrase, totalScore);
        }
      }
    }
  });

  // Sort candidates by score descending
  const sorted = Array.from(candidateScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);

  // Deduplicate case-insensitively and remove nested substrings if lower ranked
  const deduped = [];
  const seenLower = new Set();

  for (const cand of sorted) {
    const lower = cand.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      deduped.push(cand);
    }
  }

  return {
    rankedCandidates: deduped.slice(0, 8),
    suggestedDosage,
    lines,
  };
}

/**
 * Verifies candidates against RxNorm / RxNav and local clinical databases.
 * Returns the first confirmed drug candidate, or null with fallback candidates.
 *
 * @param {string[]} candidates
 * @param {string|null} suggestedDosage
 * @returns {Promise<{ candidate: string|null, standardizedCode: string|null, verified: boolean, fallbackCandidates: string[], suggestedDosage: string|null }>}
 */
async function verifyCandidatesWithRxNorm(candidates, suggestedDosage = null) {
  if (!candidates || candidates.length === 0) {
    return {
      candidate: null,
      standardizedCode: null,
      verified: false,
      fallbackCandidates: [],
      suggestedDosage,
    };
  }

  // Top 3-5 candidates to verify in rank order
  const topCandidates = candidates.slice(0, 5);
  const fallbackCandidates = topCandidates.slice(0, 3);

// Curated common brand name & combination product aliases
const COMMON_BRAND_ALIASES = {
  'naxdom': { name: 'Naxdom 500 (Naproxen + Domperidone)', genericName: 'Naproxen', dosage: '500 mg', standardizedCode: '7258', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'nexdom': { name: 'Naxdom 500 (Naproxen + Domperidone)', genericName: 'Naproxen', dosage: '500 mg', standardizedCode: '7258', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 500': { name: 'Naxdom 500 (Naproxen + Domperidone)', genericName: 'Naproxen', dosage: '500 mg', standardizedCode: '7258', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'naxdom 250': { name: 'Naxdom 250 (Naproxen + Domperidone)', genericName: 'Naproxen', dosage: '250 mg', standardizedCode: '7258', category: 'NSAID / Migraine', safetyTip: 'Take after meals with water. Avoid combining with other NSAIDs (aspirin/ibuprofen).', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'dolo': { name: 'Dolo 650 (Paracetamol)', genericName: 'Acetaminophen', dosage: '650 mg', standardizedCode: '161', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'dolo 650': { name: 'Dolo 650 (Paracetamol)', genericName: 'Acetaminophen', dosage: '650 mg', standardizedCode: '161', category: 'Analgesic / Antipyretic', safetyTip: 'Do not exceed 4,000 mg (4g) daily total from all paracetamol sources to protect liver.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'crocin': { name: 'Crocin (Paracetamol)', genericName: 'Acetaminophen', dosage: '500 mg', standardizedCode: '161', category: 'Analgesic / Antipyretic', safetyTip: 'Monitor total daily paracetamol intake across all cold/fever formulations.', dosageOptions: ['500 mg', '650 mg'], commonFrequency: 'thrice', foodInstruction: 'after_food' },
  'pan-d': { name: 'Pan-D (Pantoprazole + Domperidone)', genericName: 'Pantoprazole', dosage: '40 mg', standardizedCode: '40790', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pand': { name: 'Pan-D (Pantoprazole + Domperidone)', genericName: 'Pantoprazole', dosage: '40 mg', standardizedCode: '40790', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'pan d': { name: 'Pan-D (Pantoprazole + Domperidone)', genericName: 'Pantoprazole', dosage: '40 mg', standardizedCode: '40790', category: 'PPI / Antacid', safetyTip: 'Best taken 30-60 minutes before morning breakfast on an empty stomach.', dosageOptions: ['20 mg', '40 mg'], commonFrequency: 'once', foodInstruction: 'empty_stomach' },
  'augmentin': { name: 'Augmentin (Amoxicillin + Clavulanate)', genericName: 'Amoxicillin', dosage: '625 mg', standardizedCode: '723', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'augmentin 625': { name: 'Augmentin (Amoxicillin + Clavulanate)', genericName: 'Amoxicillin', dosage: '625 mg', standardizedCode: '723', category: 'Antibiotic', safetyTip: 'Complete the entire course prescribed even if symptoms improve early.', dosageOptions: ['375 mg', '625 mg', '1000 mg'], commonFrequency: 'twice', foodInstruction: 'with_food' },
  'ecosprin': { name: 'Ecosprin (Aspirin)', genericName: 'Aspirin', dosage: '75 mg', standardizedCode: '1191', category: 'Antiplatelet / Cardio', safetyTip: 'Low-dose cardio-protective. Take with food to minimize gastric bleeding risk.', dosageOptions: ['75 mg', '150 mg'], commonFrequency: 'once', foodInstruction: 'with_food' },
  'combiflam': { name: 'Combiflam (Ibuprofen + Paracetamol)', genericName: 'Ibuprofen', dosage: '400 mg', standardizedCode: '5640', category: 'NSAID / Pain Relief', safetyTip: 'Take after meals. Avoid if you have active peptic ulcer or renal impairment.', dosageOptions: ['400 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'telma': { name: 'Telma (Telmisartan)', genericName: 'Telmisartan', dosage: '40 mg', standardizedCode: '42355', category: 'Antihypertensive (ARB)', safetyTip: 'Take consistently at the same time each day; monitor blood pressure regularly.', dosageOptions: ['20 mg', '40 mg', '80 mg'], commonFrequency: 'once', foodInstruction: 'before_food' },
  'voveran': { name: 'Voveran (Diclofenac)', genericName: 'Diclofenac', dosage: '50 mg', standardizedCode: '3355', category: 'NSAID / Anti-inflammatory', safetyTip: 'Potent anti-inflammatory. Take with food or antacid to avoid stomach irritation.', dosageOptions: ['50 mg', '75 mg', '100 mg'], commonFrequency: 'twice', foodInstruction: 'after_food' },
  'shelcal': { name: 'Shelcal 500 (Calcium + Vitamin D3)', genericName: 'Calcium Carbonate', dosage: '500 mg', standardizedCode: '1895', category: 'Bone Health / Mineral', safetyTip: 'Take with or after lunch for optimal absorption; separate from iron supplements by 2 hours.', dosageOptions: ['250 mg', '500 mg'], commonFrequency: 'once', foodInstruction: 'after_food' },
};

  for (const cand of topCandidates) {
    const candLower = cand.toLowerCase().trim();

    // 1. Brand name alias resolution
    if (COMMON_BRAND_ALIASES[candLower]) {
      const alias = COMMON_BRAND_ALIASES[candLower];
      console.log(`[OCR BrandAlias] Resolved brand "${cand}" → ${alias.name} (generic: ${alias.genericName}, RxCUI ${alias.standardizedCode})`);
      return {
        candidate: alias.name,
        genericName: alias.genericName,
        standardizedCode: alias.standardizedCode,
        verified: true,
        fallbackCandidates,
        suggestedDosage: suggestedDosage || alias.dosage,
        category: alias.category,
        safetyTip: alias.safetyTip,
        dosageOptions: alias.dosageOptions,
        commonFrequency: alias.commonFrequency,
        foodInstruction: alias.foodInstruction,
      };
    }

    // 1b. DEMO MODE check
    if (isDemoMode()) {
      const mockCui = getMockRxCui(cand);
      if (mockCui) {
        return {
          candidate: cand,
          standardizedCode: mockCui,
          verified: true,
          fallbackCandidates,
          suggestedDosage,
        };
      }
    }

    // 2. Direct RxNorm CUI lookup
    try {
      const rxUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(cand)}&allSourcesFlag=1`;
      const { data } = await axios.get(rxUrl, { timeout: 3500 });
      const rxcui = data?.idGroup?.rxnormId?.[0] ?? null;

      if (rxcui) {
        console.log(`[OCR RxNorm] Successfully verified candidate "${cand}" → RxCUI ${rxcui}`);
        return {
          candidate: cand,
          standardizedCode: rxcui,
          verified: true,
          fallbackCandidates,
          suggestedDosage,
        };
      }
    } catch (err) {
      console.warn(`[OCR RxNorm] rxcui.json lookup failed for "${cand}":`, err.message);
    }

    // 3. Approximate term lookup (handles slight OCR misspellings & brand variations)
    try {
      const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(cand)}&maxEntries=3`;
      const { data } = await axios.get(approxUrl, { timeout: 3500 });
      const candidatesList = data?.approximateGroup?.candidate ?? [];
      
      for (const approx of candidatesList) {
        const score = parseFloat(approx?.score || '0');
        const candLower = cand.toLowerCase();
        const nameLower = (approx?.name || '').toLowerCase();
        
        // Ensure relevance: score must be high (>= 5.0 in RxNav Lucene) AND either candidate is in name or name is in candidate
        const isSubstringMatch = nameLower.includes(candLower) || candLower.includes(nameLower);
        const isHighConfidence = score >= 10.0 || (score >= 4.5 && isSubstringMatch);

        if (approx?.rxcui && isHighConfidence) {
          console.log(`[OCR RxNorm] Verified candidate "${cand}" via approximate search → ${approx.name || cand} (RxCUI ${approx.rxcui}, score=${score})`);
          return {
            candidate: approx.name || cand,
            standardizedCode: approx.rxcui,
            verified: true,
            fallbackCandidates,
            suggestedDosage,
          };
        }
      }
    } catch (err) {
      console.warn(`[OCR RxNorm] approximateTerm lookup failed for "${cand}":`, err.message);
    }

    // 4. Local Database check (DDInter reference table & Burden table)
    try {
      const dbMatch = await prisma.drugInteractionReference.findFirst({
        where: {
          OR: [
            { drugAName: { equals: cand, mode: 'insensitive' } },
            { drugBName: { equals: cand, mode: 'insensitive' } },
          ],
        },
        select: { drugAName: true, drugBName: true },
      });

      if (dbMatch) {
        const matchedName = dbMatch.drugAName.toLowerCase() === cand.toLowerCase() ? dbMatch.drugAName : dbMatch.drugBName;
        console.log(`[OCR LocalDB] Verified candidate "${cand}" against local DDInter database → ${matchedName}`);
        return {
          candidate: matchedName,
          standardizedCode: null,
          verified: true,
          fallbackCandidates,
          suggestedDosage,
        };
      }
    } catch (dbErr) {
      console.warn(`[OCR LocalDB] DB lookup failed:`, dbErr.message);
    }
  }

  // If none of the candidates resolved via RxNorm / Database:
  console.log('[OCR Verification] No candidate could be verified against RxNorm. Returning fallback chips.');
  return {
    candidate: null,
    standardizedCode: null,
    verified: false,
    fallbackCandidates,
    suggestedDosage,
  };
}

module.exports = {
  extractAndRankCandidates,
  verifyCandidatesWithRxNorm,
  isBoilerplate,
  STOP_WORDS,
  BOILERPLATE_PATTERNS,
};
