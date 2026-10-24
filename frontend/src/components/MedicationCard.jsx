/**
 * MedicationCard.jsx — PolySafe Grand Finale v8.0
 *
 * A fully redesigned medication card with:
 *  - Inline harm-level color bar (left border accent)
 *  - ACB score mini-ring inside card header
 *  - FDA OFFSIDES PRR tags with proportional bar chart
 *  - Cascade warnings as amber chips with interactive tooltips
 *  - Herb interaction badges
 *  - Prescriber + date + food instruction metadata row
 *  - Action row: discontinue, edit
 *  - "New" badge for medicines added in the last 48h
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Pill, AlertTriangle, AlertCircle,
  Clock, User, Utensils, Leaf, Brain,
  TrendingUp, Trash2, Pencil, ShieldCheck, Zap, FlaskConical
} from 'lucide-react';
import { useT } from '../i18n/useT';
import { LOCALIZED_HARM_TIERS } from '../utils/localizedAlerts';

/* ── Harm level config ────────────────────────────────────────────────── */
const HARM_CONFIG = {
  1: { label: 'Minimal',  fg: 'var(--harm-l1-fg)', bg: 'var(--harm-l1-bg)', border: '#86efac' },
  2: { label: 'Low',      fg: 'var(--harm-l2-fg)', bg: 'var(--harm-l2-bg)', border: '#bef264' },
  3: { label: 'Moderate', fg: 'var(--harm-l3-fg)', bg: 'var(--harm-l3-bg)', border: '#fde047' },
  4: { label: 'High',     fg: 'var(--harm-l4-fg)', bg: 'var(--harm-l4-bg)', border: '#fb923c' },
  5: { label: 'Critical', fg: 'var(--harm-l5-fg)', bg: 'var(--harm-l5-bg)', border: '#f87171' },
};

const TYPE_CONFIG = {
  PRESCRIPTION: { label: 'Rx',     bg: 'var(--brand-50, rgba(14, 116, 144, 0.1))', fg: 'var(--brand-700, #0e7490)', icon: Pill },
  OTC:          { label: 'OTC',    bg: 'var(--caution-bg, rgba(245, 158, 11, 0.1))', fg: 'var(--caution-fg, #b45309)', icon: ShieldCheck },
  HERBAL:       { label: 'Herbal', bg: 'var(--caregiver-50, #f0fdfa)', fg: 'var(--caregiver-800, #115E59)', icon: Leaf },
};

const FOOD_LABELS = {
  before_food: 'Before food',
  with_food:   'With food',
  after_food:  'After food',
  empty_stomach: 'Empty stomach',
};

/* ── Sub-components ────────────────────────────────────────────────────── */
function ACBRing({ score = 0, size = 36 }) {
  const max = 3;
  const pct = Math.min((score || 0) / max, 1);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  const color = score === 0 ? 'var(--safe-fg)'
    : score === 1 ? 'var(--caution-fg)'
    : score === 2 ? 'var(--harm-l4-fg)'
    : 'var(--critical-fg)';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} title={`ACB Score: ${score}/3`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', transformBox: 'fill-box' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function PRRBar({ name, prr, maxPrr = 30 }) {
  const val = Number(prr) || 1;
  const pct = Math.min((val / maxPrr) * 100, 100);
  const color = val >= 10 ? 'var(--critical-fg)' : val >= 4 ? 'var(--caution-fg)' : 'var(--harm-l2-fg)';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-36 sm:w-44 truncate font-medium" style={{ color: 'var(--ink-2)' }}>{name}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="w-12 text-right font-semibold tabular-nums text-[11px]" style={{ color }}>
        {val.toFixed(1)}×
      </span>
    </div>
  );
}

