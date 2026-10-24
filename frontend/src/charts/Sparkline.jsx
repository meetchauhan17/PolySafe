/**
 * frontend/src/charts/Sparkline.jsx
 *
 * Unified Overlay — Compact Sparkline Component (No Axes)
 * ─────────────────────────────────────────────────────────────────────────────
 * • Ultra-lightweight SVG sparkline designed for StatTiles and doctor patient lists
 * • Smooth cubic-bezier or polyline rendering with area gradient fill
 * • Pulsing / glowing end-cap dot on the latest value
 * • Full theme responsiveness (CSS variables for stroke & fill)
 * • Screen reader accessible (role="img" with descriptive trend aria-label)
 */

import React, { useId, useMemo } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';

export default function Sparkline({
  data = [],
  width = 96,
  height = 28,
  color = 'var(--brand-600, #0E7490)',
  gradientFrom = color,
  gradientTo = 'transparent',
  strokeWidth = 2,
  showEndDot = true,
  className = '',
  label = 'Trend sparkline',
  status = null, // 'critical' | 'caution' | 'safe'
}) {
  const gradientId = useId();
  const reduce = useReducedMotion();

  // Normalize data points to numeric array
  const points = useMemo(() => {
    if (!data || data.length === 0) return [10, 10];
    return data.map((d) => (typeof d === 'number' ? d : d.value ?? 0));
  }, [data]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const len = points.length;

  // Calculate SVG coordinates with 3px vertical padding
  const padY = 4;
  const drawHeight = height - padY * 2;

  const coords = useMemo(() => {
    return points.map((val, idx) => {
      const x = (idx / (len - 1 || 1)) * (width - 6) + 3;
      const y = height - padY - ((val - min) / range) * drawHeight;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val };
    });
  }, [points, len, width, height, padY, drawHeight, min, range]);

  const polylinePoints = useMemo(() => {
    return coords.map((c) => `${c.x},${c.y}`).join(' ');
  }, [coords]);

  // Closed path polygon for area gradient
  const polygonPoints = useMemo(() => {
    if (coords.length < 2) return '';
    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    return `${polylinePoints} ${lastX},${height} ${firstX},${height}`;
  }, [polylinePoints, coords, height]);

  const lastCoord = coords[coords.length - 1] || { x: width - 3, y: height / 2 };

  // Trend summary for accessibility
  const firstVal = points[0];
  const lastVal = points[len - 1];
  const deltaPct = firstVal ? Math.round(((lastVal - firstVal) / firstVal) * 100) : 0;
  const trendDescription = `${label}: started at ${firstVal}, current ${lastVal} (${deltaPct >= 0 ? '+' : ''}${deltaPct}%)`;

  // Color selection based on optional status prop
  const activeColor =
    status === 'critical'
      ? 'var(--critical-fg, #DC2626)'
      : status === 'caution'
      ? 'var(--caution-fg, #D97706)'
      : status === 'safe'
      ? 'var(--safe-fg, #16A34A)'
      : color;

  return (
    <div className={clsx('inline-flex items-center', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible flex-shrink-0 select-none"
        role="img"
        aria-label={trendDescription}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={activeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={activeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Shaded Area Fill */}
        {polygonPoints && (
          <polygon points={polygonPoints} fill={`url(#${gradientId})`} />
        )}

        {/* Crisp Line */}
        <polyline
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />

        {/* Glowing / Pulsing End-Cap Dot */}
        {showEndDot && (
          <g transform={`translate(${lastCoord.x}, ${lastCoord.y})`}>
            {status === 'critical' && !reduce && (
              <circle
                r="4.5"
                fill={activeColor}
                opacity={0.4}
                className="animate-ping"
              />
            )}
            <circle
              r="2.5"
              fill={activeColor}
              stroke="var(--surface, #FFFFFF)"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
