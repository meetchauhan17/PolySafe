/**
 * frontend/src/components/IconMap.jsx
 *
 * PolySafe Standardized Iconography & Typed Icon Map
 * ─────────────────────────────────────────────────────────────────────────────
 * Rules:
 * • Lucide-react ONLY
 * • Strict strokeWidth of 1.75
 * • Standardized sizes: 16 (sm), 20 (md), 24 (lg)
 * • Icons always inside a `halo` or explicitly paired with a status text label
 * • Deterministic icon mapping for medicine types & clinical alert types
 */

import React from 'react';
import { clsx } from 'clsx';
import {
  Pill,
  Leaf,
  ShoppingBag,
  Syringe,
  Activity,
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Info,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  HeartPulse,
  Layers,
  Clock,
  FlaskConical,
  HelpCircle,
} from 'lucide-react';

/* ── 1. Typed Medicine Icon Map ──────────────────────────────────────── */
export const MEDICINE_ICON_MAP = {
  PRESCRIPTION: Pill,
  RX:           Pill,
  OTC:          ShoppingBag,
  HERBAL:       Leaf,
  AYURVEDIC:    Leaf,
  SUPPLEMENT:   Leaf,
  BIOLOGIC:     Syringe,
  INJECTION:    Syringe,
  VACCINE:      Syringe,
  DEVICE:       Activity,
  COMPOUND:     FlaskConical,
  DEFAULT:      Pill,
};

/* ── 2. Typed Alert Severity Icon Map ────────────────────────────────── */
export const ALERT_ICON_MAP = {
  CONTRAINDICATED: { icon: AlertOctagon,   color: 'var(--critical-fg, #DC2626)', bg: 'bg-rose-500/10 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300' },
  CRITICAL:        { icon: ShieldAlert,    color: 'var(--critical-fg, #DC2626)', bg: 'bg-rose-500/10 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300' },
  MAJOR:           { icon: AlertTriangle,  color: 'var(--accent-500, #FF5C35)',  bg: 'bg-orange-500/10 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300' },
  MODERATE:        { icon: Zap,            color: 'var(--caution-fg, #D97706)', bg: 'bg-amber-500/10 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
  MINOR:           { icon: Info,           color: 'var(--brand-600, #0E7490)',  bg: 'bg-teal-500/10 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300' },
  SAFE:            { icon: ShieldCheck,    color: 'var(--safe-fg, #16A34A)',    bg: 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
  FOOD_CONFLICT:   { icon: UtensilsCrossed,color: 'var(--caution-fg, #D97706)', bg: 'bg-amber-500/10 border-amber-300 text-amber-700' },
  ALLERGY_ALERT:   { icon: HeartPulse,     color: 'var(--critical-fg, #DC2626)', bg: 'bg-rose-500/10 border-rose-300 text-rose-700' },
  DUPLICATE_THERAPY:{ icon: Layers,        color: 'var(--caution-fg, #D97706)', bg: 'bg-amber-500/10 border-amber-300 text-amber-700' },
  TIMING_ALERT:    { icon: Clock,          color: 'var(--brand-600, #0E7490)',  bg: 'bg-blue-500/10 border-blue-300 text-blue-700' },
  UNKNOWN:         { icon: HelpCircle,     color: 'var(--ink-3, #64748B)',      bg: 'bg-slate-500/10 border-slate-300 text-slate-700' },
};

/**
 * Normalizes input size to strictly 16, 20, or 24.
 */
function normalizeSize(size) {
  if (size === 16 || size === 'sm') return 16;
  if (size === 24 || size === 'lg') return 24;
  return 20; // Default md (20)
}

/**
 * Unified Clinical Icon Component
 * Enforces:
 * - Lucide-react icon rendering
 * - 1.75 stroke width
 * - Sizes 16, 20, or 24
 * - Inside a .halo container or paired with text label
 */
export function ClinicalIcon({
  name,              // Alert type or Medicine type key, or Lucide Icon component directly
  category = 'alert',// 'alert' | 'medicine'
  size = 20,         // 16 | 20 | 24 | 'sm' | 'md' | 'lg'
  halo = true,       // whether to wrap with soft halo effect
  text = null,       // optional label text paired with icon
  className = '',
  iconClassName = '',
  ...props
}) {
  const pixelSize = normalizeSize(size);

  let IconComponent = HelpCircle;
  let styleInfo = null;

  if (typeof name === 'function' || typeof name === 'object') {
    // Direct Lucide Component passed
    IconComponent = name;
  } else if (category === 'medicine') {
    const key = String(name || '').toUpperCase().trim();
    IconComponent = MEDICINE_ICON_MAP[key] || MEDICINE_ICON_MAP.DEFAULT;
  } else {
    // Default: Alert Category
    const key = String(name || '').toUpperCase().trim();
    styleInfo = ALERT_ICON_MAP[key] || ALERT_ICON_MAP.UNKNOWN;
    IconComponent = styleInfo.icon;
  }

  const renderedIcon = (
    <IconComponent
      size={pixelSize}
      strokeWidth={1.75}
      className={clsx('flex-shrink-0', iconClassName)}
      style={styleInfo?.color ? { color: styleInfo.color } : undefined}
      aria-hidden="true"
      {...props}
    />
  );

  const containerContent = halo ? (
    <div
      className={clsx(
        'halo inline-flex items-center justify-center rounded-full transition-transform',
        pixelSize === 16 ? 'w-6 h-6' : pixelSize === 24 ? 'w-9 h-9' : 'w-7 h-7',
        styleInfo?.bg ? styleInfo.bg : 'bg-[var(--surface-2)] text-[var(--ink)]'
      )}
    >
      {renderedIcon}
    </div>
  ) : (
    renderedIcon
  );

  if (text) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 font-medium', className)}>
        {containerContent}
        <span className="truncate">{text}</span>
      </span>
    );
  }

  return containerContent;
}

/**
 * Convenience Helper for Medicine Type Badge / Icon
 */
export function MedicineTypeIcon({ type = 'PRESCRIPTION', size = 20, halo = true, showLabel = false, className = '' }) {
  const normalized = String(type || '').toUpperCase();
  const label = showLabel ? normalized : null;
  return (
    <ClinicalIcon
      name={normalized}
      category="medicine"
      size={size}
      halo={halo}
      text={label}
      className={className}
    />
  );
}

/**
 * Convenience Helper for Alert Severity Icon
 */
export function AlertSeverityIcon({ severity = 'MODERATE', size = 20, halo = true, showLabel = false, className = '' }) {
  const normalized = String(severity || '').toUpperCase();
  const label = showLabel ? normalized : null;
  return (
    <ClinicalIcon
      name={normalized}
      category="alert"
      size={size}
      halo={halo}
      text={label}
      className={className}
    />
  );
}

export default {
  ClinicalIcon,
  MedicineTypeIcon,
  AlertSeverityIcon,
  MEDICINE_ICON_MAP,
  ALERT_ICON_MAP,
};
