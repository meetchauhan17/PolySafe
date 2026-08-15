/**
 * services/burdenIndex.js
 *
 * Anticholinergic and Sedative Burden Index Calculator.
 *
 * Calculates cumulative burden across a patient's entire medicine list using the
 * Anticholinergic Cognitive Burden (ACB) scale (0-3).
 *
 * Thresholds:
 *   - 0:     "Normal"   (Low / no cumulative burden)
 *   - 1 - 2: "Moderate" (Moderate burden — monitor for cognitive / fall risk)
 *   - 3+:    "Critical" (High risk of delirium, falls, memory impairment)
 */

'use strict';

const prisma = require('../lib/prisma');

/**
 * Normalizes a drug name for lookup against the burden score table.
 * Strips dosages, parenthetical brand names, etc.
 * @param {string} name
 * @returns {string}
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|ml|g|iu|unit|units|tab|cap|tablets|capsules)\b/gi, '')
    .replace(/[^a-z\s-]/g, ' ')
    .trim();
}

/**
 * Calculates the cumulative anticholinergic/sedative burden for a patient.
 *
 * @param {string} patientId - Patient ID
 * @returns {Promise<{
 *   totalScore: number,
 *   level: 'Normal' | 'Moderate' | 'Critical',
 *   breakdown: Array<{ medicineId: string, name: string, score: number }>,
 *   count: number,
 *   explanation: string
 * }>}
 */
async function calculateCumulativeBurden(patientId) {
  if (!patientId) {
    return {
      totalScore: 0,
      level: 'Normal',
      breakdown: [],
      count: 0,
      explanation: 'No patient ID provided.',
    };
  }

  try {
    // 1. Fetch all current medicines for the patient
    const medicines = await prisma.medicine.findMany({
      where: { patientId },
      select: { id: true, name: true, type: true },
    });

    if (medicines.length === 0) {
      return {
        totalScore: 0,
        level: 'Normal',
        breakdown: [],
        count: 0,
        explanation: 'Patient currently has no active medicines.',
      };
    }

    // 2. Fetch all known burden scores from DB
    const allBurdenScores = await prisma.burdenScore.findMany();
    const scoreMap = new Map();
    for (const item of allBurdenScores) {
      scoreMap.set(item.drugName.toLowerCase().trim(), item.score);
    }

    // 3. Match each medicine against known burden scores
    const breakdown = [];
    let totalScore = 0;

    for (const med of medicines) {
      const cleanName = normalizeName(med.name);
      const words = cleanName.split(/\s+/).filter(Boolean);

      let matchedScore = 0;

      // Exact match
      if (scoreMap.has(cleanName)) {
        matchedScore = scoreMap.get(cleanName);
      } else {
        // Match individual words / active ingredients (e.g., "hydroxyzine hcl" -> "hydroxyzine")
        for (const word of words) {
          if (scoreMap.has(word)) {
            matchedScore = Math.max(matchedScore, scoreMap.get(word));
          }
        }

        // Substring / partial match if still 0
        if (matchedScore === 0) {
          for (const [knownDrug, score] of scoreMap.entries()) {
            if (
              (knownDrug.length >= 4 && cleanName.includes(knownDrug)) ||
              (cleanName.length >= 4 && knownDrug.includes(cleanName))
            ) {
              matchedScore = Math.max(matchedScore, score);
            }
          }
        }
      }

      totalScore += matchedScore;
      breakdown.push({
        medicineId: med.id,
        name: med.name,
        score: matchedScore,
      });
    }

    // 4. Determine level based on thresholds
    let level = 'Normal';
    let explanation = 'No significant anticholinergic or sedative burden detected.';

    if (totalScore >= 3) {
      level = 'Critical';
      explanation = `Cumulative burden score is ${totalScore} (Critical). High risk of cognitive impairment, sedation, urinary retention, and falls. Clinical review recommended.`;
    } else if (totalScore >= 1) {
      level = 'Moderate';
      explanation = `Cumulative burden score is ${totalScore} (Moderate). Mild-to-moderate sedative or anticholinergic load. Monitor for drowsiness and dry mouth.`;
    }

    return {
      totalScore,
      level,
      breakdown,
      count: medicines.length,
      explanation,
    };
  } catch (err) {
    console.error(`[calculateCumulativeBurden] Error for patient ${patientId}:`, err);
    return {
      totalScore: 0,
      level: 'Normal',
      breakdown: [],
      count: 0,
      error: err.message,
      explanation: 'Could not calculate burden index due to internal error.',
    };
  }
}

module.exports = { calculateCumulativeBurden };
