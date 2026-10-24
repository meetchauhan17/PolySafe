import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CountUp } from '../motion/CountUp';
import Sparkline from '../charts/Sparkline';

/**
 * Editorial StatTile.
 * Features:
 * - Big Fraunces numeral with count-up
 * - Small-caps label
 * - Delta indicator with trend arrow
 * - Lightweight inline SVG sparkline
 */
export default function StatTile({
  value,
  label,
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral'
  deltaLabel,
  sparklineData,
  prefix,
  suffix,
  hint,
  icon,
  variant = 'inset', // 'inset' | 'raised' | 'outlined'
  className,
  ...props
}) {
  const numericVal = typeof value === 'number' ? value : parseFloat(value);
  const isPureNumber = !isNaN(numericVal) && typeof value === 'number';

  // Count-up animation
  const [displayVal, setDisplayVal] = useState(isPureNumber ? 0 : value);

  useEffect(() => {
    if (!isPureNumber) {
      setDisplayVal(value);
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayVal(value);
      return;
    }

    let start = 0;
    const duration = 600; // ms
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (numericVal - start) * easeProgress);

      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setDisplayVal(numericVal);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value, isPureNumber, numericVal]);

  // Delta styling
  const deltaStyles = {
    positive: 'text-[var(--safe-ink)] bg-[var(--safe-bg)] border-[var(--safe-fg)]/25',
    negative: 'text-[var(--critical-ink)] bg-[var(--critical-bg)] border-[var(--critical-fg)]/25',
    neutral:  'text-[var(--ink-2)] bg-[var(--canvas-2)] border-[var(--border)]',
  };

  const DeltaIcon = deltaType === 'positive' ? TrendingUp : deltaType === 'negative' ? TrendingDown : Minus;

  // Mini Sparkline SVG
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    return (
      <Sparkline
        data={sparklineData}
        width={80}
        height={24}
        status={deltaType === 'negative' ? 'critical' : deltaType === 'positive' ? 'safe' : null}
        label={`${label} trend`}
      />
    );
  };

  const variantClasses = {
    inset:    'card-inset',
    raised:   'card-raised',
    outlined: 'card-outlined',
    paper:    'card-paper',
  };

  return (
    <div
      className={clsx(
        'p-5 rounded-[var(--radius-lg)] flex flex-col justify-between gap-3',
        variantClasses[variant] || 'card-inset',
        className
      )}
      {...props}
    >
      {/* Top row: Label & optional icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-[var(--font-heading)]">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--ink-3)] flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      {/* Middle row: Big Fraunces Numeral */}
      <div className="flex items-baseline gap-1 my-0.5">
        {prefix && <span className="font-[var(--font-heading)] text-lg text-[var(--ink-3)] font-semibold">{prefix}</span>}
        <span className="font-[var(--font-heading)] text-3xl sm:text-4xl font-bold text-[var(--ink)] tracking-tight leading-none">
          {isPureNumber ? <CountUp value={numericVal} duration={0.6} /> : displayVal}
        </span>
        {suffix && <span className="font-[var(--font-heading)] text-base text-[var(--ink-3)] font-semibold ml-0.5">{suffix}</span>}
      </div>

      {/* Bottom row: Delta & Sparkline */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60">
        {delta ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold font-mono border',
              deltaStyles[deltaType] || deltaStyles.neutral
            )}
            title={deltaLabel || delta}
          >
            <DeltaIcon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span>{delta}</span>
          </span>
        ) : hint ? (
          <span className="text-xs text-[var(--ink-3)] truncate">{hint}</span>
        ) : <div />}

        {renderSparkline()}
      </div>
    </div>
  );
}

export { StatTile };
