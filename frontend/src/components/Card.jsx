// src/components/Card.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Card variants:
 *  flat       — surface + border, no shadow
 *  raised     — surface + border + shadow-md
 *  interactive — hover lift, pointer cursor
 *  status     — colored left-border accent
 */
export default function Card({
  children,
  title,
  subtitle,
  icon,
  action,
  badge,
  variant = 'flat',
  status,      // 'safe' | 'caution' | 'critical' | 'unknown'
  className,
  as: Component = 'div',
  onClick,
  // Filter out legacy and custom props
  hideScrews,
  glow,
  statusColor,
  elevation,
  accent,
  ...props
}) {
  const statusBorder = {
    safe:     'border-l-4 border-l-[var(--safe-fg)]',
    caution:  'border-l-4 border-l-[var(--caution-fg)]',
    critical: 'border-l-4 border-l-[var(--critical-fg)]',
    unknown:  'border-l-4 border-l-[var(--unknown-fg)]',
  };

  const statusList = ['safe', 'caution', 'critical', 'unknown'];
  const effectiveStatus = status || (statusList.includes(variant) ? variant : undefined);
  const effectiveVariant = statusList.includes(variant) ? 'flat' : (variant || 'flat');

  const finalAction = action || badge;
  const hasHeader = Boolean(title || subtitle || icon || finalAction);

  return (
    <Component
      className={clsx(
        effectiveVariant === 'flat'        && 'card-flat',
        effectiveVariant === 'raised'      && 'card-raised',
        effectiveVariant === 'interactive' && 'card-interactive',
        effectiveStatus && statusBorder[effectiveStatus],
        'p-5',
        className
      )}
      onClick={onClick}
      tabIndex={variant === 'interactive' ? 0 : undefined}
      role={variant === 'interactive' ? 'button' : undefined}
      onKeyDown={
        variant === 'interactive' && onClick
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); }
          : undefined
      }
      {...props}
    >
      {hasHeader && (
        <CardHeader
          title={
            icon ? (
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">{icon}</span>
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
          <h2 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
            {title}
          </h2>
        ) : title}
        {subtitle && (
          <p className="text-sm text-[var(--ink-3)] mt-0.5 leading-snug">{subtitle}</p>
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
