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
import BackButton from '../components/BackButton';

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
 <div className="p-5 bg-[var(--canvas)] border-2 border-[var(--caution-fg)]/50 rounded-2xl space-y-3">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-[var(--caution-fg)]/10 rounded-xl flex-shrink-0">
 <AlertTriangle className="w-5 h-5 text-[var(--caution-fg)]" />
 </div>
 <div>
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--caution-fg)]">
 Possible Prescribing Cascade Detected
 </p>
 <h2 className="text-lg font-bold text-[var(--ink)] mt-0.5" >
 This may be linked to {match.medicineName}
 </h2>
 </div>
 </div>

 <p className="text-sm text-[var(--ink-2)] leading-relaxed">
 You started{' '}
 <strong className="text-[var(--ink)]">{match.medicineName}</strong>{' '}
 on{' '}
 <strong className="text-[var(--ink)]">{formatDate(match.dateStarted)}</strong>.{' '}
 The symptom{' '}
 <em>"{match.symptomKeyword}"</em>{' '}
 is a known possible side effect of{' '}
 <strong className="text-[var(--ink)]">{match.causingDrugCategory}</strong>{' '}
 medicines.
 </p>

 {/* Key callout */}
 <div className="p-4 bg-[var(--border)] shadow-[var(--shadow-inner)] border border-[var(--caution-fg)]/30 rounded-xl flex items-start gap-2.5">
 <MessageSquare className="w-4 h-4 text-[var(--caution-fg)] flex-shrink-0 mt-0.5" />
 <p className="text-sm font-bold text-[var(--ink)] leading-relaxed">
 Worth asking your doctor before treating this as something new —
 it may be caused by a medicine you're already taking.
 </p>
 </div>
 </div>

 {/* Medicine details */}
 <Card
 title="Medicine started before this symptom"
 subtitle="Identified from your medication timeline"
 icon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
 className="space-y-3"
 >
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--canvas)] border border-[var(--border)] rounded-xl">
 <div className="p-2 bg-[var(--brand-600)]/10 rounded-lg flex-shrink-0">
 <Pill className="w-4 h-4 text-[var(--brand-600)]" />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-[var(--ink)]">{match.medicineName}</p>
 <div className="flex items-center gap-3 mt-1 flex-wrap">
 <span className="flex items-center gap-1 text-[10px] text-[var(--ink-3)]">
 <CalendarDays className="w-3 h-3" />
 Started {formatDate(match.dateStarted)}
 </span>
 {match.medicineDosage && (
 <span className="text-[10px] text-[var(--ink-3)]">{match.medicineDosage}</span>
 )}
 <span className="text-[10px] px-2 py-0.5 bg-[var(--canvas)] border border-[var(--border)] rounded-md text-[var(--ink-3)] font-semibold">
 {match.medicineType === 'PRESCRIPTION' ? 'Rx' : match.medicineType}
 </span>
 </div>
 </div>
 </div>
 </Card>

 {/* What is a prescribing cascade */}
 <Card
 title="What is a prescribing cascade?"
 icon={<HelpCircle className="w-4 h-4 text-[var(--ink-3)]" />}
 className="space-y-3"
 >
 <p className="text-sm text-[var(--ink-2)] leading-relaxed">
 {match.cascadeDescription}
 </p>
 </Card>

 {/* What to do */}
 <Card
 title="How to bring this up"
 icon={<MessageSquare className="w-4 h-4 text-[var(--brand-600)]" />}
 className="space-y-3"
 >
 <div className="p-4 bg-[var(--canvas)] border border-[var(--brand-600)]/30 rounded-xl shadow-[var(--shadow-inner)]">
 <p className="text-sm text-[var(--ink-2)] leading-relaxed italic">
 "I've been taking {match.medicineName} since {formatDate(match.dateStarted)}, and I've noticed {description}. Could this be a side effect of that medicine, rather than a new condition?"
 </p>
 </div>
 <p className="text-[11px] text-[var(--ink-3)]">
 This is a suggested question — your doctor will confirm whether the link is real in your specific case.
 </p>
 </Card>

 {/* Safety notice */}
 <div className="flex items-start space-x-2.5 p-4 border-2 border-[var(--border)] bg-[var(--canvas)] rounded-2xl">
 <Info className="w-4 h-4 text-[var(--ink-3)] flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
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
 <Card variant="safe" className="bg-[var(--canvas)] border border-[var(--safe-fg)]/30 space-y-3 shadow-[var(--shadow-sm)]">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-[var(--safe-fg)]/10 rounded-xl flex-shrink-0">
 <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
 </div>
 <div>
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand-600)]">
 No known link found
 </p>
 <h2 className="text-lg font-bold text-[var(--ink)] mt-0.5" >
 We couldn't match this to a known pattern
 </h2>
 </div>
 </div>

 <p className="text-sm text-[var(--ink)] leading-relaxed">
 PolySafe checked your symptom description against documented prescribing cascade patterns and didn't find a close match with your current medicine list.
 </p>

 <div className="p-4 bg-[var(--border)] shadow-[var(--shadow-inner)] border border-[var(--safe-fg)]/30 rounded-xl space-y-1.5">
 <div className="flex items-center gap-2">
 <MessageSquare className="w-4 h-4 text-[var(--brand-600)] flex-shrink-0" />
 <p className="text-sm font-bold text-[var(--ink)]">
 No known link found — but worth mentioning to your doctor anyway.
 </p>
 </div>
 <p className="text-xs text-[var(--ink-3)] leading-relaxed">
 Symptoms that seem unrelated to medicines can sometimes still be connected. Your doctor has the full clinical picture.
 </p>
 </div>
 </Card>

 {/* Context card */}
 <Card
 title="Why no match?"
 icon={<Info className="w-4 h-4 text-[var(--ink-3)]" />}
 className="space-y-3"
 >
 <p className="text-sm text-[var(--ink-2)] leading-relaxed">
 PolySafe only flags interactions documented in established clinical literature. The absence of a match doesn't mean your medicines aren't connected to this symptom — it means we don't have enough data to flag it automatically. 
 Your pharmacist or doctor will be better placed to evaluate it.
 </p>
 </Card>

 {/* Suggested question */}
 <Card
 title="Suggested question for your doctor"
 icon={<MessageSquare className="w-4 h-4 text-[var(--brand-600)]" />}
 className="space-y-3"
 >
 <div className="p-4 bg-[var(--canvas)] border border-[var(--border)] rounded-xl">
 <p className="text-sm text-[var(--ink-2)] leading-relaxed italic">
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
 <HeartPulse className="w-12 h-12 text-[var(--brand-600)] mx-auto" />
 <h2 className="text-xl font-bold text-[var(--ink)]">No symptom data found</h2>
 <p className="text-sm text-[var(--ink-3)]">Please log a symptom first to see cascade analysis results.</p>
 <Link to="/log-symptom" className="ps-btn ps-btn-primary inline-flex items-center gap-2 px-6 py-3">
 Log a Symptom <ChevronRight className="w-4 h-4" />
 </Link>
 </div>
 );
 }

 return (
 <div className="min-h-[88vh] bg-[var(--canvas)] pb-12">
 <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Modern Hero Header matching design system tokens ── */}
        <div className="ps-hero ps-fade-up" style={{ '--hero-accent': result.cascadeDetected ? 'var(--caution-fg)' : '#10b981', borderColor: result.cascadeDetected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)' }}>
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackButton to="/log-symptom" label="Back to Form" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-600)] animate-pulse" />
                <span>Cascade Analysis Report</span>
                <span className="text-[var(--brand-600)]/60">·</span>
                <span className="font-mono text-[11px] text-[var(--brand-600)]">{result.cascadeDetected ? 'Cascade Warning' : 'Clear Telemetry'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                Symptom <span className="ps-glow-text">Telemetry Result</span>
              </h1>
              <p className="text-sm text-[var(--ink-2)] max-w-xl leading-relaxed font-mono">
                Analysis for: "{description.length > 70 ? description.slice(0, 70) + '…' : description}"
              </p>
            </div>
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
 className="ps-btn ps-btn-primary py-3.5 flex items-center justify-center gap-2"
 >
 <HeartPulse className="w-4 h-4" />
 <span>Log Another Symptom</span>
 </button>
 <BackButton to="/home" label="Back to Dashboard" className="w-full py-3 justify-center text-sm" />
 </div>

 </div>
 </div>
 );
}
