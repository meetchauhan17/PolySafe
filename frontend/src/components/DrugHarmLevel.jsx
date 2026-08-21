/**
 * DrugHarmLevel.jsx
 *
 * Visualizes the potential harm / risk level of individual medicines and overall polypharmacy regimen using:
 *  - WHO / NCI harm classification (1–5 scale)
 *  - OFFSIDES 1.22M FDA FAERS adverse drug reaction dataset (PRR >= 2.0)
 *
 * Components:
 *  - DrugHarmBadge: Compact or prominent harm level badge with exact WHO/NCI tier colors
 *  - DrugHarmPanel: Expandable detailed accordion with Risk Meter, Class, Safety Tip, active DDIs, and OFFSIDES side effects explorer
 *  - KnownSideEffectsPanel: Dedicated expandable FDA pharmacovigilance side effects explorer
 *  - PolypharmacyHarmDashboard: Top-level overview card featuring Average Score, 5-tier color spectrum, and Highest Risk Drug
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, ShieldX, Zap, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, Info, FlaskConical,
  Activity, Heart, Pill, Eye,
} from 'lucide-react';
import Card from './Card';

// ─── Harm level config (WHO / NCI 5-Tier) ─────────────────────────────────────
export const HARM_LEVELS = {
  1: {
    tier: 'L1',
    label: 'Low Risk',
    shortLabel: 'L1 LOW',
    color: '#22C55E', // Green
    bg: 'bg-green-50',
    border: 'border-green-300',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm',
    barColor: 'bg-[#22C55E]',
    dotColor: '#22C55E',
    Icon: ShieldCheck,
    iconColor: 'text-emerald-600',
    tip: 'Multivitamins, minerals, probiotics, herbs — generally safe with minimal inherent toxicity.',
  },
  2: {
    tier: 'L2',
    label: 'Mild Risk',
    shortLabel: 'L2 MILD',
    color: '#84CC16', // Lime
    bg: 'bg-lime-50',
    border: 'border-lime-300',
    badgeCls: 'bg-lime-100 text-lime-800 border-lime-300 shadow-sm',
    barColor: 'bg-[#84CC16]',
    dotColor: '#84CC16',
    Icon: ShieldCheck,
    iconColor: 'text-lime-600',
    tip: 'Antacids, H2 blockers, PPIs, antihistamines, prokinetics — monitor for mild GI or drowsiness effects.',
  },
  3: {
    tier: 'L3',
    label: 'Moderate Risk',
    shortLabel: 'L3 MOD',
    color: '#F59E0B', // Amber
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badgeCls: 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm',
    barColor: 'bg-[#F59E0B]',
    dotColor: '#F59E0B',
    Icon: ShieldAlert,
    iconColor: 'text-amber-600',
    tip: 'NSAIDs, CCBs, beta2 agonists, antibiotics, steroids — routine clinical monitoring advised.',
  },
  4: {
    tier: 'L4',
    label: 'High Risk',
    shortLabel: 'L4 HIGH',
    color: '#F97316', // Orange
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    badgeCls: 'bg-orange-100 text-orange-900 border-orange-300 shadow-sm',
    barColor: 'bg-[#F97316]',
    dotColor: '#F97316',
    Icon: ShieldAlert,
    iconColor: 'text-orange-600',
    tip: 'Statins, opioids, SSRIs/SNRIs, TCAs, ARBs, ACEIs, antidiabetics — high-alert prescription drug.',
  },
  5: {
    tier: 'L5',
    label: 'Critical Risk',
    shortLabel: 'L5 CRIT',
    color: '#EF4444', // Red
    bg: 'bg-red-50',
    border: 'border-red-300',
    badgeCls: 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold shadow-sm',
    barColor: 'bg-[#EF4444]',
    dotColor: '#EF4444',
    Icon: ShieldX,
    iconColor: 'text-rose-600',
    tip: 'Anticoagulants (Warfarin), insulins, anticonvulsants, lithium — narrow therapeutic index.',
  },
};

// ─── Fallback class dictionary for client side matching ───────────────────────
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

/**
 * Computes individual risk level (1 to 5) from category and name strings
 */
