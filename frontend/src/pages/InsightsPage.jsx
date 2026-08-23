import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
 TrendingUp,
 ArrowLeft,
 Activity,
 AlertTriangle,
 Pill,
 ShieldCheck,
 CalendarDays,
 Info,
 ChevronRight,
 Loader2,
 Sparkles,
 BarChart3,
} from 'lucide-react';
import {
 ResponsiveContainer,
 AreaChart,
 Area,
 LineChart,
 Line,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ReferenceLine,
} from 'recharts';
import Card from '../components/Card';
import { motion, useReducedMotion } from 'framer-motion';
import { EmptyTrendsIllustration } from '../components/EmptyIllustrations';
import { InsightsSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';

async function fetchInsights() {
 const { data } = await axios.get('/patient/insights');
 return data;
}

// ─── Custom Card Tooltip for Charts ───────────────────────────────────────────
function CustomChartTooltip({ active, payload, label, mode = 'flags' }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  if (mode === 'burden') {
    const score = data.cumulativeScore;
    const isCritical = score >= 3;
    const isModerate = score >= 1 && score < 3;

    return (
      <div className="bg-[var(--chassis-panel)] border border-[var(--chassis-dark)] rounded-xl p-4 shadow-[var(--shadow-floating)] max-w-xs space-y-2 font-mono text-xs text-[var(--text-primary)]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--chassis-dark)] pb-1.5">
          <span className="font-bold text-[var(--text-primary)]">{data.label}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isCritical ? 'rgba(220,38,38,0.15)' : isModerate ? 'rgba(180,83,9,0.15)' : 'rgba(8,145,178,0.15)',
              color: isCritical ? 'var(--led-critical)' : isModerate ? 'var(--led-caution)' : 'var(--accent-primary)',
            }}
          >
            {data.level}
          </span>
        </div>
        <p className="text-xs text-[var(--text-primary)]">
          Added: <strong className="text-[var(--accent-primary)]">{data.medicine}</strong> ({data.type})
        </p>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--chassis-dark)]/50">
          <span className="text-[var(--text-muted)]">Cumulative ACB:</span>
          <strong className="text-sm font-bold text-[var(--text-primary)]">{data.cumulativeScore}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--chassis-panel)] border border-[var(--chassis-dark)] rounded-xl p-4 shadow-[var(--shadow-floating)] max-w-xs space-y-2 font-mono text-xs text-[var(--text-primary)]">
      <p className="font-bold text-[var(--text-primary)] border-b border-[var(--chassis-dark)] pb-1">
        {label || data.period}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            Total Flags:
          </span>
          <strong className="text-[var(--text-primary)] font-bold">{data.totalFlags}</strong>
        </div>
        {data.critical > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--led-critical)]">
              <span className="w-2 h-2 rounded-full bg-[var(--led-critical)]" />
              Major Risk:
            </span>
            <strong className="text-[var(--led-critical)] font-bold">{data.critical}</strong>
          </div>
        )}
        {data.moderate > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--led-caution)]">
              <span className="w-2 h-2 rounded-full bg-[var(--led-caution)]" />
              Moderate:
            </span>
            <strong className="text-[var(--led-caution)] font-bold">{data.moderate}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Demo fallback data for rich preview when no history exists yet ───────────
const SAMPLE_FLAG_DATA = [
 { period: 'Sep 2025', totalFlags: 0, critical: 0, moderate: 0 },
 { period: 'Oct 2025', totalFlags: 1, critical: 0, moderate: 1 },
 { period: 'Nov 2025', totalFlags: 1, critical: 0, moderate: 1 },
 { period: 'Dec 2025', totalFlags: 2, critical: 1, moderate: 1 },
 { period: 'Jan 2026', totalFlags: 3, critical: 1, moderate: 2 },
 { period: 'Feb 2026', totalFlags: 2, critical: 1, moderate: 1 },
];

const SAMPLE_BURDEN_DATA = [
 { step: 1, label: 'Sep 2025', medicine: 'Lisinopril', type: 'Rx', addedScore: 0, cumulativeScore: 0, level: 'Normal' },
 { step: 2, label: 'Oct 2025', medicine: 'Warfarin', type: 'Rx', addedScore: 1, cumulativeScore: 1, level: 'Moderate' },
 { step: 3, label: 'Nov 2025', medicine: 'Aspirin', type: 'OTC', addedScore: 1, cumulativeScore: 2, level: 'Moderate' },
 { step: 4, label: 'Dec 2025', medicine: 'Diphenhydramine', type: 'OTC', addedScore: 2, cumulativeScore: 4, level: 'Critical' },
 { step: 5, label: 'Jan 2026', medicine: 'Turmeric (Curcumin)', type: 'Herbal', addedScore: 0, cumulativeScore: 4, level: 'Critical' },
];

