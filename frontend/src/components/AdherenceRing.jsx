import React, { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdherenceRing({
  percentage = 100,
  streakDays = 0,
  size = 110,
  strokeWidth = 9,
  label = '7-Day Adherence',
  sublabel,
  showStreak = true,
  className = '',
}) {
  const shouldReduce = useReducedMotion();
  const [displayed, setDisplayed] = useState(shouldReduce ? percentage : 0);
  const raf = useRef(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  useEffect(() => {
    if (shouldReduce) {
      setDisplayed(clamped);
      return;
    }
    const start = performance.now();
    const duration = 750;
    const from = 0;
    const to = clamped;
    function step(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3);
      setDisplayed(Math.round(from + (to - from) * ease));
      if (elapsed < 1) {
        raf.current = requestAnimationFrame(step);
      }
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [clamped, shouldReduce]);

  // Gradient & ring coloring based on adherence health
  const getRingColor = () => {
    if (percentage >= 80) return { stroke: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', text: 'text-emerald-600', ringId: 'grad-emerald' };
    if (percentage >= 50) return { stroke: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', text: 'text-blue-600', ringId: 'grad-blue' };
    return { stroke: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', text: 'text-amber-600', ringId: 'grad-amber' };
  };

  const theme = getRingColor();

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-[var(--border)] opacity-60"
          />

          {/* Active progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${theme.ringId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
          <span className={`text-xl font-black font-[var(--font-heading)] leading-none ${theme.text}`}>
            {displayed}%
          </span>
          <span className="text-[10px] font-mono font-semibold text-[var(--ink-3)] uppercase tracking-wider mt-1">
            Adherence
          </span>
        </div>
      </div>

      {/* Label and Streak */}
      <div className="mt-2 space-y-1">
        {label && (
          <p className="text-xs font-bold font-mono text-[var(--ink)]">
            {label}
          </p>
        )}
        {showStreak && (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{streakDays} Day Streak</span>
          </div>
        )}
        {sublabel && (
          <p className="text-[10px] text-[var(--ink-3)] font-mono">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
