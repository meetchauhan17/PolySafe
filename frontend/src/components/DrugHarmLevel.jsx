/**
 * DrugHarmLevel.jsx — Industrial Skeuomorphic WHO/NCI Harm Level Visualizers & OFFSIDES Signal Miner
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Loader2, Info, FlaskConical,
  Activity, AlertTriangle, Pill, Heart
} from 'lucide-react';
import Card from './Card';
import LedIndicator from './LedIndicator';

// ─── Harm level config (WHO / NCI 5-Tier) ─────────────────────────────────────
export const HARM_LEVELS = {
  1: {
    tier: 'L1',
    label: 'Low Risk',
    shortLabel: 'L1 LOW',
    color: 'var(--led-safe)',
    ledStatus: 'safe',
    bg: 'bg-emerald-950/5',
    border: 'border-[var(--led-safe)]',
    badgeCls: 'text-[var(--led-safe)] border-[var(--led-safe)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--led-safe)]',
    tip: 'Multivitamins, minerals, probiotics, herbs — minimal inherent clinical toxicity.',
  },
  2: {
    tier: 'L2',
    label: 'Mild Risk',
    shortLabel: 'L2 MILD',
    color: 'var(--accent-secondary)',
    ledStatus: 'online',
    bg: 'bg-sky-950/5',
    border: 'border-[var(--accent-secondary)]',
    badgeCls: 'text-[var(--accent-secondary)] border-[var(--accent-secondary)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--accent-secondary)]',
    tip: 'Antacids, H2 blockers, PPIs, antihistamines — monitor for mild GI or drowsiness effects.',
  },
  3: {
    tier: 'L3',
    label: 'Moderate Risk',
    shortLabel: 'L3 MOD',
    color: 'var(--led-caution)',
    ledStatus: 'caution',
    bg: 'bg-amber-950/5',
    border: 'border-[var(--led-caution)]',
    badgeCls: 'text-[var(--led-caution)] border-[var(--led-caution)] shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--led-caution)]',
    tip: 'NSAIDs, CCBs, beta2 agonists, antibiotics, steroids — routine clinical monitoring advised.',
  },
  4: {
    tier: 'L4',
    label: 'High Risk',
    shortLabel: 'L4 HIGH',
    color: '#d97706',
    ledStatus: 'caution',
    bg: 'bg-orange-950/5',
    border: 'border-amber-500',
    badgeCls: 'text-amber-600 border-amber-500 shadow-[var(--shadow-sm)]',
    barColor: 'bg-amber-500',
    tip: 'Statins, opioids, SSRIs/SNRIs, TCAs, ARBs, ACEIs, antidiabetics — high-alert prescription drug.',
  },
  5: {
    tier: 'L5',
    label: 'Critical Risk',
    shortLabel: 'L5 CRIT',
    color: 'var(--led-critical)',
    ledStatus: 'critical',
    bg: 'bg-rose-950/5',
    border: 'border-[var(--led-critical)]',
    badgeCls: 'text-[var(--led-critical)] border-[var(--led-critical)] font-black shadow-[var(--shadow-sm)]',
    barColor: 'bg-[var(--led-critical)]',
    tip: 'Anticoagulants (Warfarin), insulins, anticonvulsants, lithium — narrow therapeutic index.',
  },
};

const CLASS_RISK_MAP = {
  // L5 Critical
  'anticoagulant': 5, 'blood thinner': 5, 'warfarin': 5, 'factor xa': 5, 'heparin': 5, 'apixaban': 5,
  'insulin': 5, 'basal insulin': 5, 'anticonvulsant': 5, 'antiseizure': 5, 'phenytoin': 5, 'carbamazepine': 5,
  'valproate': 5, 'lithium': 5, 'chemotherapy': 5, 'cytotoxic': 5, 'immunosuppressant': 5,

  // L4 High
  'statin': 4, 'atorvastatin': 4, 'rosuvastatin': 4, 'simvastatin': 4, 'opioid': 4, 'narcotic': 4,
  'tramadol': 4, 'ssri': 4, 'snri': 4, 'tca': 4, 'sertraline': 4, 'fluoxetine': 4, 'escitalopram': 4,
  'duloxetine': 4, 'amitriptyline': 4, 'arb': 4, 'acei': 4, 'telmisartan': 4, 'losartan': 4, 'ramipril': 4,
  'oral antidiabetic': 4, 'metformin': 4, 'glimepiride': 4, 'gliclazide': 4, 'sitagliptin': 4, 'dapagliflozin': 4,
  'benzodiazepine': 4, 'antipsychotic': 4,

  // L3 Moderate
  'nsaid': 3, 'paracetamol': 3, 'acetaminophen': 3, 'ibuprofen': 3, 'naproxen': 3, 'diclofenac': 3, 'aceclofenac': 3,
  'calcium channel blocker': 3, 'ccb': 3, 'amlodipine': 3, 'nifedipine': 3, 'diltiazem': 3,
  'beta2 agonist': 3, 'salbutamol': 3, 'albuterol': 3, 'formoterol': 3,
  'antibiotic': 3, 'amoxicillin': 3, 'augmentin': 3, 'azithromycin': 3, 'ciprofloxacin': 3, 'cefixime': 3,
  'corticosteroid': 3, 'steroid': 3, 'prednisolone': 3, 'budesonide': 3, 'dexamethasone': 3,

  // L2 Mild
  'antacid': 2, 'h2 blocker': 2, 'ppi': 2, 'pantoprazole': 2, 'omeprazole': 2, 'rabeprazole': 2, 'famotidine': 2, 'ranitidine': 2,
  'antihistamine': 2, 'cetirizine': 2, 'levocetirizine': 2, 'loratadine': 2, 'fexofenadine': 2, 'diphenhydramine': 2,
  'prokinetic': 2, 'domperidone': 2, 'metoclopramide': 2, 'itopride': 2, 'sucralfate': 2,

  // L1 Low
  'multivitamin': 1, 'vitamin': 1, 'mineral': 1, 'calcium': 1, 'zinc': 1, 'iron': 1, 'folic acid': 1,
  'probiotic': 1, 'herb': 1, 'herbal': 1, 'turmeric': 1, 'curcumin': 1, 'ginkgo': 1, 'ashwagandha': 1,
  'garlic': 1, 'ginseng': 1, 'ginger': 1, 'omega-3': 1,
};

export function computeRiskLevel(category = '', name = '', flags = []) {
  const text = `${category} ${name}`.toLowerCase();

  for (const [key, level] of Object.entries(CLASS_RISK_MAP)) {
    if (text.includes(key)) {
      return level;
    }
  }

  if (flags.length >= 2) return 4;
  if (flags.length === 1) return 3;

  return 3;
}

// ─── OFFSIDES Side Effects Explorer Component (Expandable) ────────────────────
export function KnownSideEffectsPanel({ medicineId, medicineName, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !data && medicineId) {
      setLoading(true);
      axios.get(`/medicine/${medicineId}/sideeffects`)
        .then(r => setData(r.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [open, data, medicineId]);

  return (
    <div className={`rounded-xl overflow-hidden shadow-[var(--shadow-sm)] bg-[var(--chassis)] border border-[rgba(255,255,255,0.3)] ${className}`}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--chassis)] hover:bg-[var(--chassis-dark)] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] font-display">Adverse Drug Reactions</span>
          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis-dark)] px-2 py-0.5 rounded-full shadow-[var(--shadow-recessed)]">
            FDA OFFSIDES
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--accent-primary)]">
          <span>{open ? 'COLLAPSE' : 'EXPAND'}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--chassis-dark)]"
          >
            <div className="p-3.5 space-y-3 bg-[var(--chassis)]">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span className="font-bold uppercase tracking-wider">FDA FAERS Signals (PRR ≥ 2.0)</span>
                {data?.total ? <span>{data.total} signals identified</span> : null}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-[var(--text-muted)] font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                  <span>Mining 1.22M OFFSIDES records...</span>
                </div>
              ) : !data || data.sideEffects?.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] font-mono italic py-1">
                  No statistically elevated adverse signals (PRR ≥ 2.0) found for {medicineName || 'this medicine'}.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.sideEffects.map((se, idx) => {
                    const prr = parseFloat(se.prr);
                    const isHigh = prr >= 10;
                    const isMedium = prr >= 5;
                    const badgeCls = isHigh
                      ? 'text-[var(--led-critical)] border-[var(--led-critical)]'
                      : isMedium
                      ? 'text-orange-600 border-orange-500'
                      : 'text-amber-600 border-amber-500';

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[var(--chassis)] shadow-[var(--shadow-recessed)] text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Activity className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="font-medium text-[var(--text-primary)] leading-snug break-words">
                            {se.sideEffect}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-[var(--chassis)] shadow-[var(--shadow-sm)] whitespace-nowrap ${badgeCls}`}
                            title={`Proportional Reporting Ratio (PRR): ${prr.toFixed(2)}`}
                          >
                            PRR {prr.toFixed(1)}×
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 1. Drug Harm Badge (Compact, Pre-Add & Card Indicator) ───────────────────
export function DrugHarmBadge({ harmLevel, category = '', name = '', flags = [], size = 'sm', className = '' }) {
  const level = harmLevel || computeRiskLevel(category, name, flags);
  const cfg = HARM_LEVELS[level] || HARM_LEVELS[3];

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-xl border bg-[var(--chassis)] ${cfg.badgeCls} ${className}`}
        title={cfg.tip}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
        <span>{cfg.shortLabel} — {cfg.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border bg-[var(--chassis)] ${cfg.badgeCls} ${className}`}
      title={cfg.tip}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      <span>{cfg.shortLabel}</span>
    </span>
  );
}

// ─── 2. Drug Harm Panel (Expandable on Medicine Cards) ─────────────────────────
export function DrugHarmPanel({ medicine, flags = [], className = '' }) {
  const [open, setOpen] = useState(false);

  const level = medicine.harmLevel || computeRiskLevel(medicine.category, medicine.name, flags);
  const cfg = HARM_LEVELS[level] || HARM_LEVELS[3];

  const myFlags = flags.filter(f =>
    f.medicineA?.id === medicine.id || f.medicineB?.id === medicine.id
  );

  return (
    <div className={`rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] border border-[rgba(255,255,255,0.4)] ${className}`}>
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--chassis)] hover:bg-[var(--chassis-dark)] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <LedIndicator status={cfg.ledStatus} size="sm" />
          <span className="text-xs font-mono font-bold" style={{ color: cfg.color }}>
            {cfg.tier} · {cfg.label}
          </span>
          {myFlags.length > 0 && (
            <span className="text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded-full font-bold">
              {myFlags.length} flag{myFlags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="harm-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-2 space-y-3 bg-[var(--chassis)]">
              {/* Dynamic Risk Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--text-muted)] font-bold uppercase">WHO/NCI Harm Level</span>
                  <span className="font-bold" style={{ color: cfg.color }}>Level {level} / 5</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--chassis)] shadow-[var(--shadow-recessed)] overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${cfg.barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(level / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Clinical note */}
              <div className="flex gap-2 text-[11px] text-[var(--text-muted)] leading-snug">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--text-muted)]" />
                <span>{cfg.tip}</span>
              </div>

              {/* Class & Generic info */}
              {medicine.category && (
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
                  <Pill className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span className="font-bold">CLASS:</span>
                  <span>{medicine.category}</span>
                </div>
              )}

              {/* Active interaction flags */}
              {myFlags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-rose-600" />
                    Active Interaction Flags
                  </p>
                  {myFlags.map((flag, i) => {
                    const other = flag.medicineA?.id === medicine.id ? flag.medicineB?.name : flag.medicineA?.name;
                    return (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] font-mono leading-tight text-[var(--text-primary)]">
                        <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{flag.severity}</strong> with <em>{other}</em></span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* OFFSIDES Side Effects Explorer */}
              <KnownSideEffectsPanel
                medicineId={medicine.id}
                medicineName={medicine.name}
                className="mt-2"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 3. Polypharmacy Harm Dashboard (Home Page Overview Widget) ───────────────
export function PolypharmacyHarmDashboard({ medicines = [], flags = [], regimenRisk = null }) {
  const shouldReduceMotion = useReducedMotion();
  if (!medicines || medicines.length === 0) return null;

  const harmLevels = medicines.map(m => m.harmLevel || computeRiskLevel(m.category, m.name, flags));
  const avgRisk = harmLevels.reduce((a, b) => a + b, 0) / harmLevels.length;
  const highestLevel = Math.max(...harmLevels);

  const highestDrug = medicines.find(m => (m.harmLevel || computeRiskLevel(m.category, m.name, flags)) === highestLevel) || medicines[0];
  const highestCfg = HARM_LEVELS[highestLevel] || HARM_LEVELS[3];

  const currentTierLevel = regimenRisk?.level || Math.round(avgRisk);
  const currentTierCfg = HARM_LEVELS[currentTierLevel] || HARM_LEVELS[3];

  return (
    <Card
      title="Polypharmacy Regimen Risk"
      icon={<Heart className="w-4 h-4 text-[var(--accent-primary)]" />}
      badge={
        <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis)] shadow-[var(--shadow-recessed)] px-2.5 py-1 rounded-xl">
          {medicines.length} ACTIVE DRUG{medicines.length !== 1 ? 'S' : ''}
        </span>
      }
      className="space-y-4"
    >
      <div className="space-y-3.5">
        {/* 2 Stat Inset Wells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Average Risk Score */}
          <div className="p-4 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Average Regimen Risk</span>
              <LedIndicator status={currentTierCfg.ledStatus} size="sm" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black font-mono" style={{ color: currentTierCfg.color }}>
                {avgRisk.toFixed(1)} / 5.0
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[var(--chassis)] shadow-[var(--shadow-sm)]" style={{ borderColor: currentTierCfg.color, color: currentTierCfg.color }}>
                {currentTierCfg.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono leading-tight">
              WHO/NCI weighted pharmacological harm classification.
            </p>
          </div>

          {/* Highest Risk Drug */}
          <div className="p-4 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Peak Risk Agent</span>
              <LedIndicator status={highestCfg.ledStatus} size="sm" />
            </div>
            <div className="flex items-baseline gap-2 flex-wrap min-w-0">
              <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-display truncate min-w-0">
                {highestDrug.name}
              </span>
              <DrugHarmBadge harmLevel={highestLevel} size="sm" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono leading-tight">
              {highestCfg.tip}
            </p>
          </div>
        </div>

        {/* 5-Tier Spectrum Meter with Crisp Embedded Active Indicator */}
        <div className="space-y-2.5 p-3.5 sm:p-4 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] border border-[rgba(255,255,255,0.4)]">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            <span className="tracking-wider uppercase">WHO/NCI 5-Tier Spectrum</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--chassis-dark)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.3)] shadow-[var(--shadow-recessed)]">
              Clinical Scale
            </span>
          </div>
          <span
            className="px-2.5 py-0.5 rounded-lg border text-xs font-extrabold shadow-xs"
            style={{
              borderColor: currentTierCfg.color,
              color: currentTierCfg.color,
              backgroundColor: 'var(--chassis)',
            }}
          >
            Regimen: {currentTierCfg.tier} ({currentTierCfg.label})
          </span>
        </div>

        {/* 5 Segmented Color Blocks */}
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-[var(--chassis-dark)] shadow-[var(--shadow-recessed)]">
          {[1, 2, 3, 4, 5].map((lvl, index) => {
            const cfg = HARM_LEVELS[lvl];
            const isCurrent = lvl === currentTierLevel;
            return (
              <motion.div
                key={lvl}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: isCurrent ? 1 : 0.4,
                  scale: isCurrent ? 1.0 : 0.98,
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { delay: index * 0.05, duration: 0.2, ease: 'easeOut' }
                }
                className={`h-4.5 rounded-lg transition-all relative flex items-center justify-center ${cfg.barColor} ${
                  isCurrent
                    ? 'ring-2 ring-white/90 dark:ring-black/70 shadow-sm z-10'
                    : 'hover:opacity-70'
                }`}
                title={`Level ${lvl}: ${cfg.label} ${isCurrent ? '(Current Regimen)' : ''}`}
              >
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* 5 Uniformly Aligned Labels on Same Baseline */}
        <div className="grid grid-cols-5 gap-1.5 text-center font-mono items-center">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const cfg = HARM_LEVELS[lvl];
            const isCurrent = lvl === currentTierLevel;
            return (
              <div key={lvl} className="flex justify-center">
                {isCurrent ? (
                  <span
                    className="w-full py-0.5 px-1 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider bg-[var(--chassis)] border shadow-[var(--shadow-sm)] truncate"
                    style={{ borderColor: cfg.color, color: cfg.color }}
                  >
                    {cfg.shortLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 py-0.5 truncate">
                    {cfg.shortLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </Card>
  );
}

export default DrugHarmPanel;
