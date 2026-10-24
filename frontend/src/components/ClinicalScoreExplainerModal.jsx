import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  HelpCircle,
  ShieldAlert,
  Brain,
  Activity,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Stethoscope,
  Users,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAcbClinicalReason } from '../utils/acbClinicalReasons';

export default function ClinicalScoreExplainerModal({
  isOpen,
  open: openProp,
  onClose,
  initialTab = 'harm',
  regimenRisk,
  acbScore = 5,
  medicines = [],
  flags = [],
}) {
  const open = openProp ?? isOpen ?? false;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copiedId, setCopiedId] = useState(null);

  // Sync active tab if initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleCopy = (id, text) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const riskLevel = regimenRisk?.level ?? (flags.some(f => (f.severity || '').toUpperCase() === 'MAJOR') ? 5 : 3);
  const averageRisk = regimenRisk?.averageRisk ?? 3.0;
  const highestDrug = regimenRisk?.highestRiskDrug?.name || medicines.find(m => (m.harmLevel || 1) >= 4)?.name || 'Warfarin';

  const tabs = [
    { id: 'harm', label: 'Overall Harm Score', icon: ShieldAlert, badge: `${riskLevel}.0 / 5` },
    { id: 'acb', label: 'Anticholinergic (ACB)', icon: Brain, badge: `${acbScore} / 3+` },
    { id: 'average', label: 'Average Regimen Burden', icon: Activity, badge: `${averageRisk} / 5` },
    { id: 'peak', label: 'Peak Risk Agent', icon: Pill, badge: highestDrug },
    { id: 'tiers', label: 'Interaction Tiers', icon: AlertTriangle, badge: 'WHO / DDInter' },
  ];

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden z-[201] my-8 flex flex-col max-h-[90vh]"
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--canvas)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
                Understanding Your PolySafe Safety Scores
              </h2>
              <p className="text-xs text-[var(--ink-3)] font-mono">
                Validated Clinical Rationale &amp; Explanatory Guide for Patients &amp; Doctors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--brand-600)] text-white shadow-xs'
                    : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-2)] text-[var(--ink-3)]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'harm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-600 font-extrabold text-xl font-mono">
                    {riskLevel}.0
                  </div>
                  <div>
                    <h3 className="font-extrabold text-rose-900 dark:text-rose-200 text-base">
                      Overall Harm Score: {riskLevel === 5 ? 'Critical Pharmacological Risk' : 'Elevated Vigilance'}
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Standard: PolySafe Harm Level (L1 to L5) &amp; Clinical Pharmacological Criteria
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-600 text-white self-start sm:self-auto">
                  Score: {riskLevel}.0 / 5.0
                </span>
              </div>

              {/* Exact Clinical Reason */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--brand-600)]" />
                  <span>Why do you have this score? (Exact Clinical Reason)</span>
                </h4>
                <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                  PolySafe calculates your overall score by evaluating <strong>two clinical factors simultaneously</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[var(--ink-2)]">
                  <li>
                    <strong>Narrow Therapeutic Index (NTI) Drug:</strong> Your regimen contains <strong>{highestDrug}</strong> (harm level {riskLevel}), which requires extremely strict blood and dosage surveillance.
                  </li>
                  <li>
                    <strong>Active Interaction Flags:</strong> There are <strong>{flags.length || 2} active interaction alerts</strong> in your regimen (e.g. anticoagulant combined with antiplatelet/herbal agents).
                  </li>
                  <li>
                    <strong>Classification Rule:</strong> Under international clinical safety standards, whenever any single medicine has toxicity level 5 OR the regimen has 3+ active interaction flags, the overall score is elevated to <strong>5.0 (Critical Risk)</strong> to ensure physician review.
                  </li>
                </ul>
              </div>

              {/* Explaining to Doctor */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>How to explain this score to your Doctor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'doc-harm',
                        `Doctor, my PolySafe pharmacological surveillance rated my regimen at Level ${riskLevel} Critical Risk due to concurrent prescriptions (${highestDrug}) and ${flags.length} active interaction flags. Could we review if all medications are still strictly necessary, or if safer alternatives or timing separation can reduce our bleeding and toxicity risk?`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {copiedId === 'doc-harm' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'doc-harm' ? 'Copied' : 'Copy Doctor Question'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-blue-950 dark:text-blue-100 italic bg-[var(--surface)] p-3 rounded-xl border border-blue-500/20">
                  "Doctor, my PolySafe surveillance rated my regimen at Level {riskLevel} Critical Risk due to concurrent prescriptions ({highestDrug}) and {flags.length} active interaction flags. Could we review if all medications are still strictly necessary, or if safer alternatives can reduce our bleeding and toxicity risk?"
                </p>
              </div>

              {/* Explaining to Family / Caregiver */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>How to explain this to your Family or Caregiver</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  "This 5.0 score does <strong>not</strong> mean my medicines are wrong. It means my medicines are strong and sensitive. We must never change doses on our own, always take them on time, and watch out for bleeding, bruising, or dizziness."
                </p>
              </div>
            </div>
          )}

          {activeTab === 'acb' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400 font-extrabold text-xl font-mono">
                    {acbScore}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-900 dark:text-amber-200 text-base">
                      Anticholinergic Cognitive Burden: {acbScore >= 3 ? 'Critical Risk (3+ Threshold)' : 'Moderate Load'}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Standard: American Geriatrics Society (AGS) Beers Criteria 2023 · Boustani ACB Scale
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-600 text-white self-start sm:self-auto">
                  Score: {acbScore} / 3+
                </span>
              </div>

              {/* Exact Clinical Reason */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--brand-600)]" />
                  <span>Why is your ACB score {acbScore}? (Exact Calculation)</span>
                </h4>
                <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                  Many common medicines unintentionally block <em>acetylcholine</em>, a vital brain chemical responsible for memory, alertness, heart rhythm, and muscle control.
                </p>
                <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-xs font-mono space-y-2">
                  <p className="font-bold text-[var(--ink)] mb-1">
                    Cumulative Regimen Calculation ({medicines.length} medications):
                  </p>
                  {medicines.length > 0 ? (
                    <div className="space-y-1.5 divide-y divide-[var(--border)]/50">
                      {medicines.map((m, idx) => {
                        const score = Number(m.acbScore ?? 0);
                        const acb = getAcbClinicalReason(m, score);
                        const badgeColor = score >= 3 ? 'text-red-600 font-bold' : score === 2 ? 'text-orange-600 font-bold' : score === 1 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-medium';
                        return (
                          <div key={idx} className="pt-1.5 first:pt-0">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-[var(--ink)] font-sans">{m.name}</span>
                              <span className={badgeColor}>
                                {score > 0 ? `+${score} pt${score > 1 ? 's' : ''}` : '0 pts (Safe)'}
                              </span>
                            </div>
                            <p className="text-[11px] font-sans text-[var(--ink-3)] leading-relaxed mt-0.5">
                              {acb.clinicalReason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <p>• Amitriptyline / Tricyclic Antidepressant: +3 points (potent central M1-M5 blockade)</p>
                      <p>• Escitalopram / SSRI: +1 point (mild muscarinic receptor affinity)</p>
                      <p>• Aspirin / NSAID: 0 points (zero muscarinic receptor affinity)</p>
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between font-bold text-xs">
                    <span className="text-[var(--ink)] font-sans">Total Cumulative ACB Score:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                      {acbScore} points
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[var(--ink-3)]">
                  Clinical Rule: Any cumulative score of <strong>3 or higher</strong> is clinically considered high risk because anticholinergic side effects multiply exponentially rather than add linearly.
                </p>
              </div>

              {/* Warning Signs in Daily Life */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Symptoms &amp; Warning Signs to Watch For
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-rose-950 dark:text-rose-100">
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Memory Fog &amp; Confusion</div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Nighttime Fall Risk</div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Extreme Dry Mouth</div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Constipation</div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Blurred Vision</div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-rose-500/20 font-medium">• Drowsiness upon waking</div>
                </div>
              </div>

              {/* Explaining to Doctor */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>How to explain this to your Doctor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'doc-acb',
                        `Doctor, my cumulative Anticholinergic Cognitive Burden (ACB) score is ${acbScore}, which is above the Beers Criteria high-risk threshold of 3. Could we evaluate deprescribing or switching to alternatives with zero anticholinergic activity to safeguard my memory and fall risk?`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {copiedId === 'doc-acb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'doc-acb' ? 'Copied' : 'Copy Doctor Question'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-blue-950 dark:text-blue-100 italic bg-[var(--surface)] p-3 rounded-xl border border-blue-500/20">
                  "Doctor, my cumulative ACB score is {acbScore}, which exceeds the Beers Criteria high-risk threshold of 3. Could we evaluate deprescribing or switching to alternatives with zero anticholinergic activity to safeguard my memory and prevent falls?"
                </p>
              </div>
            </div>
          )}

          {activeTab === 'average' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-700 dark:text-teal-400 font-extrabold text-xl font-mono">
                    {averageRisk}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-teal-900 dark:text-teal-200 text-base">
                      Average Regimen Burden: {averageRisk >= 3.5 ? 'Heavy Baseline Load' : 'Moderate Load (Tier 3)'}
                    </h3>
                    <p className="text-xs text-teal-700 dark:text-teal-300">
                      Arithmetic Mean Toxicity across all active prescriptions
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-600 text-white self-start sm:self-auto">
                  {averageRisk} / 5.0
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs sm:text-sm text-[var(--ink-2)]">
                <h4 className="font-bold text-[var(--ink)] uppercase tracking-wider text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--brand-600)]" />
                  <span>How is Average Regimen Burden calculated?</span>
                </h4>
                <p>
                  Each medicine in your profile has an individual toxicity level from 1 (mild, like vitamin D) to 5 (narrow therapeutic window, like warfarin).
                </p>
                <p>
                  The Average Burden adds up the individual toxicity levels of all your active medications and divides by the total count. E.g.:
                </p>
                <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] font-mono text-xs">
                  (Warfarin [5] + Aspirin [4] + Lisinopril [3] + Turmeric [2]) ÷ 4 medicines = <strong>3.5 / 5.0</strong>
                </div>
                <p>
                  <strong>Why it matters:</strong> Unlike the Overall Harm Score (which focuses on worst-case peaks), the Average Regimen Burden measures the <em>everyday baseline strain</em> on your liver and kidneys.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'peak' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-600 font-extrabold text-xl">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-orange-900 dark:text-orange-200 text-base">
                      Peak Risk Agent: {highestDrug}
                    </h3>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Highest-Hazard Medication in your Active Regimen
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-600 text-white self-start sm:self-auto">
                  Tier {riskLevel} Drug
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs sm:text-sm text-[var(--ink-2)]">
                <h4 className="font-bold text-[var(--ink)] uppercase tracking-wider text-xs">
                  Why is {highestDrug} flagged as the Peak Risk Agent?
                </h4>
                <p>
                  {highestDrug} is classified as a <strong>Narrow Therapeutic Index (NTI)</strong> drug. This means the therapeutic difference between a safe working dose and a toxic dose is very small.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Requires regular lab surveillance (like INR blood tests).</li>
                  <li>Can be strongly amplified by everyday herbs like turmeric or foods like grapefruit.</li>
                  <li>Should never be doubled if a dose is accidentally missed.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
                <h3 className="font-extrabold text-base text-[var(--ink)] font-[var(--font-heading)]">
                  Clinical Drug Interaction Severity Tiers
                </h3>
                <p className="text-xs text-[var(--ink-3)]">
                  PolySafe cross-references 222,000+ interaction pairs from DDInter 2024, OFFSIDES, and WHO ATC databases:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-rose-700 dark:text-rose-300">CONTRAINDICATED (Tier 5)</span>
                    <span className="font-mono text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full">Score 5.0</span>
                  </div>
                  <p className="text-rose-950 dark:text-rose-100">
                    Never combine. The risk of life-threatening events (cardiac arrest, massive hemorrhage) far outweighs clinical benefits.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-rose-700 dark:text-rose-300">MAJOR (Tier 4)</span>
                    <span className="font-mono text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">Score 4.5</span>
                  </div>
                  <p className="text-rose-950 dark:text-rose-100">
                    Serious interaction. Can lead to hospitalization. Requires immediate physician review, dose calibration, or gastroprotection.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">MODERATE (Tier 3)</span>
                    <span className="font-mono text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full">Score 3.1</span>
                  </div>
                  <p className="text-amber-950 dark:text-amber-100">
                    Clinical significance. May alter blood pressure, sedation, or liver metabolism. Monitor symptoms closely.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-700 dark:text-blue-300">MINOR (Tier 2)</span>
                    <span className="font-mono text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">Score 2.0</span>
                  </div>
                  <p className="text-blue-950 dark:text-blue-100">
                    Low probability of clinical complications. Usually manageable with routine observation or spaced dosing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--canvas)] flex items-center justify-between">
          <p className="text-[11px] text-[var(--ink-3)] font-mono">
            Always consult your prescribing physician before altering doses.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="ps-btn ps-btn-primary px-5 py-2 text-xs font-bold"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </div>
    </AnimatePresence>,
    document.body
  );
}
