import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Info } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';
import { EASE_EMPH } from '../motion/presets';

const HARM_COLORS = {
  1: 'var(--harm-l1, #10B981)',
  2: 'var(--harm-l2, #06B6D4)',
  3: 'var(--harm-l3, #F59E0B)',
  4: 'var(--harm-l4, #F97316)',
  5: 'var(--harm-l5, #EF4444)',
};

const SEVERITY_EDGE_CONFIG = {
  CONTRAINDICATED: { color: '#991B1B', width: 4.5, dash: 'none', label: 'Contraindicated' },
  MAJOR: { color: '#EF4444', width: 3.5, dash: 'none', label: 'Major Risk' },
  MODERATE: { color: '#F59E0B', width: 2.5, dash: 'none', label: 'Moderate Risk' },
  MINOR: { color: '#14B8A6', width: 1.5, dash: 'none', label: 'Minor Risk' },
  UNKNOWN: { color: '#94A3B8', width: 1.5, dash: '5 4', label: 'Unknown' },
};

function getSeverityConfig(sev) {
  const upper = String(sev || '').toUpperCase();
  if (upper.includes('CONTRA')) return SEVERITY_EDGE_CONFIG.CONTRAINDICATED;
  if (upper.includes('MAJOR')) return SEVERITY_EDGE_CONFIG.MAJOR;
  if (upper.includes('MODERATE')) return SEVERITY_EDGE_CONFIG.MODERATE;
  if (upper.includes('MINOR')) return SEVERITY_EDGE_CONFIG.MINOR;
  return SEVERITY_EDGE_CONFIG.UNKNOWN;
}

