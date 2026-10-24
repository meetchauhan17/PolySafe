/**
 * ProjectorToggle.jsx — Deprecated / Projector Mode Removed
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

export function ProjectorToggle() {
  return null;
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
