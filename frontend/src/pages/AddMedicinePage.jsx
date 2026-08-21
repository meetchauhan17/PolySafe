import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import {
  Camera, Pill, Plus, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, X, Stethoscope, ShoppingBag, Leaf, Info, ScanLine,
  FileImage, TriangleAlert, AlertTriangle, Edit3, ShieldCheck, ExternalLink,
  Activity, AlertOctagon, Search, HelpCircle, Clock, User, CalendarDays,
  Sun, Sunset, Moon, Coffee, QrCode, FlaskConical, Layers, SwitchCamera,
  CheckSquare, Square, RefreshCw, Maximize2, Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { DrugHarmBadge } from '../components/DrugHarmLevel';
import PolySafeInput from '../components/PolySafeInput';
import PolySafeSelect from '../components/PolySafeSelect';

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
    toggleActive: 'bg-[#EDE8DC] text-[#1B4B66] shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] ring-1 ring-[#1B4B66]/30',
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
    toggleActive: 'bg-[#EDE8DC] text-[#8A6D3B] shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] ring-1 ring-[#8A6D3B]/30',
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
    toggleActive: 'bg-[#EDE8DC] text-[#2B6E5E] shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] ring-1 ring-[#2B6E5E]/30',
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
async function scanPrescription(payload) {
  const form = new FormData();
  if (payload instanceof File) {
    form.append('image', payload);
  } else if (payload?.image) {
    form.append('image', payload.image);
    if (payload.backImage) {
      form.append('backImage', payload.backImage);
    }
  }
  const resp = await axios.post('/medicine/scan', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 25_000,
  });
  return resp.data;
}

async function addMedicine({ name, type, dosage }) {
  const resp = await axios.post('/medicine', { name, type, dosage });
  return resp.data;
}

