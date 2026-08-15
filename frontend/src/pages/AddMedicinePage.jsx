import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import {
  Camera, Pill, Plus, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, X, Stethoscope, ShoppingBag, Leaf, Info, ScanLine,
  FileImage, TriangleAlert, Edit3, ShieldCheck, Zap, ExternalLink,
  Activity, AlertOctagon,
} from 'lucide-react';
import { getUserIdFromToken } from '../lib/jwt';
import Card from '../components/Card';
import { notify } from '../utils/toast';

// ─── Medicine type options ────────────────────────────────────────────────────
const MEDICINE_TYPES = [
  {
    value: 'PRESCRIPTION',
    label: 'Prescription (Rx)',
    shortLabel: 'Prescription',
    description: 'Doctor-prescribed medicines',
    icon: <Stethoscope className="w-5 h-5" />,
    toggleIcon: <Stethoscope className="w-4 h-4" />,
    accent: 'text-[#1B4B66] bg-[#1B4B66]/10 border-[#1B4B66]/20',
    activeAccent: 'border-[#1B4B66] bg-[#1B4B66]/10 ring-2 ring-[#1B4B66]/30',
    // Pill toggle — active pill style
    toggleActive: 'bg-white text-[#1B4B66] shadow-sm ring-1 ring-[#1B4B66]/30',
  },
  {
    value: 'OTC',
    label: 'Over-The-Counter',
    shortLabel: 'OTC',
    description: 'Pharmacy shelf / non-prescription',
    icon: <ShoppingBag className="w-5 h-5" />,
    toggleIcon: <ShoppingBag className="w-4 h-4" />,
    accent: 'text-[#8A6D3B] bg-[#8A6D3B]/10 border-[#8A6D3B]/20',
    activeAccent: 'border-[#8A6D3B] bg-[#8A6D3B]/10 ring-2 ring-[#8A6D3B]/30',
    toggleActive: 'bg-white text-[#8A6D3B] shadow-sm ring-1 ring-[#8A6D3B]/30',
  },
  {
    value: 'HERBAL',
    label: 'Herbal / Ayurvedic',
    shortLabel: 'Herbal',
    description: 'Supplements, herbs, tonics — checked against our herb-drug interaction database',
    icon: <Leaf className="w-5 h-5" />,
    toggleIcon: <Leaf className="w-4 h-4" />,
    accent: 'text-[#2B6E5E] bg-[#2B6E5E]/10 border-[#2B6E5E]/20',
    activeAccent: 'border-[#2B6E5E] bg-[#2B6E5E]/10 ring-2 ring-[#2B6E5E]/30',
    toggleActive: 'bg-white text-[#2B6E5E] shadow-sm ring-1 ring-[#2B6E5E]/30',
  },
];

