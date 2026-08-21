/**
 * PolySafeInput — Neumorphic Clay-Surface Input Component
 *
 * Design Rule (non-negotiable):
 * - Background: --brand-clay (same as page surface; inset shadow creates perceived depth)
 * - Shadow: --neu-inset at rest to --neu-inset-deep on focus (handled by .input-field CSS)
 * - Border: none (neumorphic system uses shadows, not borders)
 * - Focus ring: double ring via box-shadow — 2px clay gap + 4px teal outline
 * - Error state: activates .input-error to red tint + shake animation
 *
 * Props:
 * className {string} — extra Tailwind classes (e.g. "w-36 text-2xl text-center")
 * error {boolean} — toggles .input-error state (shake + red tint)
 * leftIcon {node} — rendered absolutely inside the left side (you still pass pl-10 or pl-11 in className)
 * rightIcon {node} — rendered absolutely inside the right side (you still pass pr-10 in className)
 * ...rest — forwarded to the underlying <input> (type, value, onChange, placeholder, etc.)
 */
import React, { forwardRef } from 'react';

const PolySafeInput = forwardRef(function PolySafeInput(
 { className = '', error = false, leftIcon = null, rightIcon = null, ...rest },
 ref
) {
 const hasLeft = Boolean(leftIcon);
 const hasRight = Boolean(rightIcon);

 return (
 <div className="relative flex items-center w-full">
 {/* Left icon — absolutely positioned, pointer-events-none */}
 {hasLeft && (
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[#5C6B64]">
 {leftIcon}
 </span>
 )}

 <input
 ref={ref}
 className={[
 'input-field',
 hasLeft ? 'has-icon-left' : '',
 hasRight ? 'has-icon-right' : '',
 error ? 'input-error' : '',
 className,
 ]
 .filter(Boolean)
 .join(' ')}
 {...rest}
 />

 {/* Right icon — absolutely positioned */}
 {hasRight && (
 <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-[#5C6B64]">
 {rightIcon}
 </span>
 )}
 </div>
 );
});

export default PolySafeInput;
