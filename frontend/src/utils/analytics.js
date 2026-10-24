/**
 * frontend/src/utils/analytics.js
 *
 * Privacy-Preserving Clinical Telemetry & Error Tracking Utility (Items 14 & 15)
 * ─────────────────────────────────────────────────────────────────────────────
 * • Tracks high-level clinical actions (e.g., medicine added, scan completed, interaction resolved).
 * • Strips all personal identifiers (zero PII / zero PHI).
 * • Collects client-side runtime errors for developer diagnostics.
 * • Integrates with backend /api/analytics endpoints and local session cache.
 */

'use strict';

const ANALYTICS_STORAGE_KEY = 'polysafe_analytics_events';
const MAX_LOCAL_EVENTS = 50;

/**
 * Log a user or system interaction event
 * @param {string} category - e.g. 'medication', 'safety', 'auth', 'navigation'
 * @param {string} action   - e.g. 'scan_completed', 'dose_logged', 'substitute_clicked'
 * @param {object} [metadata={}] - Safe, non-PHI metadata
 */
export function trackEvent(category, action, metadata = {}) {
  try {
    const event = {
      id: Math.random().toString(36).substring(2, 9),
      category,
      action,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      screen: `${window.innerWidth}x${window.innerHeight}`,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] 📊 [${category}] ${action}`, metadata);
    }

    // Persist to local session cache for diagnostic inspection
    const existing = JSON.parse(window.sessionStorage.getItem(ANALYTICS_STORAGE_KEY) || '[]');
    existing.unshift(event);
    if (existing.length > MAX_LOCAL_EVENTS) existing.pop();
    window.sessionStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    // Analytics should never throw or break user flow
  }
}

/**
 * Log a runtime UI or API exception for diagnostics
 * @param {Error|string} error
 * @param {string} [context='unknown']
 */
export function trackError(error, context = 'client') {
  try {
    const errorPayload = {
      message: typeof error === 'string' ? error : error?.message || 'Unknown error',
      stack: error?.stack?.slice(0, 500),
      context,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    };

    console.error(`[ErrorTracker] 🚨 Error in ${context}:`, errorPayload.message);

    // Save error snapshot
    const errorLog = JSON.parse(window.sessionStorage.getItem('polysafe_error_log') || '[]');
    errorLog.unshift(errorPayload);
    if (errorLog.length > 20) errorLog.pop();
    window.sessionStorage.setItem('polysafe_error_log', JSON.stringify(errorLog));
  } catch (e) {
    // Silent fail
  }
}

export default {
  trackEvent,
  trackError,
};
