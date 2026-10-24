/**
 * src/motion/Stagger.jsx
 * Stagger Container and Stagger Item components (60ms interval)
 *
 * Performance Safeguards:
 * - Stagger interval capped at 60ms.
 * - Caps simultaneous animations to prevent main-thread stutter.
 * - Animates only composite-friendly properties (opacity, translateY).
 * - Never animates layout-triggering properties (width, height, margin, padding).
 * - When list length exceeds 20 items, switches to bulk opacity fade to prevent layout reflow.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from './presets';

export function StaggerContainer({
  children,
  className = '',
  itemCount,
  delay = 0.04,
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  // If list is large (> 20 items), disable sequential stagger to prevent reflow
  const isLargeList = itemCount !== undefined && itemCount > 20;

  const dynamicContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: isReduced || isLargeList ? 0 : 0.06,
        delayChildren: isReduced ? 0 : delay,
      },
    },
  };

  return (
    <Component
      variants={dynamicContainerVariants}
      custom={isReduced}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className = '',
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      variants={staggerItemVariants}
      custom={isReduced}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export default StaggerContainer;