export default function InsightsPage() {
 const navigate = useNavigate();
 const shouldReduceMotion = useReducedMotion();
 const { isGuest, token } = useAuth();
 const [chartMode, setChartMode] = useState('area'); // 'area' | 'bar'

 const { data, isLoading, isError } = useQuery({
 queryKey: ['patient-insights'],
 queryFn: fetchInsights,
 enabled: !!token && !isGuest,
 });

 if (isLoading) {
 return (
 <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
 <InsightsSkeleton />
 </div>
 );
 }

 const rawFlagHistory = data?.flagHistory ?? [];
 const rawBurdenHistory = data?.burdenHistory ?? [];
 const summary = data?.summary ?? {};

 // If the patient has real data use it, otherwise show sample/empty state
 const hasFlagData = rawFlagHistory.length >= 2;
 const hasBurdenData = rawBurdenHistory.length >= 2;

 const flagChartData = hasFlagData ? rawFlagHistory : SAMPLE_FLAG_DATA;
 const burdenChartData = hasBurdenData ? rawBurdenHistory : SAMPLE_BURDEN_DATA;

 const currentScore = summary.currentBurdenScore ?? (hasBurdenData ? rawBurdenHistory[rawBurdenHistory.length - 1]?.cumulativeScore : 2);
 const currentLevel = summary.currentBurdenLevel ?? (currentScore >= 3 ? 'Critical' : currentScore >= 1 ? 'Moderate' : 'Normal');

 return (
 <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
 {/* ─── Header ─── */}
 <div className="flex items-center space-x-3">
 <button
 onClick={() => navigate('/home')}
 className="btn-secondary p-2.5 rounded-2xl"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h1 className="text-2xl font-bold text-[var(--text-primary)]" >
 Safety Insights & Trends
 </h1>
 <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
 Analytics
 </span>
 </div>
 <p className="text-xs text-[var(--text-muted)]">
 Longitudinal tracking of drug interactions, burden trajectory, and prescribing cascades
 </p>
 </div>
 </div>

 {/* ─── Metric Summary Cards ─── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Card className="p-4 flex flex-col justify-between space-y-2">
 <div className="flex items-center justify-between text-[var(--text-muted)]">
 <span className="text-xs font-bold uppercase tracking-wider">Active Regimen</span>
 <Pill className="w-4 h-4 text-[var(--accent-primary)]" />
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-black text-[var(--text-primary)]" >
 {summary.totalMedicines ?? (hasBurdenData ? rawBurdenHistory.length : 4)}
 </span>
 <span className="text-xs text-[var(--text-muted)]">medicines</span>
 </div>
 </Card>

 <Card className="p-4 flex flex-col justify-between space-y-2">
 <div className="flex items-center justify-between text-[var(--text-muted)]">
 <span className="text-xs font-bold uppercase tracking-wider">ACB Burden Load</span>
 <Activity className="w-4 h-4 text-[var(--led-caution)]" />
 </div>
 <div className="flex items-center justify-between">
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl font-black text-[var(--text-primary)]" >
 {currentScore}
 </span>
 <span className="text-xs text-[var(--text-muted)]">/ 6+</span>
 </div>
 <span
 className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
 style={{
 backgroundColor: currentLevel === 'Critical' ? 'var(--chassis)' : currentLevel === 'Moderate' ? 'var(--chassis)' : 'var(--chassis)',
 color: currentLevel === 'Critical' ? 'var(--led-critical)' : currentLevel === 'Moderate' ? 'var(--led-caution)' : 'var(--accent-primary)',
 }}
 >
 {currentLevel}
 </span>
 </div>
 </Card>

 <Card className="p-4 flex flex-col justify-between space-y-2">
 <div className="flex items-center justify-between text-[var(--text-muted)]">
 <span className="text-xs font-bold uppercase tracking-wider">Flagged Pairs</span>
 <AlertTriangle className="w-4 h-4 text-[var(--led-critical)]" />
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-black text-[var(--led-critical)]" >
 {summary.totalFlags ?? (hasFlagData ? rawFlagHistory.reduce((acc, f) => acc + f.totalFlags, 0) : 2)}
 </span>
 <span className="text-xs text-[var(--text-muted)]">interactions</span>
 </div>
 </Card>
 </div>

 {/* ─── Chart 1: Interaction Flags Over Time ─── */}
 <Card
 title="Interaction Risk History"
 subtitle="Frequency of detected pharmacological flags over time"
 icon={<TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="space-y-4"
 >
 {/* Chart Controls */}
 <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[var(--chassis-dark)] pb-3">
 <div className="flex items-center gap-2">
 <span className="text-xs text-[var(--text-muted)] font-semibold">View as:</span>
 <div className="segmented-toggle-container">
 <button
 type="button"
 onClick={() => setChartMode('area')}
 className={`segmented-toggle-btn py-1 px-3 text-xs ${chartMode === 'area' ? 'active' : ''}`}
 >
 Area Trend
 </button>
 <button
 type="button"
 onClick={() => setChartMode('bar')}
 className={`segmented-toggle-btn py-1 px-3 text-xs ${chartMode === 'bar' ? 'active' : ''}`}
 >
 Monthly Bars
 </button>
 </div>
 </div>

  {!hasFlagData && (
    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/25 px-2.5 py-0.5 rounded-full shadow-xs">
      Sample Preview Mode
    </span>
  )}
 </div>

 {/* Recharts Area / Bar Component */}
 <div className="w-full h-64 pt-2">
 <ResponsiveContainer width="100%" height="100%">
 {chartMode === 'area' ? (
 <AreaChart data={flagChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="tealFlagGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.45} />
 <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--chassis-dark)" vertical={false} />
 <XAxis
 dataKey="period"
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <YAxis
 allowDecimals={false}
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <Tooltip content={<CustomChartTooltip mode="flags" />} />
 <Area
 type="monotone"
 dataKey="totalFlags"
 stroke="var(--accent-primary)"
 strokeWidth={2.5}
 fillOpacity={1}
 fill="url(#tealFlagGradient)"
 isAnimationActive={!shouldReduceMotion}
 animationDuration={800}
 animationEasing="ease-out"
 />
 </AreaChart>
 ) : (
 <BarChart data={flagChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--chassis-dark)" vertical={false} />
 <XAxis
 dataKey="period"
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <YAxis
 allowDecimals={false}
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <Tooltip content={<CustomChartTooltip mode="flags" />} />
 <Bar
 dataKey="totalFlags"
 fill="var(--accent-primary)"
 radius={[6, 6, 0, 0]}
 isAnimationActive={!shouldReduceMotion}
 animationDuration={800}
 animationEasing="ease-out"
 />
 </BarChart>
 )}
 </ResponsiveContainer>
 </div>
 <p className="text-[11px] text-[var(--text-muted)] text-center">
 Tracking chronological additions helps distinguish long-standing regimens from newly introduced drug-drug conflicts.
 </p>
 </Card>

 {/* ─── Chart 2: Cumulative Anticholinergic / Sedative Burden Trajectory ─── */}
 <Card
 title="Cumulative Burden Trajectory"
 subtitle="Anticholinergic Cognitive Burden (ACB) progression across prescription additions"
 icon={<Activity className="w-4 h-4 text-[#E0824B]" />}
 className="space-y-4"
 >
 {burdenChartData.length < 2 ? (
 <div className="p-8 text-center space-y-4">
 <EmptyTrendsIllustration className="w-36 h-36 mx-auto" />
 <div>
 <h3 className="text-base font-bold text-[var(--text-primary)]" >
 Not enough history yet
 </h3>
 <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
 As you log multiple prescriptions, OTC medicines, and herbal supplements over time, this graph will illustrate your cumulative sedation and cognitive burden curve.
 </p>
 </div>
 </div>
 ) : (
 <>
 <div className="w-full h-64 pt-2">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={burdenChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--chassis-dark)" vertical={false} />
 <XAxis
 dataKey="label"
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <YAxis
 domain={[0, 6]}
 allowDecimals={false}
 tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
 stroke="var(--chassis-dark)"
 tickLine={false}
 />
 <Tooltip content={<CustomChartTooltip mode="burden" />} />
 {/* Critical threshold line at score 3 */}
 <ReferenceLine
 y={3}
 stroke="var(--led-critical)"
 strokeDasharray="4 4"
 label={{
 value: 'Critical (3+)',
 fill: 'var(--led-critical)',
 fontSize: 10,
 fontWeight: 700,
 position: 'insideTopRight',
 }}
 />
 <Line
 type="monotone"
 dataKey="cumulativeScore"
 stroke="#E0824B"
 strokeWidth={3}
 dot={{ fill: '#FFFFFF', stroke: '#E0824B', strokeWidth: 2.5, r: 5 }}
 activeDot={{ fill: 'var(--accent-primary)', stroke: '#FFFFFF', strokeWidth: 2, r: 7 }}
 isAnimationActive={!shouldReduceMotion}
 animationDuration={800}
 animationEasing="ease-out"
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Threshold legend */}
 <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[var(--text-muted)] pt-2 border-t border-[var(--chassis-dark)]">
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--led-safe)]" />
 0: Normal
 </span>
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--led-caution)]" />
 1–2: Moderate
 </span>
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-[var(--led-critical)]" />
 3+: Critical Load
 </span>
 </div>
 </>
 )}
 </Card>

 {/* ─── Clinical Pharmacovigilance Guidance ─── */}
 <div className="flex items-start space-x-3 p-4 border-2 border-[var(--chassis-dark)] bg-[var(--chassis)] rounded-2xl">
 <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
 <p className="text-xs text-[var(--text-muted)] leading-relaxed">
 <strong>Clinical Pharmacovigilance Note:</strong> Cumulative anticholinergic burden is strongly associated with fall risk, daytime somnolence, and reversible cognitive decline in older adults. Share these trend charts during doctor consultations to support proactive deprescribing reviews.
 </p>
 </div>
 </div>
 </div>
 );
}
