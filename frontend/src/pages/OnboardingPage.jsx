import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  HeartPulse,
  FlaskConical,
  Shield,
  Activity,
  Brain,
  Stethoscope,
  Info,
  Check,
  X,
  Edit2,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { patientApi } from '../api/auth';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import PolySafeInput from '../components/PolySafeInput';
import { useT } from '../i18n/useT';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TextSizeControl from '../components/TextSizeControl';
import Logo from '../components/Logo';
import {
  OnboardingAgeIllustration,
  OnboardingConditionsIllustration,
  OnboardingReviewIllustration,
} from '../components/OnboardingIllustrations';
import { TiltCard, FloatingCapsule } from '../three-d';
import { DrawLine } from '../motion';

// ─── Preset Condition Options ────────────────────────────────────────────────
const CONDITION_OPTIONS = [
  {
    id: 'diabetes',
    label: 'Diabetes',
    description: 'Type 1 or Type 2 glycemic control',
    icon: Activity,
    colorVar: 'var(--caution-500)',
    bgActive: 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'hypertension',
    label: 'Hypertension',
    description: 'High blood pressure & ACE/ARB monitoring',
    icon: HeartPulse,
    colorVar: 'var(--critical-500)',
    bgActive: 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'kidney',
    label: 'Kidney Issues',
    description: 'CKD, renal clearance & eGFR sensitivity',
    icon: FlaskConical,
    colorVar: 'var(--brand-600)',
    bgActive: 'bg-[var(--brand-50)] border-[var(--brand-600)] text-[var(--brand-600)]',
  },
  {
    id: 'liver',
    label: 'Liver Issues',
    description: 'Hepatic metabolism & enzyme CYP interactions',
    icon: Shield,
    colorVar: 'var(--caution-500)',
    bgActive: 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-300',
  },
  {
    id: 'heart',
    label: 'Heart Condition',
    description: 'Arrhythmia, CHF, CAD & anticoagulant risks',
    icon: Stethoscope,
    colorVar: 'var(--critical-500)',
    bgActive: 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'falls',
    label: 'History of Falls',
    description: 'Fall risk & sedative / psychotropic hazards',
    icon: AlertCircle,
    colorVar: 'var(--caution-500)',
    bgActive: 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'dementia',
    label: 'Dementia / Memory',
    description: 'Cognitive decline & anticholinergic burden',
    icon: Brain,
    colorVar: 'var(--doctor-600)',
    bgActive: 'bg-[var(--doctor-50)] border-[var(--doctor-600)] text-[var(--doctor-600)]',
  },
  {
    id: 'none',
    label: 'None of the above',
    description: 'No known major chronic conditions',
    icon: CheckCircle2,
    colorVar: 'var(--safe-600)',
    bgActive: 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  },
];

