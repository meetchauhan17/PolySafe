import React, { forwardRef } from 'react';

/**
 * PolySafeInput.jsx — Standard Industrial Neumorphic Input
 *
 * - Background: bg-[var(--brand-clay)]
 * - Shadow: shadow-[var(--shadow-recessed)] at rest, shadow-[var(--shadow-recessed-deep)] on focus
 * - Border: none
 * - Radius: rounded-2xl (16px)
 * - Focus: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)]
 * - Font: font-sans text-base text-[var(--text-primary)]
 * - Placeholder: placeholder:text-[var(--text-muted)] placeholder:opacity-70
 * - Padding: px-4 py-3 (with icon offset if icon present)
 */

const PolySafeInput = forwardRef(function PolySafeInput(
  {
    className = '',
    label,
    error,
    helperText,
    icon: Icon = null,
    leftIcon = null,
    rightIcon = null,
    style = {},
    id,
    disabled = false,
    ...rest
  },
  ref
) {
  const ResolvedLeftIcon = Icon || leftIcon;
  const hasLeft = Boolean(ResolvedLeftIcon);
  const hasRight = Boolean(rightIcon);
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

      <div className="relative flex items-center w-full">
        {hasLeft && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text-muted)] flex items-center justify-center">
            {typeof ResolvedLeftIcon === 'function' ? (
              <ResolvedLeftIcon className="w-4 h-4" />
            ) : React.isValidElement(ResolvedLeftIcon) ? (
              ResolvedLeftIcon
            ) : (
              ResolvedLeftIcon
            )}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          style={{
            paddingLeft: hasLeft ? '44px' : '16px',
            paddingRight: hasRight ? '44px' : '16px',
            ...style,
          }}
          className={`w-full bg-[var(--chassis)] rounded-2xl border-none shadow-[var(--shadow-recessed)] focus:shadow-[var(--shadow-recessed-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)] font-sans text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-70 px-4 py-3 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError ? 'ring-2 ring-[var(--led-critical)]' : ''
          } ${className}`}
          {...rest}
        />

        {hasRight && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text-muted)] flex items-center justify-center">
            {typeof rightIcon === 'function' ? (
              <rightIcon className="w-4 h-4" />
            ) : (
              rightIcon
            )}
          </span>
        )}
      </div>

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

export default PolySafeInput;
