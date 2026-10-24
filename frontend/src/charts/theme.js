/**
 * frontend/src/charts/theme.js
 *
 * PolySafe Master Chart Theme & Color-Blind Safety System
 * ─────────────────────────────────────────────────────────────────────────────
 * • Series colors in order: brand blue, coral, emerald, amber-gold, vermilion, grey
 * • Severity tokens: safe, minor, moderate, major, critical, unknown
 * • Axes and grid in --hairline (var(--border))
 * • Labels in --ink-3 (12px, font-mono / font-sans)
 * • Tooltips as paper cards (var(--paper), hairline border, elevation shadow)
 * • Legends as pills (rounded-full chips with matching indicator dot and text)
 * • Color-blind secondary cues:
 *     - Unknown:        hatch pattern (diagonal lines)
 *     - Minor:          dots pattern (stippled dots)
 *     - Moderate:       none (solid tint)
 *     - Major/Critical: crosshatch pattern (intersecting diagonal grid)
 *     - ALWAYS accompanied by explicit text labels!
 */

import React from 'react';

// ── 1. Series Colors in Strict Specification Order ─────────────────────────
export const SERIES_COLORS = [
  'var(--brand-600, #0E7490)',   // 1. Brand Blue
  'var(--accent-500, #FF5C35)',   // 2. Coral
  'var(--safe-fg, #16A34A)',      // 3. Emerald
  'var(--caution-fg, #D97706)',   // 4. Amber-Gold
  'var(--critical-fg, #DC2626)',  // 5. Vermilion
  'var(--ink-4, #94A3B8)',        // 6. Grey
];

// Fallback HEX codes for canvas / SVG attributes that don't evaluate CSS vars directly
export const SERIES_HEX = [
  '#0E7490', // Brand Blue
  '#FF5C35', // Coral
  '#16A34A', // Emerald
  '#D97706', // Amber-Gold
  '#DC2626', // Vermilion
  '#94A3B8', // Grey
];

// ── 2. Severity Palette & Mappings ─────────────────────────────────────────
export const SEVERITY_COLORS = {
  SAFE:             'var(--safe-fg, #16A34A)',
  NONE:             'var(--safe-fg, #16A34A)',
  LOW:              'var(--safe-fg, #16A34A)',
  MINOR:            'var(--caution-fg, #D97706)',
  MODERATE:         'var(--caution-fg, #EA580C)',
  MAJOR:            'var(--critical-fg, #DC2626)',
  CRITICAL:         'var(--critical-fg, #DC2626)',
  CONTRAINDICATED:  'var(--critical-fg, #991B1B)',
  UNKNOWN:          'var(--ink-4, #94A3B8)',
};

export const SEVERITY_BG = {
  SAFE:             'var(--safe-bg, rgba(22, 163, 74, 0.12))',
  MINOR:            'rgba(217, 119, 6, 0.12)',
  MODERATE:         'rgba(234, 88, 12, 0.12)',
  MAJOR:            'var(--critical-bg, rgba(220, 38, 38, 0.12))',
  CRITICAL:         'rgba(153, 27, 27, 0.16)',
  UNKNOWN:          'rgba(148, 163, 184, 0.12)',
};

export const SEVERITY_LABELS = {
  SAFE:            'Safe / Clear',
  MINOR:           'Minor Interaction',
  MODERATE:        'Moderate Precaution',
  MAJOR:           'Major Conflict',
  CRITICAL:        'Critical / Contraindicated',
  UNKNOWN:         'Unknown / Inconclusive',
};

// ── 3. Color-Blind Pattern Pattern IDs ─────────────────────────────────────
export const PATTERN_IDS = {
  UNKNOWN:    'ps-pattern-hatch',
  MINOR:      'ps-pattern-dots',
  MODERATE:   'ps-pattern-none',
  MAJOR:      'ps-pattern-crosshatch',
  CRITICAL:   'ps-pattern-crosshatch',
  SAFE:       'ps-pattern-none',
};

/**
 * Returns pattern ID for a given severity string.
 */
export function getSeverityPattern(severity = '') {
  const s = String(severity).toUpperCase();
  if (s.includes('CRIT') || s.includes('MAJOR') || s.includes('CONTRA')) return PATTERN_IDS.MAJOR;
  if (s.includes('MOD')) return PATTERN_IDS.MODERATE;
  if (s.includes('MIN')) return PATTERN_IDS.MINOR;
  if (s.includes('SAFE') || s.includes('CLEAR')) return PATTERN_IDS.SAFE;
  return PATTERN_IDS.UNKNOWN;
}

