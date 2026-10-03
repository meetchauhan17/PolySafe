import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
 ShieldCheck,
 ArrowRight,
 CheckCircle2,
 AlertCircle,
 Loader2,
 Sparkles,
 HeartPulse,
 FlaskConical,
 Info,
 ChevronRight,
 X,
} from 'lucide-react';
import { patientApi } from '../api/auth';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import PolySafeInput from '../components/PolySafeInput';

// ─── Condition chip options (from master spec) ───────────────────────────────
const CONDITION_OPTIONS = [
 {
 id: 'diabetes',
 label: 'Diabetes',
 description: 'Type 1 or Type 2',
 color: 'amber',
 },
 {
 id: 'kidney',
 label: 'Kidney Issues',
 description: 'CKD, renal impairment',
 color: 'blue',
 },
 {
 id: 'liver',
 label: 'Liver Issues',
 description: 'Hepatic impairment, cirrhosis',
 color: 'orange',
 },
 {
 id: 'heart',
 label: 'Heart Condition',
 description: 'Arrhythmia, CHF, CAD',
 color: 'rose',
 },
 {
 id: 'none',
 label: 'None of the above',
 description: 'No known major conditions',
 color: 'teal',
 },
];

// Color map for the chips
const CHIP_STYLES = {
  amber: {
    base: 'border-amber-400/30 text-[var(--ink)] bg-[var(--surface)] hover:border-amber-400/60',
    active: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30 ring-offset-1',
  },
  blue: {
    base: 'border-[var(--doctor-600)]/30 text-[var(--ink)] bg-[var(--surface)] hover:border-[var(--doctor-600)]/60',
    active: 'border-[var(--doctor-600)] bg-[var(--doctor-600)]/10 text-[var(--doctor-600)] ring-2 ring-[var(--doctor-600)]/30 ring-offset-1',
  },
  orange: {
    base: 'border-orange-400/30 text-[var(--ink)] bg-[var(--surface)] hover:border-orange-400/60',
    active: 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/30 ring-offset-1',
  },
  rose: {
    base: 'border-[var(--critical-fg)]/30 text-[var(--ink)] bg-[var(--surface)] hover:border-[var(--critical-fg)]/60',
    active: 'border-[var(--critical-fg)] bg-rose-500/10 text-[var(--critical-fg)] ring-2 ring-[var(--critical-fg)]/30 ring-offset-1',
  },
  teal: {
    base: 'border-[var(--caregiver-600)]/30 text-[var(--ink)] bg-[var(--surface)] hover:border-[var(--caregiver-600)]/60',
    active: 'border-[var(--caregiver-600)] bg-[var(--caregiver-600)]/10 text-[var(--caregiver-600)] ring-2 ring-[var(--caregiver-600)]/30 ring-offset-1',
  },
};

