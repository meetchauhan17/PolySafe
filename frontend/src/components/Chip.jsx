// src/components/Chip.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';

/**
 * Interactive Chip component.
 * Selected state: brand-100 fill, brand-300 border, brand-700 text with Check icon.
 * Ripple-free tactile feel: 120ms ease-out, active press scale(0.98), 44px min touch height.
 */
export default function Chip({
  children,
  selected = false,
  onClick,
  icon,
  removable = false,
  onRemove,
  disabled = false,
  className,
  as: Component = 'button',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.(e);
  };

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'ps-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-[var(--font-heading)]',
        'text-sm font-semibold border transition-all duration-[120ms] ease-out select-none cursor-pointer',
        'min-h-[44px] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        'active:scale-[0.98] active:translate-y-[1px]',
        selected
          ? 'is-selected bg-[var(--brand-100)] text-[var(--brand-700)] border-[var(--brand-300)] shadow-[var(--shadow-xs)] font-bold'
          : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none active:scale-100 active:translate-y-0',
        className
      )}
      {...props}
    >
      {selected ? (
        <Check className="w-3.5 h-3.5 text-[var(--brand-700)] flex-shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center justify-center text-[var(--ink-3)]" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <span className="truncate">{children}</span>

      {removable && onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remove"
          onClick={handleRemove}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRemove(e);
            }
          }}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-[rgba(22,33,44,0.1)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      )}
    </Component>
  );
}

export { Chip };
