import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  X,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Stethoscope,
  Info,
} from 'lucide-react';

export default function AlternativeSuggestionsModal({
  isOpen,
  open: openProp,
  onClose,
  suggestions = [],
}) {
  const open = openProp ?? isOpen ?? false;

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

  const defaultSuggestions = [
    {
      id: 'nsaid-hypertension-cardiac',
      triggerDrug: 'Systemic Oral NSAID (e.g. Ibuprofen / Naproxen)',
      detectedConcern: 'NSAIDs blunt antihypertensive efficacy and cause renal sodium retention, elevating blood pressure and increasing cardiovascular risks.',
      saferOptions: [
        {
          name: 'Topical Diclofenac Gel (1%–2%)',
          category: 'Topical Analgesic',
          rationale: 'Provides equivalent localized analgesia for joint and muscle pain with 95% lower systemic plasma absorption and negligible renal impact.',
          level: 'Minimal Systemic Risk (L1)',
        },
        {
          name: 'Paracetamol / Acetaminophen (500mg–650mg)',
          category: 'Non-Opioid Analgesic',
          rationale: 'First-line pain relief with no adverse impact on renal prostaglandins or blood pressure control.',
          level: 'Low Risk (L2)',
        },
      ],
      deprescribingTip: 'Taper oral NSAID to lowest effective dose for shortest possible duration (< 5 days) rather than continuous chronic administration.',
    },
    {
      id: 'sulfonylurea-hypoglycemia',
      triggerDrug: 'Sulfonylurea Antidiabetic (e.g. Glimepiride)',
      detectedConcern: 'Sulfonylureas have prolonged half-lives in elderly polypharmacy patients, causing recurrent severe hypoglycemia.',
      saferOptions: [
        {
          name: 'DPP-4 Inhibitor (Sitagliptin / Vildagliptin)',
          category: 'Incretin Enhancer',
          rationale: 'Glucose-dependent insulin release with virtually zero hypoglycemia risk as monotherapy.',
          level: 'Intermediate (L3)',
        },
        {
          name: 'SGLT-2 Inhibitor (Dapagliflozin / Empagliflozin)',
          category: 'Renal Glucose Excretion',
          rationale: 'Low hypoglycemia risk with proven cardiorenal protection benefits.',
          level: 'Intermediate (L3)',
        },
      ],
      deprescribingTip: 'Discuss substituting sulfonylurea with modern incretin agents during next physician consultation.',
    },
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-3xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-black/20 px-2 py-0.5 rounded-full">
                    CLINICAL STEWARDSHIP
                  </span>
                  <span className="text-xs font-mono opacity-80">BEERS CRITERIA 2023</span>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight font-[var(--font-heading)]">
                  Safer Drug Alternatives & De-prescribing Explorer
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Explanatory Box */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Polypharmacy safety often involves replacing narrow-index or high-burden medications with safer pharmacotherapeutic equivalents. Always discuss these clinical alternatives with your treating physician before modifying your doses.
              </p>
            </div>

            {/* List of Suggestions */}
            <div className="space-y-6">
              {activeSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4 shadow-xs"
                >
                  {/* Trigger drug & Concern */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 uppercase">
                        Current Drug: {item.triggerDrug}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--ink-3)] font-semibold">
                        Alternative Recommendation #{idx + 1}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-2)] leading-relaxed pt-1">
                      <strong className="text-[var(--ink)]">Clinical Concern:</strong> {item.detectedConcern}
                    </p>
                  </div>

                  {/* Safer Alternatives Options */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Evidence-Based Safer Options:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.saferOptions.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[var(--ink)] leading-snug">{opt.name}</p>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                              {opt.level}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--brand-600)] font-semibold block">
                            {opt.category}
                          </span>
                          <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                            {opt.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* De-prescribing tip */}
                  {item.deprescribingTip && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Physician Stewardship Tip:</strong> {item.deprescribingTip}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end">
            <button
              onClick={onClose}
              className="ps-btn ps-btn-primary py-2 px-6 text-xs font-bold"
            >
              Close Explorer
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
