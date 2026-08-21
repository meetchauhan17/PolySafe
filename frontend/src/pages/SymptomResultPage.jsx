import React from 'react';
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
} from 'lucide-react';
import Card from '../components/Card';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
 if (!dateStr) return '—';
 return new Date(dateStr).toLocaleDateString('en-IN', {
 day: 'numeric',
 month: 'long',
 year: 'numeric',
 });
}

// ─── Card: Cascade match found ────────────────────────────────────────────────
function CascadeMatchCard({ match, description }) {
 return (
 <div className="space-y-4">
 {/* Calm amber alert header */}
 <div className="p-5 bg-[#FBEED9] border-2 border-[#B5791A]/50 rounded-2xl space-y-3">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-[#B5791A]/10 rounded-xl flex-shrink-0">
 <AlertTriangle className="w-5 h-5 text-[#B5791A]" />
 </div>
 <div>
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#B5791A]">
 Possible Prescribing Cascade Detected
 </p>
 <h2 className="text-lg font-bold text-[#232724] mt-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
 This may be linked to {match.medicineName}
 </h2>
 </div>
 </div>

 <p className="text-sm text-[#4A4F4B] leading-relaxed">
 You started{' '}
 <strong className="text-[#232724]">{match.medicineName}</strong>{' '}
 on{' '}
 <strong className="text-[#232724]">{formatDate(match.dateStarted)}</strong>.{' '}
 The symptom{' '}
 <em>"{match.symptomKeyword}"</em>{' '}
 is a known possible side effect of{' '}
 <strong className="text-[#232724]">{match.causingDrugCategory}</strong>{' '}
 medicines.
 </p>

 {/* Key callout */}
 <div className="p-4 bg-[#E6E0D3] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] border border-[#B5791A]/30 rounded-xl flex items-start gap-2.5">
 <MessageSquare className="w-4 h-4 text-[#B5791A] flex-shrink-0 mt-0.5" />
 <p className="text-sm font-bold text-[#7A4A0A] leading-relaxed">
 Worth asking your doctor before treating this as something new —
 it may be caused by a medicine you're already taking.
 </p>
 </div>
 </div>

 {/* Medicine details */}
 <Card
 title="Medicine started before this symptom"
 subtitle="Identified from your medication timeline"
 icon={<Pill className="w-4 h-4 text-[#2B6E5E]" />}
 className="space-y-3"
 >
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--brand-paper)] border border-[var(--brand-border-subtle)] rounded-xl">
 <div className="p-2 bg-[#2B6E5E]/10 rounded-lg flex-shrink-0">
 <Pill className="w-4 h-4 text-[#2B6E5E]" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-[#232724]">{match.medicineName}</p>
 <div className="flex items-center gap-3 mt-1 flex-wrap">
 <span className="flex items-center gap-1 text-[10px] text-[#6B726C]">
 <CalendarDays className="w-3 h-3" />
 Started {formatDate(match.dateStarted)}
 </span>
 {match.medicineDosage && (
 <span className="text-[10px] text-[#6B726C]">{match.medicineDosage}</span>
 )}
 <span className="text-[10px] px-2 py-0.5 bg-[var(--brand-paper)] border border-[var(--brand-border-subtle)] rounded-md text-[#6B726C] font-semibold">
 {match.medicineType === 'PRESCRIPTION' ? 'Rx' : match.medicineType}
 </span>
 </div>
 </div>
 </div>
 </Card>

 {/* What is a prescribing cascade */}
 <Card
 title="What is a prescribing cascade?"
 icon={<HelpCircle className="w-4 h-4 text-[#6B726C]" />}
 className="space-y-3"
 >
 <p className="text-sm text-[#4A4F4B] leading-relaxed">
 {match.cascadeDescription}
 </p>
 </Card>

 {/* What to do */}
 <Card
 title="How to bring this up"
 icon={<MessageSquare className="w-4 h-4 text-[#2B6E5E]" />}
 className="space-y-3"
 >
 <div className="p-4 bg-[#E4F2E9] border border-[#2F8558]/30 rounded-xl">
 <p className="text-sm text-[#1A5C3A] leading-relaxed italic">
 "I've been taking {match.medicineName} since {formatDate(match.dateStarted)}, and I've noticed {description}. Could this be a side effect of that medicine, rather than a new condition?"
 </p>
 </div>
 <p className="text-[11px] text-[#6B726C]">
 This is a suggested question — your doctor will confirm whether the link is real in your specific case.
 </p>
 </Card>

 {/* Safety notice */}
 <div className="flex items-start space-x-2.5 p-4 border-2 border-[var(--brand-border-subtle)] bg-[var(--brand-paper)] rounded-2xl">
 <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[#6B726C] leading-relaxed">
 <strong>This is an informational safety alert, not a medical diagnosis.</strong>{' '}
 Do not stop or change any medicine without first talking to your prescriber.
 The prescribing cascade pattern shown here is based on documented clinical literature.
 </p>
 </div>
 </div>
 );
}

// ─── Card: No match found ─────────────────────────────────────────────────────
function NoCascadeCard({ description }) {
 return (
 <div className="space-y-4">
 {/* Reassuring green card */}
 <Card variant="safe" className="bg-[#E4F2E9]/40 space-y-3">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-[#2B6E5E]/10 rounded-xl flex-shrink-0">
 <CheckCircle2 className="w-5 h-5 text-[#2B6E5E]" />
 </div>
 <div>
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2B6E5E]">
 No known link found
 </p>
 <h2 className="text-lg font-bold text-[#232724] mt-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
 We couldn't match this to a known pattern
 </h2>
 </div>
 </div>

 <p className="text-sm text-[#1A5C3A] leading-relaxed">
 PolySafe checked your symptom description against documented prescribing cascade patterns and didn't find a close match with your current medicine list.
 </p>

 <div className="p-4 bg-[#E6E0D3] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] border border-[#2F8558]/30 rounded-xl space-y-1.5">
 <div className="flex items-center gap-2">
 <MessageSquare className="w-4 h-4 text-[#2B6E5E] flex-shrink-0" />
 <p className="text-sm font-bold text-[#1A5C3A]">
 No known link found — but worth mentioning to your doctor anyway.
 </p>
 </div>
 <p className="text-xs text-[#2A6945] leading-relaxed">
 Symptoms that seem unrelated to medicines can sometimes still be connected. Your doctor has the full clinical picture.
 </p>
 </div>
 </Card>

 {/* Context card */}
 <Card
 title="Why no match?"
 icon={<Info className="w-4 h-4 text-[#6B726C]" />}
 className="space-y-3"
 >
 <p className="text-sm text-[#4A4F4B] leading-relaxed">
 PolySafe only flags interactions documented in established clinical literature. The absence of a match doesn't mean your medicines aren't connected to this symptom — it means we don't have enough data to flag it automatically. 
 Your pharmacist or doctor will be better placed to evaluate it.
 </p>
 </Card>

 {/* Suggested question */}
 <Card
 title="Suggested question for your doctor"
 icon={<MessageSquare className="w-4 h-4 text-[#2B6E5E]" />}
 className="space-y-3"
 >
 <div className="p-4 bg-[var(--brand-paper)] border border-[var(--brand-border-subtle)] rounded-xl">
 <p className="text-sm text-[#4A4F4B] leading-relaxed italic">
 "I've been experiencing {description}. Could any of my current medicines be contributing to this, even if it seems unrelated?"
 </p>
 </div>
 </Card>
 </div>
 );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SymptomResultPage() {
 const location = useLocation();
 const navigate = useNavigate();

 const result = location.state?.result;
 const description = location.state?.description || 'your symptom';

 // If the user navigated here directly without state, send them to log a symptom
 if (!result) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
 <HeartPulse className="w-12 h-12 text-[#2B6E5E] mx-auto" />
 <h2 className="text-xl font-bold text-[#232724]">No symptom data found</h2>
 <p className="text-sm text-[#6B726C]">Please log a symptom first to see cascade analysis results.</p>
 <Link to="/log-symptom" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
 Log a Symptom <ChevronRight className="w-4 h-4" />
 </Link>
 </div>
 );
 }

 return (
 <div className="min-h-[88vh] bg-[var(--brand-clay)] pb-12">
 <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

 {/* ── Back nav ───────────────────────────────────────────────────────── */}
 <div className="flex items-center space-x-3">
 <button
 onClick={() => navigate('/log-symptom')}
 className="btn-secondary p-2.5 rounded-2xl"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div>
 <h1 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
 Symptom Analysis Result
 </h1>
 <p className="text-[11px] text-[#5C6B64]">
 "{description.length > 60 ? description.slice(0, 60) + '…' : description}"
 </p>
 </div>
 </div>

 {/* ── Result card ───────────────────────────────────────────────────── */}
 {result.cascadeDetected && result.match ? (
 <CascadeMatchCard match={result.match} description={description} />
 ) : (
 <NoCascadeCard description={description} />
 )}

 {/* ── Footer actions ────────────────────────────────────────────────── */}
 <div className="flex flex-col gap-2.5 pt-2">
 <button
 onClick={() => navigate('/log-symptom')}
 className="btn-primary py-3.5 flex items-center justify-center gap-2"
 >
 <HeartPulse className="w-4 h-4" />
 <span>Log Another Symptom</span>
 </button>
 <Link
 to="/home"
 className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Back to Dashboard</span>
 </Link>
 </div>

 </div>
 </div>
 );
}
