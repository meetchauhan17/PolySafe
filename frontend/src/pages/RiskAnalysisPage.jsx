import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft,
  AlertOctagon,
  Stethoscope,
  User,
  Activity,
  Pill,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import Card from '../components/Card';
import { motion, useReducedMotion } from 'framer-motion';
import { RiskAnalysisSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { DrugHarmBadge, DrugHarmPanel } from '../components/DrugHarmLevel';

const DEMO_FLAG_DETAILS = {
  'demo-flag-1': {
    flag: {
      id: 'demo-flag-1',
      severity: 'Major',
      plainExplanation: 'Taking Amitriptyline with Escitalopram significantly increases your risk of irregular heart rhythms (QT prolongation) and extreme drowsiness or confusion.',
      clinicalExplanation: 'Pharmacodynamic synergism: concurrent use of tricyclic antidepressant (Amitriptyline) and selective serotonin reuptake inhibitor (Escitalopram) prolongs the QTc interval and elevates serotonin syndrome and anticholinergic burden risks.',
      actionPlan: 'Contact your prescribing physician to review concurrent antidepressant therapy and consider alternative non-anticholinergic options or baseline ECG monitoring.',
      doctorQuestions: [
        'Could we replace Amitriptyline with a lower-anticholinergic alternative for sleep/pain?',
        'Should we perform a baseline ECG to verify QT interval safety?',
        'What early symptoms of serotonin or anticholinergic excess should my caregiver monitor?',
      ],
      medicineA: {
        id: 'demo-med-1',
        name: 'Amitriptyline',
        type: 'PRESCRIPTION',
        dosage: '25mg at bedtime',
        prescribedBy: 'Dr. Priya Sharma, MD',
        dateAdded: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
      medicineB: {
        id: 'demo-med-2',
        name: 'Escitalopram',
        type: 'PRESCRIPTION',
        dosage: '10mg once daily',
        prescribedBy: 'Dr. Priya Sharma, MD',
        dateAdded: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe cumulative anticholinergic burden from multiple active agents.',
    },
    acbScores: [
      { medicineId: 'demo-med-1', name: 'Amitriptyline', score: 3 },
      { medicineId: 'demo-med-2', name: 'Escitalopram', score: 0 },
      { medicineId: 'demo-med-3', name: 'Amlodipine', score: 0 },
      { medicineId: 'demo-med-5', name: 'Ashwagandha Extract', score: 1 },
    ],
  },
  'demo-flag-2': {
    flag: {
      id: 'demo-flag-2',
      severity: 'Moderate',
      plainExplanation: 'Combining Ashwagandha herbal supplement with prescription Amitriptyline causes additive central nervous system sedation, dizziness, and fall risk.',
      clinicalExplanation: 'GABA-mimetic and sedative herbal synergy with tricyclic antidepressant potentiates psychomotor impairment and orthostatic hypotension.',
      actionPlan: 'Discuss all herbal supplements with your physician or pharmacist before combining with central nervous system active medications.',
      doctorQuestions: [
        'Is it safe to continue Ashwagandha alongside my current prescriptions?',
        'Does this combination increase my nighttime fall risk?',
      ],
      medicineA: {
        id: 'demo-med-1',
        name: 'Amitriptyline',
        type: 'PRESCRIPTION',
        dosage: '25mg at bedtime',
      },
      medicineB: {
        id: 'demo-med-5',
        name: 'Ashwagandha Extract',
        type: 'HERBAL',
        dosage: '500mg daily',
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe cumulative sedation and anticholinergic load.',
    },
    acbScores: [
      { medicineId: 'demo-med-1', name: 'Amitriptyline', score: 3 },
      { medicineId: 'demo-med-5', name: 'Ashwagandha Extract', score: 1 },
    ],
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchFlagDetail(flagId) {
  const { data } = await axios.get(`/interaction-flag/${flagId}`);
  return data;
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  Contraindicated: {
    headerBg:     '#FBE4DE',
    headerBorder: '#B23D25',
    pillBg:       '#B23D25',
    pillText:     '#fff',
    icon:         <AlertOctagon className="w-5 h-5" />,
    label:        'CONTRAINDICATED',
    barColor:     '#B23D25',
  },
  Major: {
    headerBg:     '#FBE4DE',
    headerBorder: '#B23D25',
    pillBg:       '#B23D25',
    pillText:     '#fff',
    icon:         <AlertOctagon className="w-5 h-5" />,
    label:        'MAJOR',
    barColor:     '#B23D25',
  },
  Moderate: {
    headerBg:     '#FBEED9',
    headerBorder: '#B5791A',
    pillBg:       '#B5791A',
    pillText:     '#fff',
    icon:         <AlertTriangle className="w-5 h-5" />,
    label:        'MODERATE',
    barColor:     '#B5791A',
  },
  Minor: {
    headerBg:     '#FEF9C3',
    headerBorder: '#A16207',
    pillBg:       '#A16207',
    pillText:     '#fff',
    icon:         <Info className="w-5 h-5" />,
    label:        'MINOR',
    barColor:     '#A16207',
  },
  Unknown: {
    headerBg:     '#F3F4F6',
    headerBorder: '#9CA3AF',
    pillBg:       '#6B7280',
    pillText:     '#fff',
    icon:         <Info className="w-5 h-5" />,
    label:        'UNKNOWN',
    barColor:     '#9CA3AF',
  },
};

// ─── Burden level config ──────────────────────────────────────────────────────
const BURDEN_LEVEL = {
  Normal:   { color: '#2B6E5E', bg: '#E4F2E9', border: '#2F8558', text: 'Low — No significant burden detected' },
  Moderate: { color: '#B5791A', bg: '#FBEED9', border: '#B5791A', text: 'Moderate — Monitor for sedation and cognitive effects' },
  Critical: { color: '#B23D25', bg: '#FBE4DE', border: '#B23D25', text: 'Critical — High risk of delirium, falls, and cognitive impairment' },
};

// Clamp burden score to a 0–100% bar fill; score of 6+ = 100%
function burdenBarPct(score) {
  return Math.min(100, Math.round((score / 6) * 100));
}

// ─── Drug type badge ──────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = {
    PRESCRIPTION: { bg: 'bg-[#1B4B66]/10 text-[#1B4B66] border-[#1B4B66]/20', label: 'Rx' },
    OTC:          { bg: 'bg-[#8A6D3B]/10 text-[#8A6D3B] border-[#8A6D3B]/20', label: 'OTC' },
    HERBAL:       { bg: 'bg-[#2B6E5E]/10 text-[#2B6E5E] border-[#2B6E5E]/20', label: 'Herbal' },
  }[type] ?? { bg: 'bg-[var(--brand-paper)] text-[#6B726C] border-[var(--brand-border-subtle)]', label: type };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── Medicine card ────────────────────────────────────────────────────────────
function DrugCard({ med, score }) {
  if (!med) return null;
  return (
    <div className="flex flex-col space-y-2.5 p-4 bg-[var(--brand-clay)] shadow-[4px_4px_8px_rgba(191,180,155,0.45),-4px_-4px_8px_rgba(255,255,255,0.60)] rounded-2xl">
      <div className="flex items-start space-x-3.5">
        <div className="icon-well w-10 h-10 flex-shrink-0">
          <Pill className="w-4 h-4 text-[#2B6E5E]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#1C2B27]">{med.name}</p>
            <div className="flex items-center gap-1.5">
              <DrugHarmBadge category={med.category} name={med.name} />
              <TypeBadge type={med.type} />
            </div>
          </div>
          {med.dosage && <p className="text-[11px] text-[#5C6B64] font-mono mt-0.5">{med.dosage}</p>}
          {score != null && (
            <p className="text-[10px] text-[#5C6B64] mt-1 font-mono">
              ACB burden score:{' '}
              <span className={`font-bold ${score >= 3 ? 'text-[#B23D25]' : score >= 1 ? 'text-[#B5791A]' : 'text-[#2B6E5E]'}`}>
                {score}
              </span>
            </p>
          )}
        </div>
      </div>
      <DrugHarmPanel medicine={med} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RiskAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { isGuest, token } = useAuth();

  const isDemoFlag = isGuest || id?.startsWith('demo-');
  const demoFallback = DEMO_FLAG_DETAILS[id] || DEMO_FLAG_DETAILS['demo-flag-1'];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flag-detail', id],
    queryFn:  () => fetchFlagDetail(id),
    enabled:  !!token && !isDemoFlag,
    staleTime: 60_000,
  });

  const activeData = isDemoFlag ? demoFallback : (data || demoFallback);
  const flag             = activeData?.flag;
  const cumulativeBurden = activeData?.cumulativeBurden;
  const acbScores        = activeData?.acbScores ?? [];

  const scoreFor = (medId) => acbScores.find((s) => s.medicineId === medId)?.score ?? null;

  if (isLoading) {
    return (
      <div className="min-h-[88vh] bg-[var(--brand-clay)] pb-16">
        <RiskAnalysisSkeleton />
      </div>
    );
  }

  if (isError || !flag) {
    return (
      <div className="min-h-[80vh] bg-[var(--brand-clay)] flex items-center justify-center p-4">
        <div className="polysafe-card p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#B23D25] mx-auto" />
          <h2 className="text-xl font-bold text-[#1C2B27]">Risk flag not found</h2>
          <p className="text-sm text-[#5C6B64]">
            {error?.response?.data?.error || 'Could not load details for this interaction.'}
          </p>
          <button onClick={() => navigate('/home')} className="btn-primary px-6 py-2.5 text-sm mx-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const cfg = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.Unknown;
  const burdenCfg = BURDEN_LEVEL[cumulativeBurden?.level] ?? BURDEN_LEVEL.Normal;
  const burdenScore = cumulativeBurden?.totalScore ?? 0;
  const burdenPct = burdenBarPct(burdenScore);

  return (
    <div className="bg-[var(--brand-clay)] min-h-[88vh] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Top navigation ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#6B726C] hover:text-[#2B6E5E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Safety Dashboard</span>
          </button>

          <span className="text-xs text-[#6B726C] font-semibold">
            {formatDate(flag.dateFlagged)}
          </span>
        </div>

        {/* ── Red/Amber header card (SAFETY CARVE-OUT) ───────────────────────── */}
        <div
          className="p-6 rounded-[32px] border-2 shadow-[6px_6px_14px_rgba(191,180,155,0.40),-6px_-6px_14px_rgba(255,255,255,0.50)]"
          style={{ backgroundColor: cfg.headerBg, borderColor: cfg.headerBorder }}
        >
          {/* Severity pill */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3.5 py-1 rounded-full shadow-xs"
              style={{ backgroundColor: cfg.pillBg, color: cfg.pillText }}
            >
              {cfg.icon}
              <span>{cfg.label} RISK</span>
            </span>
          </div>

          {/* Headline — Fraunces font, large */}
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
            {flag.medicineA?.name} + {flag.medicineB?.name}
          </h2>
          <p className="text-sm text-[#4A4F4B] mt-2 leading-relaxed">
            {flag.plainExplanation?.split('(This is an informational')[0].trim() || 'An interaction has been detected between these two medicines.'}
          </p>

          {/* Drug chips */}
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <span className="flex items-center gap-1.5 bg-[var(--brand-clay)] shadow-[3px_3px_6px_rgba(191,180,155,0.45),-3px_-3px_6px_rgba(255,255,255,0.60)] px-3.5 py-1.5 rounded-2xl text-xs font-bold text-[#1C2B27]">
              <Pill className="w-3.5 h-3.5 text-[#2B6E5E]" />
              {flag.medicineA?.name}
            </span>
            <span className="text-lg text-[#4A4F4B] font-bold">+</span>
            <span className="flex items-center gap-1.5 bg-[var(--brand-clay)] shadow-[3px_3px_6px_rgba(191,180,155,0.45),-3px_-3px_6px_rgba(255,255,255,0.60)] px-3.5 py-1.5 rounded-2xl text-xs font-bold text-[#1C2B27]">
              <Pill className="w-3.5 h-3.5 text-[#2B6E5E]" />
              {flag.medicineB?.name}
            </span>
          </div>
        </div>

        {/* ── Medicine details ────────────────────────────────────────────────── */}
        <Card
          title="Medicines Involved"
          subtitle="Pair evaluated by the safety engine"
          icon={<Pill className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-3"
        >
          <DrugCard med={flag.medicineA} score={scoreFor(flag.medicineA?.id)} />
          <DrugCard med={flag.medicineB} score={scoreFor(flag.medicineB?.id)} />
        </Card>

        {/* ── Clinical explanation (For the Doctor) ──────────────────────────── */}
        <Card
          title="For the Doctor"
          subtitle="Pharmacological mechanism & clinical recommendations"
          icon={<Stethoscope className="w-4 h-4 text-[#1B4B66]" />}
          badge={
            flag.generatedBy === 'timeout' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#B5791A] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating detailed explanation…
              </span>
            ) : flag.generatedBy === 'demo-mock' ? (
              <span className="text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] border border-[#2F8558]/30 px-2.5 py-0.5 rounded-full">
                DEMO
              </span>
            ) : null
          }
          className="space-y-3"
        >
          <div className="p-4 bg-[var(--brand-clay)] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-2xl">
            {flag.generatedBy === 'timeout' ? (
              <div className="space-y-2">
                <p className="text-sm text-[#1C2B27] leading-relaxed font-medium">
                  {flag.clinicalExplanation || `Interaction identified between ${flag.medicineA?.name} and ${flag.medicineB?.name} (${flag.severity}).`}
                </p>
                <p className="text-[11px] text-[#B5791A] italic">
                  Full AI-generated clinical summary is being generated — refresh in a few seconds.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#1C2B27] leading-relaxed font-medium">
                {flag.clinicalExplanation || 'Clinical explanation not available.'}
              </p>
            )}
          </div>

          {flag.patient?.conditions?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {flag.patient.conditions.map((c) => (
                <span key={c} className="text-[10px] px-3 py-1 bg-[var(--brand-clay)] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-xl text-[#5C6B64] font-semibold">
                  {c}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* ── Plain explanation (For You) ─────────────────────────────────────── */}
        <Card
          title="For You"
          subtitle="Simple explanation of what this means for your daily routine"
          icon={<User className="w-4 h-4 text-[#2B6E5E]" />}
          badge={
            flag.generatedBy === 'timeout' ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 italic">
                <Clock className="w-3 h-3" />
                Generating detailed explanation…
              </span>
            ) : null
          }
          className="space-y-3"
        >
          {flag.generatedBy === 'timeout' ? (
            <div className="space-y-2">
              <p className="text-[15px] text-[#1C2B27] leading-relaxed">
                {flag.plainExplanation?.split('(This is an informational')[0].trim()
                  || `An interaction was detected between ${flag.medicineA?.name} and ${flag.medicineB?.name}. Severity: ${flag.severity}.`}
              </p>
              <p className="text-[12px] text-[#B5791A] bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2">
                A personalised explanation is being generated for you. Refresh this page in a few seconds to see the full detail.
              </p>
            </div>
          ) : (
            <p className="text-[15px] text-[#1C2B27] leading-relaxed">
              {flag.plainExplanation?.split('(This is an informational')[0].trim() || 'Plain explanation not available.'}
            </p>
          )}

          <div className="flex items-start space-x-2.5 p-3.5 bg-[var(--brand-clay)] shadow-[inset_2px_2px_5px_rgba(191,180,155,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-[#5C6B64] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5C6B64] italic">
              This is an informational safety alert, not a medical diagnosis. Always consult your doctor before changing medicines.
            </p>
          </div>
        </Card>

        {/* ── Cumulative Burden Meter (SAFETY CARVE-OUT) ───────────────────────── */}
        <Card
          title="Combined Sedative / Pressure Load"
          subtitle="Anticholinergic Cognitive Burden (ACB) Index"
          icon={<Activity className="w-4 h-4 text-[#B5791A]" />}
          className="space-y-4"
        >

          {/* Score badge + level */}
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-3xl font-black font-mono"
                style={{ color: burdenCfg.color, fontFamily: "'Fraunces', serif" }}
              >
                {burdenScore}
              </span>
              <span className="text-sm text-[#5C6B64] ml-2">/ 6+ scale</span>
            </div>
            <span
              className="text-xs font-extrabold px-3.5 py-1.5 rounded-full"
              style={{ backgroundColor: burdenCfg.bg, color: burdenCfg.color, border: `1.5px solid ${burdenCfg.border}` }}
            >
              {cumulativeBurden?.level ?? 'Normal'}
            </span>
          </div>

          {/* Horizontal progress bar with Inset Well Track & High-Contrast Fill */}
          <div className="space-y-1.5">
            <div className="h-3.5 bg-[var(--brand-clay)] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={shouldReduceMotion ? { width: `${burdenPct}%` } : { width: '0%' }}
                animate={{ width: `${burdenPct}%` }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
                style={{
                  background: burdenPct >= 70
                    ? `linear-gradient(90deg, #B5791A, #B23D25)`
                    : burdenPct >= 35
                    ? `linear-gradient(90deg, #2B6E5E, #B5791A)`
                    : '#2B6E5E',
                }}
              />
            </div>
            {/* Tick markers */}
            <div className="flex justify-between text-[8px] sm:text-[9px] text-[#85948C] font-semibold px-1">
              <span>0 Normal</span>
              <span>1–2 Moderate</span>
              <span>3+ Critical</span>
            </div>
          </div>

          {/* Level description */}
          <p className="text-xs text-[#5C6B64] leading-relaxed">
            {cumulativeBurden?.explanation || burdenCfg.text}
          </p>

          {/* Disclaimer note */}
          <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-[var(--brand-clay)] shadow-[inset_2px_2px_5px_rgba(191,180,155,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]">
            <Info className="w-3.5 h-3.5 text-[#5C6B64] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5C6B64] leading-relaxed">
              <strong>No single medicine is unsafe alone</strong> — but together, cumulative anticholinergic and sedative load may increase risk of drowsiness, falls, and cognitive effects.
            </p>
          </div>
        </Card>

        {/* ── Footer actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link to="/home" className="btn-primary py-3.5 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <Link to="/add-medicine" className="btn-secondary py-3 flex items-center justify-center gap-2 text-sm">
            <Pill className="w-4 h-4" />
            <span>Manage My Medicines</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
