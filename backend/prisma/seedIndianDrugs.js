/**
 * backend/prisma/seedIndianDrugs.js
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║   PolySafe — Indian Drug Formulations Seeder                        ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  1. Imports 600+ Indian brand → generic mappings                    ║
 * ║  2. Generates cross-interaction pairs from DDI dataset by salts     ║
 * ║  3. Uses AI (Groq) to auto-resolve unknown brands                   ║
 * ║  4. Updates BRAND_ALIASES dynamically (writes to disk cache)        ║
 * ║                                                                      ║
 * ║  Run: node prisma/seedIndianDrugs.js                                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { INDIAN_DRUGS } = require('../data/indianDrugs');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

const BATCH = 500;
const ALIAS_CACHE = path.join(__dirname, '../data/ai-resolved-drugs.json');

// ─── Load existing AI cache ────────────────────────────────────────────────
let aiCache = {};
try {
  if (fs.existsSync(ALIAS_CACHE)) aiCache = JSON.parse(fs.readFileSync(ALIAS_CACHE, 'utf8'));
} catch { aiCache = {}; }

function saveCache() {
  try {
    const dir = path.dirname(ALIAS_CACHE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ALIAS_CACHE, JSON.stringify(aiCache, null, 2));
  } catch (e) { console.warn('[cache] Save failed:', e.message); }
}

// ─── Step 1: Populate AI cache with all Indian drugs (instant, no API needed)
function populateLocalCache() {
  console.log('\n[Step 1] Populating AI resolver cache with Indian drug data...');
  let added = 0;

  for (const drug of INDIAN_DRUGS) {
    const key = drug.brand.toLowerCase().trim();
    if (aiCache[key]) continue; // Already cached

    aiCache[key] = {
      brandName:       drug.brand,
      standardGeneric: drug.salts.join(' + '),
      constituents:    drug.salts,
      primaryRxCui:    null,
      dosage:          drug.dosage,
      dosageOptions:   [],
      category:        drug.category,
      safetyTip:       drug.safetyTip,
      commonFrequency: drug.frequency,
      foodInstruction: drug.foodInstruction,
      manufacturer:    drug.manufacturer,
      source:          'indian_formulary',
    };

    // Also add lowercase variants and common misspellings
    const variants = [
      drug.brand.toLowerCase(),
      drug.brand.toLowerCase().replace(/\s+/g, ''),
      drug.brand.toLowerCase().replace(/\s+\d+$/, ''), // "Dolo 650" → "dolo"
    ];
    for (const v of variants) {
      if (v !== key && !aiCache[v]) aiCache[v] = { ...aiCache[key], source: 'indian_formulary_variant' };
    }

    added++;
  }

  saveCache();
  console.log(`  ✓ ${added} Indian brand entries added to AI resolver cache`);
}

// ─── Step 2: Create cross-interaction pairs from salt-level matching ────────
// Logic: If Drug A contains Salt X, and Drug B contains Salt X → potential
//        duplicate/interaction. If both contain the same therapeutic class →compat check.
async function generateSaltInteractionPairs() {
  console.log('\n[Step 2] Generating salt-level interaction pairs from Indian drugs...');

  // Build salt → brands mapping
  const saltToBrands = {};
  for (const drug of INDIAN_DRUGS) {
    for (const salt of drug.salts) {
      const saltKey = salt.toLowerCase().trim();
      if (!saltToBrands[saltKey]) saltToBrands[saltKey] = [];
      saltToBrands[saltKey].push({ brand: drug.brand, salts: drug.salts, category: drug.category });
    }
  }

  // Find existing interaction pairs in DDInterReference for these salts
  const allSalts = Object.keys(saltToBrands);
  console.log(`  Checking ${allSalts.length} unique salts against DDInter database...`);

  let pairsFound = 0;
  const newPairs = [];
  const seen = new Set();

  // For each salt in DDInter, find Indian brands that contain it
  const dbSalts = await prisma.drugInteractionReference.findMany({
    where: {
      OR: allSalts.flatMap(s => [
        { drugAName: { contains: s, mode: 'insensitive' } },
        { drugBName: { contains: s, mode: 'insensitive' } },
      ]).slice(0, 200), // Limit OR conditions
    },
    select: { drugAName: true, drugBName: true, severity: true },
    take: 5000,
  });

  for (const ref of dbSalts) {
    // Find which Indian brands map to drugAName or drugBName
    for (const indianDrug of INDIAN_DRUGS) {
      for (const salt of indianDrug.salts) {
        const sLow = salt.toLowerCase();
        const refA = ref.drugAName.toLowerCase();
        const refB = ref.drugBName.toLowerCase();

        if (refA.includes(sLow) || sLow.includes(refA)) {
          // This Indian brand's salt matches drugAName — drugBName is the interactor
          const key = [indianDrug.brand, ref.drugBName].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            newPairs.push({
              drugAName: indianDrug.brand,
              drugBName: ref.drugBName,
              severity: ref.severity,
              ddinterId: `IND_SALT_${indianDrug.brand.slice(0,8)}_${ref.drugBName.slice(0,8)}`.replace(/\s+/g, '_'),
            });
            pairsFound++;
          }
        }

        if (refB.includes(sLow) || sLow.includes(refB)) {
          const key = [indianDrug.brand, ref.drugAName].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            newPairs.push({
              drugAName: indianDrug.brand,
              drugBName: ref.drugAName,
              severity: ref.severity,
              ddinterId: `IND_SALT_${indianDrug.brand.slice(0,8)}_${ref.drugAName.slice(0,8)}`.replace(/\s+/g, '_'),
            });
            pairsFound++;
          }
        }
      }
    }
  }

  console.log(`  Found ${pairsFound} interaction pairs for Indian brands via salt matching`);

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < newPairs.length; i += BATCH) {
    await prisma.drugInteractionReference.createMany({
      data: newPairs.slice(i, i + BATCH),
      skipDuplicates: true,
    });
    inserted += Math.min(BATCH, newPairs.length - i);
  }
  console.log(`  ✓ ${inserted} Indian drug interaction pairs inserted`);
  return inserted;
}

// ─── Step 3: Use Groq AI to resolve remaining unknown Indian brand names ────
async function aiResolveUnknownBrands() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('gsk_demo') || !apiKey.includes('_')) {
    console.log('\n[Step 3] Skipping AI resolution (GROQ_API_KEY not set or demo key)');
    return;
  }

  console.log('\n[Step 3] Using Groq AI to resolve additional Indian brand names...');

  // List of common Indian drugs not in our static dataset
  const additionalBrands = [
    'Corex', 'Benadon', 'Evion', 'Supradyn', 'Liv 52',
    'Hajmola', 'Dabur Chyawanprash', 'Shilajit Gold', 'Himalaya Karela',
    'Triphala', 'Ashwagandha', 'Tulsi Drop', 'Brahmi',
    'Nise', 'Hifenac P', 'Dolobak', 'Flexon', 'Sumo',
    'Xone', 'Monocef', 'Magnex', 'Oframax', 'Taxim',
    'Pan D', 'Pantop D', 'Razo D', 'Nexpro RD',
    'Glycomet GP', 'Gemer', 'Gluconorm', 'Trajenta',
    'Tenvir', 'Lamivudine', 'Nevirapine', 'Efavirenz',
    'R Cinex', 'Rifampicin', 'Pyrazinamide', 'Ethambutol',
    'Brufen Plus', 'Ibugesic Plus', 'Calpol Plus', 'Grilinctus',
  ];

  let resolved = 0;
  const batchSize = 5;

  for (let i = 0; i < additionalBrands.length; i += batchSize) {
    const batch = additionalBrands.slice(i, i + batchSize);
    const toResolve = batch.filter(b => !aiCache[b.toLowerCase()]);
    if (toResolve.length === 0) continue;

    try {
      const prompt = `You are an Indian clinical pharmacologist. For each medicine brand name below, provide its exact salt/generic composition as used in India.

Brands: ${toResolve.join(', ')}

Respond ONLY as a JSON array:
[
  {
    "brand": "Brand Name",
    "salts": ["Salt 1", "Salt 2"],
    "dosage": "strength",
    "category": "pharmacological class",
    "safetyTip": "one sentence patient tip",
    "foodInstruction": "before_food|after_food|with_food|empty_stomach|any"
  }
]`;

      const { data } = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Expert Indian pharmacologist. Output raw JSON array only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.05,
          max_tokens: 1000,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );

      const raw = data?.choices?.[0]?.message?.content?.trim() || '[]';
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const aiDrugs = JSON.parse(cleaned);

      for (const d of aiDrugs) {
        if (!d.brand || !d.salts?.length) continue;
        const key = d.brand.toLowerCase().trim();
        aiCache[key] = {
          brandName:       d.brand,
          standardGeneric: d.salts.join(' + '),
          constituents:    d.salts,
          primaryRxCui:    null,
          dosage:          d.dosage || 'As prescribed',
          dosageOptions:   [],
          category:        d.category || 'Prescription Medicine',
          safetyTip:       d.safetyTip || 'Take as prescribed.',
          commonFrequency: 'once',
          foodInstruction: d.foodInstruction || 'after_food',
          source:          'ai_indian_formulary',
        };
        resolved++;
      }

      saveCache();
      process.stdout.write(`  AI resolved ${resolved} additional Indian brands\r`);
    } catch (err) {
      // Non-critical — continue with next batch
    }
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  console.log(`\n  ✓ AI resolved ${resolved} additional Indian brand names`);
}

// ─── Step 4: Export updated drugAliases.js compatible entries ───────────────
function exportAliasCompatibleEntries() {
  console.log('\n[Step 4] Generating updated BRAND_ALIASES snippet...');

  const newEntries = {};
  for (const drug of INDIAN_DRUGS) {
    const key = drug.brand.toLowerCase().replace(/\s+/g, ' ').trim();
    newEntries[key] = {
      display:        drug.brand,
      generic:        drug.salts.join(' + '),
      rxcui:          null,
      dosage:         drug.dosage,
      dosageOptions:  [],
      category:       drug.category,
      safetyTip:      drug.safetyTip,
      commonFrequency: drug.frequency,
      foodInstruction: drug.foodInstruction,
    };
  }

  const outPath = path.join(__dirname, '../data/indian-aliases-generated.json');
  fs.writeFileSync(outPath, JSON.stringify(newEntries, null, 2));
  console.log(`  ✓ Exported ${Object.keys(newEntries).length} alias entries → ${outPath}`);
  return outPath;
}

// ─── Summary ─────────────────────────────────────────────────────────────────
async function summary() {
  const ddi = await prisma.drugInteractionReference.count();
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║      INDIAN DRUG SEEDING COMPLETE                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Indian brands in AI cache: ${String(Object.keys(aiCache).filter(k => aiCache[k].source?.includes('indian')).length).padEnd(20)}║`);
  console.log(`║  DrugInteractionReference:  ${String(ddi).padEnd(20)}║`);
  console.log(`║  Total AI cache entries:    ${String(Object.keys(aiCache).length).padEnd(20)}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
}

// ─── Run ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   PolySafe — Indian Drug Formulations Seeder      ║');
  console.log('║   600+ brands | AI-powered | DDInter cross-link   ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    populateLocalCache();
    await generateSaltInteractionPairs();
    await aiResolveUnknownBrands();
    exportAliasCompatibleEntries();
    await summary();
  } catch (e) {
    console.error('\n✗ Error:', e.message, e.stack);
    process.exit(1);
  } finally {
    await prisma['$disconnect']();
  }
})();
