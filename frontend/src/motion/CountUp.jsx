/**
 * src/motion/CountUp.jsx
 * Accessible Numeral Count-Up Animation
 *
 * Smooth numeral count-up for statistics, ACB scores, and harm indicators.
 * - Uses requestAnimationFrame with cubic ease-out.
 * - Uses font-variant-numeric: tabular-nums to prevent visual jitter.
 * - Respects prefers-reduced-motion: snaps immediately to final value.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function CountUp({
  value = 0,
  from = 0,
  duration = 0.75, // in seconds
  decimals = 0,
  prefix = '',
  suffix = '',
  formatter,
  className = '',
  ariaLabel,
}) {
  const isReduced = useReducedMotion();
  const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
  const numericFrom = typeof from === 'number' ? from : parseFloat(from) || 0;

  const [displayValue, setDisplayValue] = useState(isReduced ? numericTarget : numericFrom);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isReduced) {
      setDisplayValue(numericTarget);
      return;
    }

    const durationMs = duration * 1000;
    const startVal = numericFrom;
    const endVal = numericTarget;

    function step(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    }

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [numericTarget, numericFrom, duration, isReduced]);

  const formattedNum = formatter
    ? formatter(displayValue)
    : decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString();

  return (
    <span
      className={`tabular-nums font-[var(--font-mono)] ${className}`}
      aria-label={ariaLabel || `${prefix}${numericTarget}${suffix}`}
    >
      {prefix}
      {formattedNum}
      {suffix}
    </span>
  );
}

export default CountUp;
