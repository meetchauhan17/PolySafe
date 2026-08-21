/**
 * PolySafeSelect — Neumorphic Clay-Surface Select Component
 *
 * Design Rule (non-negotiable):
 * - Background: --brand-clay (same as page surface; inset shadow creates perceived depth)
 * - Shadow: --neu-inset at rest to --neu-inset-deep on focus (handled by .input-field CSS)
 * - Border: none (neumorphic system uses shadows, not borders)
 * - Focus ring: double ring via box-shadow — 2px clay gap + 4px teal outline
 * - Appearance: native select chevron suppressed; use a leftIcon for context icons
 *
 * Props:
 * className {string} — extra Tailwind classes (e.g. "text-sm")
 * error {boolean} — toggles .input-error state (shake + red tint)
 * leftIcon {node} — rendered absolutely inside the left side (you still pass pl-10 in className)
 * children {node} — <option> elements
 * ...rest — forwarded to the underlying <select> (value, onChange, etc.)
 */
import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const PolySafeSelect = forwardRef(function PolySafeSelect(
 { className = '', error = false, leftIcon = null, children, ...rest },
 ref
) {
 const hasLeft = Boolean(leftIcon);

 return (
 <div className="relative flex items-center w-full">
 {/* Left icon */}
 {hasLeft && (
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[#5C6B64]">
 {leftIcon}
 </span>
 )}

 <select
 ref={ref}
 className={[
 'input-field appearance-none cursor-pointer',
 hasLeft ? 'has-icon-left' : '',
 'pr-10', /* space for chevron */
 error ? 'input-error' : '',
 className,
 ]
 .filter(Boolean)
 .join(' ')}
 {...rest}
 >
 {children}
 </select>

 {/* Chevron — right side */}
 <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[#5C6B64]">
 <ChevronDown className="w-4 h-4" />
 </span>
 </div>
 );
});

export default PolySafeSelect;
