// src/components/PullQuote.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Editorial PullQuote.
 * Large serif italic with a coral quote mark, used for the Risk Story and highlighted clinical findings.
 */
export default function PullQuote({
  quote,
  children,
  attribution,
  source,
  className,
  as: Component = 'blockquote',
  ...props
}) {
  const content = quote || children;

  return (
    <Component
      className={clsx(
        'relative pl-6 sm:pl-8 py-3 my-4 border-l-2 border-[var(--accent-500)] bg-[var(--surface-3)]/40 rounded-r-[var(--radius-md)]',
        className
      )}
      {...props}
    >
      {/* Coral quotation glyph */}
      <span
        className="absolute left-1.5 -top-1 font-serif text-3xl sm:text-4xl text-[var(--accent-500)] select-none pointer-events-none leading-none"
        aria-hidden="true"
      >
        “
      </span>

      {/* Quote text */}
      <p className="font-[var(--font-heading)] italic text-base sm:text-lg lg:text-xl text-[var(--ink)] leading-relaxed">
        {content}
      </p>

      {/* Attribution / Source */}
      {(attribution || source) && (
        <footer className="mt-2 flex items-center gap-2 text-xs text-[var(--ink-3)] font-semibold font-[var(--font-body)]">
          {attribution && <span>— {attribution}</span>}
          {attribution && source && <span>•</span>}
          {source && <cite className="not-italic text-[var(--ink-4)]">{source}</cite>}
        </footer>
      )}
    </Component>
  );
}

export { PullQuote };
