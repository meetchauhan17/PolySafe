/**
 * src/motion/DrawLine.jsx
 * SVG Stroke-Dashoffset 700ms Animation
 *
 * Requirements:
 * - Animates SVG paths, circles, and lines using pathLength/stroke-dashoffset over 700ms.
 * - Easing: [0.16, 1, 0.3, 1] (ease-emph).
 * - Reduced motion guard: sets pathLength to 1 immediately and fades in over 100ms.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { EASE_EMPH } from './presets';

/**
 * Animated SVG stroke element (line, path, or circle).
 */
export function DrawLine({
  as = 'path',
  duration = 0.7, // 700ms
  delay = 0,
  stroke = 'currentColor',
  strokeWidth = 2,
  strokeLinecap = 'round',
  className = '',
  ...props
}) {
  const isReduced = useReducedMotion();
  const Component = motion[as] || motion.path;

  const drawVariants = {
    hidden: isReduced
      ? { opacity: 0 }
      : { pathLength: 0, opacity: 0 },
    visible: isReduced
      ? {
          opacity: 1,
          transition: { duration: 0.1, delay },
        }
      : {
          pathLength: 1,
          opacity: 1,
          transition: {
            pathLength: {
              duration,
              delay,
              ease: EASE_EMPH,
            },
            opacity: { duration: 0.15, delay },
          },
        },
  };

  return (
    <Component
      variants={drawVariants}
      initial="hidden"
      animate="visible"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      className={className}
      {...props}
    />
  );
}

/**
 * Animated standalone SVG horizontal/vertical rule.
 * Useful for dividers, timeline rules, and charts.
 */
export function DrawDivider({
  orientation = 'horizontal',
  length = '100%',
  thickness = 2,
  color = 'var(--border)',
  duration = 0.7,
  delay = 0,
  className = '',
}) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <svg
      width={isHorizontal ? length : thickness}
      height={isHorizontal ? thickness : length}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <DrawLine
        as="line"
        x1={0}
        y1={0}
        x2={isHorizontal ? '100%' : 0}
        y2={isHorizontal ? 0 : '100%'}
        stroke={color}
        strokeWidth={thickness}
        duration={duration}
        delay={delay}
      />
    </svg>
  );
}

export default DrawLine;
