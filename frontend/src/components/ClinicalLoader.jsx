import React from 'react';

/**
 * ClinicalLoader.jsx — Industrial Skeuomorphic Telemetry Loader
 * Replaces basic spinner icons with a dual-ring radar scanner.
 */
export default function ClinicalLoader({
  size = 'md',
  label = 'Processing...',
  sublabel = null,
  color = 'var(--accent-primary)',
  className = '',
}) {
  const sizeMap = {
    sm: { container: 'w-6 h-6', ring: 'w-6 h-6', core: 'w-2 h-2', text: 'text-xs' },
    md: { container: 'w-12 h-12', ring: 'w-12 h-12', core: 'w-3 h-3', text: 'text-sm' },
    lg: { container: 'w-20 h-20', ring: 'w-20 h-20', core: 'w-5 h-5', text: 'text-base' },
  };

  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${current.container} flex items-center justify-center`}>
        {/* Outer expanding resonance pulse */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: color }}
        />

        {/* Middle slotted tracking ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-dashed animate-spin`}
          style={{
            borderColor: color,
            animationDuration: '3s',
            opacity: 0.6,
          }}
        />

        {/* Inner high-speed sweep ring */}
        <div
          className="absolute inset-1 rounded-full border-2 border-t-transparent border-r-transparent animate-spin"
          style={{
            borderLeftColor: color,
            borderBottomColor: color,
            animationDuration: '0.85s',
          }}
        />

        {/* Central glowing telemetry diode */}
        <div
          className={`${current.core} rounded-full animate-pulse shadow-md`}
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>

      {label && (
        <div className="text-center space-y-0.5">
          <p className={`${current.text} font-mono font-bold tracking-wider uppercase text-[var(--text-primary)]`}>
            {label}
          </p>
          {sublabel && (
            <p className="text-xs font-mono text-[var(--text-muted)]">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
