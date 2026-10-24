// src/components/SectionHeader.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Editorial SectionHeader.
 * Features:
 * - Small-caps label (eyebrow / kicker)
 * - Big serif title (Fraunces display/heading)
 * - Optional number (e.g. "01 /")
 * - Hairline rule that draws in on mount (respects prefers-reduced-motion)
 */
export default function SectionHeader({
  title,
  kicker,
  eyebrow,
  number,
  description,
  action,
  children,
  animateRule = true,
  className,
  as: Component = 'header',
  ...props
}) {
  const effectiveKicker = kicker || eyebrow;

  return (
    <Component className={clsx('space-y-3 w-full', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {/* Eyebrow / Small-caps Kicker */}
          {effectiveKicker && (
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--accent-600)] font-[var(--font-heading)]">
              {effectiveKicker}
            </span>
          )}

          {/* Big Serif Title with optional number */}
          <div className="flex items-baseline gap-2.5">
            {number && (
              <span className="font-mono text-sm sm:text-base font-bold text-[var(--brand-600)] flex-shrink-0" aria-hidden="true">
                {number}
              </span>
            )}
            {typeof title === 'string' ? (
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-[var(--font-heading)] text-[var(--ink)] tracking-tight leading-tight">
                {title}
              </h2>
            ) : (
              title
            )}
          </div>

          {/* Subtitle / Description */}
          {description && (
            <p className="text-xs sm:text-sm text-[var(--ink-3)] max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action slot on right */}
        {action && <div className="flex-shrink-0 pt-1">{action}</div>}
      </div>

      {children}

      {/* Hairline rule that draws in on mount */}
      <div
        className={clsx(
          'h-[1px] w-full bg-[var(--hairline)]',
          animateRule && 'animate-draw-rule'
        )}
        aria-hidden="true"
      />
    </Component>
  );
}

export { SectionHeader };
