import React from 'react';

/**
 * LedIndicator.jsx — Precision Clinical LED Light Indicator
 *
 * Props:
 * - status: 'safe' | 'caution' | 'critical' | 'online' | 'offline' | 'purple' | 'amber'
 * - label: optional text string displayed in monospace
 * - size: 'sm' (10px) | 'md' (14px) | 'lg' (18px)
 * - className: custom class
 */

export default function LedIndicator({
  status = 'online',
  label,
  size = 'sm',
  className = '',
}) {
  let sizeClass = 'led--sm';
  if (size === 'md') sizeClass = 'led--md';
  if (size === 'lg') sizeClass = 'led--lg';

  let statusClass = 'led--online';
  if (status === 'safe') statusClass = 'led--safe';
  if (status === 'caution') statusClass = 'led--caution';
  if (status === 'critical' || status === 'danger') statusClass = 'led--critical';
  if (status === 'offline') statusClass = 'led--offline';
  if (status === 'purple') statusClass = 'led--purple';
  if (status === 'amber') statusClass = 'led--amber';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`led ${sizeClass} ${statusClass}`} />
      {label && (
        <span className="led-label">
          {label}
        </span>
      )}
    </div>
  );
}
