/**
 * frontend/src/components/LanguageSwitcher.jsx
 *
 * Language Switcher component supporting English, Hindi (हिन्दी), and Gujarati (ગુજરાતી).
 * Persists choice in localStorage and notifies screen readers via aria-live.
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { useT } from '../i18n/useT';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'gu', label: 'ગુજરાતી', short: 'ગુ' },
];

export default function LanguageSwitcher({
  compact = true,
  className = '',
  showIcon = true,
}) {
  const { lang, setLang } = useT();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)] ${className}`}
    >
      {showIcon && (
        <span className="pl-1 pr-0.5 text-[var(--ink-2)]" aria-hidden="true">
          <Globe className="w-3.5 h-3.5" />
        </span>
      )}
      {LANGUAGES.map((l) => {
        const isActive = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={isActive}
            aria-label={compact ? `${l.short} (${l.label})` : l.label}
            className={`px-1.5 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
              isActive
                ? 'bg-[var(--brand-600)] text-white shadow-xs'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
            }`}
          >
            {compact ? l.short : l.label}
          </button>
        );
      })}
    </div>
  );
}
