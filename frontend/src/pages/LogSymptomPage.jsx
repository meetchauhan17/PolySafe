import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HeartPulse,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Lock,
  Compass,
  Brain,
  Droplet,
  Flame,
  Clock,
  ShieldAlert,
  HeartCrack,
  Activity,
  Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import PolySafeTextarea from '../components/PolySafeTextarea';
import PolySafeInput from '../components/PolySafeInput';
import { useT } from '../i18n/useT';
import VoiceInputButton from '../components/VoiceInputButton';

// ─── Symptom Grid Options with Icons & Descriptions ───────────────────────────
const SYMPTOM_OPTIONS = [
  {
    id: 'ankle-swelling',
    label: 'Ankle / Leg Swelling',
    subtext: 'Puffy ankles, fluid retention, tight shoes',
    keyword: 'ankle swelling',
    icon: Activity,
  },
  {
    id: 'dizziness',
    label: 'Dizziness & Lightheaded',
    subtext: 'Feeling faint when standing up, unsteadiness',
    keyword: 'dizziness',
    icon: Compass,
  },
  {
    id: 'confusion',
    label: 'Confusion & Brain Fog',
    subtext: 'Memory lapses, disorientation, trouble focusing',
    keyword: 'confusion',
    icon: Brain,
  },
  {
    id: 'dry-mouth',
    label: 'Dry Mouth',
    subtext: 'Parched mouth, persistent thirst, difficulty swallowing',
    keyword: 'dry mouth',
    icon: Droplet,
  },
  {
    id: 'heartburn',
    label: 'Heartburn & Acid Reflux',
    subtext: 'Burning chest pain, indigestion, upper stomach ache',
    keyword: 'heartburn',
    icon: Flame,
  },
  {
    id: 'constipation',
    label: 'Constipation',
    subtext: 'Infrequent bowel movements, abdominal cramps',
    keyword: 'constipation',
    icon: AlertCircle,
  },
  {
    id: 'frequent-urination',
    label: 'Frequent Urination',
    subtext: 'Nighttime waking, sudden urgency, retention',
    keyword: 'frequent urination',
    icon: Clock,
  },
  {
    id: 'falls',
    label: 'Falls or Unsteadiness',
    subtext: 'Stumbling, loss of balance, sudden wobble',
    keyword: 'falls',
    icon: ShieldAlert,
  },
  {
    id: 'nausea',
    label: 'Nausea & Stomach Upset',
    subtext: 'Queasiness, loss of appetite after taking pills',
    keyword: 'nausea',
    icon: HeartCrack,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const SEVERITY_LEVELS = [
  {
    value: 1,
    label: 'Mild',
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    description: 'Noticeable, but does not interfere with daily routine or activities.',
  },
  {
    value: 2,
    label: 'Moderate',
    color: '#F97316',
    bgColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
    description: 'Causes discomfort and disrupts normal daily tasks or sleep.',
  },
  {
    value: 3,
    label: 'Severe',
    color: '#EF4444',
    bgColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    description: 'Intense distress, limits mobility, or prevents basic self-care.',
  },
];

export default function LogSymptomPage() {
  const navigate = useNavigate();
  const { isGuest, openGuestLockModal } = useAuth();
  const { t, lang } = useT();
  const textareaRef = useRef(null);

  const [description, setDescription] = useState('');
  const [dateLogged, setDateLogged] = useState(todayISO());
  const [severity, setSeverity] = useState(2); // 1: Mild, 2: Moderate, 3: Severe
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Quick symptom toggle
  const handleToggleSymptom = (sym) => {
    const kw = sym.keyword.toLowerCase();
    const current = description.toLowerCase();

    if (current.includes(kw)) {
      // Remove keyword cleanly
      const regex = new RegExp(`(^|,\\s*)${kw}`, 'gi');
      let updated = description.replace(regex, '').replace(/^,\s*/, '').trim();
      setDescription(updated);
    } else {
      // Append keyword
      setDescription((prev) => (prev.trim() ? `${prev.trimEnd()}, ${sym.keyword}` : sym.keyword));
    }
    textareaRef.current?.focus();
  };

  const handleDatePreset = (days) => {
    setDateLogged(daysAgoISO(days));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      openGuestLockModal('log symptoms and cross-reference cascades');
      return;
    }
    setError(null);

    if (!description.trim() || description.trim().length < 3) {
      setError("Please describe what you're experiencing in at least a few words.");
      notify.warning('Description Required', "Please describe your symptom in at least a few words.");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeSeverityObj = SEVERITY_LEVELS.find((s) => s.value === severity) || SEVERITY_LEVELS[1];
      const { data } = await axios.post('/symptom', {
        description: description.trim(),
        dateLogged: new Date(dateLogged).toISOString(),
        severity: activeSeverityObj.label,
      });

      notify.success('Symptom Logged Successfully', 'Cross-referencing against your medication timeline...');
      navigate('/symptom-result', {
        state: {
          result: data,
          description: description.trim(),
          severity: activeSeverityObj.label,
          onsetDate: dateLogged,
        },
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to log symptom. Please try again.';
      setError(msg);
      notify.error('Could Not Log Symptom', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSeverityObj = SEVERITY_LEVELS.find((s) => s.value === severity) || SEVERITY_LEVELS[1];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Modern Hero Header ── */}
        <div className="ps-hero ps-fade-up">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackButton to="/home" label="Back to Home" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span className="font-mono text-[11px]">Prescribing Cascade Surveillance</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                {t('log_symptom.title', 'Log a New Symptom')}
              </h1>
              <p className="text-sm text-[var(--ink-2)] max-w-xl leading-relaxed">
                {t(
                  'log_symptom.subtitle',
                  'PolySafe cross-references newly emerged symptoms against your prescription start dates to detect if this is a drug side effect rather than a new medical condition.'
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  <span>Timeline Latency Matching</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-500)]" />
                  <span>Literature-backed Cascade Rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Prescribing Cascade Explainer Banner ── */}
        <div className="flex items-start space-x-3 p-4 bg-[var(--accent-500)]/8 border border-[var(--accent-500)]/20 rounded-2xl text-xs text-[var(--ink-2)]">
          <Info className="w-4 h-4 text-[var(--accent-500)] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--ink)]">What is a prescribing cascade?</strong> It occurs when an adverse drug effect is misinterpreted as a new medical illness, prompting an unnecessary second prescription. Logging symptoms early helps protect your regimen.
          </p>
        </div>

        {/* ── Main Form Card ── */}
        <Card
          title={t('log_symptom.input_label', 'What are you experiencing?')}
          subtitle={t('log_symptom.subtitle', 'Tap common symptoms or describe in your own words.')}
          icon={<HeartPulse className="w-5 h-5 text-[var(--accent-500)]" />}
          className="space-y-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── 1. Large Symptom Chip Grid with Icons ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-[var(--font-heading)]">
                  Select Symptoms to Add
                </label>
                <span className="text-[11px] text-[var(--ink-3)] font-mono">
                  Tap to add or remove
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SYMPTOM_OPTIONS.map((sym) => {
                  const Icon = sym.icon;
                  const isSelected = description.toLowerCase().includes(sym.keyword.toLowerCase());

                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleToggleSymptom(sym)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-3 relative group ${
                        isSelected
                          ? 'bg-[var(--accent-500)]/10 border-[var(--accent-500)] shadow-xs ring-1 ring-[var(--accent-500)]'
                          : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent-500)]/40 hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-500)] text-white shadow-2xs'
                            : 'bg-[var(--surface-2)] text-[var(--ink-2)] group-hover:text-[var(--accent-500)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[var(--ink)] truncate">
                            {sym.label}
                          </p>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-500)] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--ink-3)] mt-0.5 line-clamp-2 leading-tight">
                          {sym.subtext}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Symptom Description Textarea + Voice Input ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <label
                  htmlFor="symptom-description"
                  className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-[var(--font-heading)]"
                >
                  Detailed Description
                </label>
                <VoiceInputButton
                  onResult={(text) => {
                    setDescription((prev) => (prev ? `${prev.trimEnd()} ${text}` : text));
                  }}
                  title={t('log_symptom.voice_input_title', 'Dictate symptom with microphone')}
                />
              </div>

              <PolySafeTextarea
                ref={textareaRef}
                id="symptom-description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t(
                  'log_symptom.input_placeholder',
                  'e.g. My ankles have been swelling for the past few days, and I feel slightly dizzy when standing up...'
                )}
                error={Boolean(error && !description.trim())}
                className="resize-none leading-relaxed"
              />
              <p className="text-[10px] text-[var(--ink-3)] font-mono text-right">
                {description.length} characters
              </p>
            </div>

            {/* ── 3. Severity Slider (Mild, Moderate, Severe) with Warm-to-Vermilion Track ── */}
            <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="symptom-severity" className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-[var(--font-heading)]">
                    Symptom Severity
                  </label>
                  <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                    How much is this affecting your daily routine?
                  </p>
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full border ${currentSeverityObj.bgColor}`}
                >
                  {currentSeverityObj.label} Severity
                </span>
              </div>

              {/* Slider Track with Warm-to-Vermilion Gradient */}
              <div className="space-y-2 pt-1">
                <div className="relative">
                  <input
                    id="symptom-severity"
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                    style={{
                      background: 'linear-gradient(90deg, #F59E0B 0%, #F97316 50%, #EF4444 100%)',
                    }}
                    aria-label="Symptom severity slider"
                  />
                </div>

                {/* Step Markers & Quick Taps */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {SEVERITY_LEVELS.map((lvl) => {
                    const isActive = severity === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setSeverity(lvl.value)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs border-[var(--border)]'
                            : 'text-[var(--ink-3)] hover:text-[var(--ink)] border-transparent'
                        }`}
                      >
                        <span className="block">{lvl.label}</span>
                        <span className="text-[10px] font-normal opacity-75 font-mono">
                          Level {lvl.value}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed italic pt-1">
                  "{currentSeverityObj.description}"
                </p>
              </div>
            </div>

            {/* ── 4. Onset Date with Quick Presets ── */}
            <div className="space-y-3">
              <label
                htmlFor="date-logged"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)]"
              >
                <CalendarDays className="w-3.5 h-3.5 text-[var(--accent-500)]" />
                <span>When did the symptom first start?</span>
              </label>

              <div className="flex flex-wrap items-center gap-2 pb-1">
                <span className="text-[11px] text-[var(--ink-3)] font-mono mr-1">Presets:</span>
                {[
                  { label: 'Today', days: 0 },
                  { label: '2–3 days ago', days: 3 },
                  { label: '1 week ago', days: 7 },
                  { label: '2 weeks ago', days: 14 },
                ].map((preset) => {
                  const targetDate = daysAgoISO(preset.days);
                  const isSelected = dateLogged === targetDate;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleDatePreset(preset.days)}
                      className={`text-xs px-2.5 py-1 rounded-xl border font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--accent-500)] text-white border-[var(--accent-500)] shadow-2xs'
                          : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <PolySafeInput
                id="date-logged"
                type="date"
                value={dateLogged}
                max={todayISO()}
                onChange={(e) => setDateLogged(e.target.value)}
                leftIcon={<CalendarDays className="w-4 h-4 text-[var(--ink-3)]" />}
              />
              <p className="text-[10px] text-[var(--ink-3)] font-mono">
                Prescription start dates before this day will be evaluated for side-effect causality.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="log-symptom-submit"
              disabled={isSubmitting || (!description.trim() && !isGuest)}
              className="ps-btn ps-btn-primary w-full py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('log_symptom.analyzing', 'Cross-referencing medication timeline…')}</span>
                </>
              ) : (
                <>
                  <span>{t('log_symptom.submit_btn', 'Check for Prescribing Cascades')}</span>
                  <ArrowRight className="w-4 h-4" />
                  {isGuest && <Lock className="w-4 h-4 text-[var(--border)] ml-1" />}
                </>
              )}
            </button>
          </form>
        </Card>

        {/* ── Footer Disclaimer ── */}
        <p className="text-center text-[11px] text-[var(--ink-3)] leading-relaxed px-4">
          This surveillance tool identifies potential drug-induced side effects — it does not replace a clinical examination. Always discuss symptoms with your prescribing physician.
        </p>

      </div>
  );
}