export function computeRiskLevel(category = '', name = '', flags = []) {
  const text = `${category} ${name}`.toLowerCase();

  for (const [key, level] of Object.entries(CLASS_RISK_MAP)) {
    if (text.includes(key)) {
      return level;
    }
  }

  // Fallback heuristic based on interaction flags
  if (flags.length >= 2) return 4;
  if (flags.length === 1) return 3;

  return 3; // Default Moderate
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
    <div className={`rounded-2xl border border-[rgba(191,180,155,0.4)] bg-[#EDE8DC]/70 overflow-hidden shadow-xs ${className}`}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#EDE8DC] hover:bg-[#E5DFD1] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#2B6E5E]" />
          <span className="text-xs font-bold text-[#1C2B27]">Known Side Effects</span>
          <span className="text-[10px] font-semibold text-[#5C6B64] bg-[#DED7C6] px-2 py-0.5 rounded-full">
            FDA Signals
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#2B6E5E]">
          <span>{open ? 'Hide' : 'Explore'}</span>
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
            className="overflow-hidden border-t border-[rgba(191,180,155,0.3)]"
          >
            <div className="p-3.5 space-y-3 bg-[#FDFBF7]/90">
              <div className="flex items-center justify-between text-[10px] text-[#5C6B64]">
                <span className="font-bold uppercase tracking-wider">From FDA pharmacovigilance records (PRR ≥ 2.0)</span>
                {data?.total ? <span>{data.total} signals found</span> : null}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-[#5C6B64]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2B6E5E]" />
                  <span>Querying 1.22M OFFSIDES records...</span>
                </div>
              ) : !data || data.sideEffects?.length === 0 ? (
                <p className="text-xs text-[#5C6B64] italic py-1">
                  No statistically significant adverse reactions (PRR ≥ 2.0) found for {medicineName || 'this medicine'}.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.sideEffects.map((se, idx) => {
                    const prr = parseFloat(se.prr);
                    const isHigh = prr >= 10;
                    const isMedium = prr >= 5;
                    const badgeBg = isHigh
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : isMedium
                      ? 'bg-orange-100 text-orange-900 border-orange-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300';

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#EDE8DC] border border-[#E7E1D3] shadow-xs text-xs hover:bg-[#E5DFD1] transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Activity className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="font-bold text-[#1C2B27] leading-snug break-words">
                            {se.sideEffect}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap ${badgeBg}`}
                            title={`Proportional Reporting Ratio (PRR): ${prr.toFixed(2)} — FDA FAERS statistically significant signal`}
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
  const { Icon } = cfg;

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl border ${cfg.badgeCls} ${className}`}
        title={cfg.tip}
      >
        <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
        <span>{cfg.shortLabel} — {cfg.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${cfg.badgeCls} ${className}`}
      title={cfg.tip}
    >
      <Icon className={`w-2.5 h-2.5 ${cfg.iconColor}`} />
      <span>{cfg.shortLabel}</span>
    </span>
  );
}

// ─── 2. Drug Harm Panel (Expandable on Medicine Cards) ─────────────────────────
export function DrugHarmPanel({ medicine, flags = [], className = '' }) {
  const [open, setOpen] = useState(false);

  const level = medicine.harmLevel || computeRiskLevel(medicine.category, medicine.name, flags);
  const cfg = HARM_LEVELS[level] || HARM_LEVELS[3];
  const { Icon } = cfg;

  // Filter flags matching this drug
  const myFlags = flags.filter(f =>
    f.medicineA?.id === medicine.id || f.medicineB?.id === medicine.id
  );

  return (
    <div className={`rounded-2xl overflow-hidden border ${cfg.border} shadow-sm ${className}`}>
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 ${cfg.bg} transition-all hover:brightness-95 cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${cfg.iconColor} flex-shrink-0`} />
          <span className="text-xs font-extrabold" style={{ color: cfg.color }}>
            {cfg.tier} · {cfg.label}
          </span>
          {myFlags.length > 0 && (
            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded-full font-bold">
              {myFlags.length} interaction{myFlags.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#5C6B64]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#5C6B64]" />}
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
            <div className={`px-3.5 pb-3.5 pt-2 space-y-3 ${cfg.bg}`}>
              {/* Dynamic Risk Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#5C6B64] font-semibold">WHO/NCI Risk Meter</span>
                  <span className="font-bold" style={{ color: cfg.color }}>Level {level}/5 · {cfg.label}</span>
                </div>
                <div className="h-2 rounded-full bg-[#EDE8DC] shadow-inner overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${cfg.barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(level / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Clinical note */}
              <div className="flex gap-2 text-[11px] text-[#3B4A42] leading-snug">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#5C6B64]" />
                <span>{cfg.tip}</span>
              </div>

              {/* Class & Generic info */}
              {medicine.category && (
                <div className="flex items-center gap-2 text-[11px] text-[#5C6B64]">
                  <Pill className="w-3 h-3 text-[#2B6E5E]" />
                  <span className="font-semibold">Class:</span>
                  <span>{medicine.category}</span>
                </div>
              )}

              {/* Active interaction flags */}
              {myFlags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[#5C6B64] uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-rose-600" />
                    Active Interaction Flags
                  </p>
                  {myFlags.map((flag, i) => {
                    const other = flag.medicineA?.id === medicine.id ? flag.medicineB?.name : flag.medicineA?.name;
                    return (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] leading-tight text-[#3B4A42]">
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
  if (!medicines || medicines.length === 0) return null;

  // Calculate scores
  const harmLevels = medicines.map(m => m.harmLevel || computeRiskLevel(m.category, m.name, flags));
  const avgRisk = harmLevels.reduce((a, b) => a + b, 0) / harmLevels.length;
  const highestLevel = Math.max(...harmLevels);

  // Find the highest risk medicine
  const highestDrug = medicines.find(m => (m.harmLevel || computeRiskLevel(m.category, m.name, flags)) === highestLevel) || medicines[0];
  const highestCfg = HARM_LEVELS[highestLevel] || HARM_LEVELS[3];

  // Determine current highlighted level (1 to 5)
  const currentTierLevel = regimenRisk?.level || Math.round(avgRisk);
  const currentTierCfg = HARM_LEVELS[currentTierLevel] || HARM_LEVELS[3];

  return (
    <Card
      title="Polypharmacy Risk Overview"
      icon={<Heart className="w-4 h-4 text-rose-500" />}
      badge={
        <span className="text-[11px] font-bold text-[#5C6B64] bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] px-2.5 py-1 rounded-xl">
          {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
        </span>
      }
      className="space-y-4"
    >
      {/* 2 Stat Cards: Average Risk Score & Highest Risk Drug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Average Risk Score */}
        <div className={`min-w-0 p-4 rounded-2xl border ${currentTierCfg.border} ${currentTierCfg.bg} space-y-1`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C6B64] uppercase tracking-wider">Average Risk Score</span>
            <currentTierCfg.Icon className={`w-4 h-4 ${currentTierCfg.iconColor} flex-shrink-0`} />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black" style={{ color: currentTierCfg.color, fontFamily: "'Fraunces', serif" }}>
              {avgRisk.toFixed(1)} / 5.0
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border" style={{ borderColor: currentTierCfg.color, color: currentTierCfg.color }}>
              {currentTierCfg.label}
            </span>
          </div>
          <p className="text-[11px] text-[#5C6B64] leading-tight">
            Regimen score based on WHO/NCI 5-tier pharmacological risk indices.
          </p>
        </div>

        {/* Highest Risk Drug */}
        <div className={`min-w-0 p-4 rounded-2xl border ${highestCfg.border} ${highestCfg.bg} space-y-1`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5C6B64] uppercase tracking-wider">Highest Risk Drug</span>
            <highestCfg.Icon className={`w-4 h-4 ${highestCfg.iconColor} flex-shrink-0`} />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span className="text-sm sm:text-base font-bold text-[#1C2B27] truncate min-w-0">
              {highestDrug.name}
            </span>
            <DrugHarmBadge harmLevel={highestLevel} size="sm" />
          </div>
          <p className="text-[11px] text-[#5C6B64] leading-tight">
            {highestCfg.tip}
          </p>
        </div>
      </div>

      {/* 5-Tier Horizontal Bar with Current Level Highlighted */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">
        <div className="flex items-center justify-between text-xs font-bold text-[#1C2B27]">
          <span>WHO/NCI 5-Tier Spectrum</span>
          <span style={{ color: currentTierCfg.color }}>Patient Level: {currentTierCfg.tier} ({currentTierCfg.label})</span>
        </div>

        {/* 5 color blocks */}
        <div className="grid grid-cols-5 gap-1.5 h-3.5 rounded-xl overflow-hidden p-0.5 bg-[#DED7C6]">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const cfg = HARM_LEVELS[lvl];
            const isCurrent = lvl === currentTierLevel;
            return (
              <div
                key={lvl}
                className={`h-full rounded-lg transition-all relative ${cfg.barColor} ${
                  isCurrent ? 'ring-2 ring-white scale-105 shadow-md z-10' : 'opacity-70'
                }`}
                title={`Level ${lvl}: ${cfg.label}`}
              />
            );
          })}
        </div>

        {/* 5 labels underneath */}
        <div className="grid grid-cols-5 text-[9px] sm:text-[10px] text-center font-bold text-[#5C6B64]">
          <span className="text-[#22C55E]">L1 Low</span>
          <span className="text-[#84CC16]">L2 Mild</span>
          <span className="text-[#F59E0B]">L3 Mod</span>
          <span className="text-[#F97316]">L4 High</span>
          <span className="text-[#EF4444]">L5 Crit</span>
        </div>
      </div>
    </Card>
  );
}

export default DrugHarmPanel;
