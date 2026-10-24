// src/components/Card.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Surface System Card Component.
 * Variants:
 *  - paper:       --paper background, --shadow-paper, hairline border (hero & feature areas)
 *  - raised:      --surface, shadow-sm, hover lifts 2px with shadow-md
 *  - outlined:    transparent, 1px border
 *  - inset:       --surface-2 stat well, inner shadow
 *  - status:      surface with left 4px accent bar in safe/caution/critical/brand
 *  - interactive: hover tilt hook-ready, focus ring, keyboard accessible
 * 
 * Frames:
 *  - radius xl (22px) for sections, lg (16px) for sub-cards
 *  - cornerFold: optional 14px folded corner gradient (Passport & Emergency Card)
 */
export default function Card({
  children,
  title,
  subtitle,
  icon,
  action,
  badge,
  variant = 'raised',
  status, // 'safe' | 'caution' | 'critical' | 'brand' | 'unknown'
  radius, // 'xl' | 'lg'
  size = 'subcard', // 'section' (radius-xl) | 'subcard' (radius-lg)
  cornerFold = false,
  className,
  as: Component = 'div',
  onClick,
  // Filter out legacy props
  hideScrews,
  glow,
  statusColor,
  elevation,
  accent,
  ...props
}) {
  const variantClasses = {
    paper:       'card-paper',
    raised:      'card-raised',
    outlined:    'card-outlined',
    inset:       'card-inset',
    status:      'card-status',
    interactive: 'card-interactive',
    flat:        'clinical-card',
    clinical:    'clinical-card',
  };

  const statusBorderClasses = {
    safe:     'card-status-safe border-l-4 border-l-[var(--safe-600)]',
    caution:  'card-status-caution border-l-4 border-l-[var(--caution-500)]',
    critical: 'card-status-critical border-l-4 border-l-[var(--critical-500)]',
    brand:    'card-status-brand border-l-4 border-l-[var(--brand-600)]',
    unknown:  'border-l-4 border-l-[var(--unknown-500)]',
  };

  const effectiveStatus = status || statusColor;
  const isInteractive = variant === 'interactive' || Boolean(onClick);

  // Radius frame: section = xl (22px), subcard = lg (16px)
  const effectiveRadius = radius
    ? radius === 'xl' ? 'rounded-[var(--radius-xl)]' : 'rounded-[var(--radius-lg)]'
    : size === 'section' || variant === 'paper'
    ? 'rounded-[var(--radius-xl)]'
    : 'rounded-[var(--radius-lg)]';

  const finalAction = action || badge;
  const hasHeader = Boolean(title || subtitle || icon || finalAction);

  return (
    <Component
      className={clsx(
        'p-5 transition-all duration-[120ms] ease-out',
        variantClasses[variant] || 'card-raised',
        effectiveRadius,
        effectiveStatus && statusBorderClasses[effectiveStatus],
        cornerFold && 'corner-fold',
        isInteractive && 'cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
        className
      )}
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive && Component === 'div' ? 'button' : undefined}
      onKeyDown={
        isInteractive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {hasHeader && (
        <CardHeader
          title={
            icon ? (
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 text-[var(--brand-600)]" aria-hidden="true">{icon}</span>
                <span>{title}</span>
              </div>
            ) : (
              title
            )
          }
          subtitle={subtitle}
          action={finalAction}
        />
      )}
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        {typeof title === 'string' ? (
          <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
            {title}
          </h2>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--ink-3)] mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-[var(--border)]', className)}>
      {children}
    </div>
  );
}

export { Card };
