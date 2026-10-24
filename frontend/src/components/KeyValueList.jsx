// src/components/KeyValueList.jsx
import React from 'react';
import { clsx } from 'clsx';
import { Copy, Check } from 'lucide-react';

/**
 * Editorial KeyValueList.
 * Structured pair rows with hairline borders, small-caps labels on the left, and high-contrast ink values on the right.
 */
export default function KeyValueList({
  items = [],
  children,
  density = 'md', // 'sm' | 'md' | 'lg'
  className,
  ...props
}) {
  const [copiedKey, setCopiedKey] = React.useState(null);

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const densityClasses = {
    sm: 'py-2 text-xs',
    md: 'py-2.5 text-sm',
    lg: 'py-3.5 text-base',
  };

  if (!items || items.length === 0) {
    return <div className={clsx('divide-y divide-[var(--hairline)]', className)}>{children}</div>;
  }

  return (
    <dl
      className={clsx(
        'w-full divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]',
        className
      )}
      {...props}
    >
      {items.map((item, idx) => {
        const itemKey = item.key || item.label || `kv-${idx}`;
        const itemVal = item.value ?? item.val ?? '';
        const isCopied = copiedKey === itemKey;

        return (
          <div
            key={itemKey}
            className={clsx(
              'flex items-center justify-between gap-4',
              densityClasses[density] || densityClasses.md
            )}
          >
            {/* Label / Key */}
            <dt className="flex items-center gap-2 text-[var(--ink-3)] font-semibold font-[var(--font-heading)] text-xs uppercase tracking-wider min-w-0">
              {item.icon && (
                <span className="flex-shrink-0 text-[var(--ink-3)]" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label || item.key}</span>
            </dt>

            {/* Value */}
            <dd className="flex items-center gap-2 text-right font-bold text-[var(--ink)] font-[var(--font-body)]">
              <span className={clsx(item.mono && 'font-mono')}>{itemVal}</span>

              {item.copyable && (
                <button
                  type="button"
                  onClick={() => handleCopy(itemKey, String(itemVal))}
                  aria-label={`Copy ${item.label || item.key}`}
                  className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-[var(--safe-600)]" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export { KeyValueList };
