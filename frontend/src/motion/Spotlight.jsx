/**
 * src/motion/Spotlight.jsx
 * Pointer-Tracking Spotlight Container (desktop only)
 *
 * Requirements:
 * - Subtle coral radial glow following the pointer on hero areas only, desktop only.
 * - Tracks pointer position and sets --spotlight-x, --spotlight-y, --spotlight-opacity.
 * - Disabled completely under prefers-reduced-motion or touch devices.
 */

import React, { useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function Spotlight({
  children,
  className = '',
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const containerRef = useRef(null);
  const Component = as;

  const handleMouseMove = (e) => {
    if (isReduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty('--spotlight-x', `${x}px`);
    containerRef.current.style.setProperty('--spotlight-y', `${y}px`);
    containerRef.current.style.setProperty('--spotlight-opacity', '1');
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty('--spotlight-opacity', '0');
  };

  return (
    <Component
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Spotlight;
