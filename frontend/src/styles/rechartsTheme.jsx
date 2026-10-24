// src/styles/rechartsTheme.jsx
// Palette-mapped Recharts theme using PolySafe design tokens (bridged to src/charts/theme.js)
export * from '../charts/theme.js';

import {
  SERIES_COLORS,
  SEVERITY_COLORS,
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  PaperTooltip,
  ColorBlindPatternDefs,
  RechartsGradientDefs,
} from '../charts/theme.js';

export const RECHARTS_PALETTE = {
  brand:        'var(--brand-600, #0E7490)',
  brandLight:   'var(--brand-50, rgba(14, 116, 144, 0.1))',
  accent:       'var(--accent-500, #FF5C35)',
  doctor:       'var(--doctor-600, #2563EB)',
  caregiver:    'var(--caregiver-600, #0D9488)',
  safe:         'var(--safe-fg, #15803D)',
  caution:      'var(--caution-fg, #B45309)',
  critical:     'var(--critical-fg, #B91C1C)',
  ink:          'var(--ink, #0B1B2B)',
  inkSecondary: 'var(--ink-2, #334155)',
  inkMuted:     'var(--ink-3, #64748B)',
  border:       'var(--border, #E2E8F0)',
  surface:      'var(--surface, #FFFFFF)',
  surface2:     'var(--surface-2, #EEF2F7)',
};

export const DONUT_PALETTE = [
  '#0E7490', // 1. Brand Blue
  '#FF5C35', // 2. Coral
  '#16A34A', // 3. Emerald
  '#D97706', // 4. Amber-Gold
  '#DC2626', // 5. Vermilion
  '#94A3B8', // 6. Grey
];

export const HARM_PALETTE = [
  '#15803D', // L1 Minimal (Green)
  '#65A30D', // L2 Low (Lime)
  '#CA8A04', // L3 Moderate (Yellow/Amber)
  '#EA580C', // L4 High (Orange)
  '#B91C1C', // L5 Critical (Red)
];

export {
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  PaperTooltip,
  ColorBlindPatternDefs,
  RechartsGradientDefs,
};
