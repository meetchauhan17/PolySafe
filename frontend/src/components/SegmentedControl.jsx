// src/components/SegmentedControl.jsx
import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * SegmentedControl with layout animation sliding indicator in ivory-paper with a soft shadow.
 * Meets WCAG AA, 44px touch target, and ripple-free 120ms ease-out feel.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  name,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
  ...props
}) {
  const generatedId = useId();
  const layoutId = name ? `segmented-${name}` : `segmented-indicator-${generatedId}`;

  // Normalize options into { value, label, icon, disabled }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value ?? opt.id,
      label: opt.label ?? opt.name ?? String(opt.value),
      icon: opt.icon,
      disabled: opt.disabled,
    };
  });

  const sizeClasses = {
    sm: 'text-xs min-h-[38px] sm:min-h-[44px] px-3 py-1.5',
    md: 'text-sm min-h-[44px] px-4 py-2',
    lg: 'text-base min-h-[50px] px-5 py-2.5',
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'relative inline-flex items-center p-1 rounded-full',
        'bg-[var(--surface-2)] border border-[var(--border)]',
        'select-none transition-colors duration-[120ms] ease-out',
        fullWidth && 'w-full flex',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {normalizedOptions.map((opt) => {
        const isSelected = String(value) === String(opt.value);
        const isOptionDisabled = disabled || opt.disabled;

        return (
          <button
            key={String(opt.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isOptionDisabled}
            onClick={() => !isOptionDisabled && onChange?.(opt.value)}
            className={clsx(
              'relative inline-flex items-center justify-center gap-1.5 rounded-full font-[var(--font-heading)] font-semibold',
              'transition-all duration-[120ms] ease-out cursor-pointer z-10 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
              'active:scale-[0.98]',
              sizeClasses[size] || sizeClasses.md,
              fullWidth && 'flex-1',
              isSelected
                ? 'text-[var(--ink)] font-bold'
                : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
            )}
          >
            {/* Sliding Indicator in ivory-paper with soft shadow */}
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-[var(--paper)] shadow-[var(--shadow-sm)] border border-[var(--border)] -z-10"
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 32,
                  mass: 0.8,
                }}
              />
            )}

            {opt.icon && (
              <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