async function batchAddMedicines(medicines) {
  const resp = await axios.post('/medicine/batch', { medicines });
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

// ─── Live Camera Viewfinder Modal Component ───────────────────────────────────
function LiveCameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      return;
    }

    let activeStream = null;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setCameraError('Could not access camera. Please allow camera permissions or upload an image file.');
      });

    return () => {
      if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, facingMode]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-scan.jpg', { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#EDE8DC] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[rgba(191,180,155,0.4)] flex flex-col animate-fadeIn">
        <div className="p-4 flex items-center justify-between border-b border-[rgba(191,180,155,0.3)]">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#2B6E5E]" />
            <h3 className="font-bold text-sm text-[#1C2B27]">Live Prescription & Medicine Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-[#5C6B64] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-video sm:aspect-4/3 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-300 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p>{cameraError}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Target Alignment Viewfinder */}
              <div className="absolute inset-6 sm:inset-10 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_20px_rgba(46,213,115,0.35)]">
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-t-3 border-l-3 border-emerald-400" />
                  <span className="w-5 h-5 border-t-3 border-r-3 border-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="inline-block text-[11px] font-semibold text-emerald-100 bg-black/60 backdrop-blur-xs py-1 px-3.5 rounded-full border border-emerald-500/30">
                    Align medicine strip or prescription in frame
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="w-5 h-5 border-b-3 border-l-3 border-emerald-400" />
                  <span className="w-5 h-5 border-b-3 border-r-3 border-emerald-400" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 flex items-center justify-between gap-3 bg-[#E6E0D3]">
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-3 rounded-2xl bg-[#EDE8DC] text-[#5C6B64] hover:text-[#1C2B27] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] cursor-pointer"
            title="Switch Camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSnap}
            disabled={!!cameraError}
            className="flex-1 py-3.5 bg-[#2B6E5E] text-white font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            <span>Capture & Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Barcode & DataMatrix Lookup Modal ───────────────────────────────────────
function BarcodeModal({ isOpen, onClose, onSelect }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/medicine/barcode/${encodeURIComponent(barcode.trim())}`);
      if (data.found) {
        onSelect(data);
        onClose();
        notify.success('Medicine Found from Barcode', `Loaded ${data.drug_name}`);
      } else {
        setError(data.message || 'No direct match found for this barcode.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#EDE8DC] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[rgba(191,180,155,0.4)] animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-[#2B6E5E]" />
            <h3 className="font-bold text-base text-[#1C2B27]">Box Barcode & DataMatrix Lookup</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#5C6B64] hover:text-[#1C2B27] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#5C6B64]">
          Enter or paste the barcode / GTIN / NDC number from the medicine carton for instant zero-token recognition:
        </p>

        <form onSubmit={handleLookup} className="space-y-3">
          <PolySafeInput
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. 8901234567890 or 0071-0155-23"
            autoFocus
          />

          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-xs cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !barcode.trim()}
              className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Lookup Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Multi-Medicine Batch Review Component ──────────────────────────────────
function MultiMedBatchReviewCard({ scanResult, onBatchAdd, onDismiss }) {
  const medications = scanResult.medications || [];
  const [selectedMeds, setSelectedMeds] = useState(
    medications.map((_, idx) => idx)
  );
  const [addingBatch, setAddingBatch] = useState(false);

  const toggleSelect = (idx) => {
    setSelectedMeds((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleAddAll = async () => {
    const medsToAdd = selectedMeds.map((idx) => medications[idx]);
    if (medsToAdd.length === 0) {
      notify.warn('No Medicines Selected', 'Please select at least 1 medicine to add.');
      return;
    }
    setAddingBatch(true);
    try {
      await onBatchAdd(medsToAdd);
    } finally {
      setAddingBatch(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl border-2 border-[#2B6E5E]/40 bg-[#F4FAF8] space-y-4 shadow-md animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B6E5E]/15 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[#2B6E5E] text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1C2B27]">
              Prescription Multi-Medicine Detected ({medications.length} Drugs)
            </h3>
            <p className="text-xs text-[#5C6B64]">
              {scanResult.prescriber ? `Prescribed by Dr. ${scanResult.prescriber}` : 'Review and select medicines to add'}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E4F2E9] text-[#1A5C3A] border border-[#2F8558]/30">
          Batch Ready ✓
        </span>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {medications.map((med, idx) => {
          const isSelected = selectedMeds.includes(idx);
          const salts = Array.isArray(med.composition) && med.composition.length > 0
            ? med.composition
            : (med.genericSalts || []);

          return (
            <div
              key={idx}
              onClick={() => toggleSelect(idx)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'bg-[#EDE8DC] border-[#2B6E5E] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)]'
                  : 'bg-[#EDE8DC]/50 border-[rgba(191,180,155,0.3)] opacity-60'
              }`}
            >
              <div className="mt-0.5">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-[#2B6E5E]" />
                ) : (
                  <Square className="w-5 h-5 text-[#5C6B64]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h4 className="font-bold text-sm text-[#1C2B27] truncate">
                    {med.drug_name || med.name}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#2B6E5E]/10 text-[#2B6E5E]">
                    {med.strength || 'Standard dose'}
                  </span>
                </div>

                {med.generic_name && (
                  <p className="text-xs text-[#5C6B64] truncate">
                    {med.generic_name}
                  </p>
                )}

                {salts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {salts.map((s, sIdx) => (
                      <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/70 border border-[#2B6E5E]/20 text-[#2B6E5E]">
                        <FlaskConical className="w-2.5 h-2.5" />
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#5C6B64]">
                  {med.frequency && (
                    <span className="px-2 py-0.5 rounded-md bg-black/5">
                      {med.frequency === 'twice' ? '2x daily' : med.frequency === 'thrice' ? '3x daily' : 'Once daily'}
                    </span>
                  )}
                  {med.foodInstruction && (
                    <span className="px-2 py-0.5 rounded-md bg-black/5">
                      {med.foodInstruction === 'after_food' ? 'After food' : 'Before food'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-bold text-[#5C6B64] hover:text-[#1C2B27] hover:underline cursor-pointer"
        >
          Cancel & Edit Manually
        </button>

        <button
          type="button"
          onClick={handleAddAll}
          disabled={addingBatch || selectedMeds.length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-[#2B6E5E] text-white text-sm font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {addingBatch ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Medicines...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Selected ({selectedMeds.length}) to My Regimen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Scan Results Review Card Component ──────────────────────────────────────
function ScanResultsReviewCard({ scanResult, onDismiss, onBatchAdd }) {
  if (!scanResult) return null;

  // If multi-medication prescription detected with >1 drugs, render the batch card!
  if (Array.isArray(scanResult.medications) && scanResult.medications.length > 1) {
    return <MultiMedBatchReviewCard scanResult={scanResult} onBatchAdd={onBatchAdd} onDismiss={onDismiss} />;
  }

  const confidence = (scanResult.confidence || 'high').toLowerCase();
  const rxNormVerified = !!(scanResult.rxNormVerified ?? scanResult.verified);
  const source = scanResult.source || scanResult.engine || 'gemini';

  const engineLabel =
    source === 'gemini_vision' || source === 'gemini' ? `Multimodal Gemini Vision (${scanResult.modelUsed || 'Fast Parallel'})` :
    source === 'ocr_gemini_hybrid' ? 'Smart Hybrid OCR + Gemini Text (~150 tokens)' :
    source === 'tesseract' ? 'Extracted via Local Tesseract OCR' :
    'Extracted via Vision AI';

  const drugName = scanResult.drug_name || scanResult.candidate || scanResult.generic_name;
  const strength = scanResult.strength || scanResult.suggestedDosage;
  const prescriber = scanResult.prescriber || scanResult.prescriberName;
  const frequency = scanResult.frequency || scanResult.commonFrequency;
  const duration = scanResult.duration;
  const salts = Array.isArray(scanResult.composition) && scanResult.composition.length > 0
    ? scanResult.composition
    : (scanResult.genericSalts || []);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#2B6E5E]/30 bg-[#F4FAF8] space-y-3.5 shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B6E5E]/15 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#2B6E5E]/15 text-[#2B6E5E]">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C2B27]">Scan Results</h3>
            <span className="text-[11px] text-[#5C6B64] font-medium">{engineLabel}</span>
          </div>
        </div>

        {/* Confidence & RxNorm badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {confidence === 'high' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              High confidence ✓
            </span>
          ) : confidence === 'low' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Low confidence — please verify
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              <Info className="w-3 h-3 text-amber-700" />
              Medium confidence
            </span>
          )}

          {rxNormVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E4F2E9] text-[#1A5C3A] border border-[#2F8558]/30">
              <ShieldCheck className="w-3 h-3 text-[#2F8558]" />
              Verified drug name
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBEED9] text-[#7A4A0A] border border-[#B5791A]/30">
              <TriangleAlert className="w-3 h-3 text-[#B5791A]" />
              Standardized with AI
            </span>
          )}
        </div>
      </div>

      {/* Prominent warning if confidence is low */}
      {confidence === 'low' && (
        <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Double-check these details:</strong> Image clarity was low. Please verify all pre-filled fields below before saving.
          </p>
        </div>
      )}

      {/* Extracted Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-xl border border-[rgba(191,180,155,0.3)] space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B726C]">Identified Medicine</span>
          <p className="font-bold text-[#1C2B27] text-sm truncate">{drugName || '—'}</p>
          {scanResult.generic_name && scanResult.generic_name !== drugName && (
            <p className="text-[11px] text-[#5C6B64] truncate">Generic: {scanResult.generic_name}</p>
          )}
        </div>

        <div className="p-2.5 bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-xl border border-[rgba(191,180,155,0.3)] space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B726C]">Strength & Form</span>
          <p className="font-bold text-[#1C2B27] text-sm truncate">
            {strength || '—'} {scanResult.form ? `(${scanResult.form})` : ''}
          </p>
          {scanResult.category && (
            <p className="text-[11px] text-[#5C6B64] truncate">{scanResult.category}</p>
          )}
        </div>
      </div>

      {/* ── Active Constituent Chemical Salts Decomposition Badges ── */}
      {salts.length > 0 && (
        <div className="p-3 bg-[#E6E0D3]/80 rounded-xl border border-[rgba(191,180,155,0.4)] space-y-1.5 shadow-[inset_1px_1px_3px_rgba(191,180,155,0.3)]">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#2B6E5E]">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Active Chemical Salts Breakdown:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {salts.map((salt, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#EDE8DC] border border-[rgba(191,180,155,0.6)] text-[#1C2B27] shadow-xs"
              >
                <Pill className="w-3 h-3 text-[#2B6E5E]" />
                {salt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prescriber line if extracted */}
      {prescriber && (
        <div className="flex items-center gap-2 p-2.5 bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-xl border border-[rgba(191,180,155,0.3)] text-xs">
          <span className="font-bold text-[#2B6E5E]">Prescriber:</span>
          <span className="text-[#1C2B27] font-semibold">{prescriber.startsWith('Dr.') ? prescriber : `Dr. ${prescriber}`}</span>
        </div>
      )}

      {/* Non-editable frequency and duration prescription context */}
      {(frequency || duration) && (
        <div className="p-3 bg-[#EDE8DC]/70 rounded-xl border border-[#E7E1D3] space-y-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#232724]">
            {frequency && (
              <span><strong>Frequency:</strong> {frequency}</span>
            )}
            {duration && (
              <span><strong>Duration:</strong> {duration}</span>
            )}
          </div>
          <p className="text-[10px] text-[#6B726C] italic">
            From your prescription — auto-filled in form below.
          </p>
        </div>
      )}

      {/* Dismissal footer */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[11px] text-[#5C6B64]">Pre-filled in form below · fully editable</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-bold text-[#6B726C] hover:text-[#232724] hover:underline cursor-pointer"
        >
          Clear scan results
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddMedicinePage() {
  const navigate = useNavigate();
  const { user, isGuest, requireAuth } = useAuth();
  const fileInputRef = useRef(null);

  // Form inputs
  const [name, setName] = useState('');
  const [type, setType] = useState('PRESCRIPTION');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [timings, setTimings] = useState([]);
  const [prescriber, setPrescriber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDrugInfo, setSelectedDrugInfo] = useState(null); // { name, generic, rxcui, dosage, source }

  // Scan state: 'idle' | 'scanning' | 'confirm' | 'error'
  const [scanState, setScanState] = useState('idle');
  const [scanResult, setScanResult] = useState(null); // { candidate, rawText, confidence }
  const [scanError, setScanError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Advanced Multi-Feature Scan States
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [scanMode, setScanMode] = useState('single'); // 'single' | 'two_sided'
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const backFileInputRef = useRef(null);

  // Live interaction check state
  const [checkState, setCheckState] = useState('idle'); // 'idle' | 'checking' | 'done'
  const [checkResult, setCheckResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [savedMedicineName, setSavedMedicineName] = useState('');
  const [duplicateConflict, setDuplicateConflict] = useState(null);

  // ─── Drug Autocomplete state ────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);
  const nameInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          nameInputRef.current && !nameInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await axios.get(`/medicine/search?q=${encodeURIComponent(query)}`);
      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
      setSelectedIdx(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleNameChange = useCallback((value) => {
    setName(value);
    if (submitError) setSubmitError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }, [fetchSuggestions, submitError]);

  const handleSelectSuggestion = useCallback((sug) => {
    setName(sug.name);
    if (sug.dosage) setDosage(sug.dosage);
    if (sug.commonFrequency) setFrequency(sug.commonFrequency);
    if (sug.foodInstruction) setNotes(sug.foodInstruction);

    // Auto-fill time of day chips
    if (sug.extractedTimings?.length > 0) {
      setTimings(sug.extractedTimings);
    } else if (sug.commonFrequency === 'twice') {
      setTimings(['morning', 'evening']);
    } else if (sug.commonFrequency === 'thrice') {
      setTimings(['morning', 'afternoon', 'evening']);
    } else if (sug.commonFrequency === 'four') {
      setTimings(['morning', 'afternoon', 'evening', 'bedtime']);
    } else if (sug.commonFrequency === 'once') {
      setTimings(['morning']);
    }

    if (sug.source === 'herbal' || sug.name.toLowerCase().includes('turmeric') || sug.name.toLowerCase().includes('ashwagandha') || sug.name.toLowerCase().includes('ginkgo')) {
      setType('HERBAL');
    } else {
      setType('PRESCRIPTION');
    }

    setSelectedDrugInfo(sug);
    setShowSuggestions(false);
    setSuggestions([]);
    notify.success('Drug Details Auto-Filled', `Auto-filled details for "${sug.name}"${sug.dosage ? ` (${sug.dosage})` : ''}`);
  }, []);

  const handleNameKeyDown = useCallback((e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, selectedIdx, handleSelectSuggestion]);

  // ─── Loose Pill Imprint Lookup state ─────────────────────────────────────────
  const pillFileInputRef = useRef(null);
  const [pillModeOpen, setPillModeOpen] = useState(false);
  const [pillImprintCode, setPillImprintCode] = useState('');
  const [pillState, setPillState] = useState('idle'); // 'idle' | 'searching' | 'results' | 'error'
  const [pillMatches, setPillMatches] = useState([]);
  const [pillError, setPillError] = useState(null);

  const searchPillMutation = useMutation({
    mutationFn: async ({ file, imprintCode }) => {
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await axios.post('/medicine/identify-pill', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
      } else {
        const { data } = await axios.post('/medicine/identify-pill', { imprintCode });
        return data;
      }
    },
    onMutate: () => {
      setPillState('searching');
      setPillError(null);
    },
    onSuccess: (data) => {
      setPillState('results');
      setPillMatches(data?.possibleMatches || []);
      if (data?.count === 0) {
        notify.info('No Exact Imprint Match', 'Try re-verifying the code or selecting from formulary search.');
      } else {
        notify.success('Matches Found', `Found ${data.count} candidate medication(s) matching imprint.`);
      }
    },
    onError: (err) => {
      setPillState('error');
      setPillError(err?.response?.data?.error || 'Pill lookup failed.');
      notify.error('Pill Lookup Failed', err?.response?.data?.error || 'Could not identify pill.');
    },
  });

  const handlePillManualSearch = (e) => {
    e.preventDefault();
    if (!pillImprintCode.trim()) return;
    setPillState('searching');
    setPillError(null);
    searchPillMutation.mutate({ imprintCode: pillImprintCode.trim() });
  };

  const handleSelectPillMatch = (match) => {
    setName(match.drugName);
    if (match.strength) setDosage(match.strength);
    setType('PRESCRIPTION');
    setPillModeOpen(false);
    setPillState('idle');
    notify.success('Pill Details Loaded', `Pre-filled "${match.drugName}". Review all fields before saving.`);
  };

  const handleDismissPillLookup = () => {
    setPillState('idle');
    setPillMatches([]);
    setPillImprintCode('');
    setPillError(null);
  };

  const socketRef = useRef(null);

  // ─── Setup Socket.IO listener ───────────────────────────────────────────────
  const setupSocket = useCallback((currentUserId) => {
    if (socketRef.current) socketRef.current.disconnect();

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      socket.emit('join-patient-room', { userId: currentUserId, patientId: currentUserId });
    });

    const handleResult = (data) => {
      setCheckResult(data);
      setCheckState('done');
    };

    socket.on('interaction-checked', handleResult);
    socket.on('interaction-check-result', handleResult);

    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
      // Graceful degradation — don't block the user
      setCheckState('done');
      setCheckResult({
        summary: 'check-error',
        message: 'Real-time notification delayed. You can view full interaction summary on your Dashboard.',
      });
    });

    socketRef.current = socket;
  }, []);

  // Connect socket on mount, cleanup on unmount
  useEffect(() => {
    const userId = user?.userId || user?.id;
    if (userId) setupSocket(userId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, setupSocket]);

  // ─── Scan mutation ──────────────────────────────────────────────────────────
  const scanMutation = useMutation({
    mutationFn: scanPrescription,
    onMutate: () => { setScanState('scanning'); setScanError(null); setScanResult(null); },
    onSuccess: (data) => {
      setScanResult(data);
      setScanState('confirm');

      const extractedName = data.drug_name || data.candidate || data.generic_name;
      if (extractedName) {
        // 1. Medicine Name <- drug_name (or generic_name if no brand name)
        setName(extractedName);

        // 2. Dosage <- strength (e.g. "500mg")
        const dosageVal = data.strength || data.suggestedDosage;
        if (dosageVal) {
          setDosage(dosageVal);
        }

        // 3. Medicine Type <- form: map tablet/capsule -> PRESCRIPTION default, syrup/cream let user pick
        const formStr = (data.form || '').toLowerCase();
        if (formStr.includes('tablet') || formStr.includes('capsule') || formStr.includes('pill')) {
          setType('PRESCRIPTION');
        } else if (data.suggestedType) {
          setType(data.suggestedType);
        }

        // 4. Frequency schedule mapping
        const freqStr = (data.frequency || data.commonFrequency || '').toLowerCase();
        if (freqStr.includes('twice') || freqStr.includes('bid')) {
          setFrequency('twice');
          setTimings(['morning', 'evening']);
        } else if (freqStr.includes('thrice') || freqStr.includes('tid')) {
          setFrequency('thrice');
          setTimings(['morning', 'afternoon', 'evening']);
        } else if (freqStr.includes('once') || freqStr.includes('od') || freqStr.includes('daily')) {
          setFrequency('once');
          setTimings(['morning']);
        }

        // 5. Prescriber
        const prescriberVal = data.prescriber || data.prescriberName;
        if (prescriberVal) {
          setPrescriber(prescriberVal);
        }

        // 6. Food instruction
        if (data.foodInstruction) {
          setNotes(data.foodInstruction);
        }

        // Populate drug verification card
        setSelectedDrugInfo({
          name: extractedName,
          generic: data.generic_name || data.genericName || extractedName,
          rxcui: data.rxcui || data.standardizedCode,
          dosage: dosageVal,
          category: data.category || (type === 'HERBAL' ? 'Ayurvedic / Herbal' : 'Prescription Drug'),
          safetyTip: data.safetyTip || 'Verify dosage and administration instructions with your physician.',
          dosageOptions: data.dosageOptions || [],
          source: data.source || (data.rxcui ? 'rxnorm' : 'gemini'),
        });

        notify.success('Prescription Scanned & Auto-Filled', `Auto-filled "${extractedName}". Review details below before saving.`);
      } else if (data.fallbackCandidates?.length > 0) {
        if (data.strength || data.suggestedDosage) setDosage(data.strength || data.suggestedDosage);
        if (data.frequency || data.commonFrequency) setFrequency(data.frequency || data.commonFrequency);
        if (data.foodInstruction) setNotes(data.foodInstruction);
        if (data.prescriber || data.prescriberName) setPrescriber(data.prescriber || data.prescriberName);
        notify.info('Review Suggestions', 'Could not verify exact drug name with RxNorm. Choose from suggestions or type manually.');
      } else {
        notify.info('Text Extracted', 'Please verify or enter the medicine name below.');
      }
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
      if (err.response?.status === 409) {
        const existing = err.response.data?.existingMedicine;
        setDuplicateConflict({
          name: existing?.name || name,
          existingDosage: existing?.dosage || 'Current dose',
          newDosage: dosage || 'New dose',
          id: existing?.id,
        });
        setSubmitError(`"${existing?.name || name}" is already in your active medication list.`);
        notify.warning('Already in List', `"${existing?.name || name}" is already in your medication list.`);
        return;
      }
      const msg = err.response?.data?.error || err.message || 'Failed to add medicine.';
      setSubmitError(msg);
      notify.error('Could Not Add Medicine', msg);
    },
  });

  const handleConfirmUpdateDosage = async () => {
    try {
      setSubmitError(null);
      const resp = await axios.post('/medicine', {
        name,
        type,
        dosage,
        forceUpdate: true,
      });
      setDuplicateConflict(null);
      setSubmitSuccess(resp.data);
      const medName = resp.data.medicine?.name ?? name;
      setSavedMedicineName(medName);
      notify.success('Dosage Updated', `Updated dosage for "${medName}".`);
      if (resp.data.checkingInteractions) {
        setCheckState('checking');
        setCheckResult(null);
      }
    } catch (e) {
      notify.error('Update Failed', e.response?.data?.error || e.message);
    }
  };

  // ─── Batch Add Medicines mutation ──────────────────────────────────────────
  const batchAddMutation = useMutation({
    mutationFn: batchAddMedicines,
    onSuccess: (data) => {
      notify.success('Prescription Batch Added', `Successfully added ${data.addedCount} medicines to your regimen.`);
      navigate('/home');
    },
    onError: (err) => {
      notify.error('Batch Add Failed', err.response?.data?.error || err.message);
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isGuest) {
      requireAuth('scan and extract prescription labels');
      e.target.value = '';
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setScanState('idle'); setScanError(null);
    scanMutation.mutate(file);
    e.target.value = '';
  };

  const handleFrontSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontFile(file);
    setFrontPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleBackSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackFile(file);
    setBackPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleTwoSidedAnalyze = () => {
    if (!frontFile && !backFile) {
      notify.warn('No Photos Selected', 'Please upload or snap at least one side of the packaging.');
      return;
    }
    setScanState('idle');
    setScanError(null);
    scanMutation.mutate({
      image: frontFile || backFile,
      backImage: backFile && frontFile ? backFile : undefined,
    });
  };

  const handleLiveCameraCapture = (file) => {
    if (scanMode === 'two_sided') {
      if (!frontFile) {
        setFrontFile(file);
        setFrontPreview(URL.createObjectURL(file));
        notify.info('Front Side Captured', 'Now snap or select the back side (composition table).');
      } else {
        setBackFile(file);
        setBackPreview(URL.createObjectURL(file));
        notify.info('Back Side Captured', 'Both sides ready — click Analyze to scan.');
      }
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState('idle');
      setScanError(null);
      scanMutation.mutate(file);
    }
  };

  const handleBarcodeSelect = (drugData) => {
    const medName = drugData.drug_name;
    setName(medName);
    if (drugData.strength) setDosage(drugData.strength);
    if (drugData.foodInstruction) setNotes(drugData.foodInstruction);
    setSelectedDrugInfo({
      name: medName,
      generic: drugData.generic_name || medName,
      rxcui: drugData.rxcui,
      dosage: drugData.strength,
      category: drugData.category || 'Prescription Drug',
      safetyTip: drugData.safetyTip,
      source: drugData.source || 'local_registry',
    });
    notify.success('Barcode Recognized', `Auto-filled details for "${medName}".`);
  };

  const handleDismissScan = () => {
    setScanState('idle'); setScanResult(null); setScanError(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    if (frontPreview) { URL.revokeObjectURL(frontPreview); setFrontPreview(null); setFrontFile(null); }
    if (backPreview) { URL.revokeObjectURL(backPreview); setBackPreview(null); setBackFile(null); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGuest) {
      requireAuth('add medications to your profile');
      return;
    }
    setSubmitError(null);
    if (!name.trim()) { setSubmitError('Please enter or confirm the medicine name.'); return; }

    // Build rich, formatted dosage summary for clinical record
    let formattedDosage = dosage.trim();
    const scheduleParts = [];

    if (frequency) {
      const freqMap = {
        once: 'Once daily',
        twice: 'Twice daily',
        thrice: '3x daily',
        four: '4x daily',
        weekly: 'Weekly',
        asneeded: 'As needed (PRN)',
        alternate: 'Alternate days',
      };
      const freqLabel = freqMap[frequency] || frequency;
      if (timings.length > 0) {
        const timingLabels = timings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
        scheduleParts.push(`${freqLabel} (${timingLabels})`);
      } else {
        scheduleParts.push(freqLabel);
      }
    }

    if (notes) {
      const noteMap = {
        before_food: 'Before food',
        after_food: 'After food',
        with_food: 'With food',
        empty_stomach: 'Empty stomach',
        with_water: 'With water',
        avoid_dairy: 'Avoid dairy',
      };
      scheduleParts.push(noteMap[notes] || notes);
    }

    if (prescriber.trim()) {
      scheduleParts.push(`Rx: ${prescriber.trim()}`);
    }

    if (scheduleParts.length > 0) {
      formattedDosage = formattedDosage
        ? `${formattedDosage} • ${scheduleParts.join(' • ')}`
        : scheduleParts.join(' • ');
    }

    addMutation.mutate({ name: name.trim(), type, dosage: formattedDosage || undefined });
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
      <div className="min-h-[80vh] bg-[#EDE8DC] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-5">

          {/* Medicine saved card */}
          <div className="polysafe-card p-7 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E4F2E9] border-2 border-[#2F8558] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-[#2F8558]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
                {med.name} Added
              </h2>
              <p className="text-sm text-[#5C6B64] mt-1">Saved to your medication list.</p>
            </div>

            {/* RxNorm status */}
            <div className={`flex items-start space-x-3 p-3.5 rounded-2xl border text-xs text-left ${
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
                <h3 className="text-sm font-bold text-[#1C2B27]">
                  {checkState === 'checking' ? 'Interaction Check' : 'Interaction Results'}
                </h3>
                {checkState === 'checking' && (
                  <p className="text-[11px] text-[#5C6B64]">Checking against your DDInter-indexed medicines…</p>
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
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => {
                navigate('/home', { state: { newMedicineId: med?.id } });
              }}
              className="btn-primary py-3.5"
            >
              <span>View Safety Status on Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={handleAddAnother} className="btn-secondary py-3">
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
    <div className="min-h-[88vh] bg-[#EDE8DC] pb-12">
      {/* Pulsing dot CSS */}
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2.5 rounded-xl border border-[rgba(191,180,155,0.5)] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#5C6B64] hover:text-[#2B6E5E] transition-colors"
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

        {/* ── SCAN SECTION (Multi-Feature: Live Viewfinder, Two-Sided, Barcode, Prescription Batch) ── */}
        <Card
          title="Scan Medicine or Prescription"
          subtitle="Extract medications, chemical salts, and dosages with Multimodal AI"
          icon={<ScanLine className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-4"
        >
          {/* Mode Switcher: Single Photo vs Two-Sided Scan */}
          <div className="flex p-1 bg-[#EDE8DC] rounded-xl border border-[rgba(191,180,155,0.4)] shadow-[inset_1px_1px_3px_rgba(191,180,155,0.3)]">
            <button
              type="button"
              onClick={() => setScanMode('single')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                scanMode === 'single'
                  ? 'bg-[#2B6E5E] text-white shadow-xs'
                  : 'text-[#5C6B64] hover:text-[#1C2B27]'
              }`}
            >
              Single Photo / Prescription
            </button>
            <button
              type="button"
              onClick={() => setScanMode('two_sided')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scanMode === 'two_sided'
                  ? 'bg-[#2B6E5E] text-white shadow-xs'
                  : 'text-[#5C6B64] hover:text-[#1C2B27]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Two-Sided (Front & Back)</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            className="hidden"
            onChange={scanMode === 'two_sided' ? handleFrontSelect : handleFileSelect}
          />
          <input
            ref={backFileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            className="hidden"
            onChange={handleBackSelect}
          />

          {scanState === 'idle' && (
            <div className="space-y-3">
              {scanMode === 'single' ? (
                /* ── Single Photo Quick Launch Actions ── */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Action 1: Live Camera */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuest) { requireAuth('use the live camera scanner'); return; }
                      setIsLiveCameraOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-[rgba(191,180,155,0.4)] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] hover:border-[#2B6E5E] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="p-3 rounded-xl bg-[#2B6E5E]/10 text-[#2B6E5E] group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C2B27]">Live Camera</p>
                      <p className="text-[10px] text-[#5C6B64]">Viewfinder & alignment</p>
                    </div>
                  </button>

                  {/* Action 2: Upload Photo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl border border-[rgba(191,180,155,0.4)] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] hover:border-[#2B6E5E] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="p-3 rounded-xl bg-[#2B6E5E]/10 text-[#2B6E5E] group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C2B27]">Upload Photo</p>
                      <p className="text-[10px] text-[#5C6B64]">Label, box, or slip</p>
                    </div>
                  </button>

                  {/* Action 3: Box Barcode */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuest) { requireAuth('scan barcodes'); return; }
                      setIsBarcodeModalOpen(true);
                    }}
                    className="p-4 rounded-2xl border border-[rgba(191,180,155,0.4)] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] hover:border-[#2B6E5E] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
                  >
                    <div className="p-3 rounded-xl bg-[#2B6E5E]/10 text-[#2B6E5E] group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C2B27]">Scan Barcode</p>
                      <p className="text-[10px] text-[#5C6B64]">Instant box code</p>
                    </div>
                  </button>
                </div>
              ) : (
                /* ── Two-Sided Scan (Front & Back) Cards ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Side */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-[rgba(191,180,155,0.5)] bg-[#FDFBF7] hover:border-[#2B6E5E] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px]"
                    >
                      {frontPreview ? (
                        <div className="relative w-full">
                          <img src={frontPreview} alt="Front" className="w-full max-h-28 object-contain rounded-lg" />
                          <span className="absolute top-1 right-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4F2E9] text-[#2B6E5E]">
                            Front Selected ✓
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-full bg-[#2B6E5E]/10 text-[#2B6E5E]">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-[#1C2B27]">1. Front Side (Brand Name)</p>
                            <p className="text-[10px] text-[#5C6B64]">Tap to select front photo</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Back Side */}
                    <div
                      onClick={() => backFileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-[rgba(191,180,155,0.5)] bg-[#FDFBF7] hover:border-[#2B6E5E] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px]"
                    >
                      {backPreview ? (
                        <div className="relative w-full">
                          <img src={backPreview} alt="Back" className="w-full max-h-28 object-contain rounded-lg" />
                          <span className="absolute top-1 right-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4F2E9] text-[#2B6E5E]">
                            Back Selected ✓
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2.5 rounded-full bg-[#2B6E5E]/10 text-[#2B6E5E]">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-[#1C2B27]">2. Back Side (Salts Table)</p>
                            <p className="text-[10px] text-[#5C6B64]">Tap to select back photo</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {(frontFile || backFile) && (
                    <button
                      type="button"
                      onClick={handleTwoSidedAnalyze}
                      className="w-full py-3 bg-[#2B6E5E] text-white font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Front & Back (Multimodal AI)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Sample Quick Try */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">
                <div className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4 text-[#2B6E5E]" />
                  <span className="text-xs font-bold text-[#1C2B27]">Try Verified Clinical Sample</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setScanState('scanning');
                      setScanError(null);
                      setPreviewUrl('/sample-prescriptions/naxdom-sample.jpg');
                      const res = await fetch('/sample-prescriptions/naxdom-sample.jpg');
                      const blob = await res.blob();
                      const file = new File([blob], 'naxdom-sample.jpg', { type: 'image/jpeg' });
                      scanMutation.mutate(file);
                    } catch {
                      setScanError('Failed to load sample image.');
                      setScanState('error');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-[#2B6E5E] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] hover:shadow-[3px_3px_6px_rgba(191,180,155,0.6)] rounded-xl transition-all cursor-pointer"
                >
                  ⚡ Sample (Naxdom 500)
                </button>
              </div>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-[#2B6E5E]/30 bg-[#F4FAF8]">
              {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-36 object-contain rounded-xl opacity-60" />}
              <Loader2 className="w-8 h-8 text-[#2B6E5E] animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-[#2B6E5E]">Multimodal Vision AI in Progress...</p>
                <p className="text-[11px] text-[#6B726C]">Decomposing chemical salts, dosage, and prescriber</p>
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
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1 py-2.5 text-sm cursor-pointer">
                  <Camera className="w-4 h-4" /><span>Try Again</span>
                </button>
                <button type="button" onClick={handleDismissScan} className="btn-secondary flex-1 py-2.5 text-sm cursor-pointer">
                  Type Manually
                </button>
              </div>
            </div>
          )}

          {scanState === 'confirm' && scanResult && (
            <div className="space-y-3">
              {previewUrl && (
                <div className="relative">
                  <img src={previewUrl} alt="Prescription" className="w-full max-h-44 object-contain rounded-xl border border-[rgba(191,180,155,0.4)] bg-[#EDE8DC] p-1 shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4)]" />
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4F2E9] text-[#2B6E5E] border border-[#2F8558]/30 shadow-xs">
                    <Camera className="w-3 h-3" /> From scan
                  </span>
                </div>
              )}

              {/* ── SCAN RESULTS REVIEW CARD (Single & Batch) ── */}
              <ScanResultsReviewCard
                scanResult={scanResult}
                onDismiss={handleDismissScan}
                onBatchAdd={(meds) => batchAddMutation.mutate(meds)}
              />

              {/* Fallback candidate chips if no single match */}
              {scanResult.fallbackCandidates?.length > 0 && !scanResult.drug_name && !scanResult.candidate && (
                <div className="p-3 bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5C6B64]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#E0824B]" />
                    <span>Couldn't confidently identify — did you mean:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.fallbackCandidates.map((cand, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setName(cand);
                          if (scanResult.suggestedDosage && !dosage) setDosage(scanResult.suggestedDosage);
                          notify.success('Medicine Selected', `Selected "${cand}".`);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-[#1C2B27] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] hover:text-[#2B6E5E] active:shadow-[inset_1px_1px_2px_rgba(191,180,155,0.5)] rounded-lg transition-all cursor-pointer"
                      >
                        {cand}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleDismissScan} className="btn-secondary flex-1 py-2 text-xs font-semibold cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Another</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    notify.info('Editing Pre-filled Details', 'Review and edit any fields below before saving.');
                    nameInputRef.current?.focus();
                  }}
                  className="btn-primary flex-1 py-2 text-xs font-semibold cursor-pointer"
                >
                  <span>Edit Details Below</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* ── LOOSE PILL IMPRINT LOOKUP SECTION (PROMPT 30) ─────────────────── */}
        <Card
          title="Identify a Loose Pill"
          subtitle="Look up stamped imprint codes on unlabeled tablets"
          icon={<Search className="w-4 h-4 text-[#E0824B]" />}
          badge={
            <button
              type="button"
              onClick={() => setPillModeOpen((prev) => !prev)}
              className="text-xs font-bold text-[#2B6E5E] hover:underline cursor-pointer"
            >
              {pillModeOpen ? 'Hide Tool' : 'Open Tool'}
            </button>
          }
          className="space-y-4"
        >
          {/* Prominent Mandatory Safety Caveat */}
          <div className="flex items-start space-x-3 p-3.5 bg-[#FBEED9] border border-[#B5791A]/30 rounded-xl text-xs text-[#7A4A0A]">
            <TriangleAlert className="w-4 h-4 text-[#B5791A] flex-shrink-0 mt-0.5" />
            <p>
              <strong>Important Safety Notice:</strong> This is a limited reference lookup, not a medical identification. If you're not certain, do not take this pill — check with a pharmacist.
            </p>
          </div>

          {pillModeOpen && (
            <div className="space-y-4 pt-1">
              <input
                ref={pillFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
                capture="environment"
                className="hidden"
                onChange={handlePillFileSelect}
              />

              {/* Option A: Search by Imprint Code string */}
              <form onSubmit={handlePillManualSearch} className="space-y-2">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Stamped Imprint Code
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <PolySafeInput
                      type="text"
                      value={pillImprintCode}
                      onChange={(e) => setPillImprintCode(e.target.value)}
                      placeholder="e.g. L484, IP 109, M367, 54 543"
                      leftIcon={<Search className="w-4 h-4" />}
                      className="text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchPillMutation.isPending || !pillImprintCode.trim()}
                    className="btn-primary px-4 py-2.5 text-xs font-bold"
                  >
                    {searchPillMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Code'}
                  </button>
                </div>
              </form>

              {/* Option B: Scan Pill Photo */}
              <div className="text-center">
                <span className="text-[11px] font-bold text-[#6B726C] uppercase tracking-wider bg-[#FBF8F2] px-2 py-0.5">
                  or scan pill imprint
                </span>
              </div>

              <button
                type="button"
                onClick={() => pillFileInputRef.current?.click()}
                disabled={searchPillMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E7E1D3] bg-[#FDFBF7] hover:bg-[#F4FAF8] hover:border-[#2B6E5E] text-xs font-bold text-[#232724] transition-colors"
              >
                <Camera className="w-4 h-4 text-[#2B6E5E]" />
                <span>Upload or Snap Pill Photo</span>
              </button>

              {/* Pill Searching State */}
              {pillState === 'searching' && (
                <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-[#F4FAF8] border border-[#2B6E5E]/20 text-xs font-bold text-[#2B6E5E]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching reference imprint records...</span>
                </div>
              )}

              {/* Pill Error State */}
              {pillState === 'error' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                  <p>{pillError}</p>
                  <button
                    type="button"
                    onClick={handleDismissPillLookup}
                    className="underline font-bold text-xs"
                  >
                    Clear & Try Again
                  </button>
                </div>
              )}

              {/* Pill Results State (ALWAYS plural possible matches) */}
              {pillState === 'results' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#232724]">
                      Possible Reference Matches ({pillMatches.length})
                    </p>
                    <button
                      type="button"
                      onClick={handleDismissPillLookup}
                      className="text-xs text-[#6B726C] hover:underline cursor-pointer"
                    >
                      Clear Results
                    </button>
                  </div>

                  {pillMatches.length === 0 ? (
                    <div className="p-4 bg-[#FDFBF7] border border-[#E7E1D3] rounded-xl text-center space-y-2">
                      <HelpCircle className="w-6 h-6 text-[#8A6D3B] mx-auto" />
                      <p className="text-xs font-bold text-[#232724]">No matches found in reference dataset</p>
                      <p className="text-[11px] text-[#6B726C] leading-relaxed">
                        Our reference database contains 25+ common formulations. If you cannot identify this pill, please take it to a pharmacy for professional confirmation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pillMatches.map((match) => (
                        <div
                          key={match.id}
                          className="p-3.5 rounded-xl bg-[#EDE8DC] shadow-[3px_3px_6px_rgba(191,180,155,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] border border-[rgba(191,180,155,0.3)] hover:border-[#2B6E5E] space-y-2.5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E4F2E9] text-[#2B6E5E] font-mono">
                                Imprint: {match.imprintCode}
                              </span>
                              <h4 className="text-sm font-bold text-[#232724] mt-1">
                                {match.drugName}
                              </h4>
                            </div>
                            {match.strength && (
                              <span className="text-xs font-bold text-[#1B4B66] bg-[#1B4B66]/10 px-2.5 py-1 rounded-lg">
                                {match.strength}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#6B726C]">
                            {match.shape && <span>Shape: <strong>{match.shape}</strong></span>}
                            {match.color && <span>Color: <strong>{match.color}</strong></span>}
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-[#E7E1D3]">
                            <button
                              type="button"
                              onClick={() => handleSelectPillMatch(match)}
                              className="btn-primary flex-1 py-1.5 text-xs font-bold"
                            >
                              Select & Fill Form
                            </button>
                            <button
                              type="button"
                              onClick={handleDismissPillLookup}
                              className="btn-secondary py-1.5 px-3 text-xs cursor-pointer"
                              title="Skip this match"
                            >
                              Not Sure
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-[#FDFBF7] border border-[#E7E1D3] rounded-xl text-center">
                    <p className="text-[11px] text-[#6B726C]">
                      Selecting a pill pre-fills the form below for your final verification — PolySafe will <strong>never auto-save</strong> without your explicit confirmation.
                    </p>
                  </div>
                </div>
              )}
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
            {/* Fallback candidate suggestions chip banner */}
            {scanState === 'confirm' && scanResult?.fallbackCandidates?.length > 0 && !scanResult?.candidate && (
              <div className="p-3.5 bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] rounded-2xl space-y-2 border border-[#E7E1D3]/50">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#5C6B64]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#E0824B]" />
                  <span>Couldn't confidently identify — did you mean:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scanResult.fallbackCandidates.map((cand, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setName(cand);
                        if (scanResult.suggestedDosage) setDosage(scanResult.suggestedDosage);
                        if (scanResult.suggestedType) setType(scanResult.suggestedType);
                        if (scanResult.commonFrequency) setFrequency(scanResult.commonFrequency);
                        if (scanResult.foodInstruction) setNotes(scanResult.foodInstruction);
                        if (scanResult.extractedTimings?.length > 0) setTimings(scanResult.extractedTimings);
                        if (scanResult.prescriber) setPrescriber(scanResult.prescriber);
                        notify.info('Pre-filled', `Selected "${cand}".`);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1C2B27] bg-[#EDE8DC] shadow-[3px_3px_6px_rgba(191,180,155,0.5),-3px_-3px_6px_rgba(255,255,255,0.6)] hover:text-[#2B6E5E] active:shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{cand}</span>
                      <Plus className="w-3 h-3 text-[#2B6E5E]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name with Autocomplete */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Medicine Name <span className="text-rose-500">*</span>
                </label>
                {name.trim().length > 1 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <span className="text-[10px] text-[#5C6B64] font-semibold">Pre-Add Harm Tier:</span>
                    <DrugHarmBadge category={selectedDrugInfo?.category || ''} name={name.trim()} size="sm" />
                  </div>
                )}
              </div>
              <div className="relative">
                <Pill className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5 z-10" />
                {searchLoading && (
                  <Loader2 className="w-4 h-4 text-[#2B6E5E] absolute right-3.5 top-3.5 animate-spin z-10" />
                )}
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Start typing — e.g. Warfarin, Ashwagandha, Dolo 650"
                  className={`input-field pl-10 pr-10 ${submitError && !name.trim() ? 'border-rose-300 bg-rose-50' : ''} ${scanState === 'confirm' && (scanResult?.candidate || name) ? 'border-[#2B6E5E] bg-[#F4FAF8]' : ''}`}
                />
                {scanState === 'confirm' && (scanResult?.drug_name || scanResult?.candidate || name) && (
                  <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] border border-[#2F8558]/30 px-2 py-0.5 rounded-md z-10 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-[#2B6E5E]" />
                    <span>From scan</span>
                  </div>
                )}

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#F0EBE0] border border-[#DCD5C6] rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto"
                  >
                    {suggestions.map((sug, idx) => {
                      const isSelected = idx === selectedIdx;
                      const sourceColor = sug.source === 'rxnorm' ? 'bg-[#E4F2E9] text-[#2B6E5E]'
                        : sug.source === 'herbal' ? 'bg-[#2B6E5E]/10 text-[#2B6E5E]'
                        : sug.source === 'ddinter' ? 'bg-[#FBEED9] text-[#7A4A0A]'
                        : 'bg-gray-100 text-gray-600';
                      const sourceLabel = sug.source === 'rxnorm' ? '✓ RxNorm'
                        : sug.source === 'herbal' ? '🌿 Herbal'
                        : sug.source === 'ddinter' ? '📊 DDInter'
                        : sug.source === 'rxnorm-suggest' ? '💊 RxNorm'
                        : '—';
                      return (
                        <button
                          key={`${sug.name}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectSuggestion(sug)}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#F4FAF8]' : 'hover:bg-[#FDFBF7]'
                          } ${idx > 0 ? 'border-t border-[#E7E1D3]/50' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[#232724] truncate">{sug.name}</p>
                              {sug.category && (
                                <DrugHarmBadge category={sug.category} name={sug.name} />
                              )}
                            </div>
                            {sug.generic !== sug.name && (
                              <p className="text-[11px] text-[#6B726C] truncate">Generic: {sug.generic}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {sug.dosage && (
                              <span className="text-[10px] font-bold text-[#5C6B64] bg-[#EDE8DC] px-1.5 py-0.5 rounded-md">
                                {sug.dosage}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${sourceColor}`}>
                              {sourceLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="px-4 py-2 bg-[#FDFBF7] border-t border-[#E7E1D3]">
                      <p className="text-[10px] text-[#6B726C] text-center">
                        {searchLoading ? 'Searching drug databases…' : `${suggestions.length} result${suggestions.length !== 1 ? 's' : ''} · type to refine`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {!showSuggestions && name.length === 0 && (
                <p className="text-[10px] text-[#6B726C] px-1">
                  ⚡ Smart search — matches 60+ common drugs, Indian brands, herbs & supplements instantly
                </p>
              )}
            </div>

            {/* Drug Verification Info Card — appears after selecting from autocomplete or OCR */}
            {selectedDrugInfo && name && (
              <div className="p-4 rounded-2xl border-2 border-[#2B6E5E]/25 bg-[#F4FAF8] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2B6E5E]" />
                    <span className="text-xs font-bold text-[#1C2B27]">
                      {selectedDrugInfo.rxcui ? 'RxNorm Verified Medication' : 'Identified Medication'}
                    </span>
                    <DrugHarmBadge category={selectedDrugInfo.category} name={selectedDrugInfo.name} />
                  </div>
                  <button type="button" onClick={() => setSelectedDrugInfo(null)} className="text-[#6B726C] hover:text-[#232724] cursor-pointer p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Pre-Add Warning Banner */}
                <div className="p-2.5 rounded-xl bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] border border-[rgba(191,180,155,0.3)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#B5791A]" />
                    <span className="text-xs font-bold text-[#1C2B27]">Pre-Add Harm Classification:</span>
                  </div>
                  <DrugHarmBadge category={selectedDrugInfo.category} name={selectedDrugInfo.name} size="lg" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="text-xs bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-2.5 rounded-xl border border-[rgba(191,180,155,0.3)]">
                    <span className="text-[10px] uppercase font-bold text-[#6B726C] block">Drug Name</span>
                    <p className="font-bold text-[#232724] mt-0.5 truncate">{selectedDrugInfo.name}</p>
                  </div>
                  {selectedDrugInfo.generic && selectedDrugInfo.generic !== selectedDrugInfo.name && (
                    <div className="text-xs bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-2.5 rounded-xl border border-[rgba(191,180,155,0.3)]">
                      <span className="text-[10px] uppercase font-bold text-[#6B726C] block">Active Generic</span>
                      <p className="font-bold text-[#2B6E5E] mt-0.5 truncate">{selectedDrugInfo.generic}</p>
                    </div>
                  )}
                  {selectedDrugInfo.category && (
                    <div className="text-xs bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-2.5 rounded-xl border border-[rgba(191,180,155,0.3)]">
                      <span className="text-[10px] uppercase font-bold text-[#6B726C] block">Clinical Class</span>
                      <p className="font-bold text-[#1C2B27] mt-0.5 truncate">{selectedDrugInfo.category}</p>
                    </div>
                  )}
                  {selectedDrugInfo.rxcui && (
                    <div className="text-xs bg-[#E6E0D3] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-2.5 rounded-xl border border-[rgba(191,180,155,0.3)]">
                      <span className="text-[10px] uppercase font-bold text-[#6B726C] block">RxNorm CUI</span>
                      <p className="font-bold text-[#2B6E5E] mt-0.5">#{selectedDrugInfo.rxcui}</p>
                    </div>
                  )}
                </div>

                {/* Clinical Safety Tip */}
                {selectedDrugInfo.safetyTip && (
                  <div className="flex items-start gap-2 p-2.5 bg-[#EDE8DC]/80 border border-[#E7E1D3] rounded-xl text-xs text-[#5C6B64]">
                    <Info className="w-4 h-4 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed"><strong className="text-[#1C2B27]">Safety Note:</strong> {selectedDrugInfo.safetyTip}</p>
                  </div>
                )}

                {/* Quick Dosage Presets */}
                {selectedDrugInfo.dosageOptions?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#5C6B64] uppercase tracking-wider block">
                      Quick Strength Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDrugInfo.dosageOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setDosage(opt);
                            notify.info('Dosage Set', `Set dosage to ${opt}`);
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            dosage === opt
                              ? 'bg-[#2B6E5E] text-white shadow-sm'
                              : 'bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#2B6E5E] border border-[#2B6E5E]/30 hover:bg-[#F4FAF8]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Type — 3-way pill toggle ─────────────────────────────────── */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1C2B27] uppercase tracking-wider">
                Medicine Type <span className="text-[#B23D25]">*</span>
              </label>

              {/* Segmented pill bar */}
              <div className="flex items-center p-1.5 gap-1.5 bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-2xl">
                {MEDICINE_TYPES.map((t) => {
                  const isActive = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      id={`type-toggle-${t.value.toLowerCase()}`}
                      onClick={() => setType(t.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E] focus-visible:ring-offset-2 active:shadow-[inset_3px_3px_6px_rgba(191,180,155,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.65)] active:translate-y-px ${
                        isActive
                          ? 'bg-[#EDE8DC] shadow-[3px_3px_6px_rgba(191,180,155,0.55),-3px_-3px_6px_rgba(255,255,255,0.65)] text-[#2B6E5E]'
                          : 'text-[#5C6B64] hover:text-[#1C2B27]'
                      }`}
                    >
                      <span className="flex-shrink-0">{t.toggleIcon}</span>
                      <span>{t.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected type description */}
              <p className="text-[11px] text-[#5C6B64] px-1">
                {MEDICINE_TYPES.find((t) => t.value === type)?.description}
              </p>
            </div>

            {/* Dosage + Frequency side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Dosage / Strength <span className="normal-case font-normal text-[#6B726C]">— optional</span>
                </label>
                <PolySafeInput
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg, 10ml"
                  leftIcon={<Pill className="w-4 h-4" />}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Frequency Schedule
                </label>
                <PolySafeSelect
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  leftIcon={<Clock className="w-4 h-4" />}
                  className="text-sm"
                >
                  <option value="once">Once daily</option>
                  <option value="twice">Twice daily</option>
                  <option value="thrice">3 times daily</option>
                  <option value="four">4 times daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="asneeded">As needed (PRN)</option>
                  <option value="alternate">Alternate days</option>
                </PolySafeSelect>
              </div>
            </div>

            {/* Time of Day chips */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                Time of Day <span className="normal-case font-normal text-[#6B726C]">— select dosage times</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'morning', label: 'Morning', icon: <Sun className="w-3.5 h-3.5" />, time: '8:00 AM' },
                  { id: 'afternoon', label: 'Afternoon', icon: <Coffee className="w-3.5 h-3.5" />, time: '1:00 PM' },
                  { id: 'evening', label: 'Evening', icon: <Sunset className="w-3.5 h-3.5" />, time: '6:00 PM' },
                  { id: 'bedtime', label: 'Bedtime', icon: <Moon className="w-3.5 h-3.5" />, time: '10:00 PM' },
                ].map((slot) => {
                  const isActive = timings.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setTimings(prev =>
                          prev.includes(slot.id)
                            ? prev.filter(t => t !== slot.id)
                            : [...prev, slot.id]
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E] focus-visible:ring-offset-2 active:shadow-[inset_3px_3px_6px_rgba(191,180,155,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.65)] active:translate-y-px ${
                        isActive
                          ? 'bg-[#EDE8DC] shadow-[3px_3px_6px_rgba(191,180,155,0.55),-3px_-3px_6px_rgba(255,255,255,0.65)] text-[#2B6E5E] border-[#2B6E5E]/40'
                          : 'bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] text-[#6B726C] border-transparent'
                      }`}
                    >
                      {slot.icon}
                      <span>{slot.label}</span>
                      <span className="text-[10px] font-normal opacity-60">({slot.time})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prescriber + Instructions side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Prescribed By <span className="normal-case font-normal text-[#6B726C]">— optional</span>
                </label>
                <PolySafeInput
                  type="text"
                  value={prescriber}
                  onChange={(e) => setPrescriber(e.target.value)}
                  placeholder="Doctor name or Self"
                  leftIcon={<User className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Meal Instructions <span className="normal-case font-normal text-[#6B726C]">— optional</span>
                </label>
                <PolySafeSelect
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  leftIcon={<CalendarDays className="w-4 h-4" />}
                >
                  <option value="">No special instructions</option>
                  <option value="before_food">Take before food</option>
                  <option value="after_food">Take after food</option>
                  <option value="with_food">Take with food</option>
                  <option value="empty_stomach">Take on empty stomach</option>
                  <option value="with_water">Take with plenty of water</option>
                  <option value="avoid_dairy">Avoid dairy products</option>
                </PolySafeSelect>
              </div>
            </div>
          </Card>

          {/* Duplicate Conflict Resolver Banner */}
          {duplicateConflict && (
            <div className="p-4 rounded-2xl bg-[#FBEED9] border-2 border-[#B5791A]/50 space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 text-[#B5791A] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#7A4A0A]">
                    "{duplicateConflict.name}" is already in your active medicines
                  </p>
                  <p className="text-xs text-[#8A5210] leading-relaxed">
                    Current dose: <strong>{duplicateConflict.existingDosage}</strong>
                    {dosage && dosage !== duplicateConflict.existingDosage && (
                      <span> · Update to: <strong>{dosage}</strong></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmUpdateDosage}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Dosage to "{dosage || duplicateConflict.newDosage}"</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateConflict(null)}
                  className="btn-secondary py-2.5 px-4 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={addMutation.isPending || !name.trim()}
            className="btn-primary w-full py-4 text-base shadow-[4px_4px_8px_rgba(191,180,155,0.6),-4px_-4px_8px_rgba(255,255,255,0.7)] hover:shadow-[6px_6px_12px_rgba(191,180,155,0.7),-6px_-6px_12px_rgba(255,255,255,0.8)]"
          >
            {addMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Checking RxNorm & saving...</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span>Add to My Medicine List</span><ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {addMutation.isPending && (
            <p className="text-center text-[11px] text-[#6B726C]">
              Standardizing with RxNorm · checking for duplicates · evaluating DDInter drug safety…
            </p>
          )}
        </form>

        {/* ── Advanced Scanning Modals ── */}
        <LiveCameraModal
          isOpen={isLiveCameraOpen}
          onClose={() => setIsLiveCameraOpen(false)}
          onCapture={handleLiveCameraCapture}
        />

        <BarcodeModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          onSelect={handleBarcodeSelect}
        />
      </div>
    </div>
  );
}