export function getSeverityColor(severity = '') {
  const s = String(severity).toUpperCase();
  if (s.includes('CONTRA')) return SEVERITY_COLORS.CONTRAINDICATED;
  if (s.includes('CRIT')) return SEVERITY_COLORS.CRITICAL;
  if (s.includes('MAJOR')) return SEVERITY_COLORS.MAJOR;
  if (s.includes('MOD')) return SEVERITY_COLORS.MODERATE;
  if (s.includes('MIN')) return SEVERITY_COLORS.MINOR;
  if (s.includes('SAFE') || s.includes('CLEAR')) return SEVERITY_COLORS.SAFE;
  return SEVERITY_COLORS.UNKNOWN;
}

// ── 4. Recharts Default Axis & Grid Props ──────────────────────────────────
export const CHART_AXIS_PROPS = {
  stroke: 'var(--border, #E2E8F0)',
  tick: {
    fontSize: 12,
    fill: 'var(--ink-3, #64748B)',
    fontFamily: 'var(--font-heading, system-ui, sans-serif)',
  },
  tickLine: false,
  axisLine: { stroke: 'var(--border, #E2E8F0)', strokeWidth: 1 },
};

export const CHART_GRID_PROPS = {
  stroke: 'var(--border, #E2E8F0)',
  strokeDasharray: '3 3',
  vertical: false,
};

// ── 5. Color-Blind SVG <pattern> Definitions ───────────────────────────────
/**
 * Renders SVG <defs> with accessible patterns:
 *   - Hatch for Unknown
 *   - Dots for Minor
 *   - Crosshatch for Major / Critical
 *   - Gradient fills for area charts
 */
