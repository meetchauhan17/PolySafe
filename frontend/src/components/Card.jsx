import React from 'react';

/**
 * Card.jsx — Reusable container component for PolySafe
 *
 * Enforces uniform visual standards across the entire application:
 * - background: #FFFFFF
 * - border: 2px solid #E7E1D3 (or variant border color)
 * - border-radius: 16px
 * - padding: 20px (p-5)
 * - box-shadow: 0 6px 16px rgba(28,43,39,0.10)
 * - height: h-full flex flex-col for consistent row/grid alignment
 *
 * Props:
 * @param {string} [variant='default'] - 'default' | 'caution' | 'danger' | 'safe'
 * @param {string|React.ReactNode} [title] - Optional card heading
 * @param {string|React.ReactNode} [subtitle] - Optional card sub-caption
 * @param {React.ReactNode} [icon] - Optional header icon
 * @param {React.ReactNode} [badge] - Optional pill/tag rendered in the top-right
 * @param {React.ReactNode} [headerAction] - Optional top-right button/action
 * @param {string} [className] - Additional utility classes
 * @param {function} [onClick] - Optional click handler
 * @param {React.ReactNode} children - Card body content
 */

const VARIANT_STYLES = {
  default: {
    border: 'border-[#E7E1D3]',
    bg:     'bg-white',
    iconBg: 'bg-[#2B6E5E]/10 text-[#2B6E5E]',
  },
  caution: {
    border: 'border-[#B5791A]',
    bg:     'bg-white',
    iconBg: 'bg-[#FBEED9] text-[#B5791A]',
  },
  danger: {
    border: 'border-[#B23D25]',
    bg:     'bg-white',
    iconBg: 'bg-[#FBE4DE] text-[#B23D25]',
  },
  safe: {
    border: 'border-[#2F8558]',
    bg:     'bg-white',
    iconBg: 'bg-[#E4F2E9] text-[#2F8558]',
  },
};

export default function Card({
  variant = 'default',
  title,
  subtitle,
  icon,
  badge,
  headerAction,
  className = '',
  onClick,
  style = {},
  children,
  ...props
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

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
        boxShadow: '0 6px 16px rgba(28, 43, 39, 0.10)',
        ...style,
      }}
      className={`rounded-2xl border-2 ${v.border} ${v.bg} p-5 transition-all duration-200 ease-out flex flex-col ${
        onClick
          ? 'cursor-pointer hover:border-[#2B6E5E] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(43,110,94,0.14)] active:translate-y-0.5 active:shadow-[0_2px_8px_rgba(28,43,39,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E]'
          : ''
      } ${className}`}
      {...props}
    >
      {/* Optional Card Header */}
      {(title || icon || badge || headerAction) && (
        <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${v.iconBg}`}>
                {icon}
              </div>
            )}
            {title && (
              <div className="min-w-0">
                <h3
                  className="text-base font-bold text-[#232724] tracking-tight leading-snug"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-[#6B726C] mt-0.5 leading-normal">
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
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
