// src/components/Meter.jsx
// Linear animated progress bar with threshold ticks.
// Used for ACB score, organ toxicity, etc.
import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from 'framer-motion';

export default function Meter({
  value = 0,        // current value
  max = 3,          // maximum (ACB typically 3+)
  label,
  sublabel,
  ticks,            // [{value, label}] — threshold markers
  colorByValue,     // fn(value, max) => color string; defaults to ACB scale
  className,
  showValue = true,
  critical,         // value threshold that triggers critical style
  warn,             // value threshold that triggers caution style
}) {
  const shouldReduce = useReducedMotion();
  const [width, setWidth] = useState(shouldReduce ? Math.min(value / max, 1) * 100 : 0);

  useEffect(() => {
    if (shouldReduce) {
      setWidth(Math.min(value / max, 1) * 100);
      return;
    }
    const t = setTimeout(() => {
      setWidth(Math.min(value / max, 1) * 100);
    }, 50);
    return () => clearTimeout(t);
  }, [value, max, shouldReduce]);

  const getColor = colorByValue
    ? colorByValue(value, max)
    : value >= (critical ?? max)
    ? 'var(--critical-fg)'
    : value >= (warn ?? max * 0.6)
    ? 'var(--caution-fg)'
    : 'var(--safe-fg)';

  const getBg = () => {
    if (value >= (critical ?? max)) return 'var(--critical-bg)';
    if (value >= (warn ?? max * 0.6)) return 'var(--caution-bg)';
    return 'var(--safe-bg)';
  };

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)]">
              {label}
            </span>
          )}
          {showValue && (
            <span
              className="text-sm font-bold font-[var(--font-mono)]"
              style={{ color: getColor }}
            >
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="ps-meter-track">
          <div
            className="ps-meter-fill"
            style={{
              width: `${width}%`,
              backgroundColor: getColor,
              transition: shouldReduce ? 'none' : 'width 600ms cubic-bezier(.16,1,.3,1)',
            }}
          />
        </div>
        {/* Threshold ticks */}
        {ticks?.map((tick) => {
          const pos = Math.min(tick.value / max, 1) * 100;
          return (
            <div
              key={tick.value}
              className="absolute top-0 bottom-0 w-px bg-[var(--border-strong)]"
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

// ACB-specific convenience
export function ACBMeter({ value = 0, className }) {
  return (
    <Meter
      value={value}
      max={4}
      label="Anticholinergic Burden"
      ticks={[
        { value: 0, label: '0 Normal' },
        { value: 2, label: '1–2 Moderate' },
        { value: 3, label: '3+ Critical' },
      ]}
      warn={1}
      critical={3}
      sublabel="AGS Beers 2024 — Risk of delirium, falls, cognitive decline"
      className={className}
    />
  );
}
