import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

function formatDate(isoString) {
  if (!isoString) return 'Recent Analysis';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent Analysis';
  }
}

const DEMO_FLAG_DETAILS = {
  'f1': {
    flag: {
      id: 'f1',
      severity: 'Major',
      plainExplanation: 'Turmeric may enhance Warfarin\'s blood-thinning effect, significantly increasing bleeding risk.',
      clinicalExplanation: 'Curcumin inhibits platelet aggregation and CYP2C9-mediated warfarin metabolism, elevating INR and bleeding propensity.',
      actionPlan: 'Avoid high-dose turmeric/curcumin supplements while on Warfarin unless explicitly monitored and calibrated by your anticoagulation clinic.',
      doctorQuestions: [
        'How often should we check my INR while adjusting supplements or diet?',
        'Are there specific signs of minor bleeding (e.g. gum bleeding, bruising) I should report immediately?',
        'Can dietary turmeric in food be safely consumed in moderate culinary amounts?',
      ],
      medicineA: {
        id: 'd1',
        name: 'Warfarin',
        type: 'PRESCRIPTION',
        dosage: '5mg daily',
        category: 'Anticoagulant (Blood Thinner)',
        dateAdded: new Date().toISOString(),
      },
      medicineB: {
        id: 'd4',
        name: 'Turmeric (Curcumin)',
        type: 'HERBAL',
        dosage: '500mg daily',
        category: 'Herbal Supplement',
        dateAdded: new Date().toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 3,
      level: 'Moderate',
      description: 'Elevated bleeding risk due to botanical-pharmacological metabolic interaction.',
    },
    acbScores: [
      { medicineId: 'd1', name: 'Warfarin', score: 2 },
      { medicineId: 'd4', name: 'Turmeric (Curcumin)', score: 1 },
    ],
  },
  'f2': {
    flag: {
      id: 'f2',
      severity: 'Moderate',
      plainExplanation: 'Taking Aspirin with Warfarin increases gastrointestinal bleeding risk.',
      clinicalExplanation: 'Combined anticoagulant (Warfarin) and antiplatelet (Aspirin) therapy produces additive antihemostatic effects, raising the risk of major upper GI haemorrhage.',
      actionPlan: 'Verify dual antithrombotic indication with your cardiologist or primary care physician. Consider gastroprotective co-prescription (PPI) if combination is clinically mandated.',
      doctorQuestions: [
        'Is the combination of low-dose Aspirin and Warfarin strictly indicated for my cardiovascular condition?',
        'Should I take a stomach-protecting medication (like a PPI) to reduce bleeding risk?',
      ],
      medicineA: {
        id: 'd1',
        name: 'Warfarin',
        type: 'PRESCRIPTION',
        dosage: '5mg daily',
        category: 'Anticoagulant (Blood Thinner)',
        dateAdded: new Date().toISOString(),
      },
      medicineB: {
        id: 'd2',
        name: 'Aspirin',
        type: 'OTC',
        dosage: '81mg daily',
        category: 'Antiplatelet / NSAID',
        dateAdded: new Date().toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe dual antiplatelet/anticoagulant hemostatic load.',
    },
    acbScores: [
      { medicineId: 'd1', name: 'Warfarin', score: 2 },
      { medicineId: 'd2', name: 'Aspirin', score: 2 },
    ],
  },
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
 headerBg: 'var(--chassis)',
 headerBorder: 'var(--led-critical)',
 pillBg: 'var(--led-critical)',
 pillText: '#fff',
 icon: <AlertOctagon className="w-5 h-5" />,
 label: 'CONTRAINDICATED',
 barColor: 'var(--led-critical)',
 },
 Major: {
 headerBg: 'var(--chassis)',
 headerBorder: 'var(--led-critical)',
 pillBg: 'var(--led-critical)',
 pillText: '#fff',
 icon: <AlertOctagon className="w-5 h-5" />,
 label: 'MAJOR',
 barColor: 'var(--led-critical)',
 },
 Moderate: {
 headerBg: 'var(--chassis)',
 headerBorder: 'var(--led-caution)',
 pillBg: 'var(--led-caution)',
 pillText: '#fff',
 icon: <AlertTriangle className="w-5 h-5" />,
 label: 'MODERATE',
 barColor: 'var(--led-caution)',
 },
 Minor: {
 headerBg: '#FEF9C3',
 headerBorder: '#A16207',
 pillBg: '#A16207',
 pillText: '#fff',
 icon: <Info className="w-5 h-5" />,
 label: 'MINOR',
 barColor: '#A16207',
 },
 Unknown: {
 headerBg: '#F3F4F6',
 headerBorder: '#9CA3AF',
 pillBg: '#6B7280',
 pillText: '#fff',
 icon: <Info className="w-5 h-5" />,
 label: 'UNKNOWN',
 barColor: '#9CA3AF',
 },
};

// ─── Burden level config ──────────────────────────────────────────────────────
const BURDEN_LEVEL = {
 Normal: { color: 'var(--accent-primary)', bg: 'var(--chassis)', border: 'var(--led-safe)', text: 'Low — No significant burden detected' },
 Moderate: { color: 'var(--led-caution)', bg: 'var(--chassis)', border: 'var(--led-caution)', text: 'Moderate — Monitor for sedation and cognitive effects' },
 Critical: { color: 'var(--led-critical)', bg: 'var(--chassis)', border: 'var(--led-critical)', text: 'Critical — High risk of delirium, falls, and cognitive impairment' },
};

// Clamp burden score to a 0–100% bar fill; score of 6+ = 100%
function burdenBarPct(score) {
 return Math.min(100, Math.round((score / 6) * 100));
}

// ─── Drug type badge ──────────────────────────────────────────────────────────
function TypeBadge({ type }) {
 const cfg = {
 PRESCRIPTION: { bg: 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/20', label: 'Rx' },
 OTC: { bg: 'bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)] border-[var(--role-caregiver)]/20', label: 'OTC' },
 HERBAL: { bg: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20', label: 'Herbal' },
 }[type] ?? { bg: 'bg-[var(--chassis)] text-[var(--text-muted)] border-[var(--brand-border-subtle)]', label: type };
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
    <div className="flex flex-col space-y-2.5 p-4 bg-[var(--chassis)] shadow-[var(--shadow-sm)] rounded-2xl min-w-0">
      <div className="flex items-start space-x-3.5">
        <div className="icon-well w-10 h-10 flex-shrink-0">
          <Pill className="w-4 h-4 text-[var(--accent-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">{med.name}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <DrugHarmBadge category={med.category} name={med.name} />
              <TypeBadge type={med.type} />
            </div>
          </div>
          {med.dosage && <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{med.dosage}</p>}
          {score != null && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
              ACB burden score:{' '}
              <span className={`font-bold ${score >= 3 ? 'text-[var(--led-critical)]' : score >= 1 ? 'text-[var(--led-caution)]' : 'text-[var(--accent-primary)]'}`}>
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
 queryFn: () => fetchFlagDetail(id),
 enabled: !!token && !isDemoFlag,
 staleTime: 60_000,
 });

 const activeData = data || demoFallback || DEMO_FLAG_DETAILS[id] || DEMO_FLAG_DETAILS['f1'];
 const flag = activeData?.flag;
 const cumulativeBurden = activeData?.cumulativeBurden;
 const acbScores = activeData?.acbScores ?? [];

 const scoreFor = (medId) => acbScores.find((s) => s.medicineId === medId)?.score ?? null;

 if (isLoading && !activeData) {
   return (
     <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
       <RiskAnalysisSkeleton />
     </div>
   );
 }

 if (!flag) {
 return (
 <div className="min-h-[80vh] bg-[var(--chassis)] flex items-center justify-center p-4">
 <div className="polysafe-card p-8 max-w-md w-full text-center space-y-4">
 <AlertCircle className="w-12 h-12 text-[var(--led-critical)] mx-auto" />
 <h2 className="text-xl font-bold text-[var(--text-primary)]">Risk flag not found</h2>
 <p className="text-sm text-[var(--text-muted)]">
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
 <div className="bg-[var(--chassis)] min-h-[88vh] pb-24">
 <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

 {/* ── Top navigation ─────────────────────────────────────────────────── */}
 <div className="flex items-center justify-between">
 <button
 onClick={() => navigate('/home')}
 className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Back to Safety Dashboard</span>
 </button>

 <span className="text-xs text-[var(--text-muted)] font-semibold">
 {formatDate(flag.dateFlagged)}
 </span>
 </div>

 {/* ── Red/Amber header card (SAFETY CARVE-OUT) ───────────────────────── */}
 <div
 className="p-6 rounded-[32px] border-2 shadow-[var(--shadow-card)]"
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
 <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-[var(--text-primary)]" >
 {flag.medicineA?.name} + {flag.medicineB?.name}
 </h2>
 <p className="text-sm text-[#4A4F4B] mt-2 leading-relaxed">
 {flag.plainExplanation?.split('(This is an informational')[0].trim() || 'An interaction has been detected between these two medicines.'}
 </p>

 {/* Drug chips */}
 <div className="flex items-center gap-2.5 mt-4 flex-wrap">
 <span className="flex items-center gap-1.5 bg-[var(--chassis)] shadow-[var(--shadow-card)] px-3.5 py-1.5 rounded-2xl text-xs font-bold text-[var(--text-primary)]">
 <Pill className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
 {flag.medicineA?.name}
 </span>
 <span className="text-lg text-[#4A4F4B] font-bold">+</span>
 <span className="flex items-center gap-1.5 bg-[var(--chassis)] shadow-[var(--shadow-card)] px-3.5 py-1.5 rounded-2xl text-xs font-bold text-[var(--text-primary)]">
 <Pill className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
 {flag.medicineB?.name}
 </span>
 </div>
 </div>

 {/* ── Medicine details ────────────────────────────────────────────────── */}
 <Card
 title="Medicines Involved"
 subtitle="Pair evaluated by the safety engine"
 icon={<Pill className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="space-y-3"
 >
 <DrugCard med={flag.medicineA} score={scoreFor(flag.medicineA?.id)} />
 <DrugCard med={flag.medicineB} score={scoreFor(flag.medicineB?.id)} />
 </Card>

 {/* ── Clinical explanation (For the Doctor) ──────────────────────────── */}
 <Card
 title="For the Doctor"
 subtitle="Pharmacological mechanism & clinical recommendations"
 icon={<Stethoscope className="w-4 h-4 text-[var(--accent-secondary)]" />}
 badge={
    flag.generatedBy === 'timeout' ? (
      <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--led-caution)] bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
        <Loader2 className="w-3 h-3 animate-spin text-[var(--led-caution)]" />
        Generating detailed explanation…
      </span>
    ) : flag.generatedBy === 'demo-mock' ? (
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/25 px-2.5 py-0.5 rounded-full shadow-xs">
        DEMO
      </span>
    ) : null
  }
 className="space-y-3"
 >
 <div className="p-4 bg-[var(--chassis)] shadow-[var(--shadow-recessed)] rounded-2xl">
 {flag.generatedBy === 'timeout' ? (
 <div className="space-y-2">
 <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
 {flag.clinicalExplanation || `Interaction identified between ${flag.medicineA?.name} and ${flag.medicineB?.name} (${flag.severity}).`}
 </p>
 <p className="text-[11px] text-[var(--led-caution)] italic">
 Full AI-generated clinical summary is being generated — refresh in a few seconds.
 </p>
 </div>
 ) : (
 <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
 {flag.clinicalExplanation || 'Clinical explanation not available.'}
 </p>
 )}
 </div>

 {flag.patient?.conditions?.length > 0 && (
 <div className="flex flex-wrap gap-2 pt-1">
 {flag.patient.conditions.map((c) => (
 <span key={c} className="text-[10px] px-3 py-1 bg-[var(--chassis)] shadow-[var(--shadow-card)] rounded-xl text-[var(--text-muted)] font-semibold">
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
 icon={<User className="w-4 h-4 text-[var(--accent-primary)]" />}
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
 <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">
 {flag.plainExplanation?.split('(This is an informational')[0].trim()
 || `An interaction was detected between ${flag.medicineA?.name} and ${flag.medicineB?.name}. Severity: ${flag.severity}.`}
 </p>
 <p className="text-[12px] text-[var(--led-caution)] bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2">
 A personalised explanation is being generated for you. Refresh this page in a few seconds to see the full detail.
 </p>
 </div>
 ) : (
 <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">
 {flag.plainExplanation?.split('(This is an informational')[0].trim() || 'Plain explanation not available.'}
 </p>
 )}

 <div className="flex items-start space-x-2.5 p-3.5 bg-[var(--chassis)] shadow-[var(--shadow-card)] rounded-2xl">
 <ShieldCheck className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[var(--text-muted)] italic">
 This is an informational safety alert, not a medical diagnosis. Always consult your doctor before changing medicines.
 </p>
 </div>
 </Card>

 {/* ── Cumulative Burden Meter (SAFETY CARVE-OUT) ───────────────────────── */}
 <Card
 title="Combined Sedative / Pressure Load"
 subtitle="Anticholinergic Cognitive Burden (ACB) Index"
 icon={<Activity className="w-4 h-4 text-[var(--led-caution)]" />}
 className="space-y-4"
 >

 {/* Score badge + level */}
 <div className="flex items-center justify-between">
 <div>
 <span
 className="text-3xl font-black font-mono"
 style={{ color: burdenCfg.color }}
 >
 {burdenScore}
 </span>
 <span className="text-sm text-[var(--text-muted)] ml-2">/ 6+ scale</span>
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
 <div className="h-3.5 bg-[var(--chassis)] shadow-[var(--shadow-recessed)] rounded-full overflow-hidden p-0.5">
 <motion.div
 className="h-full rounded-full"
 initial={shouldReduceMotion ? { width: `${burdenPct}%` } : { width: '0%' }}
 animate={{ width: `${burdenPct}%` }}
 transition={
 shouldReduceMotion
 ? { duration: 0 }
 : { duration: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }
 }
 style={{
 background: burdenPct >= 70
 ? `linear-gradient(90deg, var(--led-caution), var(--led-critical))`
 : burdenPct >= 35
 ? `linear-gradient(90deg, var(--accent-primary), var(--led-caution))`
 : 'var(--accent-primary)',
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
 <p className="text-xs text-[var(--text-muted)] leading-relaxed">
 {cumulativeBurden?.explanation || burdenCfg.text}
 </p>

 {/* Disclaimer note */}
 <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-card)]">
 <Info className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
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
