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
 base: 'border-[#B5791A]/30 text-[#7A4A0A] bg-[#FBEED9]/60',
 active: 'border-[#B5791A] bg-[#FBEED9] ring-2 ring-[#B5791A]/30 ring-offset-1',
 },
 blue: {
 base: 'border-[#1B4B66]/30 text-[#1B4B66] bg-[#E9F1F5]/60',
 active: 'border-[#1B4B66] bg-[#E9F1F5] ring-2 ring-[#1B4B66]/30 ring-offset-1',
 },
 orange: {
 base: 'border-[#E0824B]/30 text-[#7A3E14] bg-[#FDF3EB]/60',
 active: 'border-[#E0824B] bg-[#FDF3EB] ring-2 ring-[#E0824B]/30 ring-offset-1',
 },
 rose: {
 base: 'border-[#B23D25]/30 text-[#7A1A0A] bg-[#FBE4DE]/60',
 active: 'border-[#B23D25] bg-[#FBE4DE] ring-2 ring-[#B23D25]/30 ring-offset-1',
 },
 teal: {
 base: 'border-[#2B6E5E]/30 text-[#1A5C3A] bg-[#E4F2E9]/60',
 active: 'border-[#2B6E5E] bg-[#E4F2E9] ring-2 ring-[#2B6E5E]/30 ring-offset-1',
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
 <PageTransition className="min-h-[88vh] bg-[var(--brand-clay)] flex items-start justify-center px-4 py-10 md:py-16">
 <div className="max-w-2xl w-full space-y-6">

 {/* ── Header ─────────────────────────────────────────────────────────── */}
 <div className="text-center space-y-2">
 <div className="icon-well w-14 h-14 mx-auto mb-1">
 <ShieldCheck className="w-7 h-7 text-[#2B6E5E]" />
 </div>
 <h1 className="text-3xl md:text-4xl text-[#1C2B27] font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
 Set Up Your PolySafe Profile
 </h1>
 <p className="text-sm text-[#5C6B64] max-w-md mx-auto leading-relaxed">
 This helps PolySafe tailor interaction checks to your physiology —
 kidney impairment, for example, changes how dozens of drugs are
 metabolised and cleared.
 </p>
 </div>

 {/* ── "Only Age Required" Banner ─────────────────────────────────────── */}
 <div className="flex items-start space-x-3 p-3.5 bg-[#2B6E5E]/10 border border-[#2B6E5E]/20 rounded-2xl text-xs text-[#2B6E5E] shadow-sm">
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
 icon={<HeartPulse className="w-4 h-4 text-[#2B6E5E]" />}
 badge={
 <span className="text-[10px] font-bold bg-[#2B6E5E] text-white px-2 py-0.5 rounded-md">
 REQUIRED
 </span>
 }
 className="space-y-4"
 >
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
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
 icon={<FlaskConical className="w-4 h-4 text-[#2B6E5E]" />}
 badge={
 <span className="text-[10px] font-bold text-[#6B726C] bg-[var(--brand-border-subtle)] px-2 py-0.5 rounded-md">
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
 className={`flex items-center space-x-3 p-4 rounded-2xl border-2 text-left cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-sm transition-all duration-180 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E] focus-visible:ring-offset-2 ${
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
 <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--brand-border-subtle)]">
 <span className="text-[11px] font-bold text-[#6B726C] self-center">Selected:</span>
 {conditions.map((id) => {
 const opt = CONDITION_OPTIONS.find((o) => o.id === id);
 return (
 <button
 key={id}
 type="button"
 onClick={() => toggleCondition(id)}
 className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#2B6E5E] text-white text-[11px] font-bold rounded-lg"
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
 icon={<Sparkles className="w-4 h-4 text-[#2B6E5E]" />}
 badge={
 <span className="text-[10px] font-bold text-[#6B726C] bg-[var(--brand-border-subtle)] px-2 py-0.5 rounded-md">
 SKIP IF NONE
 </span>
 }
 className="space-y-4"
 >
 <div className="space-y-2">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
 Drug Allergies{' '}
 <span className="normal-case font-normal text-[#6B726C]">
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
 <p className="text-[11px] text-[#6B726C]">
 Separate multiple allergies with commas. Leave this field empty if you have no known drug allergies.
 </p>
 </div>
 </Card>

 {/* ── Action Buttons ─────────────────────────────────────────────── */}
 <div className="flex flex-col sm:flex-row gap-3 pt-2">
 <button
 type="submit"
 disabled={saveProfileMutation.isPending}
 className="btn-primary flex-1 py-4 text-base"
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
 className="btn-secondary sm:w-auto px-6 py-4 text-sm"
 >
 <span>Skip for Now</span>
 <ChevronRight className="w-4 h-4 text-[#6B726C]" />
 </button>
 </div>

 {/* Progress micro-copy */}
 <p className="text-center text-[11px] text-[#6B726C]">
 You can always update these details in your Profile Settings later.
 </p>
 </form>
 </div>
 </PageTransition>
 );
}
