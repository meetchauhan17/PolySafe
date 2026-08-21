import React from 'react';

/**
 * Card.jsx — Reusable Neumorphic container component for PolySafe
 *
 * Neumorphic Standards:
 * - background: #EDE8DC (warm clay molded surface)
 * - border-radius: 32px (rounded-[32px])
 * - padding: 20px (p-5)
 * - box-shadow: 9px 9px 16px rgba(191,180,155,0.55), -9px -9px 16px rgba(255,255,255,0.65)
 * - icon: drilled-in circular well (inset deep shadow)
 *
 * SAFETY CARVE-OUT:
 * - Risk statuses (safe, caution, danger) MUST NOT blend into the clay background.
 * - They strictly keep real, visible high-contrast backgrounds with solid 2px borders:
 * - safe: #E4F2E9 with #2F8558 border
 * - caution: #FBEED9 with #B5791A border
 * - danger: #FBE4DE with #B23D25 border
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
 border: 'border-transparent',
 bg: 'bg-[#EDE8DC]',
 iconBg: 'icon-well text-[#2B6E5E]',
 shadow: '9px 9px 16px rgba(191, 180, 155, 0.55), -9px -9px 16px rgba(255, 255, 255, 0.65)',
 titleColor: 'text-[#1C2B27]',
 subtitleColor: 'text-[#5C6B64]',
 },
 // ─── SAFETY CARVE-OUT STATUSES ──────────────────────────────────────────────
 caution: {
 border: 'border-[#B5791A] border-2',
 bg: 'bg-[#FBEED9]',
 iconBg: 'p-2.5 rounded-full bg-[#F5E2C4] text-[#B5791A] shadow-inner',
 shadow: '6px 6px 14px rgba(191, 180, 155, 0.40), -6px -6px 14px rgba(255, 255, 255, 0.50)',
 titleColor: 'text-[#7A4A0A]',
 subtitleColor: 'text-[#8A5210]',
 },
 danger: {
 border: 'border-[#B23D25] border-2',
 bg: 'bg-[#FBE4DE]',
 iconBg: 'p-2.5 rounded-full bg-[#F5D2C8] text-[#B23D25] shadow-inner',
 shadow: '6px 6px 14px rgba(191, 180, 155, 0.40), -6px -6px 14px rgba(255, 255, 255, 0.50)',
 titleColor: 'text-[#7A1A0A]',
 subtitleColor: 'text-[#962615]',
 },
 safe: {
 border: 'border-[#2F8558] border-2',
 bg: 'bg-[#E4F2E9]',
 iconBg: 'p-2.5 rounded-full bg-[#CCE9D6] text-[#2F8558] shadow-inner',
 shadow: '6px 6px 14px rgba(191, 180, 155, 0.40), -6px -6px 14px rgba(255, 255, 255, 0.50)',
 titleColor: 'text-[#1A5C3A]',
 subtitleColor: 'text-[#206942]',
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
 boxShadow: v.shadow,
 ...style,
 }}
 className={`rounded-[32px] ${v.border} ${v.bg} p-6 transition-all duration-200 ease-out flex flex-col ${
 onClick
 ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[12px_12px_20px_rgba(191,180,155,0.65),-12px_-12px_20px_rgba(255,255,255,0.75)] active:translate-y-0.5 active:shadow-[inset_6px_6px_10px_rgba(191,180,155,0.55),inset_-6px_-6px_10px_rgba(255,255,255,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E]'
 : ''
 } ${className}`}
 {...props}
 >
 {/* Optional Card Header */}
 {(title || icon || badge || headerAction) && (
 <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 {icon && (
 <div className={`p-2.5 rounded-full flex-shrink-0 ${v.iconBg}`}>
 {icon}
 </div>
 )}
 {title && (
 <div className="min-w-0">
 <h3
 className={`text-base sm:text-lg font-bold tracking-tight leading-snug ${v.titleColor}`}
 style={{ fontFamily: "'Fraunces', serif" }}
 >
 {title}
 </h3>
 {subtitle && (
 <p className={`text-xs mt-0.5 leading-normal ${v.subtitleColor}`}>
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
