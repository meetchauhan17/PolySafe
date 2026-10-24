import React, { forwardRef, useState, useId } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    success,
    floating = true,
    numeric = false,
    dose = false,
    icon,
    iconRight,
    leftIcon,
    rightIcon,
    showPasswordToggle = true,
    className,
    id,
    style,
    type = 'text',
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : `ps-input-${generatedId}`);
  const finalIcon = icon || leftIcon;
  const isNumeric = numeric || dose || type === 'number';
  const isPasswordField = type === 'password';

  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');
  const [showPassword, setShowPassword] = useState(false);

  const actualType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  const hasValue = (value !== undefined ? String(value).length > 0 : String(internalValue).length > 0);

  // If a label exists and floating is enabled, use floating label behavior
  const useFloatingLabel = Boolean(label && floating);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  // Resolve right icon: custom iconRight > password visibility toggle > success icon
  let finalIconRight = iconRight || rightIcon;
  if (!finalIconRight && isPasswordField && showPasswordToggle) {
    finalIconRight = (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        className="p-1 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)] focus:outline-none transition-colors cursor-pointer pointer-events-auto flex items-center justify-center"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-[var(--brand-600)]" />
        ) : (
          <Eye className="w-4 h-4 text-[var(--ink-3)] hover:text-[var(--ink)]" />
        )}
      </button>
    );
  } else if (!finalIconRight && success) {
    finalIconRight = <Check className="w-4 h-4 text-[var(--safe-600)]" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Static label if floating is explicitly disabled */}
      {label && !useFloatingLabel && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
          {props.required && <span className="text-[var(--critical-500)] ml-0.5">*</span>}
        </label>
      )}

      <div
        className={clsx(
          'relative flex items-center w-full',
          useFloatingLabel && 'ps-floating-wrapper',
          isFocused && 'is-focused',
          hasValue && 'has-value',
          finalIcon && 'has-left-icon'
        )}
      >
        {/* Left Icon */}
        {finalIcon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none flex-shrink-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            {finalIcon}
          </span>
        )}

        {/* Floating Label */}
        {useFloatingLabel && (
          <label
            htmlFor={inputId}
            className={clsx(
              'ps-floating-label font-[var(--font-heading)]',
              isFocused && 'text-[var(--brand-600)] font-bold',
              error && 'text-[var(--critical-ink)]'
            )}
          >
            {label}
            {props.required && <span className="text-[var(--critical-500)] ml-0.5">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={actualType}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={useFloatingLabel && !isFocused && !hasValue ? '' : placeholder}
          className={clsx(
            'ps-input',
            isNumeric && 'font-mono ps-input-numeric',
            finalIcon && '!pl-11 has-icon-left',
            finalIconRight && '!pr-11 has-icon-right',
            error && '!border-[var(--critical-500)] focus:!border-[var(--critical-500)]',
            success && '!border-[var(--safe-600)]',
            className
          )}
          style={{
            ...style,
            ...(finalIcon ? { paddingLeft: '2.75rem' } : {}),
            ...(finalIconRight ? { paddingRight: '2.75rem' } : {}),
          }}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? `${inputId}-error`
              : success && typeof success === 'string'
              ? `${inputId}-success`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          {...props}
        />

        {/* Right Icon / Password Toggle / Success indicator */}
        {finalIconRight && (
          <span
            className={clsx(
              'absolute right-3.5 top-1/2 -translate-y-1/2 flex-shrink-0 z-10 flex items-center justify-center',
              isPasswordField ? 'pointer-events-auto' : 'pointer-events-none text-[var(--ink-3)]'
            )}
            aria-hidden={isPasswordField ? undefined : 'true'}
          >
            {finalIconRight}
          </span>
        )}

        {/* Coral Active Underline Bar */}
        <span
          className={clsx(
            'ps-focus-underline',
            isFocused && '!scale-x-100',
            error && '!bg-[var(--critical-500)]'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Inline error with icon */}
      {error && typeof error === 'string' && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-[var(--critical-ink)] flex items-center gap-1.5 font-medium mt-0.5"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--critical-500)]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {/* Inline success text */}
      {success && typeof success === 'string' && !error && (
        <p
          id={`${inputId}-success`}
          className="text-xs text-[var(--safe-ink)] flex items-center gap-1.5 font-medium mt-0.5"
        >
          <Check className="w-3.5 h-3.5 flex-shrink-0 text-[var(--safe-600)]" aria-hidden="true" />
          <span>{success}</span>
        </p>
      )}

      {/* Helpful Hint */}
      {hint && !error && (!success || typeof success !== 'string') && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-3)] mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea(
  {
    label,
    hint,
    error,
    success,
    className,
    id,
    rows = 3,
    icon,
    leftIcon,
    rightIcon,
    iconRight,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : `ps-textarea-${generatedId}`);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
          {props.required && <span className="text-[var(--critical-500)] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={clsx(
            'ps-input resize-none',
            error && '!border-[var(--critical-500)] focus:!border-[var(--critical-500)]',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {/* Coral Active Underline */}
        <span
          className={clsx(
            'ps-focus-underline',
            isFocused && '!scale-x-100',
            error && '!bg-[var(--critical-500)]'
          )}
          aria-hidden="true"
        />
      </div>

      {error && typeof error === 'string' && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-[var(--critical-ink)] flex items-center gap-1.5 font-medium mt-0.5"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--critical-500)]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-3)] mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    className,
    id,
    children,
    icon,
    leftIcon,
    rightIcon,
    iconRight,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : `ps-select-${generatedId}`);
  const finalIcon = icon || leftIcon;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]"
        >
          {label}
          {props.required && <span className="text-[var(--critical-500)] ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {finalIcon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none flex-shrink-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            {finalIcon}
          </span>
        )}

        <select
          ref={ref}
          id={inputId}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={clsx(
            'ps-input appearance-none cursor-pointer pr-10',
            finalIcon && '!pl-11',
            error && '!border-[var(--critical-500)]',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        >
          {children}
        </select>

        {/* Custom Chevron Down */}
        <ChevronDown
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)] pointer-events-none flex-shrink-0"
          aria-hidden="true"
        />

        {/* Coral Active Underline */}
        <span
          className={clsx(
            'ps-focus-underline',
            isFocused && '!scale-x-100',
            error && '!bg-[var(--critical-500)]'
          )}
          aria-hidden="true"
        />
      </div>

      {error && typeof error === 'string' && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-[var(--critical-ink)] flex items-center gap-1.5 font-medium mt-0.5"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[var(--critical-500)]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--ink-3)] mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
});
