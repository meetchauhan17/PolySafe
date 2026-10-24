/**
 * src/motion/Shimmer.jsx
 * Skeleton Loader in Warm Ivory Tones
 *
 * Requirements:
 * - Shimmer skeleton in warm ivory tones (--surface-2, --surface-3, --paper).
 * - Disables animated sweep under prefers-reduced-motion (replaces with calm static tone).
 */

import React from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from './useReducedMotion';

export function Shimmer({
  className = '',
  rounded = 'rounded-[var(--radius-md)]',
  width,
  height,
  style,
  ...props
}) {
  const isReduced = useReducedMotion();

  const customStyles = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden select-none',
        isReduced ? 'bg-[var(--surface-2)]' : 'ps-shimmer',
        rounded,
        className
      )}
      style={customStyles}
      aria-hidden="true"
      {...props}
    />
  );
}

export function ShimmerText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          height="14px"
          width={i === lines - 1 ? '65%' : '100%'}
          rounded="rounded-[var(--radius-sm)]"
        />
      ))}
    </div>
  );
}

export default Shimmer;
