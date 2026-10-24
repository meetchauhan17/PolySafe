/**
 * frontend/src/components/Meter.jsx
 *
 * Unified Overlay — Clinical Progress & Segmented ACB Meter
 * ─────────────────────────────────────────────────────────────────────────────
 * • Meter: Continuous linear animated progress bar with threshold ticks
 * • ACBMeter: Segmented 4-tier bar (0, 1, 2, 3+) with:
 *     - Segmented blocks with threshold ticks at 0 / 1 / 2 / 3
 *     - Animated sliding marker indicating exact ACB tier position
 *     - Design token tier colors (Safe emerald, Brand cyan, Caution amber, Critical rose)
 * • Screen reader accessible (role="meter", aria-valuenow, aria-valuemin, aria-valuemax)
 */

import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../motion/useReducedMotion';
import { CountUp } from '../motion/CountUp';

export default function Meter({
  value = 0,
  max = 3,
  label,
  sublabel,
  ticks,
  colorByValue,
  className,
  showValue = true,
  critical,
  warn,
}) {
  const shouldReduce = useReducedMotion();
  const [width, setWidth] = useState(shouldReduce ? Math.min(value / max, 1) * 100 : 0);
  const [displayedValue, setDisplayedValue] = useState(shouldReduce ? value : 0);
  const raf = useRef(null);

  useEffect(() => {
    if (shouldReduce) {
      setWidth(Math.min(value / max, 1) * 100);
      setDisplayedValue(value);
      return;
    }
    const t = setTimeout(() => {
      setWidth(Math.min(value / max, 1) * 100);
    }, 50);

    const start = performance.now();
    const duration = 700;
    const from = 0;
    const to = value;
    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3);
      setDisplayedValue(from + (to - from) * ease);
      if (elapsed < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);

    return () => {
      clearTimeout(t);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, max, shouldReduce]);

  const isCritical = value >= (critical ?? max);

  const getColor = colorByValue
    ? colorByValue(value, max)
    : isCritical
    ? 'var(--critical-fg, #DC2626)'
    : value >= (warn ?? max * 0.6)
    ? 'var(--caution-fg, #D97706)'
    : 'var(--safe-fg, #16A34A)';

  const isInt = Number.isInteger(value);

  return (
    <div
      className={clsx(
        'flex flex-col gap-2 transition-all font-sans',
        isCritical && !shouldReduce && 'animate-critical-pulse',
        className
      )}
      role="meter"
      aria-label={`${label || 'Metric'}: ${value} of ${max}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)] flex items-center gap-1.5">
              <span>{label}</span>
              {isCritical && (
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
          )}
          {showValue && (
            <span
              className={clsx(
                'text-sm font-bold font-mono transition-all',
                isCritical && 'scale-105'
              )}
              style={{ color: getColor }}
            >
              <CountUp value={value} decimals={isInt ? 0 : 1} duration={0.7} /> / {max}
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div className="relative">
        <div className="h-3 w-full rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden shadow-2xs">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${width}%`,
              backgroundColor: getColor,
              transition: shouldReduce ? 'none' : 'width 700ms cubic-bezier(.16,1,.3,1)',
            }}
          />
        </div>

        {/* Ticks */}
        {ticks?.map((tick) => {
          const pos = Math.min(tick.value / max, 1) * 100;
          return (
            <div
              key={tick.value}
              className="absolute top-0 bottom-0 w-px bg-[var(--paper)]"
              style={{ left: `${pos}%` }}
              aria-hidden
            />
          );
        })}
      </div>

      {(sublabel || ticks) && (
        <div className="flex justify-between text-[11px] text-[var(--ink-3)] font-[var(--font-heading)]">
          {sublabel && <span>{sublabel}</span>}
          {ticks?.map((tick) => (
            <span key={tick.value}>{tick.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACB-Specific Segmented Meter (0, 1, 2, 3+)
// ─────────────────────────────────────────────────────────────────────────────
const ACB_TIERS = [
  { level: 0, label: '0 Normal',   status: 'Safe',     color: 'var(--safe-fg, #16A34A)',     bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
  { level: 1, label: '1 Mild',     status: 'Low',      color: 'var(--brand-600, #0E7490)',   bg: 'bg-cyan-500/15',    text: 'text-cyan-700 dark:text-cyan-300' },
  { level: 2, label: '2 Moderate', status: 'Moderate', color: 'var(--caution-fg, #D97706)', bg: 'bg-amber-500/15',   text: 'text-amber-700 dark:text-amber-300' },
  { level: 3, label: '3+ Critical',status: 'Critical', color: 'var(--critical-fg, #DC2626)',bg: 'bg-rose-500/20',    text: 'text-rose-700 dark:text-rose-300' },
];

export function ACBMeter({
  value = 0,
  className = '',
  label = 'Anticholinergic Cognitive Burden (ACB)',
  sublabel = 'Beers 2023 · Risk of delirium, memory impairment & falls',
}) {
  const shouldReduce = useReducedMotion();
  const clamped = Math.min(Math.max(value, 0), 3);
  const activeTier = ACB_TIERS[clamped] || ACB_TIERS[3];

  return (
    <div
      className={clsx('space-y-3 font-sans select-none', className)}
      role="meter"
      aria-label={`${label}: Score ${value} (${activeTier.label})`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
            <span>{label}</span>
            {value >= 3 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                CRITICAL
              </span>
            )}
          </h4>
          {sublabel && (
            <p className="text-[11px] text-[var(--ink-3)] leading-relaxed mt-0.5">
              {sublabel}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <span
            className="text-lg font-black font-mono leading-none tracking-tight"
            style={{ color: activeTier.color }}
          >
            <CountUp value={value} decimals={0} duration={0.65} />
            <span className="text-xs font-bold text-[var(--ink-3)] font-mono ml-0.5">/ 3+</span>
          </span>
          <span
            className={clsx(
              'block text-[10px] font-mono font-bold uppercase tracking-wider',
              activeTier.text
            )}
          >
            {activeTier.status} Risk
          </span>
        </div>
      </div>

      {/* Segmented Bar with Sliding Indicator Bead */}
      <div className="relative pt-2 pb-1">
        {/* Animated Sliding Marker Bead */}
        <div className="relative h-2 mb-1.5">
          <motion.div
            initial={shouldReduce ? false : { left: '0%' }}
            animate={{ left: `${(clamped / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute -top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-[var(--paper)] shadow-md transition-colors"
              style={{ backgroundColor: activeTier.color }}
            />
            <div
              className="w-1 h-1.5 -mt-0.5"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `5px solid ${activeTier.color}`,
              }}
            />
          </motion.div>
        </div>

        {/* 4 Segmented Blocks */}
        <div className="grid grid-cols-4 gap-1.5 h-3.5">
          {ACB_TIERS.map((tier) => {
            const isFilled = value >= tier.level;
            return (
              <div
                key={tier.level}
                className={clsx(
                  'h-full rounded-md border transition-all duration-300 relative overflow-hidden',
                  isFilled
                    ? 'border-transparent shadow-2xs'
                    : 'bg-[var(--surface-2)] border-[var(--border)] opacity-60'
                )}
                style={{
                  backgroundColor: isFilled ? tier.color : undefined,
                }}
              />
            );
          })}
        </div>

        {/* Threshold Ticks & Text Labels */}
        <div className="grid grid-cols-4 gap-1.5 pt-1.5 text-[10px] font-mono text-[var(--ink-3)] text-center">
          {ACB_TIERS.map((tier) => (
            <div key={tier.level} className="flex flex-col items-center">
              <span className="font-bold text-[var(--ink-2)]">{tier.level}</span>
              <span className="text-[9px] text-[var(--ink-4)] uppercase tracking-tight">
                {tier.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
