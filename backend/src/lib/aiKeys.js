/**
 * Centralized AI API Key Manager & Failover Executor
 * Supports primary + backup API keys for Google Gemini and Groq.
 * Automatically rotates and falls over to backup keys on rate limits (429), quota exhaustion, or timeouts.
 */

/**
 * Extract and sanitize all configured Gemini API keys in priority order:
 * 1. GEMINI_API_KEY (Primary)
 * 2. GEMINI_API_KEY_2 (Backup 1)
 * 3. GEMINI_API_KEY_3 (Backup 2)
 * 4. GEMINI_API_KEYS (Comma/semicolon/whitespace separated list)
 */
function getGeminiApiKeys() {
  const candidates = [];

  if (process.env.GEMINI_API_KEY) {
    candidates.push(process.env.GEMINI_API_KEY);
  }
  if (process.env.GEMINI_API_KEY_2) {
    candidates.push(process.env.GEMINI_API_KEY_2);
  }
  if (process.env.GEMINI_API_KEY_3) {
    candidates.push(process.env.GEMINI_API_KEY_3);
  }
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(/[,;\s]+/);
    candidates.push(...list);
  }

  const unique = [];
  for (const raw of candidates) {
    const key = String(raw || '').trim();
    if (
      key.length > 10 &&
      key !== 'your_gemini_api_key_here' &&
      key !== 'YOUR_GEMINI_API_KEY_HERE' &&
      !unique.includes(key)
    ) {
      unique.push(key);
    }
  }

  return unique;
}

/**
 * Extract and sanitize all configured Groq API keys in priority order:
 * 1. GROQ_API_KEY (Primary)
 * 2. GROQ_API_KEY_2 (Backup 1)
 * 3. GROQ_API_KEY_3 (Backup 2)
 * 4. GROQ_API_KEYS (Comma/semicolon/whitespace separated list)
 */
function getGroqApiKeys() {
  const candidates = [];

  if (process.env.GROQ_API_KEY) {
    candidates.push(process.env.GROQ_API_KEY);
  }
  if (process.env.GROQ_API_KEY_2) {
    candidates.push(process.env.GROQ_API_KEY_2);
  }
  if (process.env.GROQ_API_KEY_3) {
    candidates.push(process.env.GROQ_API_KEY_3);
  }
  if (process.env.GROQ_API_KEYS) {
    const list = process.env.GROQ_API_KEYS.split(/[,;\s]+/);
    candidates.push(...list);
  }

  const unique = [];
  for (const raw of candidates) {
    const key = String(raw || '').trim();
    if (
      key.length > 10 &&
      key !== 'gsk_your_groq_api_key_here' &&
      key !== 'YOUR_GROQ_API_KEY_HERE' &&
      !key.startsWith('gsk_demo') &&
      !key.startsWith('gsk_your_') &&
      !unique.includes(key)
    ) {
      unique.push(key);
    }
  }

  return unique;
}

/**
 * Execute an async operation with Groq API keys, automatically failing over to backup keys
 * if the primary key hits a 429 (rate limit), quota exhaustion, or error.
 */
async function executeWithGroqFallback(operationFn, label = 'Groq Request') {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    return null;
  }

  let lastError = null;
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const keyTag = `Key ${i + 1}/${keys.length}`;
    try {
      const result = await operationFn(apiKey, i);
      if (result !== undefined && result !== null) {
        if (i > 0) {
          console.log(`[aiKeys:${label}] Successfully executed using backup ${keyTag}`);
        }
        return result;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status || err.status || '';
      const errMsg = err.response?.data?.error?.message || err.message || 'unknown error';
      console.warn(`[aiKeys:${label}] ${keyTag} encountered error (${status || 'error'}: ${errMsg})`);

      if (i < keys.length - 1) {
        console.log(`[aiKeys:${label}] Automatically failing over to next backup key (${i + 2}/${keys.length})...`);
      }
    }
  }

  return null;
}

/**
 * Execute an async operation with Gemini API keys, automatically failing over to backup keys.
 */
async function executeWithGeminiFallback(operationFn, label = 'Gemini Request') {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    return null;
  }

  let lastError = null;
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const keyTag = `Key ${i + 1}/${keys.length}`;
    try {
      const result = await operationFn(apiKey, i);
      if (result !== undefined && result !== null) {
        if (i > 0) {
          console.log(`[aiKeys:${label}] Successfully executed using backup ${keyTag}`);
        }
        return result;
      }
    } catch (err) {
      lastError = err;
      const status = err.status || err.statusCode || '';
      const errMsg = err.message || 'unknown error';
      console.warn(`[aiKeys:${label}] ${keyTag} encountered error (${status || 'error'}: ${errMsg})`);

      if (i < keys.length - 1) {
        console.log(`[aiKeys:${label}] Automatically failing over to next backup key (${i + 2}/${keys.length})...`);
      }
    }
  }

  return null;
}

/**
 * Return health summary of configured AI keys
 */
function getAiKeyStatus() {
  const geminiKeys = getGeminiApiKeys();
  const groqKeys = getGroqApiKeys();
  return {
    geminiCount: geminiKeys.length,
    groqCount: groqKeys.length,
    hasGemini: geminiKeys.length > 0,
    hasGroq: groqKeys.length > 0,
    geminiHasBackup: geminiKeys.length > 1,
    groqHasBackup: groqKeys.length > 1,
  };
}

module.exports = {
  getGeminiApiKeys,
  getGroqApiKeys,
  executeWithGroqFallback,
  executeWithGeminiFallback,
  getAiKeyStatus,
};
