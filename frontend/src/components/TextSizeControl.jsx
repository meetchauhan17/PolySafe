/**
 * frontend/src/components/TextSizeControl.jsx
 *
 * Accessibility Text-Size Controller (A- / A / A+)
 * Works across English, Devanagari, and Gujarati scripts.
 */

import React from 'react';
import { Type } from 'lucide-react';
import { useT } from '../i18n/useT';

const SIZES = [
  { id: 'sm', label: 'A-', title: 'A- (Small text)' },
  { id: 'md', label: 'A',  title: 'A (Standard text)' },
  { id: 'lg', label: 'A+', title: 'A+ (Large text)' },
];

export default function TextSizeControl({
  className = '',
  showLabel = false,
}) {
  const { textSize, setTextSize, t } = useT();

  return (
    <div
      role="group"
      aria-label="Text size control"
      className={`inline-flex items-center gap-1 p-0.5 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)] ${className}`}
    >
      {showLabel && (
        <span className="flex items-center gap-1 pl-1.5 pr-1 text-xs text-[var(--ink-2)] font-semibold" aria-hidden="true">
          <Type className="w-3.5 h-3.5" />
          <span>{t('common.text_size', 'Text')}</span>
        </span>
      )}
      {SIZES.map((s) => {
        const isActive = textSize === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setTextSize(s.id)}
            aria-pressed={isActive}
            aria-label={s.title}
            title={s.title}
            className={`px-2 py-1 text-xs font-extrabold rounded-[6px] transition-all cursor-pointer font-mono ${
              isActive
                ? 'bg-[var(--brand-600)] text-white shadow-xs'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
