// src/components/Input.jsx
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(function Input(
  { label, hint, error, icon, iconRight, leftIcon, rightIcon, className, id, style, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const finalIcon = icon || leftIcon;
  const finalIconRight = iconRight || rightIcon;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
          {props.required && <span className="text-[var(--critical-fg)] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {finalIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none flex-shrink-0 z-10 flex items-center justify-center">
            {finalIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={clsx(
            'ps-input',
            finalIcon && '!pl-11 has-icon-left',
            finalIconRight && '!pr-11 has-icon-right',
            error && 'border-[var(--critical-fg)] focus:shadow-[0_0_0_3px_rgba(185,28,28,.25)]',
            className
          )}
          style={{
            ...style,
            ...(finalIcon ? { paddingLeft: '2.75rem' } : {}),
            ...(finalIconRight ? { paddingRight: '2.75rem' } : {}),
          }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
        />
        {finalIconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] flex-shrink-0 z-10 flex items-center justify-center">
            {finalIconRight}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--critical-fg)] flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-3)]">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, id, rows = 3, icon, leftIcon, rightIcon, iconRight, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
          {props.required && <span className="text-[var(--critical-fg)] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx(
          'ps-input resize-none',
          error && 'border-[var(--critical-fg)]',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="text-xs text-[var(--critical-fg)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, className, id, children, icon, leftIcon, rightIcon, iconRight, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={clsx(
          'ps-input appearance-none cursor-pointer',
          error && 'border-[var(--critical-fg)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--critical-fg)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
});
