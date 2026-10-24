// src/components/Divider.jsx
import React from 'react';
import { clsx } from 'clsx';

/**
 * Editorial Divider.
 * Hairline rule with an optional centered small-caps label.
 */
export default function Divider({
  label,
  children,
  className,
  dashed = false,
  ...props
}) {
  const content = label || children;

  if (!content) {
    return (
      <hr
        className={clsx(
          'w-full my-6 border-0 h-[1px] bg-[var(--hairline)]',
          dashed && 'border-t border-dashed border-[var(--border)] bg-transparent',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={clsx('relative flex items-center justify-center my-6 w-full select-none', className)}
      role="separator"
      {...props}
    >
      <div className={clsx('w-full h-[1px] bg-[var(--hairline)]', dashed && 'border-t border-dashed border-[var(--border)] bg-transparent')} />
      <span className="absolute px-3.5 py-0.5 bg-[var(--canvas)] text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-[var(--font-heading)] rounded-full border border-[var(--hairline)] shadow-[var(--shadow-xs)]">
        {content}
      </span>
    </div>
  );
}

export { Divider };
