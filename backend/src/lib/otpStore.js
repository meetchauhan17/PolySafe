/**
 * OTP store — in-memory for development / stub mode.
 * Replace with Redis (SET phone otp EX 600) in production.
 *
 * Structure: Map<phone, { code: string, expiresAt: number }>
 */
const store = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cryptographically-random 6-digit OTP and persist it.
 * @param {string} phone  E.164 phone number, e.g. "+919876543210"
 * @returns {string}      The generated OTP code
 */
function generateAndStore(phone) {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 100000–999999
  store.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

/**
 * Verify a code against the stored OTP.
 * Deletes the entry on first successful verification (one-time use).
 * @param {string} phone
 * @param {string} code
 * @returns {{ valid: boolean, reason?: string }}
 */
function verify(phone, code) {
  const entry = store.get(phone);

  if (!entry) {
    return { valid: false, reason: 'No OTP found for this number. Please request a new one.' };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  if (entry.code !== String(code)) {
    return { valid: false, reason: 'Invalid OTP.' };
  }

  // Consume the code — one-time use
  store.delete(phone);
  return { valid: true };
}

module.exports = { generateAndStore, verify };
