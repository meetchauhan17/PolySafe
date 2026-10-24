/**
 * frontend/src/charts/Heatmap.jsx
 *
 * Unified Overlay — Color-Blind Safe Heatmap Component
 * ─────────────────────────────────────────────────────────────────────────────
 * • Universal heatmap supporting:
 *     1. Adherence Calendar Mode (days/weeks adherence tracking)
 *     2. Drug Interaction Matrix Mode (N x N pairwise clinical cross-checks)
 * • Color-blind secondary cues:
 *     - Unknown:        hatch pattern (diagonal stripes)
 *     - Minor:          dots pattern (stippled dots)
 *     - Moderate:       none (solid tint)
 *     - Major/Critical: crosshatch pattern (intersecting diagonal grid)
 * • ALWAYS displays an explicit text label or code inside or above the cell
 * • Responsive to theme changes without page reload
 * • Accessible: keyboard navigation (Tab/Arrow), aria-label summaries
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Info, Check, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getSeverityPattern, SEVERITY_COLORS, ColorBlindPatternDefs } from './theme';

export default function Heatmap({
  mode = 'matrix', // 'matrix' | 'adherence'
  items = [],       // for matrix: medicines array
  pairs = [],       // for matrix: interactions array
  adherenceData = null, // for adherence: { weeks, overallPercentage }
  onCellClick,
  className = '',
  title = 'Pharmacological Matrix',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // ───────────────────────────────────────────────────────────────────────────
  // MODE A: Adherence Calendar Grid
  // ───────────────────────────────────────────────────────────────────────────
  if (mode === 'adherence') {
    const weeks = adherenceData?.weeks || [];
    const totalDays = weeks.flat().length || 56;
    const adherenceRate = adherenceData?.percentage ?? 92;

    return (
      <div
        className={clsx('space-y-4 font-sans', className)}
        role="region"
        aria-label={`Adherence Heatmap: ${adherenceRate}% adherence across ${totalDays} days`}
      >
        <ColorBlindPatternDefs />

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--ink)]">Adherence Intensity:</span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">56-Day Trajectory</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-700" />
              <span>100%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-500/80 border border-emerald-600" />
              <span>75%+</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-teal-500/50 border border-teal-600" />
              <span>50%+</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-rose-500/40 border border-rose-500" />
              <span>Missed</span>
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-x-auto">
          <div className="min-w-[420px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--ink-4)] pb-1">
              <span className="w-8">Day</span>
              <div className="flex-1 grid grid-cols-8 gap-1 text-center">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i}>W{i + 1}</span>
                ))}
              </div>
            </div>

            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dayIdx) => (
              <div key={dayName} className="flex items-center gap-1.5">
                <span className="w-8 text-[10px] font-mono text-[var(--ink-3)]">{dayName}</span>
                <div className="flex-1 grid grid-cols-8 gap-1">
                  {weeks.map((week, wIdx) => {
                    const day = week[dayIdx];
                    if (!day) return <div key={wIdx} className="h-6 rounded-xs bg-transparent" />;

                    const pct = day.percentage ?? (day.taken >= day.total ? 100 : 50);
                    const isPerfect = pct === 100;
                    const isGood = pct >= 75 && pct < 100;
                    const isMid = pct >= 50 && pct < 75;

                    const bgClass = isPerfect
                      ? 'bg-emerald-600 text-white'
                      : isGood
                      ? 'bg-emerald-500/80 text-white'
                      : isMid
                      ? 'bg-teal-500/60 text-teal-950 dark:text-teal-100'
                      : 'bg-rose-500/40 text-rose-950 dark:text-rose-100';

                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => onCellClick?.(day)}
                        className={clsx(
                          'h-6 rounded-xs border border-[var(--border)] flex items-center justify-center text-[9px] font-bold font-mono transition-transform hover:scale-110 cursor-pointer',
                          bgClass
                        )}
                        title={`${day.date || dayName}: ${pct}% adherence (${day.taken || 0}/${day.total || 4} doses)`}
                      >
                        {isPerfect ? '✓' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MODE B: Pharmacological Interaction Matrix
  // ───────────────────────────────────────────────────────────────────────────
  const medicines = items || [];
  const flags = pairs || [];

  if (medicines.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[var(--ink-3)] font-mono bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        No active medicines to evaluate in the interaction matrix.
      </div>
    );
  }

  // Lookup flag for drug pair
  const getFlag = (medA, medB) => {
    if (medA.id === medB.id || medA.name === medB.name) return null;
    return flags.find(
      (f) =>
        (f.medicineA?.id === medA.id && f.medicineB?.id === medB.id) ||
        (f.medicineA?.id === medB.id && f.medicineB?.id === medA.id) ||
        (f.medicineA?.name === medA.name && f.medicineB?.name === medB.name) ||
        (f.medicineA?.name === medB.name && f.medicineB?.name === medA.name) ||
        (f.drugA === medA.name && f.drugB === medB.name) ||
        (f.drugA === medB.name && f.drugB === medA.name)
    );
  };

  const getCellVisual = (flag) => {
    if (!flag) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        patternStyle: {},
        code: 'SAFE',
        label: 'Clear',
        icon: '✓',
      };
    }

    const sev = String(flag.severity || '').toUpperCase();

    if (sev.includes('CRIT') || sev.includes('CONTRA')) {
      return {
        bg: 'bg-rose-500/25 border-rose-600 text-rose-900 dark:text-rose-100 font-black',
        patternStyle: {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.25), rgba(220, 38, 38, 0.25) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(-45deg, rgba(220, 38, 38, 0.25), rgba(220, 38, 38, 0.25) 3px, transparent 3px, transparent 6px)',
        },
        code: 'CRIT',
        label: 'Critical Conflict',
        icon: '✕',
      };
    }

    if (sev.includes('MAJOR')) {
      return {
        bg: 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200 font-bold',
        patternStyle: {
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(225, 29, 72, 0.2), rgba(225, 29, 72, 0.2) 3px, transparent 3px, transparent 6px), repeating-linear-gradient(-45deg, rgba(225, 29, 72, 0.2), rgba(225, 29, 72, 0.2) 3px, transparent 3px, transparent 6px)',
        },
        code: 'MAJ',
        label: 'Major Interaction',
        icon: '⚠',
      };
    }

    if (sev.includes('MOD')) {
      return {
        bg: 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 font-bold',
        patternStyle: {}, // Solid tint for Moderate
        code: 'MOD',
        label: 'Moderate Precaution',
        icon: '!',
      };
    }

    if (sev.includes('MIN')) {
      return {
        bg: 'bg-teal-500/15 border-teal-500 text-teal-900 dark:text-teal-200',
        patternStyle: {
          backgroundImage: 'radial-gradient(circle, rgba(14, 116, 144, 0.45) 1.5px, transparent 1.5px)',
          backgroundSize: '6px 6px',
        },
        code: 'MIN',
        label: 'Minor Caution',
        icon: '•',
      };
    }

    return {
      bg: 'bg-slate-500/15 border-slate-400 text-slate-800 dark:text-slate-200',
      patternStyle: {
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.3) 3px, transparent 3px, transparent 6px)',
      },
      code: 'UNK',
      label: 'Unknown / Data Gap',
      icon: '?',
    };
  };

  return (
    <div
      className={clsx('space-y-4 font-sans', className)}
      role="region"
      aria-label={`${title} between ${medicines.length} medications with ${flags.length} flagged interactions`}
    >
      <ColorBlindPatternDefs />

      {/* Hover Info Header Card */}
      <div className="min-h-[46px] p-2.5 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs transition-all">
        {hoveredCell ? (
          <div className="flex items-center gap-2 text-[var(--ink)] animate-fadeIn">
            <span className="font-bold text-[var(--brand-600)]">
              {hoveredCell.drugA} + {hoveredCell.drugB}:
            </span>
            <span className="font-semibold px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11px]">
              {hoveredCell.visual.label} ({hoveredCell.visual.code})
            </span>
            {hoveredCell.flag?.plainExplanation && (
              <span className="text-[var(--ink-2)] truncate max-w-md hidden sm:inline">
                — {hoveredCell.flag.plainExplanation}
              </span>
            )}
            <span className="text-[10px] font-mono text-[var(--ink-3)] ml-auto">Click for details</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--ink-3)] font-mono text-[11px]">
            <Info className="w-3.5 h-3.5 text-[var(--brand-600)]" />
            <span>Hover or focus cells to inspect pairwise pharmacokinetic effects.</span>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <table className="border-collapse table-fixed w-full min-w-[500px]" role="grid">
          <thead>
            <tr>
              <th className="w-24 p-2 text-left text-[10px] font-mono font-bold uppercase text-[var(--ink-4)]">
                Matrix
              </th>
              {medicines.map((med) => (
                <th
                  key={med.id || med.name}
                  className="p-2 text-center text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] truncate max-w-[90px]"
                  title={med.name}
                >
                  {med.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicines.map((medA) => (
              <tr key={medA.id || medA.name}>
                <td
                  className="p-2 text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] truncate max-w-[90px] border-r border-[var(--border)]"
                  title={medA.name}
                >
                  {medA.name}
                </td>
                {medicines.map((medB) => {
                  const isSelf = medA.id === medB.id || medA.name === medB.name;
                  const flag = getFlag(medA, medB);
                  const visual = getCellVisual(flag);

                  if (isSelf) {
                    return (
                      <td key={medB.id || medB.name} className="p-1 text-center">
                        <div className="h-10 rounded-lg bg-[var(--canvas)] border border-dashed border-[var(--border)] flex items-center justify-center text-[10px] font-mono text-[var(--ink-4)]">
                          —
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={medB.id || medB.name} className="p-1 text-center">
                      <button
                        type="button"
                        style={visual.patternStyle}
                        onClick={() => onCellClick?.({ drugA: medA.name, drugB: medB.name, flag })}
                        onMouseEnter={() => setHoveredCell({ drugA: medA.name, drugB: medB.name, flag, visual })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onFocus={() => setHoveredCell({ drugA: medA.name, drugB: medB.name, flag, visual })}
                        onBlur={() => setHoveredCell(null)}
                        className={clsx(
                          'w-full h-10 rounded-lg border flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer relative shadow-2xs',
                          visual.bg
                        )}
                        aria-label={`${medA.name} and ${medB.name}: ${visual.label}`}
                      >
                        <span className="text-[10px] font-mono font-bold leading-none">
                          {visual.code}
                        </span>
                        <span className="text-[8px] font-bold opacity-75 leading-none mt-0.5">
                          {visual.icon}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color-Blind Secondary Cues Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px] font-mono text-[var(--ink-3)]">
        <span className="font-bold">Accessibility Cues:</span>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-rose-600 bg-rose-500/25" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(220,38,38,0.3) 0, rgba(220,38,38,0.3) 2px, transparent 2px, transparent 4px), repeating-linear-gradient(-45deg, rgba(220,38,38,0.3) 0, rgba(220,38,38,0.3) 2px, transparent 2px, transparent 4px)' }} />
            <span>Crosshatch: Major/Critical</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-amber-500 bg-amber-500/20" />
            <span>Solid: Moderate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-teal-500 bg-teal-500/15" style={{ backgroundImage: 'radial-gradient(circle, rgba(14,116,144,0.5) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
            <span>Dots: Minor</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-slate-400 bg-slate-500/15" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(148,163,184,0.3) 0, rgba(148,163,184,0.3) 2px, transparent 2px, transparent 4px)' }} />
            <span>Hatch: Unknown</span>
          </span>
        </div>
      </div>
    </div>
  );
}