export function ColorBlindPatternDefs() {
  return React.createElement(
    'defs',
    null,
    // 1. Hatch pattern for Unknown (Diagonal 45deg stripes)
    React.createElement(
      'pattern',
      {
        id: 'ps-pattern-hatch',
        width: 8,
        height: 8,
        patternTransform: 'rotate(45 0 0)',
        patternUnits: 'userSpaceOnUse',
      },
      React.createElement('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 8,
        stroke: 'var(--ink-4, #94A3B8)',
        strokeWidth: 2.5,
      })
    ),
    // 2. Dots pattern for Minor (Stippled dot matrix)
    React.createElement(
      'pattern',
      {
        id: 'ps-pattern-dots',
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        patternUnits: 'userSpaceOnUse',
      },
      React.createElement('circle', {
        cx: 2,
        cy: 2,
        r: 1.5,
        fill: 'var(--caution-fg, #D97706)',
      }),
      React.createElement('circle', {
        cx: 6,
        cy: 6,
        r: 1.5,
        fill: 'var(--caution-fg, #D97706)',
      })
    ),
    // 3. Crosshatch pattern for Major / Critical (Intersecting diagonal grid)
    React.createElement(
      'pattern',
      {
        id: 'ps-pattern-crosshatch',
        width: 8,
        height: 8,
        patternUnits: 'userSpaceOnUse',
      },
      React.createElement('line', {
        x1: 0,
        y1: 0,
        x2: 8,
        y2: 8,
        stroke: 'var(--critical-fg, #DC2626)',
        strokeWidth: 1.5,
      }),
      React.createElement('line', {
        x1: 8,
        y1: 0,
        x2: 0,
        y2: 8,
        stroke: 'var(--critical-fg, #DC2626)',
        strokeWidth: 1.5,
      })
    ),
    // Linear Gradients
    React.createElement(
      'linearGradient',
      { id: 'polySafeBrandGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      React.createElement('stop', { offset: '5%', stopColor: 'var(--brand-600, #0E7490)', stopOpacity: 0.28 }),
      React.createElement('stop', { offset: '95%', stopColor: 'var(--brand-600, #0E7490)', stopOpacity: 0.01 })
    ),
    React.createElement(
      'linearGradient',
      { id: 'polySafeCoralGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      React.createElement('stop', { offset: '5%', stopColor: 'var(--accent-500, #FF5C35)', stopOpacity: 0.32 }),
      React.createElement('stop', { offset: '95%', stopColor: 'var(--accent-500, #FF5C35)', stopOpacity: 0.02 })
    ),
    React.createElement(
      'linearGradient',
      { id: 'polySafeSafeGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      React.createElement('stop', { offset: '5%', stopColor: 'var(--safe-fg, #16A34A)', stopOpacity: 0.28 }),
      React.createElement('stop', { offset: '95%', stopColor: 'var(--safe-fg, #16A34A)', stopOpacity: 0.02 })
    ),
    React.createElement(
      'linearGradient',
      { id: 'polySafeCautionGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      React.createElement('stop', { offset: '5%', stopColor: 'var(--caution-fg, #D97706)', stopOpacity: 0.28 }),
      React.createElement('stop', { offset: '95%', stopColor: 'var(--caution-fg, #D97706)', stopOpacity: 0.02 })
    ),
    React.createElement(
      'linearGradient',
      { id: 'polySafeCriticalGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      React.createElement('stop', { offset: '5%', stopColor: 'var(--critical-fg, #DC2626)', stopOpacity: 0.32 }),
      React.createElement('stop', { offset: '95%', stopColor: 'var(--critical-fg, #DC2626)', stopOpacity: 0.02 })
    )
  );
}

// Backward-compatible alias
export const RechartsGradientDefs = ColorBlindPatternDefs;

// ── 6. Paper Card Chart Tooltip ───────────────────────────────────────────
/**
 * Unified Paper Card tooltip for Recharts.
 * - var(--paper) surface
 * - Hairline border (--border)
 * - 12px --ink-3 labels
 * - Colored bullet dot
 * - Rich typography
 */
export function PaperTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null;

  return React.createElement(
    'div',
    {
      className: 'p-3 rounded-xl text-xs space-y-1.5 pointer-events-none select-none min-w-[140px] font-sans',
      style: {
        background: 'var(--paper, #FFFFFF)',
        border: '1px solid var(--border, #E2E8F0)',
        boxShadow: '0 8px 24px rgba(22, 33, 44, 0.12), 0 2px 6px rgba(22, 33, 44, 0.04)',
        color: 'var(--ink, #0B1B2B)',
      },
    },
    label &&
      React.createElement(
        'p',
        {
          className:
            'font-bold font-[var(--font-heading)] border-b border-[var(--border)] pb-1 text-[11px] text-[var(--ink)]',
        },
        label
      ),
    React.createElement(
      'div',
      { className: 'space-y-1 pt-0.5' },
      payload.map((item, idx) => {
        const color = item.color || item.fill || SERIES_COLORS[idx % SERIES_COLORS.length];
        const valFormatted =
          typeof item.value === 'number'
            ? item.value % 1 !== 0
              ? item.value.toFixed(1)
              : item.value
            : item.value;

        return React.createElement(
          'div',
          {
            key: idx,
            className: 'flex items-center justify-between gap-3 text-[11px]',
          },
          React.createElement(
            'div',
            { className: 'flex items-center gap-1.5' },
            React.createElement('span', {
              className: 'w-2.5 h-2.5 rounded-full flex-shrink-0',
              style: { backgroundColor: color },
            }),
            React.createElement(
              'span',
              { className: 'text-[var(--ink-2)] font-medium' },
              (item.name || item.dataKey) + ':'
            )
          ),
          React.createElement(
            'span',
            { className: 'font-bold font-mono text-[var(--ink)]' },
            `${valFormatted}${unit}`
          )
        );
      })
    )
  );
}

// ── 7. Pill Legend Component ──────────────────────────────────────────────
/**
 * Unified pill-style legend chips for charts.
 */
export function PillLegend({ payload = [], activeKeys = [], onToggleKey }) {
  if (!payload || !payload.length) return null;

  return React.createElement(
    'div',
    {
      className: 'flex flex-wrap items-center justify-center gap-2 pt-3 text-xs font-sans',
    },
    payload.map((entry, idx) => {
      const color = entry.color || SERIES_COLORS[idx % SERIES_COLORS.length];
      const entryKey = entry.value || entry.dataKey;
      const isMuted = activeKeys.length > 0 && !activeKeys.includes(entryKey);

      return React.createElement(
        'button',
        {
          key: entryKey || idx,
          type: 'button',
          onClick: () => onToggleKey?.(entryKey),
          className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
            isMuted
              ? 'opacity-40 border-[var(--border)] bg-transparent'
              : 'bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
          }`,
        },
        React.createElement('span', {
          className: 'w-2 h-2 rounded-full flex-shrink-0',
          style: { backgroundColor: color },
        }),
        React.createElement(
          'span',
          { className: 'font-semibold text-[11px]' },
          entryKey
        )
      );
    })
  );
}

export default {
  SERIES_COLORS,
  SERIES_HEX,
  SEVERITY_COLORS,
  SEVERITY_BG,
  SEVERITY_LABELS,
  PATTERN_IDS,
  getSeverityPattern,
  getSeverityColor,
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  ColorBlindPatternDefs,
  RechartsGradientDefs,
  PaperTooltip,
  PillLegend,
};
