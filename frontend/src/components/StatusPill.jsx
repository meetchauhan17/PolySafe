// src/components/StatusPill.jsx
import React from 'react';
import { clsx } from 'clsx';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { StatusDot } from './LedIndicator';

const statusConfig = {
  safe: {
    label: 'SAFE',
    icon: ShieldCheck,
    bg: 'bg-[var(--safe-bg)]',
    text: 'text-[var(--safe-ink)]',
    border: 'border-[var(--safe-600)]/30',
  },
  caution: {
    label: 'CAUTION',
    icon: AlertTriangle,
    bg: 'bg-[var(--caution-bg)]',
    text: 'text-[var(--caution-ink)]',
    border: 'border-[var(--caution-500)]/30',
  },
  critical: {
    label: 'CRITICAL',
    icon: AlertCircle,
    bg: 'bg-[var(--critical-bg)]',
    text: 'text-[var(--critical-ink)]',
    border: 'border-[var(--critical-500)]/40',
  },
  unknown: {
    label: 'UNKNOWN',
    icon: HelpCircle,
    bg: 'bg-[var(--unknown-bg)]',
    text: 'text-[var(--unknown-fg)]',
    border: 'border-[var(--border)]',
  },
};

/**
 * StatusPill component.
 * WCAG AA requirement: Status is never communicated by color alone.
 * Always renders icon + word + color.
 *  - SAFE: emerald
 *  - CAUTION: amber-gold
 *  - CRITICAL: vermilion
 *  - UNKNOWN: grey
 */
export default function StatusPill({
  status = 'unknown',
  label,
  size = 'md',
  showDot = true,
  className,
  ...props
}) {
  const normStatus = (status || 'unknown').toLowerCase();
  const cfg = statusConfig[normStatus] || statusConfig.unknown;
  const Icon = cfg.icon;
  const word = label || cfg.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold font-[var(--font-heading)] rounded-full border shadow-[var(--shadow-xs)] select-none',
        cfg.bg,
        cfg.text,
        cfg.border,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      aria-label={`Clinical status: ${word}`}
      {...props}
    >
      {showDot && <StatusDot status={normStatus} size="sm" />}
      <Icon className={clsx(iconSizes[size] || 'w-3.5 h-3.5', 'flex-shrink-0')} aria-hidden="true" />
      <span className="tracking-wide uppercase">{word}</span>
    </span>
  );
}

export { StatusPill };