export default function OnboardingPage() {
 const navigate = useNavigate();
 const { token } = useAuth();

 const [age, setAge] = useState('');
 const [conditions, setConditions] = useState([]); // array of condition ids
 const [allergiesText, setAllergiesText] = useState('');
 const [errorMsg, setErrorMsg] = useState(null);

 // ─── Mutation ───────────────────────────────────────────────────────────────
 const saveProfileMutation = useMutation({
 mutationFn: ({ age, conditions, allergies }) => {
 return patientApi.saveProfile({ age, conditions, allergies }, token);
 },
 onSuccess: () => {
 setErrorMsg(null);
 notify.success('Profile Saved', 'Your personalized medication safety profile is now active.');
 navigate('/home');
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

 // ─── Condition chip toggle ───────────────────────────────────────────────
 const toggleCondition = (id) => {
 if (id === 'none') {
 // "None" deselects everything else and selects only itself — or deselects
 setConditions((prev) =>
 prev.includes('none') ? [] : ['none']
 );
 return;
 }
 setConditions((prev) => {
 // If "none" was selected, remove it when selecting a real condition
 const filtered = prev.filter((c) => c !== 'none');
 return filtered.includes(id)
 ? filtered.filter((c) => c !== id)
 : [...filtered, id];
 });
 };

 // ─── Submit ─────────────────────────────────────────────────────────────────
 const handleSubmit = (e) => {
 e.preventDefault();
 setErrorMsg(null);

 // Age is the only required field
 if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
 setErrorMsg('Please enter a valid age between 1 and 120.');
 return;
 }

 // Parse allergies from comma-separated text
 const allergies = allergiesText
 ? allergiesText
 .split(',')
 .map((a) => a.trim())
 .filter(Boolean)
 : [];

 // Map condition ids to readable labels for storage
 const conditionLabels = conditions
 .filter((c) => c !== 'none')
 .map((id) => {
 const opt = CONDITION_OPTIONS.find((o) => o.id === id);
 return opt ? opt.label : id;
 });

 saveProfileMutation.mutate({
 age: Number(age),
 conditions: conditionLabels,
 allergies,
 });
 };

 const handleSkip = () => {
 navigate('/home');
 };

 return (
 <PageTransition className="min-h-[88vh] bg-[var(--canvas)] flex items-start justify-center px-4 py-10 md:py-16">
 <div className="max-w-2xl w-full space-y-6">

        {/* ── Modern Hero Header matching design system tokens ── */}
        <div className="ps-hero ps-fade-up text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20 mx-auto">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-600)] animate-pulse" />
            <span>Clinical Onboarding</span>
            <span className="text-[var(--brand-600)]/60">·</span>
            <span className="font-mono text-[11px] text-[var(--brand-600)]">Physiological Baseline</span>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
              Set Up Your <span className="ps-glow-text">PolySafe Profile</span>
            </h1>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              This baseline tailors interaction checks to your physiology — kidney or hepatic factors alter how scores and dosages are monitored.
            </p>
          </div>
        </div>

 {/* ── "Only Age Required" Banner ─────────────────────────────────────── */}
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/20 rounded-2xl text-xs text-[var(--brand-600)] shadow-sm">
 <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <p>
 <strong>Only your age is required.</strong> All other fields are optional — skip anything you'd
 rather not fill in now. You can update your profile any time from Settings.
 </p>
 </div>

 {/* ── Error Alert ───────────────────────────────────────────────────── */}
 {errorMsg && (
 <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm">
 <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
 <p className="font-semibold">{errorMsg}</p>
 </div>
 )}

 {/* ── Main Form Card ────────────────────────────────────────────────── */}
 <form onSubmit={handleSubmit} noValidate className="space-y-5">

 {/* SECTION 1: Age */}
 <Card
 title="Your Age"
 subtitle="Required — affects dosage thresholds and renal/hepatic risk scoring"
 icon={<HeartPulse className="w-4 h-4 text-[var(--brand-600)]" />}
 badge={
 <span className="text-[10px] font-bold bg-[var(--brand-600)] text-white px-2 py-0.5 rounded-md">
 REQUIRED
 </span>
 }
 className="space-y-4"
 >
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
 Age in Years
 </label>
 <PolySafeInput
 type="number"
 min="1"
 max="120"
 required
 value={age}
 onChange={(e) => {
 setAge(e.target.value);
 if (errorMsg) setErrorMsg('');
 }}
 placeholder="e.g. 68"
 error={Boolean(errorMsg && (!age || Number(age) < 1))}
 className="w-36 text-2xl font-bold text-center"
 />
 </div>
 </Card>

 {/* SECTION 2: Existing Conditions — multi-select chips */}
 <Card
 title="Existing Medical Conditions"
 subtitle="Select all that apply — determines organ-specific interaction risk"
 icon={<FlaskConical className="w-4 h-4 text-[var(--brand-600)]" />}
 badge={
 <span className="text-[10px] font-bold text-[var(--ink-3)] bg-[var(--border)] px-2 py-0.5 rounded-md">
 OPTIONAL
 </span>
 }
 className="space-y-4"
 >
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {CONDITION_OPTIONS.map((opt) => {
 const isSelected = conditions.includes(opt.id);
 const styles = CHIP_STYLES[opt.color];
 return (
 <button
 key={opt.id}
 type="button"
 onClick={() => toggleCondition(opt.id)}
 className={`flex items-center space-x-3 p-4 rounded-2xl border-2 text-left cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-sm transition-all duration-180 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 ${
 isSelected ? styles.active : styles.base + ' hover:opacity-90'
 }`}
 >
 <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
 isSelected
 ? 'bg-current border-current'
 : 'border-current opacity-40'
 }`}>
 {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold leading-tight">{opt.label}</p>
 <p className="text-[11px] opacity-70 mt-0.5">{opt.description}</p>
 </div>
 {isSelected && (
 <CheckCircle2 className="w-4 h-4 flex-shrink-0 opacity-70" />
 )}
 </button>
 );
 })}
 </div>

 {conditions.length > 0 && !conditions.includes('none') && (
 <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
 <span className="text-[11px] font-bold text-[var(--ink-3)] self-center">Selected:</span>
 {conditions.map((id) => {
 const opt = CONDITION_OPTIONS.find((o) => o.id === id);
 return (
 <button
 key={id}
 type="button"
 onClick={() => toggleCondition(id)}
 className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[var(--brand-600)] text-white text-[11px] font-bold rounded-lg"
 >
 <span>{opt?.label}</span>
 <X className="w-3 h-3" />
 </button>
 );
 })}
 </div>
 )}
 </Card>

 {/* SECTION 3: Allergies — free text */}
 <Card
 title="Known Drug Allergies"
 subtitle="Helps flag prescriptions you may react to"
 icon={<Sparkles className="w-4 h-4 text-[var(--brand-600)]" />}
 badge={
 <span className="text-[10px] font-bold text-[var(--ink-3)] bg-[var(--border)] px-2 py-0.5 rounded-md">
 SKIP IF NONE
 </span>
 }
 className="space-y-4"
 >
 <div className="space-y-2">
 <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
 Drug Allergies{' '}
 <span className="normal-case font-normal text-[var(--ink-3)]">
 — comma separated, e.g. penicillin, aspirin
 </span>
 </label>
 <PolySafeInput
 type="text"
 value={allergiesText}
 onChange={(e) => setAllergiesText(e.target.value)}
 placeholder="Leave blank if none — e.g. penicillin, sulfa drugs, aspirin"
 />
 {allergiesText && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {allergiesText
 .split(',')
 .map((a) => a.trim())
 .filter(Boolean)
 .map((allergen, i) => (
 <span
 key={i}
 className="inline-flex items-center px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg"
 >
 {allergen}
 </span>
 ))}
 </div>
 )}
 <p className="text-[11px] text-[var(--ink-3)]">
 Separate multiple allergies with commas. Leave this field empty if you have no known drug allergies.
 </p>
 </div>
 </Card>

 {/* ── Action Buttons ─────────────────────────────────────────────── */}
 <div className="flex flex-col sm:flex-row gap-3 pt-2">
 <button
 type="submit"
 disabled={saveProfileMutation.isPending}
 className="ps-btn ps-btn-primary ps-shine-button flex-1 py-4 text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
 >
 {saveProfileMutation.isPending ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>Saving Profile...</span>
 </>
 ) : (
 <>
 <span>Save Profile & Go to Dashboard</span>
 <ArrowRight className="w-5 h-5" />
 </>
 )}
 </button>

 <button
 type="button"
 onClick={handleSkip}
 className="ps-btn ps-btn-secondary sm:w-auto px-6 py-4 text-sm"
 >
 <span>Skip for Now</span>
 <ChevronRight className="w-4 h-4 text-[var(--ink-3)]" />
 </button>
 </div>

 {/* Progress micro-copy */}
 <p className="text-center text-[11px] text-[var(--ink-3)]">
 You can always update these details in your Profile Settings later.
 </p>
 </form>
 </div>
 </PageTransition>
 );
}
