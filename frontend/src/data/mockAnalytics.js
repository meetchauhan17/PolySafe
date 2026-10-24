/**
 * frontend/src/data/mockAnalytics.js
 *
 * Mock longitudinal pharmacovigilance telemetry data for Guest mode & offline insights.
 * Marked with: needs clinical review
 */

export const MOCK_REGIMEN_SCORE = {
  score: 74,
  grade: 'B',
  label: 'Good',
  breakdown: {
    medicationCount: { score: 75, weight: 0.20, value: 5 },
    harmAverage:     { score: 68, weight: 0.25, value: '2.4' },
    acbBurden:       { score: 75, weight: 0.30, value: 1 },
    interactions:    { score: 76, weight: 0.25, value: 2 },
  },
};

export const MOCK_POLYPHARMACY_TREND = (() => {
  const points = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const count = i > 22 ? 3 : i > 12 ? 4 : 5;
    points.push({
      date: d.toISOString().slice(0, 10),
      medicationCount: count,
    });
  }
  return { trend: points };
})();

export const MOCK_DRUG_CLASSES = {
  byType: [
    { label: 'PRESCRIPTION', value: 3 },
    { label: 'OTC',          value: 1 },
    { label: 'HERBAL',       value: 1 },
  ],
  byHarmLevel: [
    { level: 1, label: 'Minimal',  count: 1 },
    { level: 2, label: 'Low',      count: 2 },
    { level: 3, label: 'Moderate', count: 1 },
    { level: 4, label: 'High',     count: 1 },
  ],
  total: 5,
};

export const MOCK_ACB_TIMELINE = (() => {
  const weeks = [];
  const today = new Date();
  const sampleScores = [0, 0, 1, 1, 1, 2, 2, 1];

  for (let w = 7; w >= 0; w--) {
    const d = new Date(today);
    d.setDate(today.getDate() - w * 7);
    weeks.push({
      week: `Wk -${w}`,
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      acbScore: sampleScores[7 - w] ?? 1,
    });
  }

  return {
    weeks,
    currentScore: 1,
    level: 'Low',
    interpretation: 'Low Anticholinergic Cognitive Burden. Low risk of confusion, falls, or cognitive fog.',
  };
})();

export const MOCK_TOP_INTERACTIONS = {
  flags: [
    {
      flagId: 'demo-flag-1',
      drugA: 'Warfarin',
      drugB: 'Turmeric (Curcumin)',
      severity: 'Major',
      explanation: 'Botanical-Pharmacological synergy: Turmeric inhibits CYP2C9 metabolism of Warfarin, multiplying free active anticoagulant concentrations and internal bleeding risks.',
      source: 'CDSCO / WHO Pharmacovigilance Advisory Table',
    },
    {
      flagId: 'demo-flag-2',
      drugA: 'Warfarin',
      drugB: 'Aspirin',
      severity: 'Major',
      explanation: 'Additive antihemostatic load: Combining vitamin K inhibition with platelet cyclooxygenase-1 blockade significantly raises upper GI ulceration and major hemorrhage risks.',
      source: 'DDInter NIH Interaction Reference Database',
    },
    {
      flagId: 'demo-flag-3',
      drugA: 'Amitriptyline',
      drugB: 'Escitalopram',
      severity: 'Moderate',
      explanation: 'Pharmacodynamic synergism: Concurrent TCA and SSRI administration elevates QTc interval prolongation risk and increases cumulative sedation.',
      source: 'Anticholinergic Cognitive Burden Scale',
    },
  ],
  total: 3,
};
