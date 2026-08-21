/**
 * services/interactionLookup.js
 *
 * Bidirectional DDInter reference lookup.
 *
 * Design principles:
 *   • "notInDataset: true" when a pair is not in DDInter — explicitly distinguishes
 *     "no interaction found" from "interaction checked and found safe".
 *   • Case-insensitive matching via Postgres ILIKE (handled in the query).
 *   • Returns all matches when multiple severity rows exist for the same pair
 *     (DDInter can have duplicates with different evidence levels).
 *   • Never throws — callers receive a structured result even on DB error so the
 *     interaction check flow degrades gracefully.
 */

'use strict';

const prisma = require('../lib/prisma');
const { resolveDrugCandidates } = require('./drugAliases');
const { getConstituentGenerics } = require('./aiDrugResolver');

// ─── Types (JSDoc for IDE autocomplete) ──────────────────────────────────────
/**
 * @typedef {Object} LookupResult
 * @property {boolean}  found         — true if a match exists in the DDInter table
 * @property {boolean}  notInDataset  — true if NO match found (use this, not !found)
 * @property {string|null} severity   — highest severity if multiple matches, else first match
 * @property {string[]} allSeverities — all severity levels found for this pair
 * @property {string}   drugA         — normalised input drug A name
 * @property {string}   drugB         — normalised input drug B name
 * @property {string}   source        — "DDInter"
 * @property {string}   note          — human-readable explanation of result
 */

// Severity ranking for picking the "worst" when multiple rows exist
const SEVERITY_RANK = {
  'Contraindicated': 4,
  'Major': 3,
  'Moderate': 2,
  'Minor': 1,
  'Unknown': 0,
};

function pickHighestSeverity(severities) {
  if (!severities.length) return null;
  return severities.reduce((best, current) => {
    return (SEVERITY_RANK[current] ?? 0) > (SEVERITY_RANK[best] ?? 0) ? current : best;
  }, severities[0]);
}

// ─── Core lookup ──────────────────────────────────────────────────────────────

/**
 * Look up a drug-drug pair in the DDInter reference table.
 * Matches in both A→B and B→A directions across all generic/brand candidates.
 *
 * @param {string} drugA  First drug name (any casing)
 * @param {string} drugB  Second drug name (any casing)
 * @returns {Promise<LookupResult>}
 */
async function lookupInteraction(drugA, drugB) {
  const a = (drugA ?? '').trim();
  const b = (drugB ?? '').trim();

  if (!a || !b) {
    return {
      found: false,
      notInDataset: true,
      severity: null,
      allSeverities: [],
      drugA: a,
      drugB: b,
      source: 'DDInter',
      note: 'One or both drug names were empty — cannot perform lookup.',
    };
  }

  // Use AI-powered constituent resolver for maximum brand/generic coverage
  const [candsA, candsB] = await Promise.all([
    getConstituentGenerics(a).catch(() => resolveDrugCandidates(a)),
    getConstituentGenerics(b).catch(() => resolveDrugCandidates(b)),
  ]);

  try {
    const orConditions = [];
    for (const candA of candsA) {
      for (const candB of candsB) {
        orConditions.push(
          { drugAName: { equals: candA, mode: 'insensitive' }, drugBName: { equals: candB, mode: 'insensitive' } },
          { drugAName: { equals: candB, mode: 'insensitive' }, drugBName: { equals: candA, mode: 'insensitive' } }
        );
      }
    }

    const matches = await prisma.drugInteractionReference.findMany({
      where: { OR: orConditions },
      select: {
        id: true,
        drugAName: true,
        drugBName: true,
        severity: true,
        ddinterId: true,
      },
    });

    if (matches.length === 0) {
      return {
        found: false,
        notInDataset: true,        // ← explicitly not safe — just not in dataset
        severity: null,
        allSeverities: [],
        drugA: a,
        drugB: b,
        source: 'DDInter',
        note: `No interaction record found for "${a}" + "${b}" in the DDInter reference dataset. This does NOT mean the combination is safe — it may simply not be catalogued. Always verify with a clinical source.`,
      };
    }

    const allSeverities = [...new Set(matches.map((m) => m.severity))];
    const severity = pickHighestSeverity(allSeverities);

    return {
      found: true,
      notInDataset: false,
      severity,
      allSeverities,
      matchCount: matches.length,
      drugA: a,
      drugB: b,
      source: 'DDInter',
      matches: matches.map((m) => ({
        id: m.id,
        drugAName: m.drugAName,
        drugBName: m.drugBName,
        severity: m.severity,
        ddinterId: m.ddinterId,
      })),
      note: `DDInter interaction detected: ${severity}${allSeverities.length > 1 ? ` (multiple evidence levels: ${allSeverities.join(', ')})` : ''}.`,
    };
  } catch (err) {
    // Non-fatal — caller decides how to handle
    console.error(`[interactionLookup] DB error for "${a}" + "${b}":`, err.message);
    return {
      found: false,
      notInDataset: true,
      severity: null,
      allSeverities: [],
      drugA: a,
      drugB: b,
      source: 'DDInter',
      error: 'Database lookup failed — treat as unverified.',
      note: 'Could not query the DDInter reference table. Interaction status unknown.',
    };
  }
}

/**
 * Check all pairwise combinations in a list of drug names.
 * Returns only pairs that have a match (or all pairs with notInDataset flag).
 *
 * @param {string[]} drugNames
 * @param {Object} [opts]
 * @param {boolean} [opts.includeNotFound=false]  Include unmatched pairs in result
 * @returns {Promise<LookupResult[]>}
 */
async function lookupAllPairs(drugNames, { includeNotFound = false } = {}) {
  const names = drugNames.map((n) => n.trim()).filter(Boolean);
  const results = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const result = await lookupInteraction(names[i], names[j]);
      if (result.found || includeNotFound) {
        results.push(result);
      }
    }
  }

  return results;
}

module.exports = { lookupInteraction, lookupAllPairs };
