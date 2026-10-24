/**
 * frontend/src/components/RiskRing.jsx
 *
 * Unified Overlay — Layered 3D Clinical Risk Ring
 * ─────────────────────────────────────────────────────────────────────────────
 * • Layered ring with soft inner shadow for a tactile, slight 3D look
 * • Darker background track with inset elevation
 * • Lighter animated arc (DrawLine spring-dashoffset animation)
 * • Small end-cap dot positioned dynamically at the arc tip
 * • Tier color from design tokens (Safe = emerald, Caution = amber, Critical = vermilion)
 * • CountUp center display with accessible aria-label summaries
 */

import React, { useEffect, useRef, useState, useId } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';
import { CountUp } from '../motion/CountUp';

function scoreToColor(score) {
  if (score <= 1) return 'var(--safe-fg, #16A34A)';
  if (score <= 2) return 'var(--brand-600, #0E7490)';
  if (score <= 3) return 'var(--caution-fg, #D97706)';
  if (score <= 4) return 'var(--accent-500, #FF5C35)';
  return 'var(--critical-fg, #DC2626)';
}

function scoreToLabel(score) {
  if (score <= 1) return 'Minimal Risk';
  if (score <= 2) return 'Low Risk';
  if (score <= 3) return 'Moderate Precaution';
  if (score <= 4) return 'High Vigilance';
  return 'Critical Pharmacological Risk';
}

export default function RiskRing({
  score = 1,        // 1 to 5 float or numeric string
  maxScore = 5,
  size = 140,
  label,
  sublabel,
  className,
  animate = true,
  strokeWidth = 10,
}) {
  const shouldReduce = useReducedMotion();
  const filterId = useId();

  const numericScore = typeof score === 'number' ? (Number.isNaN(score) ? 1 : score) : (parseFloat(score) || 1);

  const [displayed, setDisplayed] = useState(shouldReduce ? numericScore : 0);
  const raf = useRef(null);

  const ratio = Math.min(Math.max(numericScore / maxScore, 0), 1);
  const color = scoreToColor(numericScore);
  const statusLabel = scoreToLabel(numericScore);
  const isCritical = numericScore >= 4 || String(label || statusLabel).toLowerCase().includes('critical');

  useEffect(() => {
    if (shouldReduce || !animate) {
      setDisplayed(numericScore);
      return;
    }
    const start = performance.now();
    const duration = 750;
    const from = 0;
    const to = numericScore;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayed(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [numericScore, animate, shouldReduce]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - strokeWidth / 2 - 4;
  const circ = 2 * Math.PI * r;

  const currentRatio = shouldReduce || !animate ? ratio : Math.min(Math.max(displayed / maxScore, 0), 1);
  const offset = circ * (1 - currentRatio);

  // Calculate coordinates for the small end-cap dot
  // Starts at top (-90 degrees / -PI/2) and sweeps clockwise by (2 * PI * currentRatio)
  const angle = -Math.PI / 2 + 2 * Math.PI * currentRatio;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);

  return (
    <div
      className={clsx(
        'inline-flex flex-col items-center gap-2 transition-all select-none font-sans',
        isCritical && !shouldReduce && 'animate-critical-pulse',
        className
      )}
      role="img"
      aria-label={`Polypharmacy risk score ${numericScore.toFixed(1)} out of ${maxScore}: ${statusLabel}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className={clsx(
            'overflow-visible transition-all',
            isCritical && 'drop-shadow-[0_0_16px_rgba(220,38,38,0.3)]'
          )}
        >
          <defs>
            {/* Soft inner track drop-shadow for layered 3D depth */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(22,33,44,0.18)" />
            </filter>
          </defs>

          {/* 1. Darker Track with soft inner shadow */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--surface-2, #E2E8F0)"
            strokeWidth={strokeWidth}
            filter={`url(#${filterId})`}
          />

          {/* 2. Lighter Animated Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: shouldReduce ? 'none' : 'stroke-dashoffset 750ms cubic-bezier(.16,1,.3,1)',
            }}
          />

          {/* 3. Small End-Cap Dot positioned at the tip of the arc */}
          {currentRatio > 0.02 && (
            <g transform={`translate(${dotX}, ${dotY})`}>
              {isCritical && !shouldReduce && (
                <circle
                  r={strokeWidth * 0.65}
                  fill={color}
                  opacity={0.35}
                  className="animate-ping"
                />
              )}
              <circle
                r={strokeWidth * 0.4}
                fill="var(--paper, #FFFFFF)"
                stroke={color}
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Center Display: Big Fraunces numeral with CountUp */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-[var(--ink)] font-black leading-none font-mono tracking-tight"
            style={{ fontSize: size * 0.22 }}
          >
            <CountUp value={numericScore} decimals={1} duration={0.75} />
          </span>
          <span
            className="text-[var(--ink-3)] font-semibold mt-0.5 font-mono"
            style={{ fontSize: size * 0.09 }}
          >
            / {maxScore}
          </span>
        </div>
      </div>

      {/* Label and Sublabel */}
      {(label || sublabel) && (
        <div className="text-center space-y-0.5">
          {label && (
            <p
              className="font-bold font-[var(--font-heading)] leading-snug"
              style={{ color, fontSize: '0.875rem' }}
            >
              {label || statusLabel}
            </p>
          )}
          {sublabel && (
            <p className="text-xs text-[var(--ink-3)] mt-0.5">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
