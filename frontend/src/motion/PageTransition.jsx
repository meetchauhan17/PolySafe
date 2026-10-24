/**
 * src/motion/PageTransition.jsx
 * PolySafe Route Page Transition
 *
 * Requirements:
 * - Standard: fade + 10px rise + slight blur-in, 260ms ease-emph
 * - Reduced Motion: 100ms pure opacity fade, no movement, no blur
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { pageTransitionVariants } from './presets';

export default function PageTransition({
  children,
  className = '',
  layoutId,
  ...props
}) {
  const isReduced = useReducedMotion();

  return (
    <motion.div
      variants={pageTransitionVariants}
      custom={isReduced}
      initial="initial"
      animate="animate"
      exit="exit"
      layoutId={layoutId}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
