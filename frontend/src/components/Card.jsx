import React from 'react';

/**
 * Card.jsx — Modern Clinical Surface Panel
 *
 * Design Language:
 * - Background: var(--chassis) (#e0e5ec) default / elevated surface
 * - Border-radius: rounded-2xl (16-20px) for crisp modern framing
 * - Subtle glass border & multi-layered soft elevation
 * - Variant Cards (safe / caution / critical): High-contrast clinical carve-out with pulsing LED indicator and colored border.
 */

export default function Card({
  variant = 'default',
  elevated = false,
  title,
  subtitle,
  icon,
  badge,
  headerAction,
  className = '',
  onClick,
  style = {},
  hideScrews = true,
  children,
  ...props
}) {
  const isVariant = variant === 'safe' || variant === 'caution' || variant === 'critical' || variant === 'danger';
  const normalizedVariant = variant === 'danger' ? 'critical' : variant;

  let variantClasses = '';
  let ledColorClass = '';
  let ledGlowClass = '';

  if (normalizedVariant === 'safe') {
    variantClasses = 'ps-card--safe border border-[var(--led-safe)]/40 bg-[var(--brand-surface)]';
    ledColorClass = 'bg-[var(--led-safe)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-safe-glow)] animate-[led-pulse_2s_ease-in-out_infinite]';
  } else if (normalizedVariant === 'caution') {
    variantClasses = 'ps-card--caution border border-[var(--led-caution)]/40 bg-[var(--brand-surface)]';
    ledColorClass = 'bg-[var(--led-caution)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-caution-glow)] animate-[led-pulse_2s_ease-in-out_infinite]';
  } else if (normalizedVariant === 'critical') {
    variantClasses = 'ps-card--critical border border-[var(--led-critical)]/45 bg-[var(--brand-surface)]';
    ledColorClass = 'bg-[var(--led-critical)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-critical-glow)] animate-[led-pulse_1.2s_ease-in-out_infinite]';
  }

  const baseShadow = elevated
    ? 'shadow-[var(--shadow-floating)]'
    : 'shadow-[var(--shadow-card)]';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      style={{
        ...style,
      }}
      className={`relative bg-[var(--brand-surface)] text-[var(--text-primary)] rounded-2xl p-5 sm:p-6 transition-all duration-200 ease-out flex flex-col border border-[rgba(255,255,255,0.7)] dark:border-white/5 ${baseShadow} hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${
        onClick
          ? 'cursor-pointer active:translate-y-0.5 active:shadow-[var(--shadow-pressed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]'
          : ''
      } ${variantClasses} ${className}`}
      {...props}
    >
      {/* Pulsing LED on Status Variant Cards */}
      {isVariant && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 pointer-events-none">
          <div className={`w-2.5 h-2.5 rounded-full ${ledColorClass} ${ledGlowClass}`} />
        </div>
      )}

      {/* Optional Card Header */}
      {(title || icon || badge || headerAction) && (
        <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className="p-2.5 rounded-xl flex-shrink-0 bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] border border-[var(--chassis-dark)]/40"
              >
                {icon}
              </div>
            )}
            {title && (
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold tracking-tight leading-snug text-[var(--text-primary)] font-display">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs mt-0.5 leading-normal text-[var(--text-muted)]">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {(badge || headerAction) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {badge}
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {children}
      </div>
    </div>
  );
}
