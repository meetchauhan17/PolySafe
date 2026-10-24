/**
 * src/motion/useReducedMotion.js
 * Global Reduced-Motion Guard for PolySafe
 *
 * Wraps Framer Motion's useReducedMotion hook with safety fallbacks
 * and helper functions that automatically sanitize animations:
 * - When reduced motion is preferred:
 *   - Replaces all translational movement (x, y, scale, rotation) with 100ms pure opacity fades.
 *   - Disables all parallax and 3D tilt effects.
 *   - Clamps or disables SVG stroke-dashoffset transitions.
 */

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Hook returning boolean true if system or user prefers reduced motion.
 */
export function useReducedMotion() {
  const prefersReduced = useFramerReducedMotion();
  return Boolean(prefersReduced);
}

/**
 * Returns a sanitized transition or variant object based on user motion preference.
 *
 * @param {boolean} isReduced - Current reduced motion preference
 * @param {object} standardConfig - Animation config when motion is allowed
 * @param {object} [reducedOverride] - Optional custom override for reduced motion (defaults to 100ms fade)
 */
export function sanitizeMotion(isReduced, standardConfig, reducedOverride = null) {
  if (isReduced) {
    return (
      reducedOverride || {
        opacity: 1,
        transition: { duration: 0.1, ease: 'easeOut' },
      }
    );
  }
  return standardConfig;
}

/**
 * Helper to disable 3D transform strings and parallax offsets when reduced motion is on.
 *
 * @param {boolean} isReduced
 * @param {string|number} value
 * @param {string|number} fallback
 */
export function guard3D(isReduced, value, fallback = 0) {
  return isReduced ? fallback : value;
}

export default useReducedMotion;
