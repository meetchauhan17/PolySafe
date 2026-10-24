// src/components/TypeChip.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Pill, ShoppingBag, Leaf } from 'lucide-react';

const typeConfig = {
  rx: {
    label: 'Rx Prescription',
    shortLabel: 'Rx',
    icon: Pill,
    bg: 'bg-[var(--brand-50)]',
    text: 'text-[var(--brand-700)]',
    border: 'border-[var(--brand-200)]',
  },
  prescription: {
    label: 'Rx Prescription',
    shortLabel: 'Rx',
    icon: Pill,
    bg: 'bg-[var(--brand-50)]',
    text: 'text-[var(--brand-700)]',
    border: 'border-[var(--brand-200)]',
  },
  otc: {
    label: 'Over-The-Counter (OTC)',
    shortLabel: 'OTC',
    icon: ShoppingBag,
    bg: 'bg-[var(--surface-2)]',
    text: 'text-[var(--ink-2)]',
    border: 'border-[var(--border-strong)]',
  },
  herbal: {
    label: 'Herbal / Ayurvedic',
    shortLabel: 'Herbal',
    icon: Leaf,
    bg: 'bg-[var(--safe-bg)]',
    text: 'text-[var(--safe-ink)]',
    border: 'border-[var(--safe-600)]/30',
  },
  supplement: {
    label: 'Herbal / Supplement',
    shortLabel: 'Herbal',
    icon: Leaf,
    bg: 'bg-[var(--safe-bg)]',
    text: 'text-[var(--safe-ink)]',
    border: 'border-[var(--safe-600)]/30',
  },
};

/**
 * TypeChip component.
 * Displays medication regulatory type:
 *  - Rx: Prescription medication (Pill icon)
 *  - OTC: Over the counter (ShoppingBag icon)
 *  - Herbal: Herbal / Ayurvedic formulation (Leaf icon)
 */
export default function TypeChip({
  type = 'rx',
  short = false,
  label,
  size = 'md',
  className,
  ...props
}) {
  const normType = (type || 'rx').toLowerCase();
  const cfg = typeConfig[normType] || typeConfig.rx;
  const Icon = cfg.icon;
  const displayLabel = label || (short ? cfg.shortLabel : cfg.label);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm sm:text-base px-3 py-1 gap-2',
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
      aria-label={`Medication type: ${displayLabel}`}
      {...props}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

export { TypeChip };
