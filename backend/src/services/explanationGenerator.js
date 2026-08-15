/**
 * services/explanationGenerator.js
 *
 * Groq LLM-powered medical explanation generator for Drug-Drug Interactions and
 * Cumulative Anticholinergic / Sedative Burden.
 *
 * Outputs two distinct explanations in structured JSON:
 *   1. "clinical": Concise, formal one-liner for doctors and pharmacists.
 *   2. "plain": Plain-language explanation for patients, referencing age / conditions
 *      when relevant, with strict "not a diagnosis" safety framing.
 *
 * Guardrails:
 *   - Only explains the provided severity and burden scores — never invents claims.
 *   - 8-second strict timeout: falls back immediately to structured template so
 *     the user is never blocked or left with a frozen spinner.
 *
 * generatedBy values (checked by frontend to show contextual UI):
 *   'groq'       — live Groq response, full explanation
 *   'fallback'   — no API key, key check failed, or JSON parse error
 *   'timeout'    — Groq responded but too slowly (>8s); raw severity shown immediately
 *   'demo-mock'  — DEMO_MODE=true; pre-written fixture, Groq not called
 */

'use strict';

const axios = require('axios');
const { isDemoMode, getMockGroqExplanation } = require('../lib/demo');

/**
 * Fallback static explanation builder when Groq is unavailable, times out, or has demo key.
 */
function buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel }) {
  const sev = severity || 'Unknown';
  const score = burdenScore ?? 0;
  const level = burdenLevel ?? 'Normal';

  let clinical = `Interaction identified between ${drugA} and ${drugB} (${sev}). Cumulative anticholinergic/sedative burden index: ${score} (${level}).`;
  let plain = `An interaction between ${drugA} and ${drugB} was detected (${sev} severity). Please consult your doctor before taking both medicines together. (This is an informational safety alert, not a medical diagnosis.)`;

  if (sev === 'Major' || sev === 'Contraindicated') {
    clinical = `High-risk interaction: ${drugA} + ${drugB} (${sev}). Concomitant administration requires clinical evaluation and regimen adjustment. Cumulative burden: ${score} (${level}).`;
    plain = `Taking ${drugA} and ${drugB} together is flagged as ${sev}. Please consult your doctor or pharmacist right away. (This is an informational safety alert, not a medical diagnosis.)`;
  } else if (sev === 'Minor') {
    clinical = `Minor interaction between ${drugA} and ${drugB}. Monitor for mild adverse effects as clinically indicated.`;
    plain = `A minor interaction was found between ${drugA} and ${drugB}. No immediate change is needed, but inform your healthcare provider. (This is an informational safety alert, not a medical diagnosis.)`;
  }

  return { clinical, plain, generatedBy: 'fallback' };
}

/**
 * Generates clinical and plain explanations using Groq API with an 8-second timeout.
 *
 * @param {Object} params
 * @param {string} params.drugA - First drug name
 * @param {string} params.drugB - Second drug name
 * @param {string} params.severity - DDInter severity ('Major' | 'Moderate' | 'Minor' | 'Contraindicated' | 'Unknown')
 * @param {number} [params.burdenScore] - Cumulative ACB burden score (0-3+)
 * @param {string} [params.burdenLevel] - 'Normal' | 'Moderate' | 'Critical'
 * @param {number} [params.patientAge] - Patient age
 * @param {string[]} [params.patientConditions] - Array of patient chronic conditions
 * @returns {Promise<{ clinical: string, plain: string, generatedBy: 'groq' | 'fallback' }>}
 */
async function generateExplanation({
  drugA,
  drugB,
  severity = 'Moderate',
  burdenScore = 0,
  burdenLevel = 'Normal',
  patientAge,
  patientConditions = [],
}) {
  // ── DEMO MOCK ── Groq not called. Remove DEMO_MODE=true for production.
  // ⚠  DEMO MOCK — controlled by DEMO_MODE=true in .env.
  if (isDemoMode()) {
    console.log(`[explanationGenerator] DEMO_MODE=true — returning mock explanation for ${drugA} + ${drugB} (Groq not called)`);
    return getMockGroqExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
  }

  const apiKey = process.env.GROQ_API_KEY;

  // If no API key or mock/demo key, return structured fallback immediately
  if (!apiKey || apiKey === 'gsk_demo_key' || apiKey.startsWith('gsk_demo')) {
    return buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
  }

  const conditionsText = Array.isArray(patientConditions) && patientConditions.length > 0
    ? patientConditions.join(', ')
    : 'None reported';

  const systemPrompt = `You are a clinical pharmacologist and patient safety communication specialist.
Your task is to generate two concise, accurate explanations for an identified Drug-Drug Interaction (DDI) and cumulative anticholinergic/sedative burden score.

STRICT MEDICAL GUARDRAILS:
1. ONLY explain the verified severity level (${severity}) and cumulative burden score (${burdenScore}, ${burdenLevel}).
2. NEVER invent, hallucinate, or extrapolate unverified adverse effects or new medical conditions beyond what is provided.
3. For the "clinical" explanation: Write a 1-sentence formal pharmacological summary for a physician or pharmacist.
4. For the "plain" explanation: Write in calm, simple, patient-friendly language. Reference patient age (${patientAge ?? 'Not specified'}) or conditions (${conditionsText}) ONLY if directly relevant to clearance, sedation, or fall risk.
5. MANDATORY PATIENT FRAMING: The "plain" explanation MUST conclude with: "(This is an informational safety alert, not a medical diagnosis.)"

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "clinical": "Formal 1-sentence pharmacological summary for clinicians",
  "plain": "Patient-friendly explanation concluding with (This is an informational safety alert, not a medical diagnosis.)"
}`;

  const userPrompt = `Generate explanations for:
- Drug A: ${drugA}
- Drug B: ${drugB}
- DDInter Interaction Severity: ${severity}
- Cumulative Anticholinergic/Sedative Burden: Score ${burdenScore} (${burdenLevel})
- Patient Age: ${patientAge ?? 'N/A'}
- Patient Conditions: ${conditionsText}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000, // 8 seconds strict timeout
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      return buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
    }

    const parsed = JSON.parse(content);
    if (!parsed.clinical || !parsed.plain) {
      return buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
    }

    return {
      clinical: parsed.clinical.trim(),
      plain: parsed.plain.trim(),
      generatedBy: 'groq',
    };
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    const isNetwork = err.code === 'ENOTFOUND'    || err.code === 'ECONNREFUSED';
    console.warn(
      `[explanationGenerator] Groq API ${
        isTimeout ? 'timed out after 8s (user sees raw severity immediately)' :
        isNetwork ? 'unreachable — network error' :
        `error ${err.response?.status ?? 'unknown'}: ${err.response?.data?.error?.message || err.message}`
      } — using structured fallback`
    );
    // Graceful fallback — returns immediately so the user is never blocked.
    // generatedBy:'timeout' lets the frontend show "Generating detailed explanation..."
    // rather than a generic loading state.
    const fallback = buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
    return {
      ...fallback,
      generatedBy: isTimeout ? 'timeout' : 'fallback',
    };
  }
}

module.exports = { generateExplanation };