function CascadeChip({ symptom, mechanism }) {
  const { t } = useT();
  const [tip, setTip] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        onClick={() => setTip(p => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
        style={{ color: 'var(--caution-fg)', background: 'var(--caution-bg)', border: '1px solid var(--caution-border)' }}
      >
        <Zap size={11} />
        {t('medication_card.cascade_chip', `Cascade: ${symptom}`, { symptom })}
      </button>
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-0 w-64 p-3 rounded-xl text-xs z-50 pointer-events-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <p className="font-semibold mb-1" style={{ color: 'var(--caution-fg)' }}>
              {t('medication_card.cascade_alert', `Cascade Alert: ${symptom}`, { symptom })}
            </p>
            <p style={{ color: 'var(--ink-3)' }}>{mechanism}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function MedicationCard({
  medicine = {},
  sideEffects = [],      // Array of { effectName, prr }
  cascades = [],         // Array of { symptom, mechanism }
  herbWarnings = [],     // Array of { herbName, severity, mechanism }
  acbScore = 0,
  onDiscontinue,
  onEdit,
  isReadOnly = false,
  showActions = true,
}) {
  const { t, lang } = useT();
  const [expanded, setExpanded] = useState(false);

  const harm = HARM_CONFIG[medicine.harmLevel] || HARM_CONFIG[3];
  const harmLabel = LOCALIZED_HARM_TIERS[lang]?.[medicine.harmLevel]?.label || harm.label;
  const typeConf = TYPE_CONFIG[medicine.type] || TYPE_CONFIG.PRESCRIPTION;
  const TypeIcon = typeConf.icon;
  const typeLabel = medicine.type === 'OTC' ? t('common.otc', 'OTC') : medicine.type === 'HERBAL' ? t('common.herbal', 'Herbal') : t('common.rx', 'Rx');

  const isNew = medicine.dateAdded
    ? (Date.now() - new Date(medicine.dateAdded).getTime()) < 48 * 60 * 60 * 1000
    : false;

  const isDiscontinued = !!medicine.removedAt;

  // Use props, or fallback to medicine embedded arrays if available
  const activeSideEffects = sideEffects.length > 0 ? sideEffects : (medicine.sideEffects || []);
  const activeCascades = cascades.length > 0 ? cascades : (medicine.cascades || []);
  const activeHerbWarnings = herbWarnings.length > 0 ? herbWarnings : (medicine.herbWarnings || []);
  const activeAcbScore = acbScore !== undefined ? acbScore : (medicine.acbScore || 0);

  const hasSafetyData = activeSideEffects.length > 0 || activeCascades.length > 0 || activeHerbWarnings.length > 0 || activeAcbScore > 0 || medicine.purpose || medicine.notes;

  const foodLabel = medicine.foodInstruction
    ? t(`medication_card.${medicine.foodInstruction}`, FOOD_LABELS[medicine.foodInstruction] || medicine.foodInstruction)
    : null;

  const dateLocale = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: isDiscontinued ? 'var(--surface-3)' : 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${harm.fg}`,
        boxShadow: 'var(--shadow-card)',
        opacity: isDiscontinued ? 0.7 : 1,
      }}
    >
      {/* ── Card Header ─────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* ACB Ring */}
          <ACBRing score={activeAcbScore} />

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Medicine name */}
              <h3 className="text-sm sm:text-base font-bold leading-tight break-words hyphens-auto" style={{
                color: isDiscontinued ? 'var(--ink-4)' : 'var(--ink)',
                textDecoration: isDiscontinued ? 'line-through' : 'none',
                fontFamily: 'var(--font-sans)',
              }}>
                {medicine.name}
              </h3>

              {/* Type badge */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ color: typeConf.fg, background: typeConf.bg }}>
                <TypeIcon size={10} />
                {typeLabel}
              </span>

              {/* Harm badge */}
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ color: harm.fg, background: harm.bg }}>
                L{medicine.harmLevel || 3} {harmLabel}
              </span>

              {/* "New" badge */}
              {isNew && !isDiscontinued && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ color: 'var(--brand-700)', background: 'var(--brand-100)' }}>
                  {t('medication_card.new_badge', 'New')}
                </motion.span>
              )}

              {isDiscontinued && (
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ color: 'var(--ink-3)', background: 'var(--surface-2)' }}>
                  {t('medication_card.discontinued_badge', 'Discontinued')}
                </span>
              )}
            </div>

            {/* Dosage + frequency */}
            {(medicine.dosage || medicine.frequency) && (
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                {[medicine.dosage, medicine.frequency].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-3 mt-1.5">
              {medicine.prescribedBy && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  <User size={11} />{medicine.prescribedBy}
                </span>
              )}
              {medicine.dateAdded && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  <Clock size={11} />{new Date(medicine.dateAdded).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {foodLabel && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  <Utensils size={11} />{foodLabel}
                </span>
              )}
            </div>

            {/* Inline cascade chips (always visible if detected) */}
            {activeCascades.length > 0 && !isDiscontinued && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeCascades.map((c, i) => (
                  <CascadeChip key={i} symptom={c.symptom} mechanism={c.mechanism} />
                ))}
              </div>
            )}

            {/* Herb warning chips */}
            {activeHerbWarnings.length > 0 && !isDiscontinued && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeHerbWarnings.slice(0, 3).map((h, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ color: 'var(--caregiver-700)', background: 'var(--caregiver-50, #f0fdfa)' }}>
                    <Leaf size={10} />{h.herbName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right side: expand toggle & actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {hasSafetyData && (
              <button
                type="button"
                onClick={() => setExpanded(p => !p)}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--brand-600)', background: expanded ? 'var(--brand-50, rgba(14,116,144,0.1))' : 'transparent' }}
                aria-expanded={expanded}
              >
                <span>{t('medication_card.safety_signals', 'Safety signals')}</span>
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}

            {/* Action buttons */}
            {showActions && !isReadOnly && !isDiscontinued && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(medicine)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] cursor-pointer"
                    style={{ color: 'var(--ink-3)' }}
                    title={t('medication_card.edit_tooltip', 'Edit Medication')}
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {onDiscontinue && (
                  <button
                    type="button"
                    onClick={() => onDiscontinue(medicine)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--critical-bg)] hover:text-[var(--critical-fg)] cursor-pointer"
                    style={{ color: 'var(--ink-3)' }}
                    title={t('medication_card.discontinue_tooltip', 'Discontinue Medication')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Expandable Safety Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {expanded && hasSafetyData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 py-4 sm:px-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-3)' }}>

              {/* FDA OFFSIDES Section */}
              {activeSideEffects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp size={13} style={{ color: 'var(--critical-fg)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                      {t('medication_card.fda_offsides_title', 'FDA Post-Market Safety Signals (OFFSIDES)')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--ink-3)', background: 'var(--surface-2)' }}>
                      {t('medication_card.prr_sub', 'PRR = Proportional Reporting Ratio')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeSideEffects
                      .slice(0, 6)
                      .map((se, i) => (
                        <PRRBar key={i} name={se.effectName || se.sideEffect || se.side_effect} prr={se.prr} />
                      ))}
                  </div>
                </div>
              )}

              {/* ACB detail */}
              {activeAcbScore > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: activeAcbScore >= 2 ? 'var(--critical-bg)' : 'var(--caution-bg)' }}>
                  <Brain size={15} className="mt-0.5 flex-shrink-0" style={{ color: activeAcbScore >= 2 ? 'var(--critical-fg)' : 'var(--caution-fg)' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: activeAcbScore >= 2 ? 'var(--critical-fg)' : 'var(--caution-fg)' }}>
                      {t('medication_card.acb_score_title', `Anticholinergic Burden Score: ${activeAcbScore}/3`, { score: activeAcbScore })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {activeAcbScore === 1 && t('medication_card.acb_mild', 'Mild cognitive load. Monitor in elderly patients. (AGS Beers Criteria 2024)')}
                      {activeAcbScore === 2 && t('medication_card.acb_mod', 'Moderate cognitive risk. Associated with memory impairment. Avoid in 65+ patients if possible.')}
                      {activeAcbScore >= 3 && t('medication_card.acb_high', 'High anticholinergic burden. Strongly associated with delirium and falls. Review this regimen.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Herb warnings */}
              {activeHerbWarnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf size={13} style={{ color: 'var(--caregiver-600)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>
                      {t('medication_card.herb_interactions_title', `Herb & Supplement Interactions (${activeHerbWarnings.length})`, { count: activeHerbWarnings.length })}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeHerbWarnings.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <span className="font-semibold flex-shrink-0" style={{ color: 'var(--caregiver-700)' }}>{h.herbName}:</span>
                        <span style={{ color: 'var(--ink-3)' }}>{h.mechanism}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical indication */}
              {medicine.purpose && (
                <div className="flex items-start gap-2 text-xs">
                  <FlaskConical size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-600)' }} />
                  <p style={{ color: 'var(--ink-3)' }}>
                    <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
                      {t('medication_card.indication_label', 'Indication:')}{' '}
                    </span>
                    {medicine.purpose}
                  </p>
                </div>
              )}

              {/* Notes */}
              {medicine.notes && (
                <div className="text-xs p-2.5 rounded-lg italic" style={{ color: 'var(--ink-3)', background: 'var(--surface-2)' }}>
                  "{medicine.notes}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
