// src/components/Toggle.jsx
import React, { useId } from 'react';
import { clsx } from 'clsx';

/**
 * Accessible Tactile Toggle Switch.
 * Features:
 * - Minimum 44px touch target
 * - Ripple-free tactile feel: 120ms ease-out
 * - Ivory-paper knob with soft shadow
 * - WCAG role="switch", aria-checked, keyboard focus ring
 */
export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  hideLabel = false,
  description,
  id,
  size = 'md',
  variant = 'brand',
  className,
  'aria-label': ariaLabel,
  ...props
}) {
  const generatedId = useId();
  const toggleId = id || `ps-toggle-${generatedId}`;

  const handleToggle = (e) => {
    if (disabled) return;
    onChange?.(!checked, e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange?.(!checked, e);
    }
  };

  // Dimensions
  const sizes = {
    sm: {
      track: 'w-10 h-6 p-0.5',
      knob: 'w-4 h-4',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-12 h-7 p-0.5',
      knob: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-8 p-1',
      knob: 'w-6 h-6',
      translate: 'translate-x-6',
    },
  };

  const currentSize = sizes[size] || sizes.md;

  const activeBg = variant === 'accent'
    ? 'bg-[var(--accent-500)] border-[var(--accent-600)]'
    : 'bg-[var(--brand-600)] border-[var(--brand-600)]';

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-3 select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        aria-label={hideLabel && label ? label : (!label ? (ariaLabel || 'Toggle switch') : undefined)}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={clsx(
          'relative inline-flex items-center justify-center flex-shrink-0 cursor-pointer min-h-[44px] min-w-[44px]',
          'focus-visible:outline-none'
        )}
        {...props}
      >
        {/* Track */}
        <span
          className={clsx(
            'inline-flex items-center rounded-full border transition-colors duration-[120ms] ease-out',
            'focus-visible:shadow-[var(--shadow-focus)]',
            currentSize.track,
            checked
              ? activeBg
              : 'bg-[var(--surface-2)] border-[var(--border-strong)] hover:border-[var(--ink-3)]'
          )}
        >
          {/* Ivory Paper Knob */}
          <span
            className={clsx(
              'rounded-full bg-[var(--paper)] shadow-[var(--shadow-sm)] border border-[var(--border)]',
              'transform transition-transform duration-[120ms] ease-out flex-shrink-0',
              currentSize.knob,
              checked ? currentSize.translate : 'translate-x-0'
            )}
          />
        </span>
      </button>

      {/* Optional Label & Description */}
      {!hideLabel && (label || description) && (
        <label
          htmlFor={toggleId}
          className={clsx('flex flex-col cursor-pointer', disabled && 'cursor-not-allowed')}
        >
          {label && (
            <span className="text-sm font-semibold text-[var(--ink)] font-[var(--font-heading)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--ink-3)] mt-0.5">{description}</span>
          )}
        </label>
      )}
    </div>
  );
}

export { Toggle };
