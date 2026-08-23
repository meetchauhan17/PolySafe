import React, { forwardRef } from 'react';

/**
 * PolySafeTextarea.jsx — Standard Industrial Neumorphic Textarea
 *
 * - Background: bg-[var(--brand-clay)]
 * - Shadow: shadow-[var(--shadow-recessed)] at rest, shadow-[var(--shadow-recessed-deep)] on focus
 * - Border: none
 * - Radius: rounded-2xl (16px)
 * - Focus: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)]
 * - Font: font-sans text-base text-[var(--text-primary)]
 * - Placeholder: placeholder:text-[var(--text-muted)] placeholder:opacity-70
 * - Padding: px-4 py-3
 * - Transition: transition-all duration-200 ease-out
 */

const PolySafeTextarea = forwardRef(function PolySafeTextarea(
  {
    className = '',
    label,
    error,
    helperText,
    id,
    disabled = false,
    rows = 4,
    ...rest
  },
  ref
) {
  const errorMessage = typeof error === 'string' ? error : null;
  const hasError = Boolean(error);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        className={`w-full bg-[var(--chassis)] rounded-2xl border-none shadow-[var(--shadow-recessed)] focus:shadow-[var(--shadow-recessed-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)] font-sans text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-70 px-4 py-3 resize-y transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError ? 'ring-2 ring-[var(--led-critical)]' : ''
        } ${className}`}
        {...rest}
      />

      {(errorMessage || helperText) && (
        <span
          className={`text-xs font-mono mt-0.5 ${
            hasError ? 'text-[var(--led-critical)] font-semibold' : 'text-[var(--text-muted)]'
          }`}
        >
          {errorMessage || helperText}
        </span>
      )}
    </div>
  );
});

export default PolySafeTextarea;
