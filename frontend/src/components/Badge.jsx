// src/components/Badge.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Generic badge component.
 * Uses tokens and WCAG AA contrast.
 */
export function Badge({ children, variant = 'default', size = 'md', className, icon }) {
  const variants = {
    default:    'ps-badge-unknown',
    brand:      'ps-badge-brand',
    safe:       'ps-badge-safe',
    caution:    'ps-badge-caution',
    critical:   'ps-badge-critical',
    doctor:     'ps-badge-doctor',
    caregiver:  'ps-badge-caregiver',
    outline:    'bg-transparent border-[var(--border-strong)] text-[var(--ink-2)]',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={clsx(
        'ps-badge',
        variants[variant] || variants.default,
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * DrugHarmBadge — L1 through L5 with tier tokens and visible number.
 */
export function DrugHarmBadge({ level, showLabel = false, className }) {
  const lvl = (level || 'L1').toString().toUpperCase().replace(/^L?(\d)$/, 'L$1');
  const tierClasses = {
    L1: 'ps-harm l1',
    L2: 'ps-harm l2',
    L3: 'ps-harm l3',
    L4: 'ps-harm l4',
    L5: 'ps-harm l5',
  };
  const descriptions = {
    L1: 'Minimal Risk',
    L2: 'Low Risk',
    L3: 'Moderate Risk',
    L4: 'High Risk',
    L5: 'Critical Risk',
  };

  return (
    <span
      className={clsx(
        tierClasses[lvl] || 'ps-harm l1',
        'font-mono font-bold inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs select-none shadow-[var(--shadow-xs)]',
        className
      )}
      title={descriptions[lvl]}
      aria-label={`Harm level ${lvl}: ${descriptions[lvl]}`}
    >
      <span className="font-bold">{lvl}</span>
      {showLabel && (
        <span className="font-[var(--font-heading)] font-semibold text-[11px] opacity-90">
          — {descriptions[lvl]}
        </span>
      )}
    </span>
  );
}

export { default as Chip } from './Chip';
export { default as StatusPill } from './StatusPill';
export { default as RoleBadge } from './RoleBadge';
export { default as TypeChip } from './TypeChip';
export { default as StatusDot } from './StatusDot';
export default Badge;
