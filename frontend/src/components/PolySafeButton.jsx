import React from 'react';
import { motion } from 'framer-motion';

/**
 * PolySafeButton.jsx — Physical Tactile Control Key
 *
 * Variants:
 * - 'primary'   : Hematology Purple (#7c3aed) with accent shadow & rim highlight
 * - 'secondary' : Molded chassis surface with soft neumorphic extrusion
 * - 'teal'      : Bio Teal (#0f766e) for clinical & doctor actions
 * - 'ghost'     : Unmolded flat key with hover depth
 * - 'danger'    : Critical destructive action with red LED warning accent
 */

export default function PolySafeButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
  type = 'button',
  ...props
}) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let variantClass = 'ps-btn--primary';
  if (variant === 'secondary') variantClass = 'ps-btn--secondary';
  if (variant === 'teal') variantClass = 'ps-btn--teal';
  if (variant === 'ghost') variantClass = 'ps-btn--ghost';
  if (variant === 'danger') variantClass = 'ps-btn--danger';

  let sizeClass = '';
  if (size === 'sm') sizeClass = 'ps-btn--sm';
  if (size === 'lg') sizeClass = 'ps-btn--lg';

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={
        !disabled && !loading && !prefersReducedMotion
          ? { y: 2, scale: 0.98 }
          : undefined
      }
      transition={{ duration: 0.1 }}
      className={`ps-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="font-mono text-xs uppercase tracking-wider">Processing...</span>
        </span>
      ) : (
        <>
          {Icon && (
            <span className="flex-shrink-0">
              {typeof Icon === 'function' ? <Icon className="w-4 h-4" /> : Icon}
            </span>
          )}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
}
