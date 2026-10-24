/**
 * src/motion/HoverLift.jsx
 * Gentle Elevation Lift on Hover
 *
 * Requirements:
 * - Subtle elevation lift (y: -2px) with smooth spring/ease.
 * - Disabled completely under prefers-reduced-motion.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

export function HoverLift({
  children,
  className = '',
  y = -2,
  as = 'div',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      whileHover={
        isReduced
          ? undefined
          : {
              y,
              transition: {
                duration: 0.18,
                ease: [0.16, 1, 0.3, 1],
              },
            }
      }
      whileTap={isReduced ? undefined : { y: 0 }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export default HoverLift;
