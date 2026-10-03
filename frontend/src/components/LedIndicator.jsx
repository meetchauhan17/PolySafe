// src/components/StatusDot.jsx
// Replaces the old LedIndicator — always has color + icon + text label
import React from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

const config = {
  safe: {
    dot: 'safe',
    icon: CheckCircle2,
    label: 'Safe',
    text: 'text-[var(--safe-fg)]',
    bg:   'bg-[var(--safe-bg)]',
    border:'border-[var(--safe-fg)]/30',
  },
  caution: {
    dot: 'caution',
    icon: AlertTriangle,
    label: 'Caution',
    text: 'text-[var(--caution-fg)]',
    bg:   'bg-[var(--caution-bg)]',
    border:'border-[var(--caution-fg)]/30',
  },
  critical: {
    dot: 'critical',
    icon: AlertCircle,
    label: 'Critical',
    text: 'text-[var(--critical-fg)]',
    bg:   'bg-[var(--critical-bg)]',
    border:'border-[var(--critical-fg)]/30',
  },
  unknown: {
    dot: 'unknown',
    icon: HelpCircle,
    label: 'Unknown',
    text: 'text-[var(--unknown-fg)]',
    bg:   'bg-[var(--unknown-bg)]',
    border:'border-[var(--border)]',
  },
  online: {
    dot: 'online',
    icon: Wifi,
    label: 'Online',
    text: 'text-[var(--safe-fg)]',
    bg:   'bg-[var(--safe-bg)]',
    border:'border-[var(--safe-fg)]/30',
  },
  offline: {
    dot: 'unknown',
    icon: WifiOff,
    label: 'Offline',
    text: 'text-[var(--unknown-fg)]',
    bg:   'bg-[var(--unknown-bg)]',
    border:'border-[var(--border)]',
  },
};

/**
 * StatusDot — just the dot (and optional pulsing animation)
 */
export function StatusDot({ status = 'unknown', size = 'md', className }) {
  const sizeClass = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' };
  return (
    <span
      className={clsx('ps-status-dot', status, sizeClass[size], className)}
      aria-hidden
    />
  );
}

/**
 * StatusPill — dot + icon + label text, always all three.
 * This is the primary status display component across the app.
 */
export function StatusPill({
  status = 'unknown',
  label,
  size = 'md',
  className,
}) {
  const cfg = config[status] || config.unknown;
  const Icon = cfg.icon;
  const displayLabel = label || cfg.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };
  const iconSizes = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold font-[var(--font-heading)] rounded-full border',
        cfg.text, cfg.bg, cfg.border,
        sizeClasses[size],
        className
      )}
      aria-label={`Status: ${displayLabel}`}
    >
      <StatusDot status={status} size="sm" />
      <Icon className={clsx(iconSizes[size], 'flex-shrink-0')} aria-hidden />
      <span>{displayLabel}</span>
    </span>
  );
}

/**
 * Legacy LedIndicator — maps to StatusDot for backward compat
 */
export default function LedIndicator({ status, size, className }) {
  return <StatusDot status={status} size={size} className={className} />;
}
