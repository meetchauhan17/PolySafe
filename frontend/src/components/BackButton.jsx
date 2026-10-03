import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * BackButton — Unified, clinical-grade navigation button matching PolySafe's design system.
 * 
 * • Fixed layout with whitespace-nowrap & flex-shrink-0 (no awkward multi-line text wrapping).
 * • Interactive icon tile with micro-animation on hover (group-hover:-translate-x-0.5).
 * • Polished clinical glassmorphism card styling with subtle border and crisp elevation.
 * • Fully styled with theme tokens for seamless light/dark mode and cohesive aesthetic.
 */
export default function BackButton({
  to = '/home',
  label = 'Back to Home',
  onClick,
  className = '',
  size = 'md',
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to === -1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex items-center gap-2.5 ${
        isSmall ? 'px-3 py-1.5 rounded-xl' : 'px-3.5 py-2 rounded-2xl'
      } bg-[var(--surface)]/95 hover:bg-[var(--surface)] active:scale-[0.98] border border-[var(--border)] hover:border-[var(--brand-600)]/40 text-[var(--ink-2)] hover:text-[var(--brand-600)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)] backdrop-blur-md transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0 cursor-pointer select-none ${className}`}
      title={label}
    >
      <span
        className={`${
          isSmall ? 'w-5 h-5 rounded-lg' : 'w-6 h-6 rounded-xl'
        } bg-[var(--canvas)] group-hover:bg-[var(--brand-600)]/10 border border-[var(--border)] group-hover:border-[var(--brand-600)]/30 flex items-center justify-center text-[var(--ink-3)] group-hover:text-[var(--brand-600)] transition-all duration-200 flex-shrink-0`}
      >
        <ArrowLeft
          className={`${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } group-hover:-translate-x-0.5 transition-transform duration-200 flex-shrink-0`}
        />
      </span>
      <span className="text-xs font-bold tracking-tight">{label}</span>
    </button>
  );
}
