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

export { default as StatusDot } from './StatusDot';
export { default as StatusPill } from './StatusPill';

/**
 * Legacy LedIndicator — maps to StatusDot for backward compat
 */
export default function LedIndicator({ status, size, className }) {
  const normStatus = (status || 'unknown').toLowerCase();
  const sizeClass = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' };
  return (
    <span
      className={clsx('ps-status-dot', normStatus, sizeClass[size] || sizeClass.md, className)}
      aria-hidden="true"
    />
  );
}

