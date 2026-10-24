import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, Check, Info, ShieldAlert } from 'lucide-react';

export default function InteractionMatrix({
  medicines = [],
  flags = [],
  onSelectFlag,
  className = '',
}) {
  const [focusedCell, setFocusedCell] = useState(null);

  if (medicines.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[var(--ink-3)] font-mono bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        No active medicines to evaluate in the interaction matrix.
      </div>
    );
  }

  // Find flag for pair (medA, medB)
  const getFlagForPair = (medA, medB) => {
    if (medA.id === medB.id || medA.name === medB.name) return null;
    return flags.find(
      (f) =>
        (f.medicineA?.id === medA.id && f.medicineB?.id === medB.id) ||
        (f.medicineA?.id === medB.id && f.medicineB?.id === medA.id) ||
        (f.medicineA?.name === medA.name && f.medicineB?.name === medB.name) ||
        (f.medicineA?.name === medB.name && f.medicineB?.name === medA.name)
    );
  };

  const getCellPatternStyle = (severity) => {
    const s = String(severity || '').toUpperCase();
    if (s.includes('CONTRA') || s.includes('CRIT')) {
      return {
        className: 'bg-rose-500/25 text-rose-900 dark:text-rose-100 border-rose-600 font-black',
        style: {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.3), rgba(220, 38, 38, 0.3) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(-45deg, rgba(220, 38, 38, 0.3), rgba(220, 38, 38, 0.3) 3px, transparent 3px, transparent 6px)',
        },
        icon: <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />,
      };
    }
    if (s.includes('MAJOR')) {
      return {
        className: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/60 font-bold',
        style: {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(225, 29, 72, 0.25) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(-45deg, rgba(225, 29, 72, 0.25), rgba(225, 29, 72, 0.25) 3px, transparent 3px, transparent 6px)',
        },
        icon: <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />,
      };
    }
    if (s.includes('MODERATE')) {
      return {
        className: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-bold',
        style: {}, // Solid tint (none) for Moderate
        icon: <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />,
      };
    }
    if (s.includes('MINOR')) {
      // Dotted pattern for Minor
      return {
        className: 'text-teal-900 dark:text-teal-200 border-teal-500/40 font-semibold',
        style: {
          backgroundColor: 'rgba(20, 184, 166, 0.12)',
          backgroundImage: 'radial-gradient(circle, rgba(20, 184, 166, 0.6) 1.5px, transparent 1.5px)',
          backgroundSize: '6px 6px',
        },
        icon: <Info className="w-3 h-3 text-teal-600 shrink-0" />,
      };
    }
    // Unknown: Diagonal hatch pattern
    return {
      className: 'text-slate-800 dark:text-slate-300 border-slate-400/40 font-mono',
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.3) 3px, transparent 3px, transparent 6px)',
      },
      icon: <span className="text-[10px] font-bold">?</span>,
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tooltip banner on focus/hover */}
      <div className="min-h-[46px] p-2.5 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs transition-all">
        {focusedCell ? (
          <div className="flex items-center gap-2 text-[var(--ink)] animate-fadeIn">
            <span className="font-bold text-[var(--brand-600)]">{focusedCell.drugA} + {focusedCell.drugB}:</span>
            <span className="font-semibold px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px]">
              {focusedCell.severity} Severity
            </span>
            <span className="text-[var(--ink-2)] truncate max-w-md hidden sm:inline">
              — {focusedCell.plainText}
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)] ml-auto">Click to view details</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--ink-3)] font-mono text-[11px]">
            <Info className="w-3.5 h-3.5 text-[var(--brand-600)]" />
            <span>Hover or focus cells via keyboard (Tab / Arrow keys) to inspect drug pairs.</span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <div className="min-w-[620px]">
          <table className="w-full border-collapse text-left text-xs" role="grid" aria-label="Cross-Medication Interaction Heatmap Matrix">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="p-3 text-[11px] font-mono font-bold text-[var(--ink-3)] uppercase tracking-wider bg-[var(--surface-2)] rounded-tl-2xl">
                  Medicine / Interacting
                </th>
                {medicines.map((colMed) => (
                  <th
                    key={colMed.id || colMed.name}
                    className="p-3 text-[11px] font-bold text-[var(--ink)] font-[var(--font-heading)] text-center min-w-[95px]"
                    title={colMed.name}
                  >
                    <span className="block truncate max-w-[90px] mx-auto">
                      {colMed.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicines.map((rowMed, rIdx) => (
                <tr key={rowMed.id || rIdx} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="p-3 font-bold text-[var(--ink)] text-xs font-[var(--font-heading)] bg-[var(--surface-2)]/60 whitespace-nowrap">
                    <span className="truncate max-w-[140px] block" title={rowMed.name}>
                      {rowMed.name}
                    </span>
                  </td>

                  {medicines.map((colMed, cIdx) => {
                    const isSelf = rIdx === cIdx;
                    const flag = !isSelf ? getFlagForPair(rowMed, colMed) : null;
                    const pattern = flag ? getCellPatternStyle(flag.severity) : null;

                    return (
                      <td
                        key={colMed.id || cIdx}
                        className="p-2 text-center align-middle"
                        role="gridcell"
                      >
                        {isSelf ? (
                          <span className="text-[var(--ink-3)] text-xs opacity-25 select-none font-mono">
                            —
                          </span>
                        ) : flag ? (
                          <button
                            type="button"
                            tabIndex={0}
                            onClick={() => onSelectFlag && onSelectFlag(flag)}
                            onFocus={() => setFocusedCell({
                              drugA: rowMed.name,
                              drugB: colMed.name,
                              severity: flag.severity,
                              plainText: flag.plainExplanation,
                            })}
                            onBlur={() => setFocusedCell(null)}
                            onMouseEnter={() => setFocusedCell({
                              drugA: rowMed.name,
                              drugB: colMed.name,
                              severity: flag.severity,
                              plainText: flag.plainExplanation,
                            })}
                            onMouseLeave={() => setFocusedCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSelectFlag && onSelectFlag(flag);
                              }
                            }}
                            style={pattern?.style}
                            className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-mono border transition-all cursor-pointer shadow-2xs hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-1 flex items-center justify-center gap-1 ${pattern?.className}`}
                            aria-label={`${rowMed.name} and ${colMed.name}: ${flag.severity} interaction.`}
                          >
                            <span>{pattern?.icon}</span>
                            <span>{flag.severity}</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-emerald-600 bg-emerald-500/10 text-xs font-bold"
                            title={`${rowMed.name} + ${colMed.name}: No documented interaction`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Color-blind safety legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--ink-3)] px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--ink)]">Color-Blind Accessible Secondary Patterns:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5" title="Crosshatch pattern">
            <span
              className="w-3.5 h-3.5 rounded border border-rose-600 inline-block"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.25)',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.4), rgba(220,38,38,0.4) 2px, transparent 2px, transparent 4px), repeating-linear-gradient(-45deg, rgba(220,38,38,0.4), rgba(220,38,38,0.4) 2px, transparent 2px, transparent 4px)',
              }}
            />
            <span className="font-bold text-rose-700 dark:text-rose-400">Critical / Major (Crosshatch)</span>
          </span>
          <span className="flex items-center gap-1.5" title="Solid tint (none)">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/25 border border-amber-500 inline-block" />
            <span className="font-bold text-amber-700 dark:text-amber-400">Moderate (Solid Tint)</span>
          </span>
          <span className="flex items-center gap-1.5" title="Dotted pattern">
            <span
              className="w-3.5 h-3.5 rounded border border-teal-500/60 inline-block"
              style={{
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                backgroundImage: 'radial-gradient(circle, rgba(20, 184, 166, 0.8) 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
            <span className="font-bold text-teal-700 dark:text-teal-400">Minor (Dots)</span>
          </span>
          <span className="flex items-center gap-1.5" title="Diagonal hatch pattern">
            <span
              className="w-3.5 h-3.5 rounded border border-slate-400 inline-block"
              style={{
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(148,163,184,0.4), rgba(148,163,184,0.4) 2px, transparent 2px, transparent 4px)',
              }}
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">Unknown (Hatch)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
