/**
 * src/three-d/use3DEnabled.js
 * Global 3D Enablement Controller & Hook
 *
 * Requirements:
 * - A 3d-enabled data attribute on <html> that is false in:
 *   1. Projector mode (.projector-mode, ?projector=1)
 *   2. Reduced-motion (prefers-reduced-motion: reduce)
 *   3. Low-power devices (navigator.hardwareConcurrency <= 2)
 * - Allows manual toggle while respecting accessibility hard requirements.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'polysafe_3d_enabled';

/**
 * Evaluates whether the system and environment support 3D effects safely.
 */
export function checkSystem3DSupport() {
  if (typeof window === 'undefined') return false;

  // 1. Reduced motion check
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return false;

  // 2. Projector mode check
  const isProjector =
    document.documentElement.classList.contains('projector-mode') ||
    document.documentElement.getAttribute('data-projector') === 'true' ||
    new URLSearchParams(window.location.search).get('projector') === '1';
  if (isProjector) return false;

  // 3. Low-power hardware check (hardwareConcurrency <= 2)
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    if (navigator.hardwareConcurrency <= 2) return false;
  }

  return true;
}

/**
 * Updates DOM <html> attributes for CSS and subcomponents.
 */
export function sync3DAttributes(enabled) {
  if (typeof document === 'undefined') return;
  const val = enabled ? 'true' : 'false';
  document.documentElement.setAttribute('3d-enabled', val);
  document.documentElement.setAttribute('data-3d-enabled', val);
}

/**
 * Hook providing 3D enablement state and toggle handler.
 */
export function use3DEnabled() {
  const [is3DEnabled, setIs3DEnabledState] = useState(() => {
    const supported = checkSystem3DSupport();
    if (!supported) return false;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}

    return true;
  });

  useEffect(() => {
    // Re-check system condition on mount & listen to media query / projector changes
    const supported = checkSystem3DSupport();
    if (!supported && is3DEnabled) {
      setIs3DEnabledState(false);
      sync3DAttributes(false);
      return;
    }

    sync3DAttributes(is3DEnabled);

    try {
      localStorage.setItem(STORAGE_KEY, is3DEnabled ? 'true' : 'false');
    } catch {}

    // Listen to prefers-reduced-motion dynamically
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleMQ = (e) => {
      if (e.matches) {
        setIs3DEnabledState(false);
        sync3DAttributes(false);
      }
    };

    mq?.addEventListener?.('change', handleMQ);
    return () => mq?.removeEventListener?.('change', handleMQ);
  }, [is3DEnabled]);

  const toggle3D = useCallback(() => {
    setIs3DEnabledState((prev) => {
      const next = !prev;
      // Do not allow enabling if reduced motion is requested
      if (next && !checkSystem3DSupport()) {
        sync3DAttributes(false);
        return false;
      }
      sync3DAttributes(next);
      return next;
    });
  }, []);

  const set3DEnabled = useCallback((val) => {
    const next = Boolean(val);
    if (next && !checkSystem3DSupport()) {
      setIs3DEnabledState(false);
      sync3DAttributes(false);
      return;
    }
    setIs3DEnabledState(next);
    sync3DAttributes(next);
  }, []);

  return {
    is3DEnabled,
    toggle3D,
    set3DEnabled,
    systemSupported: typeof window !== 'undefined' ? checkSystem3DSupport() : true,
  };
}

export default use3DEnabled;
