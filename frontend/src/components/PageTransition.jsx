import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PageTransition.jsx
 *
 * Smooth fade + upward slide transition wrapper for route changes.
 * Strictly respects user's prefers-reduced-motion OS accessibility settings.
 *
 * - Standard: opacity 0 -> 1, y 10px -> 0, duration 250ms
 * - Reduced Motion: duration 0ms, instant display
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: [0.25, 1, 0.5, 1], // Smooth cubic-bezier curve
      },
    },
    exit: shouldReduceMotion
      ? { opacity: 1, y: 0 }
      : {
          opacity: 0,
          y: -6,
          transition: {
            duration: 0.15,
            ease: 'easeIn',
          },
        },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
