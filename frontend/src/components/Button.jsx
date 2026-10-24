import React from 'react';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';
import { Magnetic } from '../motion/Magnetic';

const variantMap = {
  primary:        'ps-btn-primary',
  accent:         'ps-btn-accent',
  cta:            'ps-btn-accent',
  secondary:      'ps-btn-secondary',
  ghost:          'ps-btn-ghost',
  danger:         'ps-btn-danger',
  'danger-outline': 'ps-btn-danger-outline',
  dangerOutline:  'ps-btn-danger-outline',
  success:        'ps-btn-success',
  doctor:         'ps-btn-doctor',
};

const sizeMap = {
  sm: 'ps-btn-sm',
  md: 'ps-btn-md',
  lg: 'ps-btn-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  showArrow = false,
  magnetic = false,
  icon,
  iconRight,
  leftIcon,
  rightIcon,
  className,
  as: Component = 'button',
  ...props
}) {
  const finalIcon = icon || leftIcon;
  let finalIconRight = iconRight || rightIcon;

  // If primary with showArrow requested and no right icon, use default ArrowRight
  if (showArrow && !finalIconRight) {
    finalIconRight = <ArrowRight className="w-4 h-4 ps-btn-arrow flex-shrink-0" aria-hidden="true" />;
  }

  const btn = (
    <Component
      className={clsx(
        'ps-btn',
        variantMap[variant] || 'ps-btn-primary',
        sizeMap[size] || 'ps-btn-md',
        fullWidth && 'ps-btn-full w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="ps-pill-loader" aria-hidden="true" />
      ) : finalIcon ? (
        <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
          {finalIcon}
        </span>
      ) : null}

      {children && <span className="inline-flex items-center gap-1.5">{children}</span>}

      {finalIconRight && !loading && (
        <span className="flex-shrink-0 flex items-center justify-center ps-btn-arrow" aria-hidden="true">
          {finalIconRight}
        </span>
      )}
    </Component>
  );

  if (magnetic && !disabled && !loading) {
    return <Magnetic>{btn}</Magnetic>;
  }

  return btn;
}

export function IconButton({
  icon,
  label,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  const accessibleLabel = label || ariaLabel;
  if (!accessibleLabel && process.env.NODE_ENV !== 'production') {
    console.warn('[IconButton] Accessible name (label or aria-label) is required for WCAG compliance.');
  }

  const sizeClasses = {
    sm: 'w-10 h-10 min-w-[44px] min-h-[44px] p-2 text-sm',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5 text-base',
    lg: 'w-13 h-13 min-w-[52px] min-h-[52px] p-3 text-lg',
  };

  return (
    <button
      type="button"
      aria-label={accessibleLabel || 'Action'}
      disabled={disabled || loading}
      className={clsx(
        'ps-btn inline-flex items-center justify-center rounded-full',
        variantMap[variant] || 'ps-btn-ghost',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="ps-pill-loader" aria-hidden="true" />
      ) : (
        <span className="flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}

