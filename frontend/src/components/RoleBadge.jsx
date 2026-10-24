// src/components/RoleBadge.jsx
import React from 'react';
import { clsx } from 'clsx';
import { User, Stethoscope, HeartHandshake, UserCheck } from 'lucide-react';

const roleConfig = {
  patient: {
    label: 'Patient',
    icon: User,
    bg: 'bg-[var(--brand-50)]',
    text: 'text-[var(--brand-700)]',
    border: 'border-[var(--brand-200)]',
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    bg: 'bg-[#E8EFF6] dark:bg-[#132233]',
    text: 'text-[#1E3A5F] dark:text-[#93BCE6]',
    border: 'border-[#B6D0EB] dark:border-[#223B59]',
  },
  caregiver: {
    label: 'Caregiver',
    icon: HeartHandshake,
    bg: 'bg-[var(--safe-bg)]',
    text: 'text-[var(--safe-ink)]',
    border: 'border-[var(--safe-600)]/30',
  },
  guest: {
    label: 'Guest Mode',
    icon: UserCheck,
    bg: 'bg-[var(--accent-100)] dark:bg-[var(--accent-950,rgba(255,92,53,0.18))]',
    text: 'text-[var(--accent-600)] dark:text-[var(--accent-300,#FF9E80)]',
    border: 'border-[var(--accent-500)]/40 dark:border-[var(--accent-500)]/50',
  },
};

/**
 * RoleBadge component.
 * Displays user access persona:
 *  - patient: blue
 *  - doctor: ink-blue
 *  - caregiver: emerald
 *  - guest: coral
 */
export default function RoleBadge({
  role = 'patient',
  label,
  size = 'md',
  className,
  ...props
}) {
  const normRole = (role || 'patient').toLowerCase();
  const cfg = roleConfig[normRole] || roleConfig.patient;
  const Icon = cfg.icon;
  const displayLabel = label || cfg.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm sm:text-base px-3 py-1 gap-2',
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
      aria-label={`Role: ${displayLabel}`}
      {...props}
    >
      <Icon className={clsx(iconSizes[size] || 'w-3.5 h-3.5', 'flex-shrink-0')} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

export { RoleBadge };
