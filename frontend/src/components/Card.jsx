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
  let topAccentGradient = '';

  if (normalizedVariant === 'safe') {
    variantClasses = 'ps-card--safe border-emerald-500/40 hover:border-emerald-500/70';
    ledColorClass = 'bg-[var(--led-safe)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-safe-glow)] animate-[led-pulse_2s_ease-in-out_infinite]';
    topAccentGradient = 'from-emerald-400 via-teal-400 to-cyan-500';
  } else if (normalizedVariant === 'caution') {
    variantClasses = 'ps-card--caution border-amber-500/40 hover:border-amber-500/70';
    ledColorClass = 'bg-[var(--led-caution)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-caution-glow)] animate-[led-pulse_2s_ease-in-out_infinite]';
    topAccentGradient = 'from-amber-400 via-orange-400 to-yellow-500';
  } else if (normalizedVariant === 'critical') {
    variantClasses = 'ps-card--critical border-rose-500/50 hover:border-rose-500/80';
    ledColorClass = 'bg-[var(--led-critical)]';
    ledGlowClass = 'shadow-[0_0_8px_2px_var(--led-critical-glow)] animate-[led-pulse_1.2s_ease-in-out_infinite]';
    topAccentGradient = 'from-rose-500 via-red-500 to-orange-500';
  }

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
      className={`group relative bg-[var(--brand-surface)]/95 backdrop-blur-xl text-[var(--text-primary)] rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out flex flex-col border border-[var(--brand-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 ${
        onClick
          ? 'cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]'
          : ''
      } ${variantClasses} ${className}`}
      {...props}
    >
      {/* Top Accent Gradient Line for variant cards */}
      {topAccentGradient && (
        <div
          className={`absolute top-0 left-6 right-6 h-1 bg-gradient-to-r ${topAccentGradient} rounded-b-full opacity-80 group-hover:opacity-100 transition-opacity`}
        />
      )}

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
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center justify-center shadow-xs flex-shrink-0"
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
                  <p className="text-xs mt-0.5 leading-normal text-[var(--text-secondary)]">
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
