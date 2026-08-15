const { verifyToken } = require('../lib/jwt');

/**
 * auth middleware
 * ──────────────
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload as `req.user = { userId, role }`.
 *
 * Returns 401 if the header is missing or the token is invalid / expired.
 */
function auth(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }

  const token = header.slice(7); // strip "Bearer "

  try {
    const decoded = verifyToken(token);
    // Attach only what downstream handlers need — don't expose the full JWT payload
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * requireRole middleware factory
 * ──────────────────────────────
 * Must be used AFTER the `auth` middleware (relies on `req.user` being set).
 *
 * Usage:
 *   router.get('/admin', auth, requireRole(['DOCTOR', 'PHARMACIST']), handler)
 *
 * @param {string[]} roles  Array of allowed Role enum values
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = { auth, requireRole };
