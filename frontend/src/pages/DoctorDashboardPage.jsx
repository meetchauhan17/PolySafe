/**
 * DoctorDashboardPage.jsx — Clinical Physician Dashboard
 * Route: /doctor-dashboard
 *
 * Capabilities:
 * - Patient Connection Management (6-digit PIN claim & approval status)
 * - Real-Time Regimen Timeline with Provenance & FDA Pharmacovigilance (OFFSIDES)
 * - Pre-Prescribing Safety Simulation Engine
 * - Direct Physician Prescription Issuance (POST /connection/doctor-prescribe)
 * - Clinical Deprescribing & Regimen Optimization Assistant (Beers Criteria & ACB scale)
 * - Patient Logged Symptoms & Prescribing Cascade Correlation
 * - One-Click Print-Ready Clinical Consultation & Risk Assessment Report
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Stethoscope, Loader2, AlertCircle, CheckCircle2, Clock,
  Pill, Leaf, ShoppingBag, AlertOctagon, ChevronRight,
  Users, Shield, Info, TriangleAlert, Plus, Search, X,
  FileText, Activity, Brain, ArrowDownCircle, Printer,
  Sparkles, Check, HeartHandshake, AlertTriangle, Trash2,
  Calendar, RefreshCw, Layers
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  EmptyDoctorPatientIllustration,
  EmptyDoctorListIllustration,
  EmptyMedicinesIllustration,
} from '../components/EmptyIllustrations';
import {
  DoctorPatientListSkeleton,
  DoctorPatientDetailSkeleton,
} from '../components/Skeletons';
import { notify } from '../utils/toast';
import { DrugHarmBadge, KnownSideEffectsPanel } from '../components/DrugHarmLevel';

// ─── API helpers ──────────────────────────────────────────────────────────────
async function claimCode(code) {
  const { data } = await axios.post('/connection/claim-code', { code });
  return data;
}

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

// ─── Severity colours ─────────────────────────────────────────────────────────
const SEV_CFG = {
  Contraindicated: { badge: 'bg-red-100 text-red-800 border-red-200', dot: '#B23D25', variant: 'danger' },
  Major:           { badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: '#B23D25', variant: 'danger' },
  Moderate:        { badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: '#B5791A', variant: 'caution' },
  Minor:           { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: '#A16207', variant: 'default' },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── 1. Pre-Prescribing Safety Check & Prescription Modal ─────────────────────
function DoctorSafetyCheckModal({ isOpen, onClose, patientId, patientAge, onPrescribeSuccess }) {
  const [drug, setDrug] = useState('');
  const [dosage, setDosage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [err, setErr] = useState('');

  // Drug search autocomplete
  useEffect(() => {
    const q = drug.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      axios.get(`/medicine/search?q=${encodeURIComponent(q)}`)
        .then(r => setSuggestions(r.data?.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [drug]);

  const handleCheck = async (e) => {
    e?.preventDefault?.();
    const trimmed = drug.trim();
    if (!trimmed) return;
    setChecking(true);
    setErr('');
    setResult(null);
    setShowSuggestions(false);
    try {
      const { data } = await axios.post('/connection/doctor-safety-check', {
        patientId,
        proposedDrug: trimmed,
        dosage: dosage.trim() || undefined,
      });
      setResult(data);
    } catch (error) {
      setErr(error?.response?.data?.error || 'Safety check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handlePrescribeDirectly = async () => {
    if (!result?.proposedDrug?.name) return;
    setPrescribing(true);
    setErr('');
    try {
      const { data } = await axios.post('/connection/doctor-prescribe', {
        patientId,
        name: result.proposedDrug.name,
        dosage: dosage.trim() || result.proposedDrug.dosage || 'Standard dose',
        type: 'PRESCRIPTION',
      });
      notify.success('Prescription Issued', data.message || `Prescribed ${result.proposedDrug.name} for patient.`);
      onPrescribeSuccess?.();
      onClose();
    } catch (error) {
      setErr(error?.response?.data?.error || 'Failed to issue prescription.');
    } finally {
      setPrescribing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-[#E8E2D6] border border-[rgba(191,180,155,0.6)] shadow-[10px_10px_30px_rgba(0,0,0,0.25)] rounded-[32px] p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1B4B66]/10 border border-[#1B4B66]/20 rounded-2xl">
              <Stethoscope className="w-6 h-6 text-[#1B4B66]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
                Pre-Prescribing Safety Check
              </h2>
              <p className="text-xs text-[#5C6B64]">
                Patient (Age {patientAge || '—'}) · Real-time DDInter & Regimen Risk Simulator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5C6B64] hover:bg-[#DED7C6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Framing Notice */}
        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Clinical Simulator:</strong> Cross-checks the proposed drug against the patient's active medicines for direct DDInter flags and WHO/NCI tiered polypharmacy score changes before issuing a prescription.
          </p>
        </div>

        {/* Search & Input Form */}
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Drug Name with Autocomplete */}
            <div className="sm:col-span-2 space-y-1.5 relative">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C6B64]">
                Proposed Drug / Indian Brand
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={drug}
                  onChange={(e) => {
                    setDrug(e.target.value);
                    setShowSuggestions(true);
                    setErr('');
                    setResult(null);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g. D3B12 PLUS, Pan-D, Warfarin, Metformin…"
                  className="input-field w-full text-sm py-3"
                  autoFocus
                />
                {checking && (
                  <Loader2 className="w-4 h-4 text-[#2B6E5E] animate-spin absolute right-3 top-3.5" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--brand-paper)] border border-[var(--brand-border-subtle)] shadow-lg rounded-2xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDrug(s.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#1C2B27] hover:bg-[var(--brand-clay)] flex items-center justify-between border-b border-black/5 last:border-0 cursor-pointer"
                    >
                      <span>{s.name}</span>
                      {s.harmLevel && <DrugHarmBadge harmLevel={s.harmLevel} size="sm" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dosage input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5C6B64]">
                Dosage (Optional)
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg, 1 tab"
                className="input-field w-full text-sm py-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-5 py-2.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!drug.trim() || checking}
              className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Simulate Safety Check</span>
            </button>
          </div>
        </form>

        {/* Error message */}
        {err && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* Result Evaluation Card */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-2 border-t border-[rgba(191,180,155,0.4)]"
          >
            {/* Top Decision Banner */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                result.decision === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : result.decision === 'CAUTION'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.decision === 'CRITICAL' ? (
                  <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0" />
                ) : result.decision === 'CAUTION' ? (
                  <TriangleAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-wider">
                    Prescribing Decision: {result.decision}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {result.decision === 'SAFE'
                      ? `No direct interaction detected with patient's ${result.currentRegimenCount} active medicines.`
                      : result.decision === 'CRITICAL'
                      ? 'Severe pharmacological interaction or contraindicated combination identified.'
                      : 'Moderate interaction or polypharmacy burden detected — clinical monitoring advised.'}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-black px-3 py-1 rounded-xl border ${
                  result.decision === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : result.decision === 'CAUTION'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {result.decision}
              </span>
            </div>

            {/* Drug Resolution & Regimen Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Proposed Drug Details */}
              <div className="p-3.5 rounded-2xl bg-[#EDE8DC] shadow-[inset_2px_2px_5px_rgba(191,180,155,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64]">Proposed Drug</span>
                  <DrugHarmBadge harmLevel={result.proposedDrug?.harmLevel} size="sm" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1C2B27]">{result.proposedDrug?.name}</p>
                  <p className="text-xs text-[#5C6B64] font-medium mt-0.5">
                    Active Composition: <strong className="text-[#1C2B27]">{result.proposedDrug?.genericName}</strong>
                  </p>
                  {result.proposedDrug?.class && (
                    <p className="text-[11px] text-[#5C6B64] mt-0.5">
                      Class: {result.proposedDrug.class}
                    </p>
                  )}
                </div>
              </div>

              {/* Projected Regimen Impact */}
              <div className="p-3.5 rounded-2xl bg-[#EDE8DC] shadow-[inset_2px_2px_5px_rgba(191,180,155,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64]">Projected Regimen Risk</span>
                  <span className="text-[10px] font-extrabold text-[#2B6E5E]">
                    {result.currentRegimenCount + 1} total medicines
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {result.projectedRegimenRisk}
                  </span>
                  {result.projectedAverageScore && (
                    <span className="text-xs font-semibold text-[#5C6B64]">
                      ({result.projectedAverageScore} / 5.0 score)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5C6B64] leading-tight">
                  Calculated using WHO/NCI tiered polypharmacy index.
                </p>
              </div>
            </div>

            {/* Interaction Flags List */}
            {result.flags && result.flags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#B23D25] flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{result.flags.length} Interaction Flag{result.flags.length !== 1 ? 's' : ''} Detected</span>
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {result.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#EDE8DC] shadow-[4px_4px_8px_rgba(191,180,155,0.5),-4px_-4px_8px_rgba(255,255,255,0.65)] border border-[rgba(191,180,155,0.3)] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#1C2B27]">
                          {result.proposedDrug?.name} ↔ {flag.counterpart || flag.interactingDrug}
                        </p>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            flag.severity === 'Major' || flag.severity === 'Contraindicated'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6B64] leading-relaxed">
                        {flag.plainExplanation || flag.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar: Prescribe Directly Button */}
            <div className="pt-3 flex items-center justify-between gap-3 border-t border-[rgba(191,180,155,0.3)]">
              <span className="text-[11px] text-[#5C6B64]">
                Ready to prescribe for this patient?
              </span>
              <button
                type="button"
                onClick={handlePrescribeDirectly}
                disabled={prescribing}
                className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2"
              >
                {prescribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Prescribe & Add to Regimen</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── 2. Print-Ready Clinical Summary & Consultation Report Modal ──────────────
function ClinicalConsultationReportModal({ isOpen, onClose, patientId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['clinical-summary-report', patientId],
    queryFn: () => fetchPatientClinicalSummary(patientId),
    enabled: isOpen && !!patientId,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-[#FDFBF7] border border-[#D5CEBF] shadow-[10px_10px_40px_rgba(0,0,0,0.3)] rounded-[32px] p-6 sm:p-10 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:p-0 print:border-none print:shadow-none"
      >
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex items-center justify-between gap-4 print:hidden border-b border-[#D5CEBF] pb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#2B6E5E]" />
            <h3 className="text-base font-bold text-[#1C2B27]">Clinical Consultation & Risk Assessment Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C6B64] hover:bg-[#EDE8DC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#2B6E5E] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#5C6B64]">Compiling clinical pharmacovigilance data…</p>
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-sm text-rose-700">Failed to load clinical summary.</div>
        ) : (
          <div className="space-y-6 text-[#1C2B27]">
            {/* Header Document Banner */}
            <div className="flex items-start justify-between border-b-2 border-[#2B6E5E] pb-4">
              <div>
                <h1 className="text-2xl font-black text-[#2B6E5E]" style={{ fontFamily: "'Fraunces', serif" }}>
                  PolySafe Clinical Polypharmacy Report
                </h1>
                <p className="text-xs text-[#5C6B64] mt-0.5">
                  Automated Pharmacovigilance, Interaction Risk Matrix & Deprescribing Recommendations
                </p>
              </div>
              <div className="text-right text-xs text-[#5C6B64]">
                <p className="font-bold text-[#1C2B27]">Date: {new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Status: <strong>Verified Clinical Record</strong></p>
              </div>
            </div>

            {/* Patient Demographics & Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#EDE8DC] rounded-2xl border border-[#D5CEBF]">
              <div>
                <span className="text-[10px] font-bold text-[#5C6B64] uppercase">Patient</span>
                <p className="text-sm font-bold text-[#1C2B27]">{data.patient.contact}</p>
                <p className="text-xs text-[#5C6B64]">Age: {data.patient.age || '—'} years</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#5C6B64] uppercase">Diagnosed Conditions</span>
                <p className="text-xs font-semibold text-[#1C2B27] mt-0.5">
                  {data.patient.conditions?.length ? data.patient.conditions.join(', ') : 'None documented'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#5C6B64] uppercase">Regimen Risk Score</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-black text-[#B23D25]">
                    {data.regimenRisk?.tier || 'L3'} ({data.regimenRisk?.label || 'Moderate'})
                  </span>
                  <span className="text-xs text-[#5C6B64]">Score: {data.regimenRisk?.averageRisk?.toFixed(1) || '3.0'}/5.0</span>
                </div>
              </div>
            </div>

            {/* Active Regimen Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#2B6E5E] flex items-center gap-2">
                <Pill className="w-4 h-4" />
                <span>1. Active Medication Regimen ({data.activeMedicines?.length || 0})</span>
              </h4>
              <div className="border border-[#D5CEBF] rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#EDE8DC] text-[#5C6B64] font-bold border-b border-[#D5CEBF]">
                    <tr>
                      <th className="p-3">Medication Name</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">WHO/NCI Harm Level</th>
                      <th className="p-3">Prescribed By</th>
                      <th className="p-3">Initiated Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E1D3]">
                    {data.activeMedicines?.map((m, i) => (
                      <tr key={i} className="hover:bg-[#FDFBF7]">
                        <td className="p-3 font-bold text-[#1C2B27]">{m.name}</td>
                        <td className="p-3 text-[#5C6B64]">{m.dosage || 'Standard'}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-[#EDE8DC] text-[10px] font-bold">{m.type}</span></td>
                        <td className="p-3"><DrugHarmBadge harmLevel={m.harmLevel} size="sm" /></td>
                        <td className="p-3 text-[#5C6B64]">{m.prescribedBy}</td>
                        <td className="p-3 text-[#5C6B64]">{fmt(m.dateAdded)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Drug Interactions Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#B23D25] flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                <span>2. DDInter Drug Interaction Risk Matrix ({data.flags?.length || 0} Flags)</span>
              </h4>
              {data.flags?.length === 0 ? (
                <p className="text-xs text-emerald-800 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  ✓ No severe or contraindicated drug-drug interactions detected across active medicines.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.flags?.map((f, i) => (
                    <div key={i} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-950">{f.drugA} ↔ {f.drugB}</strong>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-rose-100 text-rose-900 border border-rose-300">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-rose-800 text-[11px] leading-relaxed">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anticholinergic & Cognitive Burden Index */}
            <div className="p-4 bg-[#EDE8DC] border border-[#D5CEBF] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#2B6E5E] flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>3. Cumulative Anticholinergic & Sedative Cognitive Burden</span>
                </h4>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#2B6E5E] text-white">
                  ACB Score: {data.anticholinergicBurden?.totalScore || 0} ({data.anticholinergicBurden?.level || 'Normal'})
                </span>
              </div>
              <p className="text-xs text-[#5C6B64] leading-relaxed">
                {data.anticholinergicBurden?.explanation || 'Regimen evaluated against validated Anticholinergic Cognitive Burden (ACB) scales.'}
              </p>
            </div>

            {/* Deprescribing & Optimization Recommendations */}
            {data.deprescribingCandidates?.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>4. Clinical Deprescribing & Optimization Recommendations</span>
                </h4>
                <div className="space-y-2">
                  {data.deprescribingCandidates.map((c, i) => (
                    <div key={i} className="p-3 bg-white border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-950">
                        <span>{c.name} ({c.dosage || 'Active'})</span>
                        <DrugHarmBadge harmLevel={c.harmLevel} size="sm" />
                      </div>
                      <p className="text-amber-900 text-[11px]"><strong>Clinical Rationale:</strong> {c.reason}</p>
                      <p className="text-emerald-900 text-[11px]"><strong>Recommendation:</strong> {c.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Sign-off */}
            <div className="pt-8 border-t border-[#D5CEBF] flex items-end justify-between text-xs text-[#5C6B64]">
              <div>
                <p>Reviewed by: <strong>Attending Physician</strong></p>
                <p className="text-[10px] text-[#8C8472] mt-0.5">PolySafe AI Clinical Decision Support Engine v2.0</p>
              </div>
              <div className="border-t border-black w-48 text-center pt-1">
                <span className="text-[10px]">Physician Signature & Date</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── 3. Clinical Deprescribing Assistant Tab ──────────────────────────────────
function DeprescribingAssistantPanel({ patientId, onTaperSuccess }) {
  const queryClient = useQueryClient();
  const [taperingId, setTaperingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clinical-summary-report', patientId],
    queryFn: () => fetchPatientClinicalSummary(patientId),
    enabled: !!patientId,
  });

  const handleDeprescribe = async (candidate) => {
    if (!window.confirm(`Discontinue and deprescribe ${candidate.name}? This will update the patient's active timeline.`)) {
      return;
    }
    setTaperingId(candidate.medicineId);
    try {
      await axios.post('/connection/doctor-deprescribe', {
        patientId,
        medicineId: candidate.medicineId,
        rationale: candidate.reason,
        taperPlan: candidate.recommendation,
      });
      notify.success('Deprescribing Executed', `Successfully discontinued ${candidate.name}. Regimen burden recalculated.`);
      queryClient.invalidateQueries(['patient-timeline', patientId]);
      queryClient.invalidateQueries(['clinical-summary-report', patientId]);
      onTaperSuccess?.();
    } catch (err) {
      notify.error('Deprescribing Failed', err?.response?.data?.error || 'Failed to discontinue medicine.');
    } finally {
      setTaperingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center space-y-3">
        <Loader2 className="w-6 h-6 text-[#2B6E5E] animate-spin mx-auto" />
        <p className="text-xs text-[#5C6B64]">Evaluating patient regimen against Beers Criteria & STOPP/START rules…</p>
      </Card>
    );
  }

  const candidates = data?.deprescribingCandidates || [];

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <Card className="p-5 space-y-3 bg-[#EDE8DC] border border-[#D5CEBF]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#2B6E5E]/15 text-[#2B6E5E]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C2B27]">Regimen Optimization & Deprescribing Engine</h3>
              <p className="text-xs text-[#5C6B64]">Beers Criteria 2023 · STOPP/START v3 · Anticholinergic Cognitive Burden</p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-xl bg-[#2B6E5E] text-white">
            {candidates.length} Candidate{candidates.length !== 1 ? 's' : ''} Identified
          </span>
        </div>
        <p className="text-xs text-[#5C6B64] leading-relaxed">
          PolySafe scans active medications for high-risk geriatric pharmacotherapy, excessive anticholinergic burden, and duplicate therapeutic classes to assist physicians in safe deprescribing and taper protocols.
        </p>
      </Card>

      {/* Candidate List */}
      {candidates.length === 0 ? (
        <Card className="p-8 text-center space-y-3 bg-emerald-50/50 border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-emerald-950">Optimized Regimen</h4>
            <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
              No high-risk Beers Criteria medications or critical anticholinergic burden scores detected in this patient's active regimen.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidates.map((cand, idx) => (
            <Card key={idx} className="p-4 space-y-3 border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1C2B27]">{cand.name}</span>
                    {cand.dosage && <span className="text-xs text-[#5C6B64]">({cand.dosage})</span>}
                  </div>
                  <div className="mt-1">
                    <DrugHarmBadge harmLevel={cand.harmLevel} size="sm" />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={taperingId === cand.medicineId}
                  onClick={() => handleDeprescribe(cand)}
                  className="btn-secondary py-2 px-3.5 text-xs text-rose-800 border-rose-300 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {taperingId === cand.medicineId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>Discontinue / Deprescribe</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-[rgba(191,180,155,0.3)]">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <p className="font-bold text-amber-950">Clinical Rationale:</p>
                  <p className="text-amber-900 mt-0.5 leading-relaxed">{cand.reason}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <p className="font-bold text-emerald-950">Recommended Alternative / Plan:</p>
                  <p className="text-emerald-900 mt-0.5 leading-relaxed">{cand.recommendation}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 4. Patient Logged Symptoms & Cascade Correlation Tab ──────────────────────
function PatientSymptomsPanel({ patientId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['clinical-summary-report', patientId],
    queryFn: () => fetchPatientClinicalSummary(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <Card className="p-8 text-center space-y-3">
        <Loader2 className="w-6 h-6 text-[#2B6E5E] animate-spin mx-auto" />
        <p className="text-xs text-[#5C6B64]">Loading patient logged symptoms & cascade correlations…</p>
      </Card>
    );
  }

  const symptoms = data?.symptoms || [];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#EDE8DC] border border-[#D5CEBF]">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold text-[#1C2B27]">Patient Logged Symptoms & Prescribing Cascades</h3>
            <p className="text-xs text-[#5C6B64]">Real-time patient telemetry cross-referenced with medication initiation dates</p>
          </div>
        </div>
      </Card>

      {symptoms.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-[#1C2B27]">No Patient Symptoms Logged</p>
          <p className="text-xs text-[#5C6B64]">The patient has not logged any adverse events or discomfort reports.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {symptoms.map((s, idx) => (
            <Card key={idx} className="p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1C2B27]">{s.description}</span>
                  {s.bodyPart && (
                    <span className="px-2 py-0.5 rounded-full bg-[#DED7C6] text-[10px] font-semibold text-[#5C6B64]">
                      {s.bodyPart}
                    </span>
                  )}
                  {s.severity && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.severity === 'Severe' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.severity}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5C6B64]">
                  Logged on {fmt(s.date)}
                </p>
              </div>
              <Activity className="w-4 h-4 text-rose-500 flex-shrink-0 mt-1" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 5. Main Patient View with Clinical Tabs ───────────────────────────────────
function PatientView({ patientId }) {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'deprescribing' | 'symptoms'
  const [showSafetyCheckModal, setShowSafetyCheckModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn:  () => fetchPatientTimeline(patientId),
    enabled:  !!patientId,
    refetchInterval: 20000,
  });

  if (isLoading) {
    return <DoctorPatientDetailSkeleton />;
  }

  if (isError) {
    return (
      <Card variant="danger" className="h-full flex items-center gap-3 text-sm text-rose-700">
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <span>{error?.response?.data?.error || 'Failed to load patient data.'}</span>
      </Card>
    );
  }

  const medicines = data?.medicines ?? [];
  const flags     = data?.flags     ?? [];
  const patient   = data?.patient   ?? {};

  return (
    <div className="space-y-6">
      {/* Patient profile banner + Action bar */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-[#1B4B66]/10 border border-[#1B4B66]/20 flex-shrink-0">
              <Users className="w-6 h-6 text-[#1B4B66]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-[#1C2B27]">Anonymous Patient Record</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] border border-[#2F8558]/30 px-2 py-0.5 rounded-full">
                  <Shield className="w-2.5 h-2.5" />
                  CONSENT APPROVED
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-[#5C6B64]">
                {patient.age && <span>Age: <strong className="text-[#1C2B27]">{patient.age} yrs</strong></span>}
                {patient.conditions?.length > 0 && (
                  <span>Conditions: <strong className="text-[#1C2B27]">{patient.conditions.join(', ')}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#2B6E5E]" />
              <span>Clinical Report</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSafetyCheckModal(true)}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Safety Check / Prescribe</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-[rgba(191,180,155,0.3)] pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-[#2B6E5E] text-white shadow-xs'
                : 'text-[#5C6B64] hover:bg-[#EDE8DC]'
            }`}
          >
            📋 Regimen Timeline ({medicines.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deprescribing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deprescribing'
                ? 'bg-[#2B6E5E] text-white shadow-xs'
                : 'text-[#5C6B64] hover:bg-[#EDE8DC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deprescribing Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('symptoms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'symptoms'
                ? 'bg-[#2B6E5E] text-white shadow-xs'
                : 'text-[#5C6B64] hover:bg-[#EDE8DC]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Patient Symptoms</span>
          </button>
        </div>
      </Card>

      {/* Pre-Prescribing & Prescribing Modal */}
      <DoctorSafetyCheckModal
        isOpen={showSafetyCheckModal}
        onClose={() => setShowSafetyCheckModal(false)}
        patientId={patientId}
        patientAge={patient.age}
        onPrescribeSuccess={() => {
          queryClient.invalidateQueries(['patient-timeline', patientId]);
          queryClient.invalidateQueries(['clinical-summary-report', patientId]);
        }}
      />

      {/* Clinical Report Print Modal */}
      <ClinicalConsultationReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        patientId={patientId}
      />

      {/* Tab 1: Timeline & Active Regimen */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Active Risk Flags */}
          {flags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#B23D25] flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>Active Pharmacology Risk Flags ({flags.length})</span>
              </h3>
              {flags.map((f) => {
                const cfg = SEV_CFG[f.severity] ?? SEV_CFG.Moderate;
                return (
                  <Card
                    key={f.id}
                    variant={cfg.variant}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {f.severity}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">{fmt(f.dateFlagged)}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1C2B27]">
                      {f.medicineA?.name} ↔ {f.medicineB?.name}
                    </p>
                    {f.clinicalExplanation && (
                      <p className="text-xs text-[#5C6B64] leading-relaxed">{f.clinicalExplanation}</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Medication Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1C2B27]">
              Medication History & Timeline ({medicines.length})
            </h3>

            {medicines.length === 0 ? (
              <Card className="p-8 text-center space-y-3">
                <EmptyMedicinesIllustration className="w-28 h-28 mx-auto" />
                <p className="text-sm font-bold text-[#1C2B27]">No medicines on record</p>
                <p className="text-xs text-[#5C6B64] max-w-xs mx-auto">
                  This patient has not logged any prescription, OTC, or herbal medicines yet.
                </p>
              </Card>
            ) : (
              <div className="relative pl-2 py-2">
                <motion.div
                  className="absolute left-[19px] top-4 bottom-6 w-[3px] z-0 rounded-full origin-top"
                  style={{ backgroundColor: '#2B6E5E' }}
                  initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
                />
                <div className="space-y-5">
                  {medicines.map((med, index) => {
                    const typeIcon = med.type === 'HERBAL'
                      ? <Leaf className="w-3.5 h-3.5 text-[#2B6E5E]" />
                      : med.type === 'OTC'
                      ? <ShoppingBag className="w-3.5 h-3.5 text-[#8A6D3B]" />
                      : <Pill className="w-3.5 h-3.5 text-[#1B4B66]" />;

                    return (
                      <motion.div
                        key={med.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.25,
                          delay: shouldReduceMotion ? 0 : index * 0.05,
                          ease: [0.25, 1, 0.5, 1],
                        }}
                        className="relative z-10 flex items-start gap-4"
                      >
                        {/* Dot */}
                        <div
                          className="w-10 h-10 rounded-full bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] border-[3px] flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: med.flagged ? '#B23D25' : '#2B6E5E',
                          }}
                        >
                          {typeIcon}
                        </div>

                        {/* Entry card */}
                        <Card
                          variant={med.flagged ? 'danger' : 'default'}
                          className="flex-1 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2B6E5E]">
                                  {med.addedByUser?.role === 'DOCTOR' ? 'Prescribed by Physician' : 'Self-logged'} · {med.type}
                                </span>
                                <DrugHarmBadge harmLevel={med.harmLevel} size="sm" />
                              </div>
                              <p className="text-base font-bold text-[#1C2B27] mt-0.5">
                                {med.name}
                                {med.dosage && (
                                  <span className="text-sm font-normal text-[#5C6B64] ml-2">({med.dosage})</span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs text-[#9CA3AF] font-semibold">{fmt(med.dateAdded)}</span>
                          </div>

                          {/* Flag note */}
                          {med.flagged && med.flags?.length > 0 && (
                            <div className="space-y-1">
                              {med.flags.map((flag, fi) => (
                                <span
                                  key={fi}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full mr-2"
                                >
                                  <AlertOctagon className="w-3 h-3 text-rose-500" />
                                  Flagged with {flag.counterpartName} ({flag.severity})
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Expandable Known Side Effects Panel (FDA OFFSIDES) */}
                          <KnownSideEffectsPanel
                            medicineId={med.id}
                            medicineName={med.name}
                            className="mt-2"
                          />
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Deprescribing Assistant */}
      {activeTab === 'deprescribing' && (
        <DeprescribingAssistantPanel
          patientId={patientId}
          onTaperSuccess={() => {
            queryClient.invalidateQueries(['patient-timeline', patientId]);
          }}
        />
      )}

      {/* Tab 3: Patient Logged Symptoms */}
      {activeTab === 'symptoms' && (
        <PatientSymptomsPanel patientId={patientId} />
      )}
    </div>
  );
}

// ─── 6. Claim Code Panel ───────────────────────────────────────────────────────
function ClaimPanel({ onSuccess }) {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');

  const mutation = useMutation({
    mutationFn: claimCode,
    onSuccess: (data) => {
      notify.success('Access Request Sent', 'Waiting for patient to approve in their PolySafe app.');
      onSuccess(data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to claim code.';
      setError(msg);
      notify.error('Access Request Failed', msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <Card className="max-w-md mx-auto space-y-6 p-6 sm:p-8">
      {/* Icon header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E4F2E9] border-2 border-[#2B6E5E]/30 flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-[#2B6E5E]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
            Enter Patient Access PIN
          </h2>
          <p className="text-xs text-[#5C6B64] mt-1">
            Ask your patient to open PolySafe → "Share with Doctor" and provide their 6-digit access code.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Code input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold uppercase tracking-widest text-[#5C6B64]">
            Patient 6-digit PIN
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (error) setError('');
            }}
            placeholder="000000"
            className={`input-field text-center text-3xl font-black tracking-[0.5em] py-5 ${error ? 'input-error' : ''}`}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={code.length < 6 || mutation.isPending}
          className="btn-primary w-full py-4 text-base"
        >
          {mutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Connecting…</span></>
          ) : (
            <><Stethoscope className="w-5 h-5" /><span>Connect to Patient Record</span></>
          )}
        </button>
      </form>

      {/* Info */}
      <div className="flex items-start gap-2 p-3.5 bg-[#EDE8DC] border border-[var(--brand-border-subtle)] rounded-2xl">
        <Info className="w-4 h-4 text-[#5C6B64] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#5C6B64] leading-relaxed">
          Once entered, the patient will receive a secure prompt to approve access. You will gain clinical access to their active medication timeline, interaction matrix, and prescribing tools.
        </p>
      </div>
    </Card>
  );
}

// ─── 7. Doctor Connections Sidebar / Patient List with Search ──────────────────
function ConnectionsList({ onSelect, selectedId }) {
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-connections'],
    queryFn:  fetchMyConnections,
    refetchInterval: 15000,
  });
  const connections = data?.connections ?? [];

  const filtered = connections.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const age = String(c.patientAge || '');
    return age.includes(term) || (c.label || '').toLowerCase().includes(term);
  });

  if (isLoading) {
    return <DoctorPatientListSkeleton />;
  }

  if (connections.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#5C6B64] bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-[32px] space-y-2">
        <EmptyDoctorListIllustration className="w-20 h-20 mx-auto" />
        <div>
          <p className="font-bold text-[#1C2B27]">No approved patients yet</p>
          <p className="mt-1 leading-relaxed text-[11px]">
            Click "+ Enter Code" above to link a patient via their 6-digit access code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter connected patients…"
          className="input-field w-full text-xs py-2 pl-8 pr-3"
        />
        <Search className="w-3.5 h-3.5 text-[#5C6B64] absolute left-2.5 top-2.5" />
      </div>

      <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {filtered.map((c) => {
            const isSelected = selectedId === c.connectionId;
            return (
              <motion.div
                key={c.connectionId}
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelect(c.patientId, c.connectionId)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border-[#2B6E5E] ring-1 ring-[#2B6E5E]'
                    : 'bg-[#FDFBF7] hover:bg-[#EDE8DC] border-[#D5CEBF]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-[#2B6E5E] text-white shadow-xs' : 'bg-[#EDE8DC] text-[#2B6E5E]'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1C2B27] truncate">Anonymous Patient</p>
                    <p className="text-[10px] text-[#5C6B64]">
                      Age {c.patientAge || '—'} · {c.recentMeds?.length ?? 0} active meds
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#2B6E5E] translate-x-0.5' : 'text-[#9CA3AF]'}`} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── 8. Main Doctor Dashboard Page ─────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep]       = useState('list');  // 'list' | 'claim' | 'claimed' | 'viewing'
  const [selectedPatient, setSelectedPatient] = useState(null);  // { patientId, connectionId }

  const handleClaimSuccess = () => {
    setStep('claimed');
    queryClient.invalidateQueries(['doctor-connections']);
  };

  const handleSelectPatient = (patientId, connectionId) => {
    setSelectedPatient({ patientId, connectionId });
    setStep('viewing');
  };

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* ── Step: Claim Code Modal/Panel ── */}
      {step === 'claim' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Link Patient Record
            </h2>
            <button
              onClick={() => setStep('list')}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
          </div>
          <ClaimPanel onSuccess={handleClaimSuccess} />
        </div>
      )}

      {/* ── Step: Code claimed, waiting for patient approval ── */}
      {step === 'claimed' && (
        <Card className="max-w-md mx-auto text-center space-y-5 p-8">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-[#E0824B]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Waiting for Patient Approval
            </h2>
            <p className="text-sm text-[#5C6B64] mt-2 leading-relaxed">
              Your connection request has been sent. The patient will receive an approval prompt in their PolySafe app. Once approved, their record will appear in your clinical list.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-[#2B6E5E]"
                style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }}
              />
            ))}
          </div>
          <button
            onClick={() => { setStep('list'); queryClient.invalidateQueries(['doctor-connections']); }}
            className="btn-primary w-full py-3"
          >
            <Users className="w-4 h-4" />
            <span>View Connected Patients</span>
          </button>
        </Card>
      )}

      {/* ── Step: Patient list + viewer (Side-by-Side Unified Grid Layout) ── */}
      {(step === 'list' || step === 'viewing') && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Sidebar: Approved Patients Card (Sticky on desktop) */}
          <div className="lg:sticky lg:top-[88px] space-y-4">
            <Card
              title="Clinical Patients"
              subtitle="Consent-approved records"
              icon={<Users className="w-4 h-4 text-[#2B6E5E]" />}
              className="p-5"
            >
              <div className="space-y-4">
                {/* Pinned "+ Enter Code" Button */}
                <button
                  onClick={() => setStep('claim')}
                  className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enter Patient Code</span>
                </button>

                <div className="border-t border-[var(--brand-border-subtle)] pt-3">
                  <ConnectionsList
                    onSelect={handleSelectPatient}
                    selectedId={selectedPatient?.connectionId}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Main: Animated Patient Details or Clean Empty State */}
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'viewing' && selectedPatient ? (
                <motion.div
                  key={selectedPatient.patientId}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 14, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: -14, filter: 'blur(2px)' }}
                  transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                >
                  <PatientView patientId={selectedPatient.patientId} />
                </motion.div>
              ) : (
                <motion.div
                  key="no-patient-selected"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="flex flex-col items-center justify-center p-12 text-center py-16 space-y-4">
                    <EmptyDoctorPatientIllustration className="w-36 h-36 mx-auto mb-1" />
                    <div>
                      <h3
                        className="text-xl font-bold text-[#1C2B27]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        Select a Patient Record
                      </h3>
                      <p className="text-sm text-[#5C6B64] mt-1.5 max-w-sm mx-auto leading-relaxed">
                        Choose an approved patient from the left panel to review their complete medication timeline, active pharmacology risk flags, and cross-prescribing cascade insights.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
