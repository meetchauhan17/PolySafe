/**
 * src/motion/Pressable.jsx
 * Tactile Feedback Press Wrapper
 *
 * Requirements:
 * - Subtle scale(.98) tactile compression on active/press.
 * - Respects prefers-reduced-motion: disables scaling.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

export function Pressable({
  children,
  className = '',
  scale = 0.98,
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      whileTap={isReduced ? undefined : { scale }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.5,
      }}
      className={`inline-block select-none ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Pressable;
