'use strict';

/**
 * lib/demo.js
 * ───────────────────────────────────────────────────────────────────────────
 * DEMO MODE — controlled exclusively by the DEMO_MODE environment variable.
 *
 * Set  DEMO_MODE=true  in your .env (or shell) before a live demonstration
 * if the venue network is unreliable or you don't want to depend on external
 * APIs (OCR.space, RxNorm/RxNav, Groq).
 *
 * Every public function in this file is a deliberate, explicitly-labelled
 * MOCK. They never reach a live API. They are not hidden fallbacks — they are
 * intentional demo fixtures that can be audited in one place.
 *
 * Zero code changes are required elsewhere: the callers check isDemoMode()
 * first and branch into these mocks. Flip the env var, restart the server.
 * ───────────────────────────────────────────────────────────────────────────
 */

/** Returns true when DEMO_MODE is explicitly set to the string "true". */
function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK: OCR.space scan response
// Simulates a prescription label scan for a widely-recognised demo drug pair
// (Warfarin + Aspirin) so that the interaction check fires during a demo.
// ─────────────────────────────────────────────────────────────────────────────
function getMockOcrResult() {
  // ⚠ DEMO MOCK — not a real OCR result. Set DEMO_MODE=false for production.
  const rawText = `Patient: Demo Patient
Drug: Warfarin
Tablet 5mg
Take once daily as directed
Rx: 12345-DEMO
Refills: 2`;

  return {
    // ── DEMO MOCK ── OCR.space not called. Remove DEMO_MODE=true to use live OCR.
    __demoMock: true,
    rawText,
    candidate: 'Warfarin',
    lineCount:  6,
    note:       '[DEMO MODE] Pre-set OCR result — drug name extracted for demonstration purposes. Verify before saving.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK: RxNorm / RxNav standardisation response
// Returns a known RxCUI for the most common demo drug names so the interaction
// check has standardised codes to work with. Falls back to null for unknowns.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_RXCUI_MAP = {
  // ⚠ DEMO MOCK — static map, not a real RxNorm API call.
  warfarin:    '11289',
  aspirin:     '1191',
  atorvastatin:'83367',
  lisinopril:  '29046',
  metformin:   '6809',
  simvastatin: '36567',
  fluconazole: '4450',
  ibuprofen:   '5640',
  omeprazole:  '40790',
  amlodipine:  '17767',
};

function getMockRxCui(drugName) {
  // ── DEMO MOCK ── RxNav not called. Remove DEMO_MODE=true to use live RxNorm.
  const key = drugName?.toLowerCase().trim();
  return DEMO_RXCUI_MAP[key] ?? null; // returns null for unknown names — graceful non-failure
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK: Groq explanation response
// Returns pre-written, medically accurate explanations for the Warfarin+Aspirin
// demo pair (and a generic fallback for any other pair) so the risk page
// shows polished content without an LLM call.
// ─────────────────────────────────────────────────────────────────────────────
function getMockGroqExplanation({ drugA, drugB, severity, burdenScore, burdenLevel }) {
  // ── DEMO MOCK ── Groq API not called. Remove DEMO_MODE=true to use live Groq.
  const pairKey = [drugA, drugB].map((d) => d?.toLowerCase().trim()).sort().join('+');

  const knownPairs = {
    'aspirin+warfarin': {
      clinical: `Concurrent use of warfarin (vitamin K antagonist) and aspirin (COX inhibitor / antiplatelet) carries a Major interaction risk: additive haemorrhagic potential through dual anticoagulant-antiplatelet pathway inhibition, requiring INR monitoring and dose optimisation.`,
      plain:    `Taking warfarin and aspirin together significantly increases the risk of bleeding because both medicines affect how your blood clots. Please do not change either dose without talking to your doctor first. (This is an informational safety alert, not a medical diagnosis.)`,
    },
    'fluconazole+simvastatin': {
      clinical: `Fluconazole potently inhibits CYP3A4/CYP2C9, leading to markedly elevated simvastatin plasma concentrations and substantially increased risk of myopathy and rhabdomyolysis.`,
      plain:    `Fluconazole (antifungal) can cause simvastatin to build up in your blood to harmful levels, raising the risk of serious muscle damage. Your doctor may need to pause your statin while you take the antifungal. (This is an informational safety alert, not a medical diagnosis.)`,
    },
  };

  if (knownPairs[pairKey]) {
    return {
      // ── DEMO MOCK ── Pre-written explanation (not AI-generated).
      ...knownPairs[pairKey],
      generatedBy: 'demo-mock',
    };
  }

  // Generic demo fallback for any other pair
  const sev   = severity   ?? 'Moderate';
  const score = burdenScore ?? 0;
  const level = burdenLevel ?? 'Normal';
  return {
    // ── DEMO MOCK ── Generic pre-written explanation (not AI-generated).
    clinical: `[DEMO] Interaction identified between ${drugA} and ${drugB} (${sev}). Cumulative anticholinergic/sedative burden: ${score} (${level}). Full Groq analysis available in production.`,
    plain:    `[DEMO] ${drugA} and ${drugB} have a ${sev} interaction. In a live environment this explanation is personalised by the Groq LLM using your age and conditions. (This is an informational safety alert, not a medical diagnosis.)`,
    generatedBy: 'demo-mock',
  };
}

module.exports = { isDemoMode, getMockOcrResult, getMockRxCui, getMockGroqExplanation };
