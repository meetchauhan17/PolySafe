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
 * Supports multi-language translation (en | hi | gu) with:
 *   - Simple everyday words in native script (Devanagari / Gujarati)
 *   - Strict safety framing translated
 *   - 8-second timeout with deterministic fallback (English + translated template)
 *   - In-memory cache by (flagId, lang)
 *
 * generatedBy values (checked by frontend to show contextual UI):
 *   'groq'       — live Groq response, full explanation
 *   'fallback'   — no API key, key check failed, or JSON parse error
 *   'timeout'    — Groq responded but too slowly (>8s); raw severity shown immediately
 *   'demo-mock'  — DEMO_MODE=true; pre-written fixture, Groq not called
 */

'use strict';

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { isDemoMode, getMockGroqExplanation } = require('../lib/demo');
const { executeWithGroqFallback, executeWithGeminiFallback, getGroqApiKeys } = require('../lib/aiKeys');

// Cache keyed by `${flagId || `${drugA}-${drugB}`}:${lang}`
const explanationCache = new Map();

/**
 * Secondary LLM explanation engine via Google Gemini Flash (with multi-key backup rotation)
 */
async function tryGeminiExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, patientAge, patientConditions, lang = 'en' }) {
  return await executeWithGeminiFallback(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const conditionsText = Array.isArray(patientConditions) && patientConditions.length > 0 ? patientConditions.join(', ') : 'None';

    let langInstruction = 'Respond in clear, accessible English.';
    let mandatoryEnding = '(This is an informational safety alert, not a medical diagnosis.)';

    if (lang === 'hi') {
      langInstruction = 'Respond strictly in Hindi (हिंदी in Devanagari script). Use simple, reassuring Hindi words that an Indian patient or elderly family member can easily understand.';
      mandatoryEnding = '(यह एक सूचनात्मक सुरक्षा चेतावनी है, चिकित्सीय निदान नहीं।)';
    } else if (lang === 'gu') {
      langInstruction = 'Respond strictly in Gujarati (ગુજરાતી script). Use simple, reassuring Gujarati words that an elderly family member can easily understand.';
      mandatoryEnding = '(આ એક માહિતીપ્રદ સુરક્ષા ચેતવણી છે, તબીબી નિદાન નથી.)';
    }

    const prompt = `You are a clinical pharmacologist and patient safety communication specialist.
Generate two concise, accurate explanations for this Drug-Drug Interaction:
- Drug A: ${drugA}
- Drug B: ${drugB}
- Interaction Severity: ${severity}
- Cumulative Burden: Score ${burdenScore ?? 0} (${burdenLevel ?? 'Normal'})
- Patient Age: ${patientAge ?? 'Not specified'}
- Conditions: ${conditionsText}
- Target Language: ${lang.toUpperCase()}

STRICT GUARDRAILS:
1. ONLY explain the verified severity level (${severity}) and burden score (${burdenScore}).
2. NEVER invent unverified adverse effects.
3. ${langInstruction}
4. "clinical": 1-sentence formal pharmacological summary for a physician or pharmacist.
5. "plain": Plain-language explanation for patients ending strictly with: "${mandatoryEnding}"

Return ONLY valid JSON matching this schema:
{
  "clinical": "1-sentence pharmacological summary",
  "plain": "Patient-friendly explanation concluding strictly with ${mandatoryEnding}"
}`;

    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(text);
    if (parsed.clinical && parsed.plain) {
      console.log(`[explanationGenerator] Successfully generated clinical explanation via Gemini Flash for ${drugA} + ${drugB} in ${lang}`);
      return {
        clinical: parsed.clinical.trim(),
        plain: parsed.plain.trim(),
        generatedBy: 'gemini',
        isTranslated: lang !== 'en',
        lang,
      };
    }
    return null;
  }, 'ExplanationGenerator:Gemini');
}

/**
 * Fallback static explanation builder when Groq is unavailable, times out, or has demo key.
 * If lang is 'hi' or 'gu', returns the English text plus the translated deterministic template.
 */
function buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, lang = 'en' }) {
  const sev = severity || 'Unknown';
  const score = burdenScore ?? 0;
  const level = burdenLevel ?? 'Normal';

  let enClinical = `Interaction identified between ${drugA} and ${drugB} (${sev}). Cumulative anticholinergic/sedative burden index: ${score} (${level}).`;
  let enPlain = `An interaction between ${drugA} and ${drugB} was detected (${sev} severity). Please consult your doctor before taking both medicines together. (This is an informational safety alert, not a medical diagnosis.)`;

  if (sev === 'Major' || sev === 'Contraindicated') {
    enClinical = `High-risk interaction: ${drugA} + ${drugB} (${sev}). Concomitant administration requires clinical evaluation and regimen adjustment. Cumulative burden: ${score} (${level}).`;
    enPlain = `Taking ${drugA} and ${drugB} together is flagged as ${sev}. Please consult your doctor or pharmacist right away. (This is an informational safety alert, not a medical diagnosis.)`;
  } else if (sev === 'Minor') {
    enClinical = `Minor interaction between ${drugA} and ${drugB}. Monitor for mild adverse effects as clinically indicated.`;
    enPlain = `A minor interaction was found between ${drugA} and ${drugB}. No immediate change is needed, but inform your healthcare provider. (This is an informational safety alert, not a medical diagnosis.)`;
  }

  if (lang === 'hi') {
    let hiPlain = `${drugA} और ${drugB} के बीच परस्पर क्रिया पाई गई (${sev} जोखिम)। दोनों दवाएं एक साथ लेने से पहले कृपया अपने डॉक्टर से सलाह लें। (यह एक सूचनात्मक सुरक्षा चेतावनी है, चिकित्सीय निदान नहीं।)`;
    if (sev === 'Major' || sev === 'Contraindicated') {
      hiPlain = `${drugA} और ${drugB} को एक साथ लेना ${sev} जोखिम के रूप में चिह्नित है। कृपया तुरंत अपने डॉक्टर या फार्मासिस्ट से सलाह लें। (यह एक सूचनात्मक सुरक्षा चेतावनी है, चिकित्सीय निदान नहीं।)`;
    } else if (sev === 'Minor') {
      hiPlain = `${drugA} और ${drugB} के बीच मामूली परस्पर क्रिया पाई गई। तत्काल किसी बदलाव की आवश्यकता नहीं है, लेकिन अपने डॉक्टर को सूचित करें। (यह एक सूचनात्मक सुरक्षा चेतावनी है, चिकित्सीय निदान नहीं।)`;
    }
    return {
      clinical: `औषधीय परस्पर क्रिया: ${drugA} + ${drugB} (${sev})। संचयी शामक भार: ${score} (${level})।`,
      plain: `${hiPlain}\n\n[Original: ${enPlain}]`,
      generatedBy: 'fallback',
      isTranslated: true,
      lang: 'hi',
    };
  }

  if (lang === 'gu') {
    let guPlain = `${drugA} અને ${drugB} વચ્ચે ક્રિયાપ્રતિક્રિયા જણાઈ છે (${sev} જોખમ). બંને દવાઓ સાથે લેતા પહેલાં કૃપા કરીને તમારા ડૉક્ટરની સલાહ લો. (આ એક માહિતીપ્રદ સુરક્ષા ચેતવણી છે, તબીબી નિદાન નથી.)`;
    if (sev === 'Major' || sev === 'Contraindicated') {
      guPlain = `${drugA} અને ${drugB} સાથે લેવું ${sev} જોખમ તરીકે ફ્લેગ થયેલ છે. કૃપા કરીને તાત્કાલિક તમારા ડૉક્ટર અથવા ફાર્માસિસ્ટનો સંપર્ક કરો. (આ એક માહિતીપ્રદ સુરક્ષા ચેતવણી છે, તબીબી નિદાન નથી.)`;
    } else if (sev === 'Minor') {
      guPlain = `${drugA} અને ${drugB} વચ્ચે સામાન્ય ક્રિયાપ્રતિક્રિયા મળી છે. તાત્કાલિક કોઈ ફેરફારની જરૂર નથી, પરંતુ તમારા ડૉક્ટરને જાણ કરો. (આ એક માહિતીપ્રદ સુરક્ષા ચેતવણી છે, તબીબી નિદાન નથી.)`;
    }
    return {
      clinical: `ઔષધીય ક્રિયાપ્રતિક્રિયા: ${drugA} + ${drugB} (${sev}). કુલ સેડટીવ બોજ: ${score} (${level}).`,
      plain: `${guPlain}\n\n[Original: ${enPlain}]`,
      generatedBy: 'fallback',
      isTranslated: true,
      lang: 'gu',
    };
  }

  return { clinical: enClinical, plain: enPlain, generatedBy: 'fallback', isTranslated: false, lang: 'en' };
}

/**
 * Generates clinical and plain explanations using Groq API with an 8-second timeout.
 * Cached by (flagId || `${drugA}-${drugB}`, lang).
 */
