const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

/**
 * Sign a JWT containing { userId, role }.
 * @param {{ userId: string, role: string }} payload
 * @returns {string} signed token
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT.
 * Throws a JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {{ userId: string, role: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
