/**
 * src/motion/Magnetic.jsx
 * Pointer-Attracted Magnetic Hover Effect
 *
 * Requirements:
 * - Subtle pointer-attraction hover for primary pill buttons.
 * - Maximum displacement: capped at 6px.
 * - Desktop fine-pointer only (@media (hover: hover) and (pointer: fine)).
 * - Smooth bounce-free spring return on mouse leave.
 * - Disabled completely under prefers-reduced-motion.
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { SPRINGS } from './presets';

export function Magnetic({
  children,
  className = '',
  maxOffset = 6, // max 6px offset per prompt
  strength = 0.25,
  ...props
}) {
  const isReduced = useReducedMotion();
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHoverSupported, setIsHoverSupported] = useState(false);

  useEffect(() => {
    // Only enable magnetic pointer attraction on desktop fine-pointer devices
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsHoverSupported(mq.matches);

      const handler = (e) => setIsHoverSupported(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  const handleMouseMove = (e) => {
    if (isReduced || !isHoverSupported || !ref.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (clientX - centerX) * strength;
    const deltaY = (clientY - centerY) * strength;

    // Cap at maxOffset
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (isReduced || !isHoverSupported) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={SPRINGS.magnetic}
      className={`inline-block ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Magnetic;
