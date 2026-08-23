import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PageTransition.jsx — Mechanical spring transition wrapper for route changes.
 */
export default function PageTransition({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: shouldReduceMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: [0.175, 0.885, 0.32, 1.275], // mechanical spring easing curve
      },
    },
    exit: shouldReduceMotion
      ? { opacity: 1, y: 0 }
      : {
          opacity: 0,
          y: -8,
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