async function generateExplanation({
  drugA,
  drugB,
  severity = 'Moderate',
  burdenScore = 0,
  burdenLevel = 'Normal',
  patientAge,
  patientConditions = [],
  flagId = null,
  lang = 'en',
}) {
  const normalizedLang = ['hi', 'gu'].includes(String(lang).toLowerCase()) ? String(lang).toLowerCase() : 'en';
  const cacheKey = `${flagId || `${drugA}-${drugB}`}:${normalizedLang}`;

  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey);
  }

  // ── DEMO MOCK ── Groq not called if DEMO_MODE=true
  if (isDemoMode()) {
    console.log(`[explanationGenerator] DEMO_MODE=true — returning mock explanation for ${drugA} + ${drugB} (${normalizedLang})`);
    const mock = getMockGroqExplanation({ drugA, drugB, severity, burdenScore, burdenLevel });
    if (normalizedLang !== 'en') {
      const fb = buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, lang: normalizedLang });
      explanationCache.set(cacheKey, fb);
      return fb;
    }
    explanationCache.set(cacheKey, mock);
    return mock;
  }

  const groqKeys = getGroqApiKeys();

  // If no API keys configured or demo mode, attempt Gemini Flash before static fallback
  if (groqKeys.length === 0 || isDemoMode()) {
    const geminiExp = await tryGeminiExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, patientAge, patientConditions, lang: normalizedLang });
    if (geminiExp) {
      explanationCache.set(cacheKey, geminiExp);
      return geminiExp;
    }
    const fb = buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, lang: normalizedLang });
    explanationCache.set(cacheKey, fb);
    return fb;
  }

  const conditionsText = Array.isArray(patientConditions) && patientConditions.length > 0
    ? patientConditions.join(', ')
    : 'None reported';

  let langInstruction = 'Respond in clear, accessible English.';
  let mandatoryEnding = '(This is an informational safety alert, not a medical diagnosis.)';

  if (normalizedLang === 'hi') {
    langInstruction = 'Respond strictly in Hindi (हिंदी in Devanagari script). Use simple, reassuring everyday Hindi words that an elderly Indian patient can easily understand.';
    mandatoryEnding = '(यह एक सूचनात्मक सुरक्षा चेतावनी है, चिकित्सीय निदान नहीं।)';
  } else if (normalizedLang === 'gu') {
    langInstruction = 'Respond strictly in Gujarati (ગુજરાતી script). Use simple, reassuring Gujarati words that an elderly family member can easily understand.';
    mandatoryEnding = '(આ એક માહિતીપ્રદ સુરક્ષા ચેતવણી છે, તબીબી નિદાન નથી.)';
  }

  const systemPrompt = `You are a clinical pharmacologist and patient safety communication specialist.
Your task is to generate two concise, accurate explanations for an identified Drug-Drug Interaction (DDI) and cumulative anticholinergic/sedative burden score.

STRICT MEDICAL GUARDRAILS:
1. ONLY explain the verified severity level (${severity}) and cumulative burden score (${burdenScore}, ${burdenLevel}).
2. NEVER invent, hallucinate, or extrapolate unverified adverse effects or new medical conditions beyond what is provided.
3. ${langInstruction}
4. For the "clinical" explanation: Write a 1-sentence formal pharmacological summary for a physician or pharmacist.
5. For the "plain" explanation: Write in calm, simple, patient-friendly language. Reference patient age (${patientAge ?? 'Not specified'}) or conditions (${conditionsText}) ONLY if directly relevant.
6. MANDATORY PATIENT FRAMING: The "plain" explanation MUST conclude with: "${mandatoryEnding}"

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "clinical": "1-sentence pharmacological summary",
  "plain": "Patient-friendly explanation concluding with ${mandatoryEnding}"
}`;

  const userPrompt = `Generate explanations for:
- Drug A: ${drugA}
- Drug B: ${drugB}
- DDInter Interaction Severity: ${severity}
- Cumulative Anticholinergic/Sedative Burden: Score ${burdenScore} (${burdenLevel})
- Patient Age: ${patientAge ?? 'N/A'}
- Patient Conditions: ${conditionsText}
- Language: ${normalizedLang.toUpperCase()}`;

  const groqResult = await executeWithGroqFallback(async (apiKey) => {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.clinical || !parsed.plain) return null;

    return {
      clinical: parsed.clinical.trim(),
      plain: parsed.plain.trim(),
      generatedBy: 'groq',
      isTranslated: normalizedLang !== 'en',
      lang: normalizedLang,
    };
  }, 'ExplanationGenerator:Groq');

  if (groqResult) {
    explanationCache.set(cacheKey, groqResult);
    return groqResult;
  }

  // If Groq fails across all primary + backup keys, try Gemini Flash before static fallback
  const geminiExp = await tryGeminiExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, patientAge, patientConditions, lang: normalizedLang });
  if (geminiExp) {
    explanationCache.set(cacheKey, geminiExp);
    return geminiExp;
  }

  const fallback = buildFallbackExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, lang: normalizedLang });
  const result = {
    ...fallback,
    generatedBy: 'fallback',
    isTranslated: normalizedLang !== 'en',
    lang: normalizedLang,
  };
  explanationCache.set(cacheKey, result);
  return result;
}

module.exports = {
  generateExplanation,
  buildFallbackExplanation,
  explanationCache,
};
