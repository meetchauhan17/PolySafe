/**
 * frontend/src/charts/Gauge.jsx
 *
 * Unified Overlay — Semi-Circle Clinical Organ Toxicity Gauge
 * ─────────────────────────────────────────────────────────────────────────────
 * • Semi-circle gauge (180° radial sweep) designed for doctor radar tab & toxicity profiles
 * • Layered track with soft inner shadow and high-contrast animated indicator arc
 * • End-cap dot on the current score
 * • Color-coded threshold segments:
 *     - 0–49:   Safe / Minimal (var(--safe-fg, #16A34A))
 *     - 50–69:  Moderate Clearance (var(--caution-fg, #D97706))
 *     - 70–100: Critical Vulnerability (var(--critical-fg, #DC2626))
 * • Center CountUp score with threshold tick marks (0, 50, 70, 100)
 * • Screen reader accessible: role="meter", aria-valuenow, aria-valuemin, aria-valuemax
 */

import React, { useEffect, useRef, useState, useId } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';
import { CountUp } from '../motion/CountUp';

export default function Gauge({
  value = 50, // 0 to 100
  min = 0,
  max = 100,
  size = 180,
  strokeWidth = 14,
  label = 'Organ Clearance',
  sublabel = 'Filtration load',
  criticalThreshold = 70,
  warnThreshold = 50,
  className = '',
  animate = true,
}) {
  const reduce = useReducedMotion();
  const filterId = useId();

  const [displayed, setDisplayed] = useState(reduce ? value : 0);
  const raf = useRef(null);

  // Clamp value
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min || 1);

  // Animation hook
  useEffect(() => {
    if (reduce || !animate) {
      setDisplayed(clamped);
      return;
    }
    const start = performance.now();
    const duration = 750;
    const from = 0;
    const to = clamped;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayed(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [clamped, animate, reduce]);

  // Dimensions for 180 degree semi-circle
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = (size - strokeWidth * 2) / 2;
  const semiCirc = Math.PI * r; // half circumference

  // Tier color mapping
  const isCritical = clamped >= criticalThreshold;
  const isWarn = clamped >= warnThreshold && !isCritical;

  const color = isCritical
    ? 'var(--critical-fg, #DC2626)'
    : isWarn
    ? 'var(--caution-fg, #D97706)'
    : 'var(--safe-fg, #16A34A)';

  const tierText = isCritical
    ? 'Critical Load'
    : isWarn
    ? 'Moderate Clearance'
    : 'Optimal Clearance';

  // Current angle for end-cap dot (from -180 deg to 0 deg)
  const currentRatio = reduce || !animate ? ratio : (displayed - min) / (max - min || 1);
  const angleRad = Math.PI * (1 - currentRatio);
  const dotX = cx - r * Math.cos(angleRad);
  const dotY = cy - r * Math.sin(angleRad);

  return (
    <div
      className={clsx('flex flex-col items-center select-none font-sans', className)}
      role="meter"
      aria-label={`${label}: ${clamped} out of ${max} (${tierText})`}
      aria-valuenow={clamped}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg
          width={size}
          height={size * 0.65}
          viewBox={`0 0 ${size} ${size * 0.65}`}
          className="overflow-visible"
        >
          <defs>
            {/* Soft inner track drop-shadow */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(22,33,44,0.18)" />
            </filter>
          </defs>

          {/* Background Darker Track with slight 3D inner inset feel */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="var(--surface-2, #E2E8F0)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={`url(#${filterId})`}
          />

          {/* Threshold Zone Marker Line for Critical (at 70%) */}
          {criticalThreshold && (
            <line
              x1={cx - (r + strokeWidth * 0.5) * Math.cos(Math.PI * (1 - criticalThreshold / 100))}
              y1={cy - (r + strokeWidth * 0.5) * Math.sin(Math.PI * (1 - criticalThreshold / 100))}
              x2={cx - (r - strokeWidth * 0.5) * Math.cos(Math.PI * (1 - criticalThreshold / 100))}
              y2={cy - (r - strokeWidth * 0.5) * Math.sin(Math.PI * (1 - criticalThreshold / 100))}
              stroke="var(--paper, #FFFFFF)"
              strokeWidth="2.5"
            />
          )}

          {/* Animated Arc (Lighter foreground sweep) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={semiCirc}
            strokeDashoffset={semiCirc * (1 - currentRatio)}
            style={{
              transition: reduce ? 'none' : 'stroke-dashoffset 750ms cubic-bezier(.16,1,.3,1)',
            }}
          />

          {/* End-Cap Indicator Dot */}
          {currentRatio > 0.02 && (
            <g transform={`translate(${dotX}, ${dotY})`}>
              {isCritical && !reduce && (
                <circle r={strokeWidth * 0.6} fill={color} opacity={0.35} className="animate-ping" />
              )}
              <circle
                r={strokeWidth * 0.38}
                fill="var(--paper, #FFFFFF)"
                stroke={color}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Threshold tick labels */}
          <text x={cx - r} y={cy + 16} fontSize="10" fill="var(--ink-4)" textAnchor="middle" fontFamily="var(--font-mono)">
            0
          </text>
          <text x={cx} y={cy - r - 6} fontSize="9" fill="var(--ink-4)" textAnchor="middle" fontFamily="var(--font-mono)">
            50
          </text>
          <text x={cx + r} y={cy + 16} fontSize="10" fill="var(--ink-4)" textAnchor="middle" fontFamily="var(--font-mono)">
            100
          </text>
        </svg>

        {/* Center Score & CountUp */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight"
              style={{ color }}
            >
              <CountUp value={clamped} decimals={0} duration={0.75} />
            </span>
            <span className="text-[11px] font-bold text-[var(--ink-3)] font-mono">/100</span>
          </div>
          <span
            className={clsx(
              'text-[10px] font-bold uppercase tracking-wider font-mono mt-0.5 px-2 py-0.2 rounded-full border',
              isCritical
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : isWarn
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            )}
          >
            {tierText}
          </span>
        </div>
      </div>

      {/* Label and Sublabel */}
      {(label || sublabel) && (
        <div className="text-center mt-3 space-y-0.5">
          {label && (
            <h4 className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
              {label}
            </h4>
          )}
          {sublabel && (
            <p className="text-[11px] text-[var(--ink-3)] leading-tight max-w-[160px]">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