const SEVERITY_COLOR = {
  Major:           { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', icon: <AlertOctagon className="w-5 h-5 text-rose-500" /> },
  Contraindicated: { bg: 'bg-red-50',  border: 'border-red-400',  text: 'text-red-900',  badge: 'bg-red-100 text-red-800',  icon: <AlertOctagon className="w-5 h-5 text-red-600" /> },
  Moderate:        { bg: 'bg-[#FBEED9]', border: 'border-[#B5791A]/50', text: 'text-[#7A4A0A]', badge: 'bg-[#FBEED9] text-[#7A4A0A]', icon: <TriangleAlert className="w-5 h-5 text-[#B5791A]" /> },
  Minor:           { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', icon: <Info className="w-5 h-5 text-yellow-500" /> },
  Unknown:         { bg: 'bg-gray-50',  border: 'border-gray-300',  text: 'text-gray-700',  badge: 'bg-gray-100 text-gray-600', icon: <Info className="w-5 h-5 text-gray-400" /> },
};

// ─── API helpers ──────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('polysafe_token'); }

async function scanPrescription(imageFile) {
  const form = new FormData();
  form.append('image', imageFile);
  const resp = await axios.post('/medicine/scan', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${getToken()}`,
    },
    timeout: 20_000,
  });
  return resp.data;
}

async function addMedicine({ name, type, dosage }) {
  const resp = await axios.post(
    '/medicine',
    { name, type, dosage },
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  return resp.data;
}

// ─── Pulsing dot animation component ─────────────────────────────────────────
function PulsingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#2B6E5E]"
          style={{
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

// ─── Interaction Check Result Panel ──────────────────────────────────────────
function InteractionResult({ result, medicineName }) {
  if (!result) return null;

  if (result.summary === 'check-error') {
    return (
      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-gray-600">Interaction check unavailable</p>
          <p className="text-xs text-gray-500 mt-0.5">{result.message}</p>
        </div>
      </div>
    );
  }

  if (result.summary === 'no-prior-medicines') {
    return (
      <div className="p-4 bg-[#E4F2E9] border-2 border-[#2F8558]/30 rounded-2xl flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 text-[#2F8558] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[#1A5C3A]">First medicine added!</p>
          <p className="text-xs text-[#2A6945] mt-0.5">
            Add more medicines — PolySafe will check each pair for interactions automatically.
          </p>
        </div>
      </div>
    );
  }

  if (result.summary === 'all-clear') {
    return (
      <div className="p-4 bg-[#E4F2E9] border-2 border-[#2F8558]/30 rounded-2xl flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-[#2F8558] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[#1A5C3A]">No known interactions found ✓</p>
          <p className="text-xs text-[#2A6945] mt-0.5">
            Checked <strong>{medicineName}</strong> against {result.checkedCount} medicine{result.checkedCount !== 1 ? 's' : ''} — 
            no DDInter matches. Always verify with your doctor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Cumulative Burden Index Banner ─────────────────────────────────── */}
      {result.cumulativeBurden && (
        <div className={`p-4 rounded-2xl border-2 ${
          result.cumulativeBurden.level === 'Critical' ? 'bg-rose-50 border-rose-300 text-rose-900' :
          result.cumulativeBurden.level === 'Moderate' ? 'bg-[#FBEED9] border-[#B5791A]/50 text-[#7A4A0A]' :
          'bg-[#E4F2E9] border-[#2F8558]/30 text-[#1A5C3A]'
        } space-y-1.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Anticholinergic / Sedative Burden
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              result.cumulativeBurden.level === 'Critical' ? 'bg-rose-200 text-rose-900 font-extrabold' :
              result.cumulativeBurden.level === 'Moderate' ? 'bg-amber-200 text-amber-900 font-extrabold' :
              'bg-emerald-200 text-emerald-900 font-extrabold'
            }`}>
              Score: {result.cumulativeBurden.totalScore} · {result.cumulativeBurden.level}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            {result.cumulativeBurden.explanation}
          </p>
        </div>
      )}

      {/* Flags list */}
      {result.flagsFound?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <p className="text-sm font-bold text-[#232724]">
              {result.flagsFound.length} interaction{result.flagsFound.length !== 1 ? 's' : ''} detected
            </p>
          </div>

          {result.flagsFound.map((flag, i) => {
            const colors = SEVERITY_COLOR[flag.severity] ?? SEVERITY_COLOR.Unknown;
            return (
              <div
                key={flag.flagId ?? i}
                className={`p-4 rounded-2xl border-2 ${colors.bg} ${colors.border} space-y-2.5`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {colors.icon}
                    <div>
                      <p className={`text-sm font-bold ${colors.text}`}>
                        {flag.drugA} + {flag.drugB}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                        {flag.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plain explanation */}
                <p className={`text-xs leading-relaxed ${colors.text} opacity-90`}>
                  {flag.plainExplanation}
                </p>

                {/* View Risk Details CTA */}
                {flag.flagId && (
                  <Link
                    to={`/risk/${flag.flagId}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-[#2B6E5E] hover:bg-[#1F5245] px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Risk Details</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddMedicinePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('PRESCRIPTION');
  const [dosage, setDosage] = useState('');

  // OCR / scan state
  const [scanState, setScanState] = useState('idle'); // 'idle'|'scanning'|'confirm'|'error'
  const [scanError, setScanError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Interaction check state
  const [checkState, setCheckState] = useState('idle'); // 'idle'|'checking'|'done'
  const [checkResult, setCheckResult] = useState(null);
  const [savedMedicineName, setSavedMedicineName] = useState('');

  // Submit error
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // ─── Socket.io setup ────────────────────────────────────────────────────────
  const setupSocket = useCallback((userId) => {
    // Don't create duplicate connections
    if (socketRef.current?.connected) return;

    const socketUrl = import.meta.env.VITE_API_URL || (
      window.location.origin.includes(':3000') || window.location.origin.includes(':5173')
        ? 'http://localhost:5000'
        : window.location.origin
    );

    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
      socket.emit('join-patient-room', userId);
    });

    socket.on('interaction-checked', (data) => {
      console.log('[socket] interaction-checked:', data);
      setCheckState('done');
      setCheckResult(data);
    });

    socket.on('disconnect', () => console.log('[socket] disconnected'));
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
      // Graceful degradation — don't block the user
      setCheckState('done');
      setCheckResult({
        summary: 'check-error',
        message: 'Could not connect to real-time check service. Please refresh the page.',
      });
    });

    socketRef.current = socket;
  }, []);

  // Connect socket on mount, cleanup on unmount
  useEffect(() => {
    const userId = getUserIdFromToken();
    if (userId) setupSocket(userId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [setupSocket]);

  // ─── Scan mutation ──────────────────────────────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: scanPrescription,
    onMutate: () => { setScanState('scanning'); setScanError(null); setScanResult(null); },
    onSuccess: (data) => {
      setScanResult(data);
      setScanState('confirm');
      if (data.candidate) setName(data.candidate);
      notify.info('Text Extracted', 'Please verify or edit the medicine name below.');
    },
    onError: (err) => {
      const msg = err.response?.data?.error
        || (err.code === 'ECONNABORTED' ? 'Scan timed out — please try again or type manually.' : null)
        || err.message
        || 'OCR scan failed. Please enter the medicine name manually.';
      setScanError(msg);
      setScanState('error');
      notify.warning('OCR Scan Notice', msg);
    },
  });

  // ─── Add Medicine mutation ──────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: addMedicine,
    onSuccess: (data) => {
      setSubmitError(null);
      setSubmitSuccess(data);
      const medName = data.medicine?.name ?? name;
      setSavedMedicineName(medName);
      notify.success('Medicine Added Successfully', `"${medName}" has been saved to your medication list.`);

      // Start the interaction check listening state
      if (data.checkingInteractions) {
        setCheckState('checking');
        setCheckResult(null);

        // Fallback: if no socket event arrives within 20s, show timeout message
        setTimeout(() => {
          setCheckState((prev) => {
            if (prev === 'checking') {
              setCheckResult({
                summary: 'check-error',
                message: 'Interaction check timed out. Please check your risk summary manually.',
              });
              notify.info('Analysis Pending', 'Interaction check is taking longer than usual. You can review your dashboard.');
              return 'done';
            }
            return prev;
          });
        }, 20_000);
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Failed to add medicine.';
      setSubmitError(msg);
      notify.error('Could Not Add Medicine', msg);
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('idle'); setScanError(null);
    scanMutation.mutate(file);
    e.target.value = '';
  };

  const handleDismissScan = () => {
    setScanState('idle'); setScanResult(null); setScanError(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!name.trim()) { setSubmitError('Please enter or confirm the medicine name.'); return; }
    addMutation.mutate({ name: name.trim(), type, dosage: dosage.trim() || undefined });
  };

  const handleAddAnother = () => {
    setSubmitSuccess(null); setName(''); setDosage('');
    setScanState('idle'); setCheckState('idle'); setCheckResult(null);
    setSavedMedicineName('');
  };

  // ─── Post-submit: show interaction check panel then success ─────────────────
  if (submitSuccess) {
    const med = submitSuccess.medicine;
    const rxn = submitSuccess.rxNorm;

    return (
      <div className="min-h-[80vh] bg-[#FBF8F2] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-5">

          {/* Medicine saved card */}
          <div className="polysafe-card p-7 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E4F2E9] border-2 border-[#2F8558] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#2F8558]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#232724]">{med.name} Added</h2>
              <p className="text-sm text-[#6B726C] mt-1">Saved to your medication list.</p>
            </div>

            {/* RxNorm status */}
            <div className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs text-left ${
              rxn?.found
                ? 'bg-[#E4F2E9] border-[#2F8558]/30 text-[#1A5C3A]'
                : 'bg-[#FBEED9] border-[#B5791A]/30 text-[#7A4A0A]'
            }`}>
              {rxn?.found ? <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="font-bold">{rxn?.found ? `RxNorm Standardized — CUI ${rxn.rxcui}` : 'Not in RxNorm database'}</p>
                <p className="mt-0.5 opacity-80">{rxn?.note}</p>
              </div>
            </div>
          </div>

          {/* ── Interaction check panel ─────────────────────────────────────── */}
          <div className="polysafe-card p-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${
                checkState === 'checking' ? 'bg-[#2B6E5E]/10 text-[#2B6E5E]' :
                checkResult?.summary === 'flags-found' ? 'bg-rose-100 text-rose-600' :
                'bg-[#E4F2E9] text-[#2F8558]'
              }`}>
                {checkState === 'checking' ? <Activity className="w-4 h-4 animate-pulse" /> :
                 checkResult?.summary === 'flags-found' ? <AlertOctagon className="w-4 h-4" /> :
                 <ShieldCheck className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#232724]">
                  {checkState === 'checking' ? 'Interaction Check' : 'Interaction Results'}
                </h3>
                {checkState === 'checking' && (
                  <p className="text-[11px] text-[#6B726C]">Checking against your DDInter-indexed medicines…</p>
                )}
              </div>
            </div>

            {/* Pulsing loading state */}
            {checkState === 'checking' && (
              <div className="flex items-center space-x-3 py-4 px-2">
                <PulsingDots />
                <p className="text-sm text-[#2B6E5E] font-semibold">
                  Checking against your current medicines…
                </p>
              </div>
            )}

            {/* Result */}
            {checkState === 'done' && checkResult && (
              <InteractionResult result={checkResult} medicineName={savedMedicineName} />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button onClick={handleAddAnother} className="btn-primary py-3.5">
              <Plus className="w-4 h-4" /><span>Add Another Medicine</span>
            </button>
            <button onClick={() => navigate('/home')} className="btn-secondary py-3">
              <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[88vh] bg-[#FBF8F2] pb-12">
      {/* Pulsing dot CSS */}
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2.5 rounded-xl border-2 border-[#E7E1D3] bg-white text-[#6B726C] hover:text-[#2B6E5E] hover:border-[#2B6E5E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#232724]">Add Medicine</h1>
            <p className="text-xs text-[#6B726C]">Prescription, OTC, herbal — all tracked together</p>
          </div>
        </div>

        {/* Herbal notice */}
        <div className="flex items-start space-x-3 p-3.5 bg-[#2B6E5E]/8 border border-[#2B6E5E]/20 rounded-xl text-xs text-[#2B6E5E]">
          <Leaf className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Include all medicines including herbs and supplements.</strong> Turmeric, Ashwagandha, and other
            Ayurvedic products interact with common drugs — one of the most common polypharmacy blindspots.
          </p>
        </div>

        {/* Global form error */}
        {submitError && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{submitError}</p>
          </div>
        )}

        {/* ── SCAN SECTION ──────────────────────────────────────────────────── */}
        <Card
          title="Scan Prescription Photo"
          subtitle="PolySafe reads the label — you confirm before anything is saved"
          icon={<ScanLine className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {scanState === 'idle' && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-[#E7E1D3] bg-[#FDFBF7] hover:border-[#2B6E5E] hover:bg-[#F4FAF8] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-sm transition-all duration-180 ease-out cursor-pointer group"
            >
              <div className="p-3.5 rounded-full bg-[#2B6E5E]/10 text-[#2B6E5E] group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#232724]">Scan prescription photo</p>
                <p className="text-[11px] text-[#6B726C] mt-0.5">Tap to open camera or choose from gallery</p>
              </div>
            </button>
          )}

          {scanState === 'scanning' && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-[#2B6E5E]/30 bg-[#F4FAF8]">
              {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-36 object-contain rounded-xl opacity-60" />}
              <Loader2 className="w-8 h-8 text-[#2B6E5E] animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-[#2B6E5E]">Reading prescription...</p>
                <p className="text-[11px] text-[#6B726C]">Extracting medicine details</p>
              </div>
            </div>
          )}

          {scanState === 'error' && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 bg-[#FBEED9] border-2 border-[#B5791A]/40 rounded-2xl">
                <TriangleAlert className="w-5 h-5 text-[#B5791A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#7A4A0A]">Scan unsuccessful</p>
                  <p className="text-xs text-[#8A5210] mt-0.5">{scanError}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1 py-2.5 text-sm">
                  <Camera className="w-4 h-4" /><span>Try Again</span>
                </button>
                <button type="button" onClick={handleDismissScan} className="btn-secondary flex-1 py-2.5 text-sm">
                  Type Manually
                </button>
              </div>
            </div>
          )}

          {scanState === 'confirm' && scanResult && (
            <div className="space-y-3">
              {previewUrl && <img src={previewUrl} alt="Prescription" className="w-full max-h-40 object-contain rounded-xl border border-[#E7E1D3]" />}
              <div className="p-3 bg-[#FDFBF7] border border-[#E7E1D3] rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#6B726C] uppercase tracking-wider">OCR extracted text</p>
                  <span className="text-[10px] text-[#2B6E5E] font-bold">Confidence: high</span>
                </div>
                <p className="text-xs text-[#232724] font-mono bg-white p-2 rounded-lg border border-[#E7E1D3] whitespace-pre-wrap">
                  {scanResult.rawText || scanResult.candidate}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleDismissScan} className="btn-secondary flex-1 py-2 text-xs">
                  Re-scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (scanResult.candidate) setName(scanResult.candidate);
                    setScanState('idle');
                  }}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Confirm & Use Pre-filled
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ── FORM SECTION ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card
            title="Medicine Details"
            subtitle={
              scanState === 'confirm' && scanResult?.candidate
                ? 'Pre-filled from scan — verify before saving'
                : 'Enter all details before saving'
            }
            icon={<Pill className="w-4 h-4 text-[#2B6E5E]" />}
            className="space-y-5"
          >
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                Medicine Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Pill className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder="e.g. Warfarin, Ashwagandha, Metformin"
                  className={`input-field pl-10 ${submitError && !name.trim() ? 'border-rose-300 bg-rose-50' : ''} ${scanState === 'confirm' && scanResult?.candidate ? 'border-[#2B6E5E] bg-[#F4FAF8]' : ''}`}
                />
                {scanState === 'confirm' && scanResult?.candidate && (
                  <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#2B6E5E] bg-[#2B6E5E]/10 px-2 py-1 rounded-md">
                    From scan ✓
                  </div>
                )}
              </div>
            </div>

            {/* Type — 3-way pill toggle ─────────────────────────────────── */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                Medicine Type <span className="text-rose-500">*</span>
              </label>

              {/* Segmented pill bar */}
              <div className="flex items-center p-1 gap-1 bg-[#EDE9DF] rounded-2xl">
                {MEDICINE_TYPES.map((t) => {
                  const isActive = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      id={`type-toggle-${t.value.toLowerCase()}`}
                      onClick={() => setType(t.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? t.toggleActive
                          : 'text-[#6B726C] hover:text-[#232724] hover:bg-white/50'
                      }`}
                    >
                      <span className="flex-shrink-0">{t.toggleIcon}</span>
                      <span className="hidden sm:inline">{t.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected type description */}
              <p className="text-[11px] text-[#6B726C] px-1">
                {MEDICINE_TYPES.find((t) => t.value === type)?.description}
              </p>
            </div>

            {/* Dosage */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                Dosage <span className="normal-case font-normal text-[#6B726C]">— optional</span>
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 5mg, 10ml, 500mg"
                className="input-field"
              />
            </div>
          </Card>

          {/* Submit */}
          <button
            type="submit"
            disabled={addMutation.isPending || !name.trim()}
            className="btn-primary w-full py-4 text-base"
          >
            {addMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Checking RxNorm & saving...</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span>Add to My Medicine List</span><ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {addMutation.isPending && (
            <p className="text-center text-[11px] text-[#6B726C]">
              Standardizing with RxNorm · checking for duplicates · saving…
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
