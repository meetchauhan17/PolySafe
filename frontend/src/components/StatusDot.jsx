// src/components/StatusDot.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Calm StatusDot component.
 * Replaces old glow dots / LedIndicators.
 * Features:
 *  - NO glow
 *  - Subtle 2s pulse ONLY for 'critical' status
 *  - Reduced-motion safe (collapses to static dot)
 */
export default function StatusDot({
  status = 'unknown',
  size = 'md',
  className,
  ...props
}) {
  const normStatus = (status || 'unknown').toLowerCase();
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={clsx(
        'ps-status-dot',
        normStatus,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { StatusDot };
