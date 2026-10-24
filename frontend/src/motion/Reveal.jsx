/**
 * src/motion/Reveal.jsx
 * Scroll-Triggered Reveal Component (runs once)
 *
 * Requirements:
 * - Triggers when scrolled into view (once: true).
 * - Standard: 12px rise + opacity fade, 350ms ease-emph.
 * - Reduced motion: 100ms pure opacity fade, no translateY.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { revealVariants } from './presets';

export function Reveal({
  children,
  className = '',
  delay = 0,
  margin = '-30px',
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      variants={revealVariants}
      custom={isReduced}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
