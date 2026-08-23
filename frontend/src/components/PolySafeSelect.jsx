import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * PolySafeSelect.jsx — Industrial Skeuomorphic Recessed Dropdown Well
 */

const PolySafeSelect = forwardRef(function PolySafeSelect(
  {
    className = '',
    error = false,
    leftIcon = null,
    label,
    helperText,
    children,
    style = {},
    ...rest
  },
  ref
) {
  const hasLeft = Boolean(leftIcon);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="ps-label">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Left icon */}
        {hasLeft && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--accent-primary)] flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        <select
          ref={ref}
          style={{
            paddingLeft: hasLeft ? '44px' : '16px',
            paddingRight: '40px',
            ...style,
          }}
          className={`ps-input ps-select cursor-pointer ${hasLeft ? '!pl-[44px] has-icon-left' : ''} ${
            error ? 'ps-input--error' : ''
          } ${className}`}
          {...rest}
        >
          {children}
        </select>

        {/* Right Chevron */}
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[var(--text-muted)] flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>

      {helperText && (
        <span className={`text-[11px] font-mono ${error ? 'text-[var(--led-critical)]' : 'text-[var(--text-muted)]'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
});

export default PolySafeSelect;
