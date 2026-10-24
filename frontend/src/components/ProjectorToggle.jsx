/**
 * ProjectorToggle.jsx — Presentation & Projector Mode Controller
 * ─────────────────────────────────────────────────────────────
 * Enables 1-click stage presentation mode for 1080p and 768p projectors:
 *  - Increases font scaling
 *  - Maximizes contrast (pure ink / surfaces)
 *  - Hides non-essential chrome (pings, shortcuts)
 *  - Enlarges click and tap targets
 */

import React from 'react';
import { Presentation, Sun, Moon } from 'lucide-react';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

export function ProjectorToggle({ className = '', compact = false }) {
  const { isProjectorMode, toggleProjectorMode } = useDisplaySettings();

  return (
    <button
      type="button"
      onClick={toggleProjectorMode}
      aria-pressed={isProjectorMode}
      aria-label={isProjectorMode ? 'Disable Projector Mode' : 'Enable Projector Mode for stage presentation'}
      title="Stage Projector Mode (High contrast, large font & click targets, hides secondary chrome)"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
        isProjectorMode
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-xs ring-2 ring-amber-500/20'
          : 'bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] border-[var(--border)] hover:bg-[var(--surface)]'
      } ${className}`}
    >
      <Presentation className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span className={compact ? 'hidden md:inline' : ''}>
        Projector
      </span>
      <span
        className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
          isProjectorMode
            ? 'bg-amber-500 text-white shadow-xs'
            : 'bg-[var(--border)] text-[var(--ink-3)]'
        }`}
      >
        {isProjectorMode ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useDisplaySettings();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={`p-2 rounded-xl text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all cursor-pointer shadow-xs active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-700" />
      )}
    </button>
  );
}

export default ProjectorToggle;