export default function InteractionWeb({
  medicines = [],
  flags = [],
  onSelectFlag,
  onDegradeToList,
  className = '',
}) {
  const isReduced = useReducedMotion();
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  // Detect small screens (< 640px) and degrade to List
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && onDegradeToList) {
        onDegradeToList();
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, [onDegradeToList]);

  // Diagram geometry
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 175;

  const N = Math.max(medicines.length, 1);

  // Compute node positions along circle with subtle pseudo-depth layer offsets
  const nodeMap = useMemo(() => {
    const map = new Map();
    medicines.forEach((med, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      // Slight parallax radial perturbation for depth effect
      const depthOffset = (i % 2 === 0 ? 4 : -4);
      const effectiveRadius = radius + depthOffset;
      const x = cx + effectiveRadius * Math.cos(angle);
      const y = cy + effectiveRadius * Math.sin(angle);
      const isHerbal =
        med.type === 'HERBAL' ||
        /herbal|turmeric|curcumin|ginkgo|ginseng|ashwagandha|st\.?\s*john/i.test(med.name || '');

      map.set(med.id || med.name, {
        index: i,
        medicine: med,
        x,
        y,
        angle,
        harmLevel: med.harmLevel || 3,
        color: HARM_COLORS[med.harmLevel || 3] || HARM_COLORS[3],
        isHerbal,
        depthLayer: i % 2 === 0 ? 'front' : 'mid',
      });
    });
    return map;
  }, [medicines, N, cx, cy, radius]);

  // Map edges from flags
  const edges = useMemo(() => {
    return flags
      .map((f, idx) => {
        const idA = f.medicineA?.id || f.medicineA?.name;
        const idB = f.medicineB?.id || f.medicineB?.name;
        const nodeA = nodeMap.get(idA);
        const nodeB = nodeMap.get(idB);

        if (!nodeA || !nodeB) return null;
        const sevCfg = getSeverityConfig(f.severity);

        return {
          id: f.id || `edge-${idx}`,
          flag: f,
          nodeA,
          nodeB,
          path: `M ${nodeA.x} ${nodeA.y} Q ${cx} ${cy} ${nodeB.x} ${nodeB.y}`,
          ...sevCfg,
        };
      })
      .filter(Boolean);
  }, [flags, nodeMap, cx, cy]);

  // Keyboard navigation across nodes
  const handleKeyDown = (e) => {
    if (medicines.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev === null ? 0 : (prev + 1) % medicines.length));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev === null ? medicines.length - 1 : (prev - 1 + medicines.length) % medicines.length
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex !== null) {
        const focusedMed = medicines[focusedIndex];
        const connectedFlag = flags.find(
          (f) =>
            f.medicineA?.id === focusedMed.id ||
            f.medicineB?.id === focusedMed.id ||
            f.medicineA?.name === focusedMed.name ||
            f.medicineB?.name === focusedMed.name
        );
        if (connectedFlag && onSelectFlag) {
          onSelectFlag(connectedFlag);
        }
      }
    } else if (e.key === 'Escape') {
      setFocusedIndex(null);
      setHoveredEdgeId(null);
    }
  };

  const activeMed = focusedIndex !== null ? medicines[focusedIndex] : null;

  const isNodeConnected = (node) => {
    if (focusedIndex === null) return true;
    if (node.index === focusedIndex) return true;
    return edges.some(
      (e) =>
        (e.nodeA.index === focusedIndex && e.nodeB.index === node.index) ||
        (e.nodeB.index === focusedIndex && e.nodeA.index === node.index)
    );
  };

  const isEdgeHighlighted = (e) => {
    if (hoveredEdgeId) return e.id === hoveredEdgeId;
    if (focusedIndex === null) return false;
    return e.nodeA.index === focusedIndex || e.nodeB.index === focusedIndex;
  };

  const connectedFlagsForActive = useMemo(() => {
    if (!activeMed) return [];
    return flags.filter(
      (f) =>
        f.medicineA?.id === activeMed.id ||
        f.medicineB?.id === activeMed.id ||
        f.medicineA?.name === activeMed.name ||
        f.medicineB?.name === activeMed.name
    );
  }, [activeMed, flags]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Small Screen Degrade Notice */}
      {isMobile && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Optimal on wide displays. Switched to responsive list view.</span>
          </div>
          {onDegradeToList && (
            <button
              onClick={onDegradeToList}
              className="px-2.5 py-1 rounded-xl bg-amber-600 text-white font-mono font-bold text-[10px] whitespace-nowrap cursor-pointer hover:bg-amber-700"
            >
              Switch to List
            </button>
          )}
        </div>
      )}

      {/* Main SVG Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Interactive Medication Interaction Web. Use arrow keys to navigate nodes, Enter to open interaction details."
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)]"
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[500px] h-auto select-none overflow-visible"
        >
          {/* Outer Orbit Guide Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Interactive Edges drawn in with pathLength */}
          <g className="edges">
            {edges.map((e, idx) => {
              const highlighted = isEdgeHighlighted(e);
              const dimmed = focusedIndex !== null && !highlighted;

              return (
                <motion.path
                  key={e.id}
                  d={e.path}
                  fill="none"
                  stroke={e.color}
                  strokeWidth={highlighted ? e.width * 1.6 : e.width}
                  strokeDasharray={e.dash}
                  initial={isReduced ? { opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
                  animate={isReduced ? { opacity: dimmed ? 0.12 : highlighted ? 1 : 0.7 } : {
                    pathLength: 1,
                    opacity: dimmed ? 0.12 : highlighted ? 1 : 0.7,
                  }}
                  transition={{
                    pathLength: { duration: 0.7, delay: idx * 0.08, ease: EASE_EMPH },
                    opacity: { duration: 0.2 },
                  }}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredEdgeId(e.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  onClick={() => onSelectFlag && onSelectFlag(e.flag)}
                >
                  <title>{`${e.nodeA.medicine.name} + ${e.nodeB.medicine.name} (${e.label}): ${e.flag.plainExplanation}`}</title>
                </motion.path>
              );
            })}
          </g>

          {/* Center Information Radar */}
          <g transform={`translate(${cx}, ${cy})`} pointerEvents="none">
            {activeMed ? (
              <g className="text-center transition-all animate-fadeIn">
                <circle
                  r="64"
                  fill="var(--surface-2)"
                  stroke={HARM_COLORS[activeMed.harmLevel || 3]}
                  strokeWidth="2.5"
                  className="shadow-md"
                />
                <text
                  textAnchor="middle"
                  y="-16"
                  className="fill-[var(--ink)] font-black text-xs font-[var(--font-heading)]"
                >
                  {activeMed.name.length > 14 ? `${activeMed.name.slice(0, 12)}…` : activeMed.name}
                </text>
                <text
                  textAnchor="middle"
                  y="2"
                  className="fill-[var(--ink-2)] text-[10px] font-mono font-bold"
                >
                  Harm Tier L{activeMed.harmLevel || 3}
                </text>
                <text
                  textAnchor="middle"
                  y="18"
                  className="fill-[var(--brand-600)] text-[10px] font-mono font-bold"
                >
                  {connectedFlagsForActive.length} Interaction
                  {connectedFlagsForActive.length !== 1 ? 's' : ''}
                </text>
                <text
                  textAnchor="middle"
                  y="32"
                  className="fill-[var(--ink-3)] text-[8px] font-mono"
                >
                  Click to inspect
                </text>
              </g>
            ) : hoveredEdgeId ? (
              (() => {
                const hoveredEdge = edges.find((e) => e.id === hoveredEdgeId);
                if (!hoveredEdge) return null;
                return (
                  <g className="text-center animate-fadeIn">
                    <rect
                      x="-80"
                      y="-32"
                      width="160"
                      height="64"
                      rx="12"
                      fill="var(--surface-2)"
                      stroke={hoveredEdge.color}
                      strokeWidth="2"
                      opacity="0.95"
                    />
                    <text
                      textAnchor="middle"
                      y="-12"
                      className="fill-[var(--ink)] font-bold text-[11px]"
                    >
                      {hoveredEdge.label}
                    </text>
                    <text
                      textAnchor="middle"
                      y="4"
                      className="fill-[var(--ink-2)] text-[9px] font-mono"
                    >
                      {hoveredEdge.nodeA.medicine.name} + {hoveredEdge.nodeB.medicine.name}
                    </text>
                    <text
                      textAnchor="middle"
                      y="18"
                      className="fill-[var(--ink-3)] text-[8px] font-mono"
                    >
                      Click to open clinical drawer
                    </text>
                  </g>
                );
              })()
            ) : (
              <g className="text-center opacity-60">
                <circle r="44" fill="var(--canvas)" stroke="var(--border)" strokeWidth="1" />
                <text
                  textAnchor="middle"
                  y="-4"
                  className="fill-[var(--ink-3)] text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Interaction
                </text>
                <text
                  textAnchor="middle"
                  y="10"
                  className="fill-[var(--ink-3)] text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Web
                </text>
              </g>
            )}
          </g>

          {/* Medicine Nodes with Parallax Depth and Hover Lift */}
          <g className="nodes">
            {medicines.map((med, idx) => {
              const node = nodeMap.get(med.id || med.name);
              if (!node) return null;

              const isFocused = focusedIndex === idx;
              const connected = isNodeConnected(node);
              const nodeOpacity = connected ? 1 : 0.2;

              // Text label placement angle
              const cos = Math.cos(node.angle);
              const sin = Math.sin(node.angle);
              const labelOffset = 28;
              const lx = node.x + cos * labelOffset;
              const ly = node.y + sin * labelOffset + 4;
              const textAnchor = cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle';

              return (
                <g
                  key={med.id || idx}
                  tabIndex={0}
                  role="button"
                  aria-label={`${med.name}, Harm level L${node.harmLevel}, ${
                    node.isHerbal ? 'Herbal Supplement' : 'Medicine'
                  }`}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  onMouseLeave={() => setFocusedIndex(null)}
                  onClick={() => {
                    const flagForMed = flags.find(
                      (f) =>
                        f.medicineA?.id === med.id ||
                        f.medicineB?.id === med.id ||
                        f.medicineA?.name === med.name ||
                        f.medicineB?.name === med.name
                    );
                    if (flagForMed && onSelectFlag) {
                      onSelectFlag(flagForMed);
                    }
                  }}
                  className="cursor-pointer outline-none"
                  style={{
                    opacity: nodeOpacity,
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transform: isFocused ? 'scale(1.22)' : 'scale(1)',
                    filter: isFocused ? 'drop-shadow(0 10px 18px rgba(0,0,0,0.3))' : 'none',
                    transition: 'all 200ms ease-out',
                  }}
                >
                  {/* Outer pulse focus ring */}
                  {isFocused && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2.5"
                      className="animate-ping opacity-60"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isFocused ? 18 : 14}
                    fill={node.color}
                    stroke="var(--canvas)"
                    strokeWidth="3"
                    className="shadow-sm"
                  />

                  {/* Herbal Leaf Icon or Harm Tier Number */}
                  {node.isHerbal ? (
                    <g transform={`translate(${node.x - 7}, ${node.y - 7})`} pointerEvents="none">
                      <path
                        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                        fill="white"
                        transform="scale(0.7)"
                      />
                    </g>
                  ) : (
                    <text
                      x={node.x}
                      y={node.y + 3.5}
                      textAnchor="middle"
                      fill="white"
                      className="font-mono font-black text-[9px] pointer-events-none select-none"
                    >
                      L{node.harmLevel}
                    </text>
                  )}

                  {/* Outer Text Label */}
                  <text
                    x={lx}
                    y={ly}
                    textAnchor={textAnchor}
                    className={`text-[11px] font-bold font-[var(--font-heading)] select-none ${
                      isFocused ? 'fill-[var(--ink)] font-black text-xs' : 'fill-[var(--ink-2)]'
                    }`}
                  >
                    {med.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Keyboard and Legend Footer */}
        <div className="w-full mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--ink-3)]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-bold text-[var(--ink)]">
              ← / →
            </span>
            <span>Cycle Medicines</span>
            <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-bold text-[var(--ink)]">
              Enter
            </span>
            <span>Open Flag Details</span>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Major
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Minor
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Leaf className="w-3 h-3 text-emerald-600" /> Herbal Node
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
