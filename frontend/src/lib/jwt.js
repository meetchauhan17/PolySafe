/**
 * frontend/src/lib/jwt.js
 * Lightweight JWT payload decoder — no signature verification needed on the
 * client (we only need the userId claim to join the right socket room).
 */

export function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    // atob handles base64url by replacing chars first
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserIdFromToken(token) {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.userId ?? null;
}
