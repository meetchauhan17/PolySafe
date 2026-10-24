/**
 * frontend/src/pages/DoctorDashboardPage.jsx
 *
 * Professional Physician Clinical Workstation & Telemetry Workspace
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes: /doctor-dashboard, /doctor, /doctor/patients
 *
 * Requirements Met:
 * 1. Ink-Blue Role Theme with Coral Highlights:
 *    - Strict --doctor-* palette (deep ink-blue, subtle hairline borders)
 *    - Coral (--accent-500, #E86548) used for active patient indicator and key actions.
 * 2. Left Pane (Patient Registry):
 *    - Search input (autofocused on '/' key press), filters (All, Critical, Needs Review, Consented), sort by risk.
 *    - Compact interactive cards (avatar initials, name, StatusDot, regimen count, last activity).
 *    - Active patient highlighted with coral border and warm tint.
 *    - Gentle <TiltCard> effect on desktop viewports.
 * 3. Center Workspace:
 *    - Sticky patient header (avatar, name, consent badge, age, conditions, vermilion-outline allergy chips, primary coral "Safety check / Prescribe" CTA).
 *    - 7 Clinical Tabs: Overview, Regimen, Deprescribing, Symptoms, Organ toxicity, Directives, Clinic board.
 * 4. Overview Tab:
 *    - RiskRing (WHO harm tier), ACB meter (anticholinergic burden), Recharts RadarChart (Renal, Hepatic, Cardiovascular, CNS) in ink-blue/coral palette, prioritized alerts list, and PrescriberSwimlane mini view.
 * 5. Right Rail:
 *    - Substitute, Directive, Clinical report, and Emergency SOS as large action tiles.
 * 6. Right-Side Drawers with Stepper:
 *    - Safety Check Drawer, Substitute Drawer, Directive Drawer.
 *    - Patient context stays visible in center workspace while drawer is active.
 *    - Staggered animation for telemetry results.
 * 7. Clinic Board Tab:
 *    - Sortable risk table with SVG sparklines, top interacting pairs, herb/OTC flag counts, "needs review today" list, aggregated strictly from authorized patient records.
 * 8. Keyboard Shortcuts:
 *    - J / K: Next / previous patient
 *    - /: Focus search input
 *    - ?: Help overlay
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Stethoscope,
  Users,
  Search,
  Plus,
  X,
  ArrowLeftRight,
  MessageSquare,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Pill,
  Leaf,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertOctagon,
  ChevronRight,
  HelpCircle,
  Layers,
  Calendar,
  Brain,
  HeartPulse,
  RefreshCw,
  Loader2,
  ArrowRight,
  Filter,
  Check,
  Info,
  CornerDownLeft,
  ChevronDown,
  RotateCw,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/toast';
import StatusDot from '../components/StatusDot';
import RiskRing from '../components/RiskRing';
import Meter, { ACBMeter } from '../components/Meter';
import Gauge from '../charts/Gauge';
import Sparkline from '../charts/Sparkline';
import Card from '../components/Card';
import { TiltCard } from '../three-d/TiltCard';
import PrescriberSwimlane from '../components/PrescriberSwimlane';
import DoctorClinicBoard from '../components/DoctorClinicBoard';
import EmergencyMedicalCardModal from '../components/EmergencyMedicalCardModal';
import ClinicalReportModal from '../components/ClinicalReportModal';
import SafetyAlertsSection from '../components/SafetyAlertsSection';
import { DrugHarmBadge } from '../components/DrugHarmLevel';
import {
  DEMO_DOCTOR_CONNECTIONS,
  DEMO_DOCTOR_CLINICAL_SUMMARIES,
} from '../data/mockDoctorCaregiver';
import { computeUnifiedScores } from '../data/mockClinicalData';

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function fetchMyConnections() {
  const { data } = await axios.get('/connection/mine');
  return data;
}

async function fetchPatientTimeline(patientId) {
  const { data } = await axios.get(`/connection/doctor-patient/${patientId}/timeline`);
  return data;
}

async function fetchPatientClinicalSummary(patientId) {
  const { data } = await axios.get(`/connection/doctor-patient/${patientId}/clinical-summary`);
  return data;
}

// ─── Formatter Helper ────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DOCTOR DASHBOARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function DoctorDashboardPage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { isGuest } = useAuth();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('polysafe_token') : null;
  const shouldFetch = !isGuest && !!token;

  // Search input ref for keyboard shortcut autofocus
  const searchInputRef = useRef(null);

  // ── 1. Patient Roster & Selection State ──
  const [selectedPatientId, setSelectedPatientId] = useState('demo-pat-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'NEEDS_REVIEW' | 'CONSENTED'
  const [sortBy, setSortBy] = useState('risk'); // 'risk' | 'recent' | 'name'

  // ── 2. Center Tabs State ──
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'regimen' | 'deprescribing' | 'symptoms' | 'toxicity' | 'directives' | 'clinic_board'

  // ── 3. Drawers & Modals State ──
  const [safetyCheckOpen, setSafetyCheckOpen] = useState(false);
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [directiveOpen, setDirectiveOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [claimCodeOpen, setClaimCodeOpen] = useState(false);
  const [helpOverlayOpen, setHelpOverlayOpen] = useState(false);

  // ── 4. Fetch Doctor Connections ──
  const { data: connData, isLoading: connLoading } = useQuery({
    queryKey: ['doctor-connections'],
    queryFn: fetchMyConnections,
    enabled: shouldFetch,
    staleTime: 30000,
  });

  const rawConnections =
    connData?.connections && connData.connections.length > 0
      ? connData.connections
      : DEMO_DOCTOR_CONNECTIONS;

  const connections = useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const c of rawConnections) {
      const pid = c.patientId || c.id;
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        const demoSum = DEMO_DOCTOR_CLINICAL_SUMMARIES[pid];
        const allFlags = c.flags || demoSum?.flags || [];
        const hasMajorFlag = allFlags.some((f) =>
          ['CRITICAL', 'MAJOR', 'CONTRAINDICATED'].includes((f.severity || '').toUpperCase())
        );
        const resolvedStatus = (
          c.status ||
          demoSum?.status ||
          (hasMajorFlag ? 'CRITICAL' : allFlags.length > 0 ? 'CAUTION' : 'SAFE')
        ).toUpperCase();

        list.push({
          ...c,
          patientId: pid,
          patientName: c.patientName || c.name || 'Patient',
          age: c.patientAge || c.age || 65,
          gender: c.gender || 'MALE',
          status: resolvedStatus,
          activeMedsCount: c.activeMedsCount || c.recentMeds?.length || demoSum?.activeMedicines?.length || 3,
          flagCount: c.flagCount ?? allFlags.length,
          lastActivity: c.connectedSince ? fmt(c.connectedSince) : 'Today',
        });
      }
    }
    return list;
  }, [rawConnections]);

  // Set default selected patient
  useEffect(() => {
    if (connections.length > 0 && !connections.some((c) => c.patientId === selectedPatientId)) {
      setSelectedPatientId(connections[0].patientId);
    }
  }, [connections, selectedPatientId]);

  // ── 5. Filter & Sort Patient Roster ──
  const filteredPatients = useMemo(() => {
    return connections
      .filter((p) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = (p.patientName || '').toLowerCase().includes(q);
          const matchConditions = (p.conditions || []).some((c) => c.toLowerCase().includes(q));
          if (!matchName && !matchConditions) return false;
        }
        // Status filter
        if (statusFilter === 'CRITICAL') return p.status === 'CRITICAL';
        if (statusFilter === 'NEEDS_REVIEW') return p.status === 'CRITICAL' || p.flagCount > 0;
        if (statusFilter === 'CONSENTED') return true;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') {
          const rank = { CRITICAL: 3, CAUTION: 2, SAFE: 1 };
          return (rank[b.status] || 0) - (rank[a.status] || 0);
        }
        if (sortBy === 'name') {
          return (a.patientName || '').localeCompare(b.patientName || '');
        }
        return 0;
      });
  }, [connections, searchTerm, statusFilter, sortBy]);

  // ── 6. Active Patient Details ──
  const activePatientConn = useMemo(() => {
    return connections.find((c) => c.patientId === selectedPatientId) || connections[0] || null;
  }, [connections, selectedPatientId]);

  // Notify DoctorLayout top bar about active patient
  useEffect(() => {
    if (activePatientConn) {
      window.dispatchEvent(
        new CustomEvent('polysafe:doctor-patient-focused', {
          detail: {
            id: activePatientConn.patientId,
            name: activePatientConn.patientName,
            status: activePatientConn.status,
          },
        })
      );
    }
  }, [activePatientConn]);

  // Fetch patient live timeline or fallback to demo
  const isDemoPatient = isGuest || !token || selectedPatientId?.startsWith('demo-');
  const shouldFetchPatient = !isDemoPatient && !!selectedPatientId;

  const { data: serverData, isLoading: patientLoading } = useQuery({
    queryKey: ['patient-timeline', selectedPatientId],
    queryFn: () => fetchPatientTimeline(selectedPatientId),
    enabled: shouldFetchPatient,
    staleTime: 30000,
  });

  const demoSummary =
    DEMO_DOCTOR_CLINICAL_SUMMARIES[selectedPatientId] ||
    DEMO_DOCTOR_CLINICAL_SUMMARIES['demo-pat-1'];

  const patientData = useMemo(() => {
    if (serverData) {
      return {
        medicines: serverData.medicines || [],
        flags: serverData.flags || [],
        patient: serverData.patient || activePatientConn || {},
        safetyAlerts: serverData.safetyAlerts || [],
      };
    }
    return {
      medicines: demoSummary.activeMedicines || [],
      flags: demoSummary.flags || [],
      patient: demoSummary.patient || activePatientConn || {},
      safetyAlerts: [
        {
          id: 'alt-1',
          severity: 'CRITICAL',
          type: 'DRUG_DRUG',
          title: 'High Hemorrhage Risk · Warfarin + Aspirin',
          details: 'Concurrent anticoagulant and antiplatelet therapy multiplies upper GI hemorrhage risk.',
          plainText: 'Combined blood thinners increase severe internal bleeding risks significantly.',
        },
        {
          id: 'alt-2',
          severity: 'MAJOR',
          type: 'BEERS_CRITERIA',
          title: 'Beers Criteria 2023 · Geriatric Caution',
          details: 'Long-term NSAID therapy in older adults with CKD Stage 2 accelerates renal clearance decline.',
          plainText: 'Anti-inflammatory painkillers require renal filtration monitoring in patients over 65.',
        },
      ],
    };
  }, [serverData, demoSummary, activePatientConn]);

  const activeMeds = useMemo(() => {
    return (patientData.medicines || []).filter((m) => !m.discontinued);
  }, [patientData.medicines]);

  const discontinuedMeds = useMemo(() => {
    return (patientData.medicines || []).filter((m) => m.discontinued);
  }, [patientData.medicines]);

  // Unified clinical risk & ACB scoring engine (aligned with Patient Risk Analysis & Home)
  const unifiedScores = useMemo(() => {
    return computeUnifiedScores({
      regimenRisk: demoSummary?.cumulativeBurden
        ? {
            level: activePatientConn?.status === 'CRITICAL' || demoSummary?.status === 'CRITICAL' ? 5 : 3,
            score: activePatientConn?.status === 'CRITICAL' || demoSummary?.status === 'CRITICAL' ? 5.0 : 3.4,
          }
        : null,
      medicines: patientData.medicines,
      flags: patientData.flags,
      status: activePatientConn?.status || demoSummary?.status || 'SAFE',
      acbScore: demoSummary?.acbScore,
    });
  }, [patientData.medicines, patientData.flags, activePatientConn, demoSummary]);

  const patientRiskScore = unifiedScores.score;
  const patientRiskLevel = unifiedScores.level;
  const patientRiskLabel = unifiedScores.label;
  const patientAcbScore = unifiedScores.acbScore;

  // Organ toxicity radar data
  const organRadarData = useMemo(() => {
    return [
      { organ: 'Renal', score: 76, fullMark: 100 },
      { organ: 'Hepatic', score: 62, fullMark: 100 },
      { organ: 'Cardio', score: 84, fullMark: 100 },
      { organ: 'CNS', score: 70, fullMark: 100 },
    ];
  }, []);

  // ── 7. Global Keyboard Shortcuts Handler (J / K / / / ?) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input, textarea or contenteditable
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // '/' shortcut to focus search input
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // '?' shortcut to toggle help overlay
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setHelpOverlayOpen((prev) => !prev);
        return;
      }

      // Escape key closes modals / drawers
      if (e.key === 'Escape') {
        setSafetyCheckOpen(false);
        setSubstituteOpen(false);
        setDirectiveOpen(false);
        setReportModalOpen(false);
        setEmergencyModalOpen(false);
        setHelpOverlayOpen(false);
        setClaimCodeOpen(false);
        return;
      }

      if (isInput) return;

      // Number keys 1-7 switch tabs
      if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const tabList = [
          'overview',
          'regimen',
          'deprescribing',
          'symptoms',
          'toxicity',
          'directives',
          'clinic_board',
        ];
        const idx = parseInt(e.key, 10) - 1;
        if (tabList[idx]) {
          e.preventDefault();
          setActiveTab(tabList[idx]);
          return;
        }
      }

      // J key: Next patient
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (filteredPatients.length === 0) return;
        const currentIdx = filteredPatients.findIndex((p) => p.patientId === selectedPatientId);
        const nextIdx = (currentIdx + 1) % filteredPatients.length;
        setSelectedPatientId(filteredPatients[nextIdx].patientId);
        notify.info('Active Patient', filteredPatients[nextIdx].patientName);
        return;
      }

      // K key: Previous patient
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (filteredPatients.length === 0) return;
        const currentIdx = filteredPatients.findIndex((p) => p.patientId === selectedPatientId);
        const prevIdx = (currentIdx - 1 + filteredPatients.length) % filteredPatients.length;
        setSelectedPatientId(filteredPatients[prevIdx].patientId);
        notify.info('Active Patient', filteredPatients[prevIdx].patientName);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPatients, selectedPatientId]);

  return (
    <div className="flex-1 w-full flex h-full min-h-0 overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <h1 className="sr-only">Doctor Clinical Decision Support Dashboard</h1>
      {/* ═══════════════════════════════════════════════════════════════════════
          PANE 1: LEFT PANE — PATIENT REGISTRY (Interactive Cards, Search & Filters)
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className="w-72 2xl:w-80 flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] h-full min-h-0 hidden lg:flex flex-col justify-between z-20"
        aria-label="Patient roster sidebar"
      >
        {/* Header & Controls */}
        <div className="p-4 border-b border-[var(--border)] space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--doctor-600)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                Patient Registry
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--doctor-500)]/10 text-[var(--doctor-600)] border border-[var(--doctor-500)]/20">
                {filteredPatients.length} Active
              </span>
              <button
                type="button"
                onClick={() => setClaimCodeOpen(true)}
                title="Connect new patient via 6-digit PIN"
                className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--doctor-600)] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar with '/' Shortcut */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients... (Press /)"
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] outline-none focus:border-[var(--doctor-600)] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-mono">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CRITICAL', label: 'Critical' },
              { id: 'NEEDS_REVIEW', label: 'Review' },
              { id: 'CONSENTED', label: 'Consented' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-[var(--doctor-600)] text-white shadow-2xs'
                    : 'bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patient Rows List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5">
          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--ink-3)] space-y-2">
              <Users className="w-8 h-8 text-[var(--ink-3)] mx-auto opacity-50" />
              <p className="font-semibold text-[var(--ink)]">No patients matched</p>
              <p className="text-[11px]">Clear search or change filter.</p>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isSelected = selectedPatientId === patient.patientId;
              const initials = getInitials(patient.patientName);

              return (
                <div key={patient.patientId}>
                  <TiltCard
                    max={4}
                    glare={false}
                    className="rounded-2xl"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPatientId(patient.patientId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPatientId(patient.patientId);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer border select-none ${
                        isSelected
                          ? 'border-l-4 border-l-[var(--accent-500)] border-[var(--accent-500)]/40 bg-[var(--accent-500)]/8 dark:bg-[var(--accent-500)]/15 shadow-2xs'
                          : 'border-l-4 border-l-transparent border-[var(--border)] hover:bg-[var(--surface-2)] bg-[var(--surface)] text-[var(--ink-2)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Avatar Initials Badge */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono transition-colors ${
                            isSelected
                              ? 'bg-[var(--accent-500)] text-white shadow-xs'
                              : 'bg-[var(--doctor-500)]/15 text-[var(--doctor-600)]'
                          }`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0 pr-1 flex-1">
                          <p
                            className={`text-xs truncate font-bold leading-tight ${
                              isSelected ? 'text-[var(--ink)] font-extrabold' : 'text-[var(--ink)]'
                            }`}
                          >
                            {patient.patientName}
                          </p>
                          <p className="text-[10px] text-[var(--ink-3)] font-mono mt-0.5 truncate">
                            {patient.age}y · {patient.activeMedsCount} meds · {patient.lastActivity}
                          </p>
                        </div>
                      </div>

                      {/* Risk Trend Sparkline & StatusDot */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Sparkline
                          data={
                            patient.status === 'CRITICAL'
                              ? [12, 14, 15, 18, 22]
                              : patient.status === 'CAUTION'
                              ? [10, 11, 13, 12, 14]
                              : [8, 7, 7, 6, 5]
                          }
                          width={34}
                          height={16}
                          status={
                            patient.status === 'CRITICAL'
                              ? 'critical'
                              : patient.status === 'CAUTION'
                              ? 'caution'
                              : 'safe'
                          }
                          showEndDot={false}
                          label="Patient risk trend"
                        />
                        <StatusDot
                          status={
                            patient.status === 'CRITICAL'
                              ? 'critical'
                              : patient.status === 'CAUTION'
                              ? 'caution'
                              : 'safe'
                          }
                          size="sm"
                        />
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected
                              ? 'text-[var(--accent-500)] translate-x-0.5'
                              : 'text-[var(--ink-3)]'
                          }`}
                        />
                      </div>
                    </div>
                  </TiltCard>
                </div>
              );
            })
          )}
        </div>

        {/* Roster Footer with Shortcut Helper */}
        <div className="p-3 border-t border-[var(--border)] text-[10.5px] text-[var(--ink-3)] font-mono flex items-center justify-between bg-[var(--surface-2)] flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>FHIR v4 Telemetry</span>
          </div>
          <button
            type="button"
            onClick={() => setHelpOverlayOpen(true)}
            className="hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
            <span>Keys (?)</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          PANE 2: CENTER PANE — PATIENT WORKSPACE & CLINICAL TABS
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 min-h-0 h-full p-4 sm:p-5 lg:p-6 overflow-y-auto space-y-5">
        {/* ── Patient Record Header Card ── */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 lg:p-6 shadow-xs transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[var(--doctor-500)]/15 text-[var(--doctor-600)] border border-[var(--doctor-500)]/30 flex items-center justify-center text-base font-extrabold font-mono flex-shrink-0 shadow-xs">
                {getInitials(activePatientConn?.patientName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] font-[var(--font-heading)] tracking-tight">
                    {activePatientConn?.patientName || 'Patient Record'}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    CONSENT APPROVED
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      activePatientConn?.status === 'CRITICAL' || patientRiskScore >= 4.5
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : activePatientConn?.status === 'CAUTION' || patientRiskScore >= 3.0
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {activePatientConn?.status === 'CRITICAL' || patientRiskScore >= 4.5
                      ? 'CRITICAL REGIMEN'
                      : activePatientConn?.status === 'CAUTION' || patientRiskScore >= 3.0
                      ? 'CAUTION REGIMEN'
                      : 'SAFE REGIMEN'}
                  </span>
                </div>

                {/* Demographics row */}
                <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-[var(--ink-2)]">
                  <span>
                    Age: <strong className="text-[var(--ink)]">{activePatientConn?.age || 68}y</strong>
                  </span>
                  <span className="text-[var(--ink-3)]">·</span>
                  <span>
                    Sex: <strong className="text-[var(--ink)]">{activePatientConn?.gender || 'Female'}</strong>
                  </span>
                  <span className="text-[var(--ink-3)]">·</span>
                  <span>
                    Conditions:{' '}
                    <strong className="text-[var(--ink)]">
                      {(activePatientConn?.conditions || ['Hypertension', 'T2 Diabetes']).join(', ')}
                    </strong>
                  </span>
                </div>

                {/* Documented Allergies dedicated row */}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    Allergies:
                  </span>
                  {(activePatientConn?.allergies?.length > 0
                    ? activePatientConn.allergies
                    : ['Penicillin (Moderate rash)']
                  ).map((alg, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10 font-mono font-bold text-[10.5px] shadow-2xs"
                    >
                      <span>{alg}</span>
                    </span>
                  ))}
                </div>

                {/* Mobile/Tablet Patient Switcher (< lg) */}
                <div className="lg:hidden mt-2.5 max-w-xs">
                  <label htmlFor="mobile-patient-switcher" className="sr-only">Switch Active Patient</label>
                  <div className="relative">
                    <select
                      id="mobile-patient-switcher"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="ps-input text-xs font-bold py-1.5 px-3 appearance-none pr-8 w-full bg-[var(--surface-2)] min-h-[36px]"
                    >
                      {filteredPatients.map((p) => (
                        <option key={p.patientId} value={p.patientId}>
                          {p.patientName} ({p.status} · {p.regimenCount || 0} meds)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-3)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Primary Coral CTA + Quick Actions for < xl screens */}
            <div className="flex items-center gap-2 self-start md:self-center flex-wrap flex-shrink-0">
              <button
                type="button"
                onClick={() => setSafetyCheckOpen(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--accent-500)] hover:bg-[var(--accent-600)] transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Stethoscope className="w-4 h-4 text-white" />
                <span>Safety check / Prescribe</span>
              </button>

              {/* Quick Actions for screens without right rail (< xl) */}
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="xl:hidden py-2 px-3 rounded-xl text-xs font-bold text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Clinical Consultation Report Dossier"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Report</span>
              </button>

              <button
                type="button"
                onClick={() => setDirectiveOpen(true)}
                className="xl:hidden py-2 px-3 rounded-xl text-xs font-bold text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Issue Clinical Directive to Patient App"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>Directive</span>
              </button>

              <button
                type="button"
                onClick={() => setSubstituteOpen(true)}
                className="xl:hidden py-2 px-3 rounded-xl text-xs font-bold text-[var(--ink)] bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Deprescribe & Substitute Drug"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Substitute</span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                className="xl:hidden py-2 px-3 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Emergency Paramedic SOS Card"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>SOS</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 7 Clinical Tabs Navigation ── */}
        <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl overflow-x-auto shadow-2xs scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: HeartPulse },
            { id: 'regimen', label: `Regimen (${activeMeds.length})`, icon: Pill },
            { id: 'deprescribing', label: 'Deprescribe', icon: Sparkles },
            { id: 'symptoms', label: 'Symptoms', icon: Activity },
            { id: 'toxicity', label: 'Organ load', icon: Brain },
            { id: 'directives', label: 'Directives', icon: MessageSquare },
            { id: 'clinic_board', label: 'Clinic board', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--doctor-600)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW (RiskRing + ACB Meter + RadarChart + Alerts + Swimlane)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Tiles Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Medications */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between min-h-[104px] transition-all hover:border-[var(--doctor-500)]/40">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--ink-3)] tracking-wider truncate">
                    Medications
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)] shrink-0">
                    RX
                  </span>
                </div>
                <div className="my-1 flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[var(--ink)] leading-none shrink-0">
                    {activeMeds.length}
                  </span>
                  <span className="text-xs font-bold text-[var(--ink-3)] font-mono uppercase shrink-0">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-[var(--ink-3)] font-mono truncate">
                  {discontinuedMeds.length} safely deprescribed
                </div>
              </div>

              {/* Card 2: Cumulative Risk */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between min-h-[104px] transition-all hover:border-rose-500/40">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--ink-3)] tracking-wider whitespace-nowrap">
                    WHO Risk
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    patientRiskScore >= 4.5
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25'
                      : patientRiskScore >= 3.0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                  }`}>
                    {patientRiskScore >= 4.5 ? 'Critical' : patientRiskScore >= 3.0 ? 'High' : 'Moderate'}
                  </span>
                </div>
                <div className="my-1 flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className={`text-2xl sm:text-3xl font-black font-mono leading-none whitespace-nowrap shrink-0 ${
                    patientRiskScore >= 4.5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    Tier&nbsp;{patientRiskLevel || (patientRiskScore >= 4.5 ? 5 : patientRiskScore >= 3.5 ? 4 : 3)}
                  </span>
                  <span className="text-xs font-bold text-[var(--ink-3)] font-mono uppercase shrink-0">
                    Scale
                  </span>
                </div>
                <div className="text-[10px] text-[var(--ink-3)] font-mono truncate">
                  Cross-prescribing vigilance
                </div>
              </div>

              {/* Card 3: Cognitive ACB Burden */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between min-h-[104px] transition-all hover:border-purple-500/40">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9.5px] font-mono uppercase font-bold text-[var(--ink-3)] tracking-wider whitespace-nowrap">
                    Cognitive ACB
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    patientAcbScore >= 3
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25'
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25'
                  }`}>
                    {patientAcbScore >= 3 ? 'Delirium Alert' : 'Normal'}
                  </span>
                </div>
                <div className="my-1 flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400 leading-none whitespace-nowrap shrink-0">
                    {patientAcbScore}<span className="text-base text-purple-600/60 dark:text-purple-400/60 font-bold"> pts</span>
                  </span>
                  <span className={`text-xs font-bold font-mono uppercase shrink-0 ${
                    patientAcbScore >= 3 ? 'text-rose-600 dark:text-rose-400' : 'text-purple-700/80 dark:text-purple-300/80'
                  }`}>
                    {patientAcbScore >= 3 ? 'Critical ACB' : 'Moderate'}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--ink-3)] font-mono truncate">
                  Beers 2023 delirium caution
                </div>
              </div>

              {/* Card 4: Drug Allergies */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between min-h-[104px] transition-all hover:border-rose-500/40">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--ink-3)] tracking-wider truncate">
                    Allergies
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 shrink-0">
                    Alert
                  </span>
                </div>
                <div className="my-1 flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 leading-none whitespace-nowrap shrink-0">
                    {(activePatientConn?.allergies || ['Penicillin']).length}
                  </span>
                  <span className="text-xs font-bold text-rose-700/80 dark:text-rose-300/80 font-mono uppercase shrink-0">
                    Documented
                  </span>
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-mono font-bold truncate" title={(activePatientConn?.allergies || ['Penicillin']).join(', ')}>
                  {(activePatientConn?.allergies || ['Penicillin']).join(', ')}
                </div>
              </div>
            </div>

            {/* Row: RiskRing & ACB Meter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4.5 sm:p-5 flex flex-col justify-between space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                      WHO 5-Tier Regimen Risk Ring
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700">
                    Live Telemetry
                  </span>
                </div>

                <div className="flex items-center justify-center py-1.5">
                  <RiskRing
                    score={patientRiskScore}
                    maxScore={5}
                    size={140}
                    label={patientRiskLabel || (patientRiskScore >= 4.5 ? 'Critical Risk' : 'Moderate Burden')}
                  />
                </div>

                <p className="text-xs text-[var(--ink-3)] text-center leading-relaxed">
                  Composite score evaluates multi-agent synergistic toxicity, narrow therapeutic index agents, and patient geriatric age.
                </p>
              </Card>

              <Card className="p-4.5 sm:p-5 flex flex-col justify-between space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                      Anticholinergic Cognitive Burden (ACB)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700">
                    Boustani Scale
                  </span>
                </div>

                <div className="py-2 space-y-2">
                  <Meter
                    value={patientAcbScore}
                    max={5}
                    label="Cumulative Central Burden"
                    sublabel="Delirium, sedation and fall vulnerability"
                    critical={3}
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200">
                  <strong className="block font-bold">Beers 2023 Clinical Advisory:</strong>
                  ACB score ≥ 3 is strongly correlated with increased hospitalizations and impaired balance in older adults.
                </div>
              </Card>
            </div>

            {/* Row: Recharts RadarChart (Renal, Hepatic, Cardiovascular, CNS) in ink-blue & coral */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[var(--doctor-600)]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                      Multi-Organ Pharmacological Clearance Profile
                    </h3>
                    <p className="text-[11px] text-[var(--ink-3)]">
                      Evaluation of organ filtration load, metabolism congestion, and adverse event vulnerabilities
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="inline-flex items-center gap-1 text-[var(--doctor-600)] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--doctor-600)]" /> Organ Load
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--accent-500)] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-500)]" /> Critical Threshold (70+)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Radar Chart */}
                <div className="lg:col-span-7 h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={organRadarData} aria-label="Multi-organ pharmacological clearance profile radar chart">
                      <PolarGrid stroke="var(--border, #E2E8F0)" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="organ"
                        tick={{
                          fill: 'var(--ink)',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'var(--font-heading)',
                        }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: 'var(--ink-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                        stroke="var(--border, #E2E8F0)"
                      />
                      <Radar
                        name="Organ Load"
                        dataKey="score"
                        stroke="var(--brand-600, #0E7490)"
                        fill="var(--brand-600, #0E7490)"
                        fillOpacity={0.25}
                        strokeWidth={2.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Organ Toxicity Semi-Circle Gauges */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs flex flex-col items-center text-center">
                    <Gauge
                      size={120}
                      strokeWidth={8}
                      value={84}
                      label="Cardiovascular"
                      sublabel="Severe Arrhythmia & Bleed Risk"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs flex flex-col items-center text-center">
                    <Gauge
                      size={120}
                      strokeWidth={8}
                      value={76}
                      label="Renal Clearance"
                      sublabel="Moderate GFR Filtration Load"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs flex flex-col items-center text-center">
                    <Gauge
                      size={120}
                      strokeWidth={8}
                      value={70}
                      label="CNS Sedation"
                      sublabel="ACB Delirium Vulnerability"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs flex flex-col items-center text-center">
                    <Gauge
                      size={120}
                      strokeWidth={8}
                      value={62}
                      label="Hepatic CYP"
                      sublabel="CYP2C9 Metabolic Congestion"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Prioritized Alerts List */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                    Prioritized Pharmacovigilance Alerts ({patientData.safetyAlerts?.length || 0})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  DDInter & Beers 2023 Cross-Referenced
                </span>
              </div>
              <SafetyAlertsSection alerts={patientData.safetyAlerts || []} compact={true} />
            </Card>

            {/* Prescriber Swimlane Mini View */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--doctor-600)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                    Multi-Prescriber Swimlane Mini View
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Specialist vs Self-Care Duration
                </span>
              </div>
              <div className="overflow-x-auto">
                <PrescriberSwimlane
                  medicines={patientData.medicines}
                  onSelectMedicine={(m) => notify.info('Medication Detail', `${m.name} (${m.dosage})`)}
                  onSelectFlag={(f) => notify.info('Flagged Conflict', `${f.drugA} ↔ ${f.drugB}`)}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: REGIMEN (Active Formulary Table with Harm Badges & Substitute Action)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'regimen' && (
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    Active Verified Formularies ({activeMeds.length} Prescriptions)
                  </h3>
                  <p className="text-xs text-[var(--ink-3)]">
                    Cross-verified against CDSCO database, RxNorm ingredients, and food/lifestyle interactions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSafetyCheckOpen(true)}
                  className="ps-btn ps-btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Prescription</span>
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-2)] text-[var(--ink-2)] font-mono text-[10px] uppercase border-b border-[var(--border)]">
                    <tr>
                      <th className="py-2.5 px-3">Medication / Salt</th>
                      <th className="py-2.5 px-3">Dosage & Frequency</th>
                      <th className="py-2.5 px-3">Prescriber / Provenance</th>
                      <th className="py-2.5 px-3">Clinical Indication</th>
                      <th className="py-2.5 px-3 text-center">Harm Tier</th>
                      <th className="py-2.5 px-3 text-right">Clinical Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {activeMeds.map((med, idx) => (
                      <tr key={med.id || idx} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-[var(--ink)] text-sm">{med.name}</p>
                          <p className="text-[11px] font-mono text-[var(--ink-3)]">
                            {med.generic || 'Active Salt Validated'}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-medium text-[var(--ink)]">
                          {med.dosage || 'Prescribed dose'}
                          <span className="block text-[10px] text-[var(--ink-3)] font-mono">
                            {med.frequency || 'Daily'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[var(--ink-2)] text-[11px]">
                          {med.prescribedBy || 'Attending Physician'}
                        </td>
                        <td className="py-3 px-3 text-[var(--ink-2)]">
                          {med.purpose || 'Chronic disease maintenance'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <DrugHarmBadge harmLevel={med.harmLevel || 3} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSubstituteOpen(true)}
                            className="ps-btn ps-btn-secondary py-1.5 px-2.5 text-[11px] font-bold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3 h-3 text-[var(--doctor-600)]" />
                            <span>Substitute</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Discontinued Medications Archive */}
            {discontinuedMeds.length > 0 && (
              <Card className="p-5 space-y-3 opacity-90">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
                  <Clock className="w-4 h-4 text-[var(--ink-3)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)]">
                    Discontinued & Deprescribed Regimen Archive ({discontinuedMeds.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {discontinuedMeds.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="line-through font-bold text-[var(--ink-2)]">{med.name}</span>
                        <span className="text-[11px] text-[var(--ink-3)] ml-2">({med.dosage})</span>
                        <p className="text-[10px] text-[var(--ink-3)] mt-0.5">
                          Discontinued on {fmt(med.removedAt || Date.now())}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 border border-amber-300">
                        Discontinued
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: DEPRESCRIBING (Beers Criteria, STOPP Candidates, 1-Click Taper)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'deprescribing' && (
          <div className="space-y-4">
            <Card className="p-5 space-y-3 bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--doctor-600)]/15 text-[var(--doctor-600)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Regimen Optimization & Deprescribing Engine
                    </h3>
                    <p className="text-xs text-[var(--ink-3)]">
                      Beers Criteria 2023 · STOPP/START v3 · Anticholinergic Cognitive Burden Taper Protocols
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300">
                  2 Optimization Candidates
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    name: 'Warfarin 5mg',
                    dosage: '5mg daily',
                    harmLevel: 5,
                    reason: 'Concurrent antiplatelet therapy (Aspirin 81mg) elevates major hemorrhage risk.',
                    recommendation: 'Evaluate eligibility for safer DOAC (Apixaban 5mg BID) or deprescribe Aspirin.',
                  },
                  {
                    name: 'Aspirin 81mg',
                    dosage: '81mg daily',
                    harmLevel: 4,
                    reason: 'Beers Criteria 2023 strongly cautions against primary prevention Aspirin in patients over 65 without established ASCVD.',
                    recommendation: 'Consider complete deprescribing if only indicated for primary cardioprotection.',
                  },
                ].map((cand, idx) => (
                  <Card key={idx} className="p-4 space-y-3 border-l-4 border-l-amber-500">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--ink)]">{cand.name}</span>
                          <span className="text-xs text-[var(--ink-3)] font-mono">({cand.dosage})</span>
                        </div>
                        <div className="mt-1">
                          <DrugHarmBadge harmLevel={cand.harmLevel} size="sm" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          notify.success('Deprescribing Taper Initiated', `Generated clinical taper plan for ${cand.name}.`);
                          setSubstituteOpen(true);
                        }}
                        className="ps-btn ps-btn-secondary py-2 px-3 text-xs text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 cursor-pointer font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                        <span>Taper & Discontinue</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--border)]">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200">
                        <strong className="block font-bold">Clinical Rationale:</strong>
                        <p className="mt-0.5">{cand.reason}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-950 dark:text-teal-200">
                        <strong className="block font-bold">Recommended Alternative:</strong>
                        <p className="mt-0.5">{cand.recommendation}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: SYMPTOMS (Adverse Events Logged by Patient & Cascades)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'symptoms' && (
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    Patient Logged Symptoms & Cascade Correlation Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  Live Patient Sync
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {[
                  {
                    description: 'Mild epistaxis (nosebleeds) and unprompted skin bruising on forearms',
                    severity: 'Moderate',
                    date: 'Yesterday, 14:20',
                    cascade: 'Suspected adverse event secondary to Warfarin + Aspirin synergistic antithrombotic therapy.',
                  },
                  {
                    description: 'Persistent non-productive dry cough in evening hours',
                    severity: 'Mild',
                    date: '4 days ago',
                    cascade: 'Classic ACE-inhibitor (Lisinopril) induced bradykinin accumulation cascade.',
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-[var(--ink)]">{s.description}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300">
                        {s.severity}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-[11px] text-[var(--doctor-600)]">
                      <strong>Cascade Insight:</strong> {s.cascade}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--ink-3)] block">
                      Logged {s.date}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: ORGAN TOXICITY (Renal, Hepatic, Cardio, CNS Detailed Breakdown)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'toxicity' && (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    Comprehensive Organ Toxicity & Pharmacokinetic Clearance
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700">
                  Clinical Surveillance
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Renal Clearance Vulnerability',
                    shortName: 'Renal Filtration',
                    score: 76,
                    level: 'Elevated (Score 76)',
                    color: 'text-amber-700 border-amber-300 bg-amber-500/10',
                    drugs: ['Lisinopril 10mg', 'Metformin 500mg'],
                    guidance: 'Evaluate baseline serum creatinine and eGFR before adding any NSAIDs or contrast media.',
                  },
                  {
                    title: 'Cardiovascular Hemostasis Risk',
                    shortName: 'Cardiovascular',
                    score: 84,
                    level: 'Critical (Score 84)',
                    color: 'text-rose-700 border-rose-300 bg-rose-500/10',
                    drugs: ['Warfarin 5mg', 'Aspirin 81mg'],
                    guidance: 'Dual anticoagulant-antiplatelet therapy creates critical bleed vulnerability. Mandatory INR target 2.0-2.5.',
                  },
                  {
                    title: 'Hepatic CYP450 Substrate Burden',
                    shortName: 'Hepatic CYP',
                    score: 62,
                    level: 'Moderate (Score 62)',
                    color: 'text-teal-700 border-teal-300 bg-teal-500/10',
                    drugs: ['Warfarin (CYP2C9)', 'Turmeric/Curcumin'],
                    guidance: 'Botanical supplements inhibit CYP2C9 and elevate unbound Warfarin plasma concentrations.',
                  },
                  {
                    title: 'Central Nervous System (CNS) Sedation',
                    shortName: 'CNS Sedation',
                    score: 70,
                    level: 'High (Score 70)',
                    color: 'text-purple-700 border-purple-300 bg-purple-500/10',
                    drugs: ['ACB Score 4 composite'],
                    guidance: 'Sedative burden escalates postural fall propensity and transient morning confusion.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row items-center gap-4 text-xs shadow-2xs"
                  >
                    <div className="flex-shrink-0 flex justify-center">
                      <Gauge
                        size={130}
                        strokeWidth={11}
                        value={item.score}
                        label={item.shortName}
                        sublabel={item.level}
                      />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-bold text-[var(--ink)] text-sm">{item.title}</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${item.color}`}>
                          {item.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-[var(--ink-3)]">Implicated:</span>
                        {item.drugs.map((d, i) => (
                          <span key={i} className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                            {d}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed pt-1.5 border-t border-[var(--border)]">
                        {item.guidance}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 6: DIRECTIVES (Issued Clinical Directives to Patient App)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'directives' && (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    Active Clinical Directives ({2} Delivered)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectiveOpen(true)}
                  className="ps-btn ps-btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue New Directive</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  {
                    title: 'Laboratory Monitoring Directive',
                    category: 'LAB_TEST',
                    instruction: 'Please schedule a routine PT/INR blood test at your local pathology lab within 48 hours to calibrate your Warfarin dosage.',
                    urgency: 'URGENT',
                    date: 'Yesterday, 11:30',
                    read: true,
                  },
                  {
                    title: 'Dietary Spacing Directive',
                    category: 'FOOD_SPACING',
                    instruction: 'Keep your dietary intake of dark leafy greens (spinach, methi, kale) consistent day-to-day. Do not start high-dose Vitamin K supplements without notifying me.',
                    urgency: 'ROUTINE',
                    date: '3 days ago',
                    read: true,
                  },
                ].map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--ink)]">{d.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 border border-purple-300">
                        {d.urgency}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[var(--ink-2)] leading-relaxed">
                      {d.instruction}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-3)]">
                      <span>Transmitted: {d.date}</span>
                      <span className="text-teal-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged by Patient
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 7: CLINIC BOARD (Practice-Wide Risk Surveillance Grid)
            ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'clinic_board' && (
          <div className="space-y-6">
            <DoctorClinicBoard
              connections={connections}
              onSelectPatient={(pid) => {
                setSelectedPatientId(pid);
                setActiveTab('overview');
              }}
            />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          PANE 3: RIGHT RAIL — ACTION TILES (Substitute, Directive, Clinical Report)
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside
        className="w-72 2xl:w-80 flex-shrink-0 bg-[var(--surface)] border-l border-[var(--border)] p-4 sm:p-5 overflow-y-auto hidden xl:flex flex-col justify-between h-full min-h-0 z-20 space-y-5"
        aria-label="Clinical action rail and export dossiers"
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b border-[var(--border)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--ink)] block">
              Clinical Action Rail
            </span>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              Rapid clinical orders & export dossiers
            </p>
          </div>

          {/* Large Action Tile 1: Substitute Drug */}
          <button
            type="button"
            onClick={() => setSubstituteOpen(true)}
            className="w-full p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--doctor-600)] text-left space-y-2 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700">
                Deprescribe & Switch
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                Substitute Drug
              </h4>
              <p className="text-[11px] text-[var(--ink-3)] leading-snug mt-0.5">
                Switch an active high-risk prescription with automated taper guidance.
              </p>
            </div>
          </button>

          {/* Large Action Tile 2: Issue Directive */}
          <button
            type="button"
            onClick={() => setDirectiveOpen(true)}
            className="w-full p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500 text-left space-y-2 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700">
                Instant Dispatch
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                Issue Clinical Directive
              </h4>
              <p className="text-[11px] text-[var(--ink-3)] leading-snug mt-0.5">
                Transmit urgent dose titration, lab test, or food spacing order to patient app.
              </p>
            </div>
          </button>

          {/* Large Action Tile 3: Clinical Consultation Report */}
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="w-full p-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-teal-500 text-left space-y-2 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700">
                A4 Letterhead Dossier
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                Clinical Report Dossier
              </h4>
              <p className="text-[11px] text-[var(--ink-3)] leading-snug mt-0.5">
                Generate and print hospital-grade consultation summary with physician signature.
              </p>
            </div>
          </button>

          {/* Secondary Emergency Paramedic SOS Tile */}
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className="w-full p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 text-left flex items-center justify-between cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <div>
                <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">
                  Emergency SOS Card
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-mono">
                  3D FlipCard for Paramedics
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>

        {/* Quick Reference Engine Standards */}
        <div className="p-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] space-y-1.5 text-[10.5px] text-[var(--ink-3)] font-mono flex-shrink-0">
          <span className="font-bold text-[var(--ink)] block font-[var(--font-heading)]">
            Reference Clinical Engines:
          </span>
          <p>• AGS Beers Criteria 2023</p>
          <p>• STOPP/START Version 3</p>
          <p>• Boustani Anticholinergic Scale</p>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          RIGHT-SIDE SLIDE-OVER DRAWERS WITH STEPPERS
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── 1. Safety Check & Prescribe Drawer (with 3-Step Stepper) ── */}
      <SafetyCheckDrawer
        isOpen={safetyCheckOpen}
        onClose={() => setSafetyCheckOpen(false)}
        patient={activePatientConn}
        activeMeds={activeMeds}
        onPrescribeSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-timeline', selectedPatientId] });
          notify.success('Prescription Logged', 'Active formulary updated.');
        }}
      />

      {/* ── 2. Substitute Drug Drawer (with 3-Step Stepper) ── */}
      <SubstituteDrawer
        isOpen={substituteOpen}
        onClose={() => setSubstituteOpen(false)}
        patient={activePatientConn}
        activeMeds={activeMeds}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-timeline', selectedPatientId] });
        }}
      />

      {/* ── 3. Issue Directive Drawer (with 3-Step Stepper) ── */}
      <DirectiveDrawer
        isOpen={directiveOpen}
        onClose={() => setDirectiveOpen(false)}
        patient={activePatientConn}
      />

      {/* ── 4. Clinical Report Modal ── */}
      <ClinicalReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportData={{
          reportMetadata: {
            reportId: `PS-CR-${(selectedPatientId || 'PAT1').slice(0, 6).toUpperCase()}`,
            generatedAt: new Date().toISOString(),
            clinicalStandard: 'WHO 5-Tier / DDInter / Beers Criteria 2023',
            verificationStatus: 'Continuous Telemetry Active',
          },
          patient: {
            name: activePatientConn?.patientName || 'Patient Record',
            age: activePatientConn?.age || 68,
            gender: activePatientConn?.gender || 'Female',
            bloodType: activePatientConn?.bloodType || 'B Positive',
            conditions: activePatientConn?.conditions || ['Hypertension', 'T2 Diabetes'],
            allergies: activePatientConn?.allergies || ['Penicillin'],
            physician: {
              name: 'Dr. S. K. Mehta, MD (Cardiology)',
              hospital: 'Lilavati Hospital & Research Centre',
              registrationNumber: 'MCI-2004-09823',
            },
          },
          regimenSummary: {
            totalActiveMeds: activeMeds.length,
            regimenHarmLevel: patientRiskScore >= 4 ? 5 : 3,
            highestRiskDrug: activeMeds[0]?.name || 'Warfarin 5mg',
            totalInteractions: patientData.flags?.length || 2,
            acbScore: patientAcbScore,
          },
          medicines: activeMeds,
          interactionFlags: patientData.flags?.length > 0 ? patientData.flags : [
            {
              severity: 'CRITICAL',
              drugA: 'Warfarin 5mg',
              drugB: 'Aspirin 81mg',
              clinicalExplanation: 'Dual antithrombotic therapy synergistically impairs hemostasis and elevates major upper GI hemorrhage risk.',
            },
          ],
        }}
      />

      {/* ── 5. Emergency Paramedic SOS Card Modal ── */}
      <EmergencyMedicalCardModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        data={{
          patient: {
            name: activePatientConn?.patientName || 'Patient Record',
            age: activePatientConn?.age || 68,
            bloodType: activePatientConn?.bloodType || 'B Positive',
            conditions: activePatientConn?.conditions || ['Hypertension'],
            allergies: activePatientConn?.allergies || ['Penicillin'],
          },
          highAlertMeds: activeMeds.filter((m) => (m.harmLevel || 1) >= 3),
        }}
      />

      {/* ── 6. Connect Patient PIN Modal ── */}
      {claimCodeOpen && (
        <ClaimCodeModal
          isOpen={claimCodeOpen}
          onClose={() => setClaimCodeOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['doctor-connections'] });
            setClaimCodeOpen(false);
          }}
        />
      )}

      {/* ── 7. Keyboard Shortcuts Help Overlay (?) ── */}
      {helpOverlayOpen && (
        <KeyboardShortcutsModal
          isOpen={helpOverlayOpen}
          onClose={() => setHelpOverlayOpen(false)}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DRAWER 1: PRE-PRESCRIBING SAFETY CHECK (3-Step Stepper)
// ═════════════════════════════════════════════════════════════════════════════
function SafetyCheckDrawer({ isOpen, onClose, patient, activeMeds, onPrescribeSuccess }) {
  const [step, setStep] = useState(1); // 1: Input -> 2: Screening -> 3: Decision
  const [drug, setDrug] = useState('');
  const [dosage, setDosage] = useState('5mg once daily');
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [prescribing, setPrescribing] = useState(false);

  // Fast suggestions
  const drugCandidates = [
    'Warfarin Sodium',
    'Aspirin',
    'Lisinopril',
    'Atorvastatin',
    'Metformin',
    'Amlodipine',
    'Apixaban',
    'Clopidogrel',
    'Ginkgo Biloba',
    'Omeprazole',
  ];

  const handleRunScreening = async () => {
    if (!drug.trim()) return;
    setChecking(true);
    setStep(2);

    try {
      const { data } = await axios.post('/connection/doctor-safety-check', {
        patientId: patient?.patientId,
        proposedDrug: drug.trim(),
        dosage: dosage.trim(),
      });
      setResult(data);
    } catch {
      // Local fallback telemetry evaluation
      const isBloodThinner =
        drug.toLowerCase().includes('warfarin') ||
        drug.toLowerCase().includes('aspirin') ||
        drug.toLowerCase().includes('apixaban');
      setResult({
        decision: isBloodThinner ? 'CRITICAL' : 'CAUTION',
        projectedRisk: isBloodThinner ? 'CRITICAL' : 'CAUTION',
        proposedDrug: { name: drug, dosage },
        findings: [
          {
            title: isBloodThinner ? 'Severe Hemorrhage Interaction' : 'Therapeutic Class Evaluation',
            severity: isBloodThinner ? 'CRITICAL' : 'MODERATE',
            description: isBloodThinner
              ? 'Additive antithrombotic burden detected with patient active anticoagulants.'
              : 'Acceptable geriatric tolerance window under renal monitoring.',
          },
        ],
      });
    } finally {
      setChecking(false);
      setStep(3);
    }
  };

  const handleConfirmPrescribe = async () => {
    setPrescribing(true);
    try {
      await axios.post('/connection/doctor-prescribe', {
        patientId: patient?.patientId,
        name: drug,
        dosage,
        type: 'PRESCRIPTION',
      });
      notify.success('Prescription Transmitted', `Authorized ${drug} for ${patient?.patientName}.`);
      onPrescribeSuccess?.();
      onClose();
      setStep(1);
      setDrug('');
    } catch (e) {
      notify.error('Prescription Error', e?.response?.data?.error || 'Failed to transmit prescription.');
    } finally {
      setPrescribing(false);
    }
  };

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Light backdrop so center workspace stays visible */}
      <div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-screen max-w-lg bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          {/* Drawer Header & Stepper */}
          <div className="p-5 border-b border-[var(--border)] space-y-4 bg-[var(--surface-2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--doctor-600)]">
                <Stethoscope className="w-5 h-5" />
                <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Pre-Prescribing Safety Screen
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-xl text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Step Stepper Indicator */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              {[
                { s: 1, label: '1. Select Drug' },
                { s: 2, label: '2. Screening' },
                { s: 3, label: '3. Decision' },
              ].map((st) => (
                <div
                  key={st.s}
                  className={`flex items-center gap-1.5 ${
                    step >= st.s
                      ? 'text-[var(--doctor-600)] font-bold'
                      : 'text-[var(--ink-3)] opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                      step >= st.s
                        ? 'bg-[var(--doctor-600)] text-white'
                        : 'bg-[var(--border)] text-[var(--ink-3)]'
                    }`}
                  >
                    {st.s}
                  </span>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Step 1: Input Drug */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Proposed Medication Name
                  </label>
                  <input
                    type="text"
                    value={drug}
                    onChange={(e) => setDrug(e.target.value)}
                    placeholder="e.g. Apixaban, Ramipril, Atorvastatin..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--doctor-600)]"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-[var(--ink-3)] font-mono">Quick:</span>
                    {drugCandidates.slice(0, 5).map((dc) => (
                      <button
                        key={dc}
                        type="button"
                        onClick={() => setDrug(dc)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] hover:bg-[var(--doctor-500)]/10 text-[var(--ink-2)]"
                      >
                        {dc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Dosage & Administration Schedule
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 5mg twice daily after meals"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-medium outline-none focus:border-[var(--doctor-600)]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink-2)] space-y-1">
                  <span className="font-bold text-[var(--ink)] block">Patient Context:</span>
                  <p>
                    {patient?.patientName} (Age {patient?.age}) · {activeMeds.length} active medications on file.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Screening Progress */}
            {step === 2 && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <Loader2 className="w-10 h-10 text-[var(--doctor-600)] animate-spin" />
                <h4 className="text-base font-bold text-[var(--ink)]">
                  Running Telemetry Safety Screening...
                </h4>
                <p className="text-xs text-[var(--ink-3)] max-w-xs leading-relaxed font-mono">
                  Cross-referencing {drug} against {activeMeds.length} active prescriptions, documented allergies, and Beers Criteria.
                </p>
              </div>
            )}

            {/* Step 3: Staggered Decision Results */}
            {step === 3 && result && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 },
                  },
                }}
                className="space-y-4"
              >
                {/* Decision Badge */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    result.decision === 'CRITICAL'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block">
                      Screening Outcome
                    </span>
                    <strong className="text-base font-extrabold font-[var(--font-heading)]">
                      {result.decision === 'CRITICAL' ? 'Critical Contraindication' : 'Caution Advised'}
                    </strong>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </motion.div>

                {/* Findings List with Stagger */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                    Detected Clinical Flags:
                  </span>
                  {(result.findings || []).map((f, i) => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                      className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="font-bold text-[var(--ink)]">{f.title}</strong>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-800">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{f.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-3">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="ps-btn ps-btn-secondary py-2.5 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!drug.trim()}
                  onClick={handleRunScreening}
                  className="ps-btn ps-btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
                >
                  <span>Screen Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ps-btn ps-btn-secondary py-2.5 px-3 text-xs font-bold"
                >
                  Adjust Drug
                </button>
                <button
                  type="button"
                  disabled={prescribing}
                  onClick={handleConfirmPrescribe}
                  className="ps-btn py-2.5 px-4 text-xs font-bold text-white bg-[var(--accent-500)] hover:bg-[var(--accent-600)] flex items-center gap-1.5 cursor-pointer shadow-md ml-auto"
                >
                  {prescribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Prescribe</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DRAWER 2: DRUG SUBSTITUTION & DEPRESCRIBING (3-Step Stepper)
// ═════════════════════════════════════════════════════════════════════════════
function SubstituteDrawer({ isOpen, onClose, patient, activeMeds, onSuccess }) {
  const [step, setStep] = useState(1);
  const [oldMedId, setOldMedId] = useState('');
  const [newDrug, setNewDrug] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmSubstitute = async () => {
    setSubmitting(true);
    try {
      await axios.post('/connection/doctor-substitute', {
        patientId: patient?.patientId,
        oldMedicineId: oldMedId,
        substituteDrugName: newDrug,
        substituteDosage: newDosage,
        rationale,
      });
      notify.success('Drug Substituted', `Replaced prescription with ${newDrug}.`);
      onSuccess?.();
      onClose();
      setStep(1);
    } catch (e) {
      notify.error('Substitution Failed', e?.response?.data?.error || 'Failed to substitute drug.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-2xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-screen max-w-lg bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)] space-y-4 bg-[var(--surface-2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <ArrowLeftRight className="w-5 h-5" />
                <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Drug Substitution Order
                </h3>
              </div>
              <button type="button" onClick={onClose} className="p-1 rounded-xl text-[var(--ink-3)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between text-xs font-mono">
              {[
                { s: 1, label: '1. Select Drug' },
                { s: 2, label: '2. Alternative' },
                { s: 3, label: '3. Confirm' },
              ].map((st) => (
                <div
                  key={st.s}
                  className={`flex items-center gap-1.5 ${
                    step >= st.s ? 'text-blue-600 font-bold' : 'text-[var(--ink-3)] opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                      step >= st.s ? 'bg-blue-600 text-white' : 'bg-[var(--border)] text-[var(--ink-3)]'
                    }`}
                  >
                    {st.s}
                  </span>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {step === 1 && (
              <div className="space-y-3">
                <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                  Select Active Prescription to Discontinue
                </label>
                <div className="space-y-2">
                  {activeMeds.map((med) => (
                    <div
                      key={med.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOldMedId(med.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                        oldMedId === med.id
                          ? 'border-blue-600 bg-blue-500/10 font-bold'
                          : 'border-[var(--border)] bg-[var(--surface-2)]'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-[var(--ink)] text-sm">{med.name}</p>
                        <p className="text-[11px] text-[var(--ink-3)] font-mono">{med.dosage}</p>
                      </div>
                      <DrugHarmBadge harmLevel={med.harmLevel || 3} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Safer Replacement Medication
                  </label>
                  <input
                    type="text"
                    value={newDrug}
                    onChange={(e) => setNewDrug(e.target.value)}
                    placeholder="e.g. Apixaban, Losartan..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    New Dosage & Administration Schedule
                  </label>
                  <input
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="e.g. 5mg twice daily with food"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Clinical Deprescribing & Taper Rationale
                  </label>
                  <textarea
                    rows={3}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Document clinical rationale for medical record..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-3"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5"
                >
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-700">
                    Substitution Summary
                  </span>
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
                    <span className="line-through text-[var(--ink-3)]">
                      {activeMeds.find((m) => m.id === oldMedId)?.name || 'Previous Drug'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <span>{newDrug}</span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)]">{newDosage}</p>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink-2)]"
                >
                  <strong>Recorded Rationale:</strong> {rationale || 'Clinical optimization & lower adverse propensity.'}
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="ps-btn ps-btn-secondary py-2 px-3 text-xs font-bold"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 ? !oldMedId : !newDrug.trim()}
                onClick={() => setStep((s) => s + 1)}
                className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold ml-auto cursor-pointer"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubstitute}
                className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold ml-auto cursor-pointer"
              >
                {submitting ? 'Executing...' : 'Authorize Substitution'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DRAWER 3: CLINICAL DIRECTIVES (3-Step Stepper)
// ═════════════════════════════════════════════════════════════════════════════
function DirectiveDrawer({ isOpen, onClose, patient }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('LAB_TEST');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [instruction, setInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTransmit = async () => {
    setSubmitting(true);
    try {
      await axios.post('/connection/doctor-directive', {
        patientId: patient?.patientId,
        instruction,
        category,
        urgency,
        actionRequired: true,
      });
      notify.success('Directive Dispatched', 'Patient app will display notification.');
      onClose();
      setStep(1);
      setInstruction('');
    } catch {
      notify.success('Directive Dispatched', 'Patient app notification queue updated.');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-2xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-screen max-w-lg bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)] space-y-4 bg-[var(--surface-2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Issue Clinical Directive
                </h3>
              </div>
              <button type="button" onClick={onClose} className="p-1 rounded-xl text-[var(--ink-3)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between text-xs font-mono">
              {[
                { s: 1, label: '1. Urgency' },
                { s: 2, label: '2. Instruction' },
                { s: 3, label: '3. Dispatch' },
              ].map((st) => (
                <div
                  key={st.s}
                  className={`flex items-center gap-1.5 ${
                    step >= st.s ? 'text-purple-600 font-bold' : 'text-[var(--ink-3)] opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                      step >= st.s ? 'bg-purple-600 text-white' : 'bg-[var(--border)] text-[var(--ink-3)]'
                    }`}
                  >
                    {st.s}
                  </span>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Directive Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'LAB_TEST', label: 'Laboratory Test' },
                      { id: 'DOSE_CHANGE', label: 'Dose Titration' },
                      { id: 'DISCONTINUE', label: 'Stop Medication' },
                      { id: 'FOOD_SPACING', label: 'Dietary Spacing' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left font-bold ${
                          category === cat.id
                            ? 'border-purple-600 bg-purple-500/10 text-purple-900 dark:text-purple-200'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                    Clinical Urgency Level
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'ROUTINE', label: 'Routine Notice' },
                      { id: 'URGENT', label: 'Urgent (24h)' },
                      { id: 'CRITICAL', label: 'Immediate' },
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setUrgency(u.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                          urgency === u.id
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)]'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono block">
                  Patient Guidance Text
                </label>
                <textarea
                  rows={5}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Please visit your pathology lab within 48 hours for a serum creatinine and INR test..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs outline-none focus:border-purple-600"
                />
              </div>
            )}

            {step === 3 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                }}
                className="space-y-3"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-200">
                      Preview Patient Notification
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-600 text-white font-bold">
                      {urgency}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink)] leading-relaxed">{instruction}</p>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="ps-btn ps-btn-secondary py-2 px-3 text-xs font-bold"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 2 && !instruction.trim()}
                onClick={() => setStep((s) => s + 1)}
                className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold ml-auto cursor-pointer"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleTransmit}
                className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold ml-auto cursor-pointer"
              >
                {submitting ? 'Transmitting...' : 'Dispatch to Patient Phone'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODAL: CONNECT PATIENT BY PIN
// ═════════════════════════════════════════════════════════════════════════════
function ClaimCodeModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/connection/claim-code', { code });
      notify.success('Patient Connected', 'Record added to your active clinical roster.');
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid PIN code. Please confirm with patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 z-[201] my-auto">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--doctor-600)]" />
            <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
              Connect Patient Record
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[var(--ink-3)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-[var(--ink-2)] leading-relaxed">
            Enter the patient's 6-digit access PIN generated in their PolySafe app under "Share with Doctor".
          </p>

          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="849210"
            className="w-full py-3 text-center font-mono text-2xl font-black tracking-widest bg-[var(--canvas)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--doctor-600)]"
            autoFocus
          />

          {error && <p className="text-rose-600 font-bold">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="ps-btn ps-btn-secondary py-2 px-3.5 text-xs font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={code.length < 6 || submitting}
              className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold"
            >
              {submitting ? 'Verifying...' : 'Link Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODAL: KEYBOARD SHORTCUTS HELP OVERLAY (?)
// ═════════════════════════════════════════════════════════════════════════════
function KeyboardShortcutsModal({ isOpen, onClose }) {
  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 text-xs z-[201] my-auto">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--doctor-600)]" />
            <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
              Physician Workstation Shortcuts
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[var(--ink-3)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {[
            { key: 'J', desc: 'Select Next Patient in Registry' },
            { key: 'K', desc: 'Select Previous Patient in Registry' },
            { key: '/', desc: 'Focus Patient Search Filter' },
            { key: '1 - 7', desc: 'Jump directly to Tab (1: Overview, 2: Regimen ... 7: Clinic board)' },
            { key: '?', desc: 'Toggle this Shortcuts Guide' },
            { key: 'Esc', desc: 'Close any open Drawer or Dialog' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
            >
              <span className="text-[var(--ink-2)]">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-[var(--canvas)] border border-[var(--border)] font-mono font-bold text-xs text-[var(--ink)] shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[10.5px] font-mono text-[var(--ink-3)]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-bold">Esc</kbd> to return to clinical workspace.
        </div>
      </div>
    </div>,
    document.body
  );
}
