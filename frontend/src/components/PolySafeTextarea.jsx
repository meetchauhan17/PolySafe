/**
 * PolySafeTextarea — Neumorphic Clay-Surface Textarea Component
 *
 * Design Rule (non-negotiable):
 *  - Background: --brand-clay (same as page surface; inset shadow creates perceived depth)
 *  - Shadow: --neu-inset at rest → --neu-inset-deep on focus (handled by .input-field CSS)
 *  - Border: none (neumorphic system uses shadows, not borders)
 *  - Focus ring: double ring via box-shadow — 2px clay gap + 4px teal outline
 *  - Error state: activates .input-error → red tint + shake animation
 *
 * Props:
 *   className   {string}  — extra Tailwind classes (e.g. "resize-none leading-relaxed")
 *   error       {boolean} — toggles .input-error state (shake + red tint)
 *   rows        {number}  — number of visible rows (default: 4)
 *   ...rest               — forwarded to the underlying <textarea> (value, onChange, placeholder, etc.)
 */
import React, { forwardRef } from 'react';

const PolySafeTextarea = forwardRef(function PolySafeTextarea(
  { className = '', error = false, rows = 4, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={[
        'input-field',
        error ? 'input-error' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
});

export default PolySafeTextarea;
