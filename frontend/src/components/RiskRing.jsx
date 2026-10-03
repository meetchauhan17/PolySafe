// src/components/RiskRing.jsx
// Animated SVG ring 1–5 with center score and label.
// Used on HomePage (StatusHero) and RiskAnalysisPage.
import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from 'framer-motion';

const RING_R = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

function scoreToColor(score) {
  if (score <= 1) return 'var(--harm-l1)';
  if (score <= 2) return 'var(--harm-l2)';
  if (score <= 3) return 'var(--harm-l3)';
  if (score <= 4) return 'var(--harm-l4)';
  return 'var(--harm-l5)';
}

function scoreToLabel(score) {
  if (score <= 1) return 'Minimal';
  if (score <= 2) return 'Low';
  if (score <= 3) return 'Moderate';
  if (score <= 4) return 'High';
  return 'Critical';
}

export default function RiskRing({
  score = 1,        // 1 to 5 float
  maxScore = 5,
  size = 140,
  label,
  sublabel,
  className,
  animate = true,
}) {
  const shouldReduce = useReducedMotion();
  const [displayed, setDisplayed] = useState(shouldReduce ? score : 0);
  const raf = useRef(null);

  const ratio = Math.min(Math.max(score / maxScore, 0), 1);
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const color = scoreToColor(score);
  const statusLabel = scoreToLabel(score);

  useEffect(() => {
    if (shouldReduce || !animate) {
      setDisplayed(score);
      return;
    }
    const start = performance.now();
    const duration = 600;
    const from = 0;
    const to = score;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayed(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score, animate, shouldReduce]);

  const strokeWidth = 10;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - strokeWidth / 2 - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(score / maxScore, 0), 1));

  return (
    <div
      className={clsx('inline-flex flex-col items-center gap-2', className)}
      role="img"
      aria-label={`Risk score ${score.toFixed(1)} out of ${maxScore}: ${statusLabel}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={shouldReduce || !animate ? offset : circ * (1 - (displayed / maxScore))}
            style={{
              transition: shouldReduce ? 'none' : `stroke-dashoffset 600ms cubic-bezier(.16,1,.3,1)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[var(--ink)] font-extrabold leading-none font-[var(--font-mono)]"
            style={{ fontSize: size * 0.18 }}
          >
            {displayed.toFixed(1)}
          </span>
          <span
            className="text-[var(--ink-3)] font-semibold mt-0.5"
            style={{ fontSize: size * 0.1 }}
          >
            / {maxScore}
          </span>
        </div>
      </div>
      {(label || sublabel) && (
        <div className="text-center">
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
