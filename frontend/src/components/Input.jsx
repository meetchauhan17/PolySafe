// src/components/Input.jsx
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(function Input(
  { label, hint, error, icon, iconRight, className, id, ...props },
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
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none flex-shrink-0">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'ps-input',
            icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-[var(--critical-fg)] focus:shadow-[0_0_0_3px_rgba(185,28,28,.25)]',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)] flex-shrink-0">
            {iconRight}
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
  { label, hint, error, className, id, rows = 3, ...props },
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
  { label, hint, error, className, id, children, ...props },
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
