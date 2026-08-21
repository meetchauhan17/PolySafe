const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

// Load harm levels dataset
let harmData = { classes: {}, drugs: {} };
try {
  const filePath = path.join(__dirname, '../../data/harm-levels.json');
  if (fs.existsSync(filePath)) {
    harmData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
} catch (e) {
  console.warn('[regimenRisk] Failed to load harm-levels.json:', e.message);
}

/**
 * Returns the individual drug harm tier (1 to 5) for a given drug name or category.
 * Defaults to 3 (Moderate Risk) if unknown.
 *
 * @param {string} drugName
 * @param {string} [category]
 * @returns {number} 1 | 2 | 3 | 4 | 5
 */
function getDrugHarmLevel(drugName, category = '') {
  if (!drugName) return 3;
  const nameLower = drugName.toLowerCase().trim();

  // 1. Direct drug dictionary lookup
  if (harmData.drugs && harmData.drugs[nameLower] !== undefined) {
    return harmData.drugs[nameLower];
  }

  // 2. Substring matching against drug dictionary keys
  if (harmData.drugs) {
    for (const [key, level] of Object.entries(harmData.drugs)) {
      if (nameLower.includes(key) || (key.length >= 4 && key.includes(nameLower))) {
        return level;
      }
    }
  }

  // 3. Match against class keyword lists
  const combinedText = `${nameLower} ${category || ''}`.toLowerCase();
  if (harmData.classes) {
    // Check in reverse order (5 down to 1) so critical high-risk keywords take precedence
    for (const tier of ['5', '4', '3', '2', '1']) {
      const classInfo = harmData.classes[tier];
      if (classInfo && classInfo.keywords) {
        for (const kw of classInfo.keywords) {
          if (combinedText.includes(kw)) {
            return parseInt(tier, 10);
          }
        }
      }
    }
  }

  return 3; // Default to 3 (Moderate)
}

/**
 * Computes patient-level polypharmacy regimen risk using the WHO/NCI 5-Tier formula:
 *
 * - averageRisk = sum(harmLevel for all active medicines) / count
 * - If max(harmLevel) = 5 OR activeFlags >= 3 → CRITICAL (5)
 * - Else if averageRisk >= 3.5 OR majorFlags >= 1 → HIGH (4)
 * - Else if averageRisk >= 2.5 → MODERATE (3)
 * - Else if averageRisk >= 1.5 → MILD (2)
 * - Else → LOW (1)
 *
 * @param {string} patientId
 * @returns {Promise<{
 *   averageRisk: number,
 *   level: number,
 *   tier: string,
 *   label: string,
 *   color: string,
 *   highestRiskDrug: { name: string, harmLevel: number, tier: string } | null,
 *   distribution: { L1: number, L2: number, L3: number, L4: number, L5: number },
 *   activeCount: number,
 *   flagCount: number,
 *   majorFlagCount: number
 * }>}
 */
async function calculateRegimenRisk(patientId) {
  if (!patientId) {
    return {
      averageRisk: 0,
      level: 1,
      tier: 'L1',
      label: 'LOW',
      color: 'green',
      highestRiskDrug: null,
      distribution: { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 },
      activeCount: 0,
      flagCount: 0,
      majorFlagCount: 0,
    };
  }

  // 1. Fetch active medicines (removedAt: null)
  const activeMeds = await prisma.medicine.findMany({
    where: {
      patientId,
      removedAt: null,
    },
    select: {
      id: true,
      name: true,
      dosage: true,
      type: true,
      harmLevel: true,
    },
  });

  // 2. Fetch active interaction flags
  const activeFlags = await prisma.interactionFlag.findMany({
    where: {
      patientId,
      medicineA: { removedAt: null },
      medicineB: { removedAt: null },
    },
    select: {
      id: true,
      severity: true,
    },
  });

  if (!activeMeds || activeMeds.length === 0) {
    return {
      averageRisk: 0,
      level: 1,
      tier: 'L1',
      label: 'LOW',
      color: 'green',
      highestRiskDrug: null,
      distribution: { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 },
      activeCount: 0,
      flagCount: 0,
      majorFlagCount: 0,
    };
  }

  const distribution = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
  let sumHarm = 0;
  let maxHarm = 1;
  let highestMed = null;

  for (const med of activeMeds) {
    const level = med.harmLevel || getDrugHarmLevel(med.name);
    sumHarm += level;

    if (level >= 1 && level <= 5) {
      distribution[`L${level}`] += 1;
    }

    if (level > maxHarm || !highestMed) {
      maxHarm = level;
      highestMed = {
        name: med.name,
        dosage: med.dosage,
        harmLevel: level,
        tier: `L${level}`,
      };
    }
  }

  const count = activeMeds.length;
  const averageRisk = parseFloat((sumHarm / count).toFixed(1));
  const activeFlagCount = activeFlags.length;
  const majorFlagCount = activeFlags.filter((f) =>
    ['MAJOR', 'CONTRAINDICATED'].includes((f.severity || '').toUpperCase())
  ).length;

  // Apply specified classification formula
  let level = 1;
  let label = 'LOW';
  let color = 'green';

  if (maxHarm === 5 || activeFlagCount >= 3) {
    level = 5;
    label = 'CRITICAL';
    color = 'red';
  } else if (averageRisk >= 3.5 || majorFlagCount >= 1) {
    level = 4;
    label = 'HIGH';
    color = 'orange';
  } else if (averageRisk >= 2.5) {
    level = 3;
    label = 'MODERATE';
    color = 'amber';
  } else if (averageRisk >= 1.5) {
    level = 2;
    label = 'MILD';
    color = 'lime';
  } else {
    level = 1;
    label = 'LOW';
    color = 'green';
  }

  return {
    averageRisk,
    level,
    tier: `L${level}`,
    label,
    color,
    highestRiskDrug: highestMed,
    distribution,
    activeCount: count,
    flagCount: activeFlagCount,
    majorFlagCount,
  };
}

module.exports = {
  getDrugHarmLevel,
  calculateRegimenRisk,
};
