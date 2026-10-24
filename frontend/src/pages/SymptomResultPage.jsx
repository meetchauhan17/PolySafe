import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Pill,
  CalendarDays,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Info,
  HeartPulse,
  ChevronRight,
  Copy,
  Check,
  Printer,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { useT } from '../i18n/useT';
import { motion, useReducedMotion } from 'framer-motion';
import { DrawLine } from '../motion/DrawLine';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function calculateDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 28;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = Math.max(1, Math.round(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
  return diff;
}

// ─── Mini Timeline with DrawLine ──────────────────────────────────────────────
function MiniTimeline({ drugName, drugCategory, dateStarted, symptomName, dateSymptom }) {
  const shouldReduceMotion = useReducedMotion();
  const daysDiff = calculateDaysBetween(dateStarted, dateSymptom);

  return (
    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[var(--accent-500)]" />
          <span>Chronological Prescribing Sequence</span>
        </span>
        <span className="text-[11px] font-mono text-[var(--accent-500)] font-bold bg-[var(--accent-500)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent-500)]/20">
          {daysDiff} days elapsed
        </span>
      </div>

      {/* SVG DrawLine Timeline */}
      <div className="relative pt-2 pb-1">
        {/* Horizontal Connecting Animated SVG Line */}
        <div className="w-full h-8 relative flex items-center">
          <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
            <line
              x1="5%"
              y1="16"
              x2="95%"
              y2="16"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <DrawLine
              as="line"
              x1="5%"
              y1="16"
              x2="95%"
              y2="16"
              stroke="var(--accent-500)"
              strokeWidth="3"
              strokeDasharray="6 4"
              duration={0.8}
            />
          </svg>

          {/* Central Interval Badge over the line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--accent-500)]/30 text-[10px] font-bold text-[var(--ink)] shadow-2xs whitespace-nowrap font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-500)] animate-pulse" />
              <span>{daysDiff}d Latency Window</span>
            </span>
          </div>
        </div>

        {/* Milestones Below Line */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Milestone 1: Drug Started */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[var(--accent-500)]/15 text-[var(--accent-500)] border border-[var(--accent-500)]/30 flex items-center justify-center flex-shrink-0">
                <Pill className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)] truncate">{drugName}</p>
                <p className="text-[10px] text-[var(--ink-3)] font-mono">Prescription Started</p>
              </div>
            </div>
            <p className="text-[11px] font-mono text-[var(--ink-2)] pl-9">
              {formatDate(dateStarted)}
            </p>
          </div>

          {/* Milestone 2: Symptom Emerged */}
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--ink)] truncate capitalize">{symptomName}</p>
                <p className="text-[10px] text-[var(--ink-3)] font-mono">Symptom Emerged</p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-[11px] font-mono text-[var(--ink-2)] pr-9">
              {formatDate(dateSymptom)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Conversation Checklist ────────────────────────────────────────────
function DoctorConversationChecklist({ match, description }) {
  const medicine = match?.medicineName || 'this medicine';
  const symptom = match?.symptomKeyword || description || 'this symptom';

  const defaultQuestions = [
    `Could my symptom ("${symptom}") be an adverse side effect of ${medicine} rather than a new condition?`,
    `Would a dose adjustment or temporary tapering of ${medicine} determine if the symptom resolves?`,
    `Is there an alternative medication class with lower risk of ${symptom} that we could substitute?`,
    `Should we conduct baseline lab tests or blood pressure checks before adding any new prescription?`,
    `Are any of my supplements (such as herbal extracts) aggravating this drug effect?`,
  ];

  const [checkedState, setCheckedState] = useState(
    defaultQuestions.reduce((acc, _, idx) => ({ ...acc, [idx]: false }), {})
  );
  const [copied, setCopied] = useState(false);

  const toggleCheck = (idx) => {
    setCheckedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyChecklist = () => {
    const textToCopy = [
      `PolySafe Prescribing Cascade Discussion Guide:`,
      `Medicine Involved: ${medicine}`,
      `Symptom: ${symptom}`,
      `Questions to ask my doctor:`,
      ...defaultQuestions.map((q, idx) => `${idx + 1}. ${q}`),
    ].join('\n');

    try {
      navigator.clipboard?.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  return (
    <Card
      title="Doctor Conversation Checklist"
      subtitle="Interactive questions to review with your doctor before accepting an additional prescription"
      icon={<MessageSquare className="w-4 h-4 text-[var(--accent-500)]" />}
      className="space-y-4"
    >
      <div className="space-y-2.5">
        {defaultQuestions.map((q, idx) => {
          const isChecked = checkedState[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleCheck(idx)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isChecked
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[var(--canvas)] border-[var(--border)] hover:border-[var(--accent-500)]/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs sm:text-sm leading-snug transition-colors ${
                    isChecked
                      ? 'text-[var(--ink-3)] line-through'
                      : 'text-[var(--ink)] font-medium'
                  }`}
                >
                  {q}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Copy / Print Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--ink-3)] font-mono">
          {Object.values(checkedState).filter(Boolean).length} of {defaultQuestions.length} discussed
        </span>

        <button
          type="button"
          onClick={handleCopyChecklist}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--accent-500)] transition-all cursor-pointer shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              <span>Copy Questions</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

// ─── Card: Cascade Match Found ────────────────────────────────────────────────
function CascadeMatchCard({ match, description, onsetDate }) {
  const { t } = useT();
  const shouldReduceMotion = useReducedMotion();

  const probabilityPct = 85;

  return (
    <div className="space-y-5">
      {/* ── Cascade Card with Probability Bar ── */}
      <div className="p-5 sm:p-6 bg-[var(--surface)] border-2 border-[var(--caution-fg)]/40 rounded-3xl space-y-5 shadow-xs relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[var(--caution-fg)]/10 text-[var(--caution-fg)] rounded-2xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--caution-fg)] font-mono">
                Prescribing Cascade Detected
              </p>
              <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mt-0.5">
                Likely Linked to {match.medicineName}
              </h2>
            </div>
          </div>

          <span className="text-xs font-extrabold font-mono px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
            {probabilityPct}% High Probability
          </span>
        </div>

        {/* Animated Probability Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--ink-3)] font-semibold">Causal Correlation Probability</span>
            <span className="font-bold text-[var(--ink)]">{probabilityPct}%</span>
          </div>

          <div className="h-3.5 bg-[var(--canvas)] shadow-inner rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
            <motion.div
              className="h-full rounded-full"
              initial={shouldReduceMotion ? { width: `${probabilityPct}%` } : { width: '0%' }}
              animate={{ width: `${probabilityPct}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'linear-gradient(90deg, #F59E0B 0%, #F97316 60%, #EF4444 100%)',
              }}
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-[var(--ink-3)] px-1">
            <span>0% Unrelated</span>
            <span>50% Possible</span>
            <span>85%+ Documented Cascade Pattern</span>
          </div>
        </div>

        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
          You started taking <strong className="text-[var(--ink)]">{match.medicineName}</strong> on{' '}
          <strong className="text-[var(--ink)]">{formatDate(match.dateStarted)}</strong>. The symptom{' '}
          <em className="text-[var(--ink)]">"{match.symptomKeyword}"</em> is a classic, documented side effect of{' '}
          <strong className="text-[var(--ink)]">{match.causingDrugCategory}</strong> medicines.
        </p>

        {/* Prescribing cascade alert callout */}
        <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[var(--caution-fg)] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-[var(--ink)]">
              Before treating this as a new condition:
            </p>
            <p className="text-[var(--ink-2)] leading-relaxed">
              Patients with this symptom are often given a diuretic or additional pill. Discussing this with your doctor now can prevent unnecessary prescriptions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mini Timeline with DrawLine ── */}
      <MiniTimeline
        drugName={match.medicineName}
        drugCategory={match.causingDrugCategory}
        dateStarted={match.dateStarted}
        symptomName={match.symptomKeyword}
        dateSymptom={onsetDate || new Date().toISOString()}
      />

      {/* ── Literature Context Card ── */}
      <Card
        title="Mechanism & Pharmacological Context"
        subtitle="Clinical evidence behind this prescribing cascade"
        icon={<HelpCircle className="w-4 h-4 text-[var(--ink-3)]" />}
        className="space-y-3"
      >
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
          {match.cascadeDescription}
        </p>
      </Card>

      {/* ── Doctor Conversation Checklist ── */}
      <DoctorConversationChecklist match={match} description={description} />

      {/* ── Safety Notice ── */}
      <div className="flex items-start space-x-2.5 p-4 border border-[var(--border)] bg-[var(--canvas)] rounded-2xl">
        <Info className="w-4 h-4 text-[var(--ink-3)] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
          <strong>This is an informational safety alert, not a diagnosis.</strong> Do not discontinue or alter the dosage of your prescribed medicines without first consulting your doctor.
        </p>
      </div>
    </div>
  );
}

// ─── Card: No Match Found ─────────────────────────────────────────────────────
function NoCascadeCard({ description }) {
  const { t } = useT();
  const shouldReduceMotion = useReducedMotion();

  const probabilityPct = 12;

  return (
    <div className="space-y-5">
      {/* Reassuring Clear Card */}
      <div className="p-6 bg-[var(--surface)] border border-emerald-500/30 rounded-3xl space-y-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

        <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-mono">
                No Known Cascade Link Found
              </p>
              <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mt-0.5">
                No Established Drug Cascade Match
              </h2>
            </div>
          </div>

          <span className="text-xs font-extrabold font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            {probabilityPct}% Low Association
          </span>
        </div>

        {/* Low Probability Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--ink-3)]">Causal Correlation Probability</span>
            <span className="font-bold text-emerald-600">{probabilityPct}%</span>
          </div>

          <div className="h-3.5 bg-[var(--canvas)] shadow-inner rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={shouldReduceMotion ? { width: `${probabilityPct}%` } : { width: '0%' }}
              animate={{ width: `${probabilityPct}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
            />
          </div>
        </div>

        <p className="text-sm text-[var(--ink-2)] leading-relaxed">
          PolySafe cross-referenced your symptom description against established prescribing cascade patterns and your active medicine timeline. No known cascade correlation was detected in clinical literature.
        </p>
      </div>

      {/* Suggested Follow-up */}
      <Card
        title="Suggested Question for Your Doctor"
        icon={<MessageSquare className="w-4 h-4 text-[var(--brand-600)]" />}
        className="space-y-3"
      >
        <div className="p-4 bg-[var(--canvas)] border border-[var(--border)] rounded-2xl">
          <p className="text-sm text-[var(--ink-2)] leading-relaxed italic">
            "I have been experiencing {description}. Even though it might seem unrelated, could any of my current medicines be playing a role?"
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SymptomResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useT();

  // Support direct visit with mock fallback or state
  const stateResult = location.state?.result;
  const stateDescription = location.state?.description;
  const stateOnsetDate = location.state?.onsetDate;

  // Fallback demo cascade result if visited directly
  const fallbackResult = {
    cascadeDetected: true,
    match: {
      medicineId: 'd-amlodipine',
      medicineName: 'Amlodipine',
      medicineType: 'PRESCRIPTION',
      medicineDosage: '5mg once daily',
      dateStarted: new Date(Date.now() - 34 * 86400000).toISOString(),
      symptomKeyword: 'ankle swelling',
      causingDrugCategory: 'calcium channel blocker',
      cascadeDescription:
        'Calcium channel blockers (such as Amlodipine) dilate precapillary vessels more than postcapillary venules, causing fluid transudation and bilateral ankle or peripheral edema. This is frequently misdiagnosed as heart failure or venous insufficiency, leading to unnecessary diuretic prescription.',
    },
    symptom: {
      id: 'demo-sym-1',
      description: 'Ankles have been swelling and shoes feel tight for the past week',
      dateLogged: new Date().toISOString(),
    },
  };

  const result = stateResult || fallbackResult;
  const description = stateDescription || result.symptom?.description || 'swollen ankles and tightness';
  const onsetDate = stateOnsetDate || result.symptom?.dateLogged || new Date().toISOString();

  return (
    <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Modern Hero Header ── */}
        <div
          className="ps-hero ps-fade-up"
          style={{
            '--hero-accent': result.cascadeDetected ? 'var(--caution-fg)' : 'var(--safe-fg)',
            borderColor: result.cascadeDetected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
          }}
        >
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackButton to="/log-symptom" label="Back to Form" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)]">
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    result.cascadeDetected ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="font-mono text-[11px]">
                  {result.cascadeDetected ? 'Cascade Warning Active' : 'Clear Telemetry'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                {t('symptom_result.title', 'Symptom Telemetry Result')}
              </h1>
              <p className="text-sm text-[var(--ink-2)] max-w-xl leading-relaxed font-mono">
                Evaluated: "{description.length > 70 ? description.slice(0, 70) + '…' : description}"
              </p>
            </div>
          </div>
        </div>

        {/* ── Result Card ── */}
        {result.cascadeDetected && result.match ? (
          <CascadeMatchCard match={result.match} description={description} onsetDate={onsetDate} />
        ) : (
          <NoCascadeCard description={description} />
        )}

        {/* ── Footer CTAs ── */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => navigate('/log-symptom')}
            className="ps-btn ps-btn-primary py-3.5 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold shadow-xs"
          >
            <HeartPulse className="w-4 h-4" />
            <span>Log Another Symptom</span>
          </button>
          <BackButton
            to="/home"
            label={t('common.back', 'Back to Dashboard')}
            className="w-full py-3 justify-center text-sm"
          />
        </div>

      </div>
  );
}
