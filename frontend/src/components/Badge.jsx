// src/components/Badge.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Generic badge / chip component.
 * For severity-specific status, use StatusPill from LedIndicator.jsx.
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
    sm: 'text-[11px] px-1.5 py-0.5',
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
      {icon && <span className="flex-shrink-0" aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}

/**
 * DrugHarmBadge — L1 through L5 with color and label.
 */
export function DrugHarmBadge({ level, className }) {
  const lvl = (level || 'L1').toString().toUpperCase().replace(/^L?(\d)$/, 'L$1');
  const tierClasses = {
    L1: 'ps-harm l1',
    L2: 'ps-harm l2',
    L3: 'ps-harm l3',
    L4: 'ps-harm l4',
    L5: 'ps-harm l5',
  };
  const descriptions = {
    L1: 'Minimal risk',
    L2: 'Low risk',
    L3: 'Moderate risk',
    L4: 'High risk',
    L5: 'Critical risk',
  };
  return (
    <span
      className={clsx(tierClasses[lvl] || 'ps-harm l1', className)}
      title={descriptions[lvl]}
      aria-label={`Harm level ${lvl}: ${descriptions[lvl]}`}
    >
      {lvl}
    </span>
  );
}

/**
 * Selectable Chip — for filter selection, multi-select, etc.
 */
export function Chip({ children, selected, onClick, icon, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)]',
        'text-sm font-semibold font-[var(--font-heading)] border transition-all',
        'min-h-[36px] cursor-pointer',
        selected
          ? 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-600)]'
          : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]',
        className
      )}
      aria-pressed={selected}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}

export default Badge;