// ─── Preset Allergy Options ──────────────────────────────────────────────────
const ALLERGY_PRESETS = [
  { id: 'none', label: 'No known drug allergies' },
  { id: 'penicillin', label: 'Penicillin' },
  { id: 'sulfa', label: 'Sulfa drugs' },
  { id: 'aspirin', label: 'Aspirin & NSAIDs' },
  { id: 'opioids', label: 'Opioids / Codeine' },
  { id: 'cephalosporins', label: 'Cephalosporins' },
  { id: 'ace_inhibitors', label: 'ACE Inhibitors' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { theme, toggleTheme } = useDisplaySettings();
  const { t } = useT();

  // 3-Step Stepper state: 1 (Age) | 2 (Conditions & Allergies) | 3 (Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState([]); // array of condition ids
  const [selectedAllergies, setSelectedAllergies] = useState(['none']); // defaults to "No known allergies"
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customAllergies, setCustomAllergies] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // Success Moment state
  const [showSuccessMoment, setShowSuccessMoment] = useState(false);

  // ─── Mutation ─────────────────────────────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: ({ age, conditions, allergies }) => {
      return patientApi.saveProfile({ age, conditions, allergies }, token);
    },
    onSuccess: () => {
      setErrorMsg(null);
      setShowSuccessMoment(true);
      notify.success('Profile Saved', 'Your personalized medication safety baseline is now active.');
      // Allow the check and capsule animation to settle before redirecting
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 1800);
    },
    onError: (err) => {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to save profile. Please check your entries.';
      setErrorMsg(msg);
      notify.error('Profile Update Failed', msg);
    },
  });

  // ─── Toggle Condition Chip ────────────────────────────────────────────────
  const toggleCondition = (id) => {
    if (id === 'none') {
      setConditions((prev) => (prev.includes('none') ? [] : ['none']));
      return;
    }
    setConditions((prev) => {
      const filtered = prev.filter((c) => c !== 'none');
      return filtered.includes(id)
        ? filtered.filter((c) => c !== id)
        : [...filtered, id];
    });
  };

  // ─── Toggle Allergy Chip ──────────────────────────────────────────────────
  const toggleAllergy = (id) => {
    if (id === 'none') {
      setSelectedAllergies((prev) => (prev.includes('none') ? [] : ['none']));
      setCustomAllergies([]);
      return;
    }
    setSelectedAllergies((prev) => {
      const filtered = prev.filter((a) => a !== 'none');
      return filtered.includes(id)
        ? filtered.filter((a) => a !== id)
        : [...filtered, id];
    });
  };

  // ─── Add Custom Allergy Tag ───────────────────────────────────────────────
  const handleAddCustomAllergy = (e) => {
    e?.preventDefault();
    const trimmed = customAllergyInput.trim();
    if (!trimmed) return;
    if (!customAllergies.includes(trimmed)) {
      setCustomAllergies((prev) => [...prev, trimmed]);
      // Remove 'none' if present
      setSelectedAllergies((prev) => prev.filter((a) => a !== 'none'));
    }
    setCustomAllergyInput('');
  };

  const handleRemoveCustomAllergy = (name) => {
    setCustomAllergies((prev) => prev.filter((a) => a !== name));
  };

  // ─── Step Navigation ──────────────────────────────────────────────────────
  const handleNextToStep2 = (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setErrorMsg('Please enter a valid age between 1 and 120.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextToStep3 = (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    setCurrentStep(3);
  };

  // ─── Final Submit ─────────────────────────────────────────────────────────
  const handleFinalSubmit = (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    const parsedAge = Number(age);
    if (!age || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setErrorMsg('Please enter a valid age between 1 and 120.');
      setCurrentStep(1);
      return;
    }

    // Map condition ids to readable labels
    const conditionLabels = conditions
      .filter((c) => c !== 'none')
      .map((id) => {
        const opt = CONDITION_OPTIONS.find((o) => o.id === id);
        return opt ? opt.label : id;
      });

    // Compile allergies
    let allAllergies = [];
    if (!selectedAllergies.includes('none')) {
      const presetLabels = selectedAllergies.map((id) => {
        const p = ALLERGY_PRESETS.find((opt) => opt.id === id);
        return p ? p.label : id;
      });
      allAllergies = [...presetLabels, ...customAllergies];
    }

    saveProfileMutation.mutate({
      age: parsedAge,
      conditions: conditionLabels,
      allergies: allAllergies,
    });
  };

  const handleSkip = () => {
    navigate('/home', { replace: true });
  };

  // Gather summary for step 3 review
  const selectedConditionObjects = conditions
    .filter((id) => id !== 'none')
    .map((id) => CONDITION_OPTIONS.find((o) => o.id === id))
    .filter(Boolean);

  const compiledAllergyList = selectedAllergies.includes('none')
    ? []
    : [
        ...selectedAllergies.map((id) => ALLERGY_PRESETS.find((p) => p.id === id)?.label).filter(Boolean),
        ...customAllergies,
      ];

  return (
    <PageTransition className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between py-6 px-4 sm:px-6 selection:bg-[var(--accent-100)] selection:text-[var(--ink)]">
      {/* ── Top Bar Controls ── */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          <TextSizeControl />
          <LanguageSwitcher compact={true} />

          {/* Theme Toggle (Sun/Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--brand-600)] stroke-[2.2]" />
            )}
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-8">

          {/* ══════════════════════════════════════════════════════════════════
              3-STEP STEPPER WITH DRAWLINE PROGRESS ANIMATION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between relative max-w-md mx-auto px-4">
              
              {/* Stepper Node 1 */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] ${
                    currentStep === 1
                      ? 'bg-[var(--brand-600)] text-white shadow-md ring-4 ring-[var(--brand-600)]/20'
                      : currentStep > 1
                      ? 'bg-[var(--safe-600)] text-white shadow-xs cursor-pointer'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-3)]'
                  }`}
                  aria-label="Step 1: Age"
                >
                  {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                </button>
                <span className={`text-[11px] font-bold tracking-tight font-mono ${currentStep === 1 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                  Age
                </span>
              </div>

              {/* Progress Line between 1 and 2 */}
              <div className="flex-1 h-1 mx-2 relative flex items-center">
                <div className="absolute inset-0 bg-[var(--border)] rounded-full" />
                {currentStep >= 2 ? (
                  <svg className="w-full h-1 overflow-visible z-10" preserveAspectRatio="none">
                    <DrawLine as="line" x1="0" y1="2" x2="100%" y2="2" stroke="var(--brand-600)" strokeWidth={3} />
                  </svg>
                ) : null}
              </div>

              {/* Stepper Node 2 */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => { if (age && Number(age) >= 1) setCurrentStep(2); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] ${
                    currentStep === 2
                      ? 'bg-[var(--brand-600)] text-white shadow-md ring-4 ring-[var(--brand-600)]/20'
                      : currentStep > 2
                      ? 'bg-[var(--safe-600)] text-white shadow-xs cursor-pointer'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-3)]'
                  }`}
                  aria-label="Step 2: Conditions and Allergies"
                >
                  {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                </button>
                <span className={`text-[11px] font-bold tracking-tight font-mono ${currentStep === 2 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                  Conditions
                </span>
              </div>

              {/* Progress Line between 2 and 3 */}
              <div className="flex-1 h-1 mx-2 relative flex items-center">
                <div className="absolute inset-0 bg-[var(--border)] rounded-full" />
                {currentStep >= 3 ? (
                  <svg className="w-full h-1 overflow-visible z-10" preserveAspectRatio="none">
                    <DrawLine as="line" x1="0" y1="2" x2="100%" y2="2" stroke="var(--brand-600)" strokeWidth={3} />
                  </svg>
                ) : null}
              </div>

              {/* Stepper Node 3 */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep === 3
                      ? 'bg-[var(--brand-600)] text-white shadow-md ring-4 ring-[var(--brand-600)]/20'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-3)]'
                  }`}
                  aria-label="Step 3: Review"
                >
                  3
                </div>
                <span className={`text-[11px] font-bold tracking-tight font-mono ${currentStep === 3 ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)]'}`}>
                  Review
                </span>
              </div>

            </div>
          </div>

          {/* Global Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs shadow-xs" role="alert">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: BIG NUMERIC AGE INPUT
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-[var(--shadow-paper)] space-y-8 animate-fadeIn">
              
              {/* Header with Editorial Line-Art Illustration */}
              <div className="text-center space-y-2">
                <OnboardingAgeIllustration className="w-24 h-24 mx-auto mb-1" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-200)] mx-auto">
                  <span className="w-2 h-2 rounded-full bg-[var(--brand-600)] animate-pulse" />
                  <span>Step 1 of 3</span>
                  <span className="text-[var(--brand-600)]/60">·</span>
                  <span className="font-mono text-[11px]">Primary Clinical Anchor</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
                  What is your current age?
                </h1>
                <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
                  Your age calibrates Beers 2023 geriatric criteria, anticholinergic susceptibility, and renal clearance risk models.
                </p>
              </div>

              {/* Big Numeric Input */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    autoFocus
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="68"
                    aria-label="Age in years"
                    className="w-44 sm:w-56 py-5 text-center font-mono text-5xl sm:text-6xl font-black text-[var(--brand-600)] bg-[var(--canvas)] border-2 border-[var(--border)] rounded-3xl outline-none focus:border-[var(--brand-600)] focus:ring-4 focus:ring-[var(--brand-600)]/20 shadow-inner transition-all"
                  />
                  <span className="block text-center text-xs font-mono font-bold text-[var(--ink-3)] uppercase tracking-widest mt-2">
                    Years of Age
                  </span>
                </div>

                {/* Quick Age Interval Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="text-[11px] font-bold text-[var(--ink-3)] mr-1">Quick Select:</span>
                  {[55, 65, 72, 80].map((presetAge) => (
                    <button
                      key={presetAge}
                      type="button"
                      onClick={() => {
                        setAge(String(presetAge));
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="px-3 py-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--ink)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] transition-colors cursor-pointer"
                    >
                      {presetAge}
                    </button>
                  ))}
                </div>

                {/* Real-time Beers Criteria Pill */}
                {age && Number(age) >= 65 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Beers 2023 Geriatric Safety Threshold Active (&ge;65 yrs)</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-bold text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Skip for Now
                </button>

                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="px-4 sm:px-6 py-3.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99] ps-shine-button"
                >
                  <span className="hidden sm:inline">Continue to Health Conditions</span>
                  <span className="sm:hidden">Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: CONDITION CARDS (TILTING) & ALLERGY CHIPS
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-paper)] space-y-8 animate-fadeIn">
              
              {/* Header with Editorial Line-Art Illustration */}
              <div className="space-y-1">
                <OnboardingConditionsIllustration className="w-24 h-24 mx-auto mb-2" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-200)]">
                  <span>Step 2 of 3</span>
                  <span className="text-[var(--brand-600)]/60">·</span>
                  <span className="font-mono text-[11px]">Pharmacological Context</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
                  Conditions & Drug Allergies
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-2)]">
                  Select existing conditions to activate organ-toxicity alarms, and check any known drug reactions.
                </p>
              </div>

              {/* ── Condition Cards with Subtle Tilt ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider font-mono">
                    Chronic Health Conditions (Select all that apply)
                  </span>
                  <span className="text-[11px] text-[var(--ink-3)]">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONDITION_OPTIONS.map((opt) => {
                    const isSelected = conditions.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <TiltCard
                        key={opt.id}
                        max={4}
                        scale={1.01}
                        glare={false}
                        className="w-full h-full cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCondition(opt.id)}
                          className={`w-full h-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] ${
                            isSelected
                              ? `${opt.bgActive} shadow-xs`
                              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className={`p-2 rounded-xl border flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[var(--surface)] border-current text-current'
                              : 'bg-[var(--canvas)] border-[var(--border)] text-[var(--ink-3)]'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold leading-tight font-[var(--font-heading)]">
                                {opt.label}
                              </h3>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-current" />}
                            </div>
                            <p className="text-[11px] opacity-75 mt-0.5 leading-snug line-clamp-2">
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      </TiltCard>
                    );
                  })}
                </div>
              </div>

              {/* ── Allergy Chips with "None" Option ── */}
              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider font-mono">
                    Known Drug Allergies
                  </span>
                  <span className="text-[11px] text-[var(--ink-3)]">Select or type custom</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_PRESETS.map((allergy) => {
                    const isSelected = selectedAllergies.includes(allergy.id);
                    return (
                      <button
                        key={allergy.id}
                        type="button"
                        onClick={() => toggleAllergy(allergy.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? allergy.id === 'none'
                              ? 'bg-[var(--safe-600)] text-white border-[var(--safe-600)] shadow-xs'
                              : 'bg-[var(--critical-500)] text-white border-[var(--critical-500)] shadow-xs'
                            : 'bg-[var(--canvas)] border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{allergy.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Allergy Adder */}
                {!selectedAllergies.includes('none') && (
                  <form onSubmit={handleAddCustomAllergy} className="flex gap-2 pt-1">
                    <PolySafeInput
                      type="text"
                      value={customAllergyInput}
                      onChange={(e) => setCustomAllergyInput(e.target.value)}
                      placeholder="Type custom allergy (e.g. Ciprofloxacin)..."
                      className="text-xs flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!customAllergyInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] hover:border-[var(--brand-600)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                )}

                {/* Custom Allergy Tags */}
                {customAllergies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customAllergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAllergy(allergy)}
                          className="hover:text-rose-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-3 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Age</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextToStep3}
                  className="px-6 py-3.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99] ps-shine-button"
                >
                  <span>Review Clinical Baseline</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: REVIEW STEP IN A --PAPER CARD
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="bg-[var(--paper)] text-[var(--ink)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-[var(--shadow-paper)] space-y-6 grain animate-fadeIn">
              
              {/* Header with Editorial Line-Art Illustration */}
              <div className="space-y-1">
                <OnboardingReviewIllustration className="w-24 h-24 mx-auto mb-2" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface)] text-[var(--brand-600)] border border-[var(--border)]">
                  <span>Step 3 of 3</span>
                  <span className="text-[var(--brand-600)]/60">·</span>
                  <span className="font-mono text-[11px]">Final Clinical Verification</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
                  Review Clinical Baseline
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-2)]">
                  Confirm your parameters before PolySafe initiates continuous real-time cross-referencing.
                </p>
              </div>

              {/* Review Section 1: Age */}
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-200)] flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm">
                    {age}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Patient Age: {age} Years Old
                    </h3>
                    <p className="text-[11px] text-[var(--ink-2)]">
                      {Number(age) >= 65 ? 'Beers 2023 Geriatric Safety Thresholds Applied' : 'Adult Baseline Clearance Thresholds Applied'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--brand-600)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
                  aria-label="Edit Age"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Review Section 2: Chronic Conditions */}
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between shadow-2xs">
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--brand-600)]" />
                    <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Active Clinical Conditions ({selectedConditionObjects.length})
                    </h3>
                  </div>

                  {selectedConditionObjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedConditionObjects.map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-0.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] text-[11px] font-bold text-[var(--ink-2)]"
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--ink-3)] italic">
                      No chronic conditions selected.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--brand-600)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
                  aria-label="Edit Conditions"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Review Section 3: Drug Allergies */}
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-start justify-between shadow-2xs">
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-600)]" />
                    <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Documented Drug Allergies
                    </h3>
                  </div>

                  {compiledAllergyList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {compiledAllergyList.map((allergy, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--safe-600)] font-medium">
                      No known drug allergies reported.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="p-2 rounded-lg text-[var(--ink-3)] hover:text-[var(--brand-600)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
                  aria-label="Edit Allergies"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Zero-Trust Notice */}
              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-3)] px-1">
                <ShieldCheck className="w-4 h-4 text-[var(--safe-600)] flex-shrink-0" />
                <span>Zero-Trust Encryption: All profile attributes are stored securely and can be amended at any time in Settings.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-3 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={saveProfileMutation.isPending}
                  className="px-5 sm:px-8 py-3.5 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 ps-shine-button"
                >
                  {saveProfileMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Activating Baseline...</span></>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Save Profile & Activate PolySafe</span>
                      <span className="sm:hidden">Activate PolySafe</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SUCCESS MOMENT: CHECK DRAWS IN, CAPSULE SETTLES
          ══════════════════════════════════════════════════════════════════ */}
          {showSuccessMoment && (
            <div className="fixed inset-0 z-50 bg-[var(--canvas)]/95 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[var(--surface)] border-2 border-[var(--brand-600)]/40 rounded-3xl p-8 sm:p-12 shadow-[var(--shadow-paper)] max-w-md w-full text-center space-y-6 animate-scaleUp">
                
                {/* SVG Check Draws In over 700ms */}
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-[var(--safe-600)] flex items-center justify-center text-[var(--safe-600)] shadow-sm">
                  <svg className="w-10 h-10 overflow-visible" viewBox="0 0 40 40">
                    <DrawLine
                      as="path"
                      d="M10 21 l7 7 l14 -14"
                      fill="none"
                      stroke="var(--safe-600)"
                      strokeWidth={3.5}
                      duration={0.7}
                    />
                  </svg>
                </div>

                {/* 3D Floating Capsule Settles */}
                <div className="flex justify-center -my-2">
                  <FloatingCapsule size="md" />
                </div>

                {/* Text */}
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                    Profile Active & Verified
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    Cross-referencing 222,000+ interaction rules and Beers criteria for your clinical safety...
                  </p>
                </div>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--brand-600)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Entering PolySafe Dashboard...</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-4xl mx-auto text-center pt-6 text-[11px] text-[var(--ink-3)] font-mono">
        PolySafe Baseline Configuration · Longitudinal Pharmacovigilance
      </footer>
    </PageTransition>
  );
}
