// src/components/Button.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variantMap = {
  primary:   'ps-btn-primary',
  secondary: 'ps-btn-secondary',
  ghost:     'ps-btn-ghost',
  danger:    'ps-btn-danger',
  doctor:    'ps-btn-doctor',
};

const sizeMap = {
  sm: 'ps-btn-sm',
  md: '',
  lg: 'ps-btn-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  leftIcon,
  rightIcon,
  className,
  as: Component = 'button',
  ...props
}) {
  const finalIcon = icon || leftIcon;
  const finalIconRight = iconRight || rightIcon;

  return (
    <Component
      className={clsx(
        'ps-btn',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden />
      ) : finalIcon ? (
        <span className="flex-shrink-0" aria-hidden>{finalIcon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {finalIconRight && !loading && (
        <span className="flex-shrink-0" aria-hidden>{finalIconRight}</span>
      )}
    </Component>
  );
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...props }) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-[var(--radius-sm)]',
    md: 'w-10 h-10 rounded-[var(--radius-sm)]',
    lg: 'w-12 h-12 rounded-[var(--radius-md)]',
  };
  return (
    <button
      aria-label={label}
      className={clsx(
        'ps-btn inline-flex items-center justify-center p-0 min-h-0',
        variantMap[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
