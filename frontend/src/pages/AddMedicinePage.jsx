import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import {
 Camera, Pill, Plus, ArrowRight, ArrowLeft, Loader2, AlertCircle,
 CheckCircle2, X, Stethoscope, ShoppingBag, Leaf, Info, ScanLine,
 FileImage, TriangleAlert, Edit3, ShieldCheck, ExternalLink,
 Activity, AlertOctagon, Search, HelpCircle, Clock, User, CalendarDays,
 Sun, Sunset, Moon, Coffee, QrCode, FlaskConical, Layers, SwitchCamera,
 CheckSquare, Square, Sparkles, Building2, Calendar,
 Tag, ShieldAlert, Package,
} from 'lucide-react';
import Card from '../components/Card';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { DrugHarmBadge } from '../components/DrugHarmLevel';
import PolySafeInput from '../components/PolySafeInput';
import PolySafeSelect from '../components/PolySafeSelect';
import LedIndicator from '../components/LedIndicator';
import ClinicalLoader from '../components/ClinicalLoader';

// ─── Dosage Form Options ──────────────────────────────────────────────────────
const DOSAGE_FORMS = [
 { value: 'tablet', label: 'Tablet', icon: '' },
 { value: 'capsule', label: 'Capsule', icon: '' },
 { value: 'syrup', label: 'Syrup / Liquid', icon: '' },
 { value: 'injection', label: 'Injection', icon: '' },
 { value: 'cream', label: 'Cream / Gel / Ointment', icon: '' },
 { value: 'drops', label: 'Eye / Ear Drops', icon: '' },
 { value: 'inhaler', label: 'Inhaler / Respules', icon: '' },
];

// ─── Medicine type options ────────────────────────────────────────────────────
const MEDICINE_TYPES = [
 {
 value: 'PRESCRIPTION',
 label: 'Prescription (Rx)',
 shortLabel: 'Prescription',
 description: 'Doctor-prescribed medicines',
 icon: <Stethoscope className="w-5 h-5" />,
 toggleIcon: <Stethoscope className="w-4 h-4" />,
 accent: 'text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 border-[var(--accent-secondary)]/20',
 activeAccent: 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 ring-2 ring-[var(--accent-secondary)]/30',
 // Pill toggle — active pill style
 toggleActive: 'bg-[var(--chassis)] text-[var(--accent-secondary)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--accent-secondary)]/30',
 },
 {
 value: 'OTC',
 label: 'Over-The-Counter',
 shortLabel: 'OTC',
 description: 'Pharmacy shelf / non-prescription',
 icon: <ShoppingBag className="w-5 h-5" />,
 toggleIcon: <ShoppingBag className="w-4 h-4" />,
 accent: 'text-[var(--role-caregiver)] bg-[var(--role-caregiver)]/10 border-[var(--role-caregiver)]/20',
 activeAccent: 'border-[var(--role-caregiver)] bg-[var(--role-caregiver)]/10 ring-2 ring-[var(--role-caregiver)]/30',
 toggleActive: 'bg-[var(--chassis)] text-[var(--role-caregiver)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--role-caregiver)]/30',
 },
 {
 value: 'HERBAL',
 label: 'Herbal / Ayurvedic',
 shortLabel: 'Herbal',
 description: 'Supplements, herbs, tonics — checked against our herb-drug interaction database',
 icon: <Leaf className="w-5 h-5" />,
 toggleIcon: <Leaf className="w-4 h-4" />,
 accent: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20',
 activeAccent: 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30',
 toggleActive: 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--accent-primary)]/30',
 },
];

const SEVERITY_COLOR = {
 Major: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700', icon: <AlertOctagon className="w-5 h-5 text-rose-500" /> },
 Contraindicated: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', badge: 'bg-red-100 text-red-800', icon: <AlertOctagon className="w-5 h-5 text-red-600" /> },
 Moderate: { bg: 'bg-[var(--chassis)]', border: 'border-[var(--led-caution)]/50', text: 'text-[var(--text-primary)]', badge: 'bg-[var(--chassis)] text-[var(--text-primary)]', icon: <TriangleAlert className="w-5 h-5 text-[var(--led-caution)]" /> },
 Minor: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700', icon: <Info className="w-5 h-5 text-yellow-500" /> },
 Unknown: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-600', icon: <Info className="w-5 h-5 text-gray-400" /> },
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
 className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"
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
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl flex items-start space-x-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">First medicine added!</p>
 <p className="text-xs text-[var(--text-muted)] mt-0.5">
 Add more medicines — PolySafe will check each pair for interactions automatically.
 </p>
 </div>
 </div>
 );
 }

 if (result.summary === 'all-clear') {
 return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">No known interactions found </p>
 <p className="text-xs text-[var(--text-muted)] mt-0.5">
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
 result.cumulativeBurden.level === 'Moderate' ? 'bg-[var(--chassis)] border-[var(--led-caution)]/50 text-[var(--text-primary)]' :
          'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--text-primary)]'
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
 <p className="text-sm font-bold text-[var(--text-primary)]">
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
 className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-[var(--accent-primary)] hover:bg-[#1F5245] px-3 py-1.5 rounded-xl transition-colors"
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
 <div className="bg-[var(--chassis)] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.4)] flex flex-col animate-fadeIn">
 <div className="p-4 flex items-center justify-between border-b border-[var(--chassis-dark)]">
 <div className="flex items-center space-x-2">
 <Camera className="w-5 h-5 text-[var(--accent-primary)]" />
 <h3 className="font-bold text-sm text-[var(--text-primary)]">Live Prescription & Medicine Scanner</h3>
 </div>
 <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-[var(--text-muted)] cursor-pointer">
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

 <div className="p-4 flex items-center justify-between gap-3 bg-[var(--chassis-dark)]">
 <button
 type="button"
 onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
 className="p-3 rounded-2xl bg-[var(--chassis)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-card)] cursor-pointer"
 title="Switch Camera"
 >
 <SwitchCamera className="w-5 h-5" />
 </button>

 <button
 type="button"
 onClick={handleSnap}
 disabled={!!cameraError}
 className="flex-1 py-3.5 bg-[var(--accent-primary)] text-white font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
 <div className="bg-[var(--chassis)] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[rgba(255,255,255,0.4)] animate-fadeIn">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <QrCode className="w-5 h-5 text-[var(--accent-primary)]" />
 <h3 className="font-bold text-base text-[var(--text-primary)]">Box Barcode & DataMatrix Lookup</h3>
 </div>
 <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 <p className="text-xs text-[var(--text-muted)]">
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
 <div className="p-4 sm:p-6 rounded-3xl border-2 border-[var(--accent-primary)]/40 bg-[var(--chassis)] space-y-4 shadow-md animate-fadeIn">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--accent-primary)]/15 pb-3">
 <div className="flex items-center space-x-2.5">
 <div className="p-2 rounded-xl bg-[var(--accent-primary)] text-white">
 <Layers className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-bold text-[var(--text-primary)]">
 Prescription Multi-Medicine Detected ({medications.length} Drugs)
 </h3>
 <p className="text-xs text-[var(--text-muted)]">
 {scanResult.prescriber ? `Prescribed by Dr. ${scanResult.prescriber}` : 'Review and select medicines to add'}
 </p>
 </div>
 </div>

        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shadow-xs">
          Batch Ready
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
 ? 'bg-[var(--chassis)] border-[var(--accent-primary)] shadow-[var(--shadow-card)]'
 : 'bg-[var(--chassis)]/50 border-[var(--chassis-dark)] opacity-60'
 }`}
 >
 <div className="mt-0.5">
 {isSelected ? (
 <CheckSquare className="w-5 h-5 text-[var(--accent-primary)]" />
 ) : (
 <Square className="w-5 h-5 text-[var(--text-muted)]" />
 )}
 </div>

 <div className="flex-1 min-w-0 space-y-1.5">
 <div className="flex flex-wrap items-center justify-between gap-1">
 <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
 {med.drug_name || med.name}
 </h4>
 <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
 {med.strength || 'Standard dose'}
 </span>
 </div>

 {med.generic_name && (
 <p className="text-xs text-[var(--text-muted)] truncate">
 {med.generic_name}
 </p>
 )}

 {salts.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-0.5">
 {salts.map((s, sIdx) => (
 <span key={sIdx} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--chassis)] shadow-[var(--shadow-recessed)] border border-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
 <FlaskConical className="w-2.5 h-2.5" />
 {s}
 </span>
 ))}
 </div>
 )}

 <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
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
 className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline cursor-pointer"
 >
 Cancel & Edit Manually
 </button>

 <button
 type="button"
 onClick={handleAddAll}
 disabled={addingBatch || selectedMeds.length === 0}
 className="w-full sm:w-auto px-6 py-3 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
 <div className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--accent-primary)]/30 bg-[var(--chassis)] space-y-3.5 shadow-sm animate-fadeIn">
 {/* Header */}
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--accent-primary)]/15 pb-2.5">
 <div className="flex items-center space-x-2">
 <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
 <ScanLine className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-[var(--text-primary)]">Scan Results</h3>
 <span className="text-[11px] text-[var(--text-muted)] font-medium">{engineLabel}</span>
 </div>
 </div>

 {/* Confidence & RxNorm badges */}
 <div className="flex flex-wrap items-center gap-1.5">
 {confidence === 'high' ? (
 <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
 <CheckCircle2 className="w-3 h-3 text-emerald-600" />
 High confidence 
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Verified drug name
          </span>
        ) : (
 <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--chassis)] text-[var(--text-primary)] border border-[var(--led-caution)]/30">
 <TriangleAlert className="w-3 h-3 text-[var(--led-caution)]" />
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
 <div className="p-2.5 bg-[var(--chassis-dark)] shadow-[var(--shadow-card)] rounded-xl border border-[var(--chassis-dark)] space-y-0.5">
 <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Identified Medicine</span>
 <p className="font-bold text-[var(--text-primary)] text-sm truncate">{drugName || '—'}</p>
 {scanResult.generic_name && scanResult.generic_name !== drugName && (
 <p className="text-[11px] text-[var(--text-muted)] truncate">Generic: {scanResult.generic_name}</p>
 )}
 </div>

 <div className="p-2.5 bg-[var(--chassis-dark)] shadow-[var(--shadow-card)] rounded-xl border border-[var(--chassis-dark)] space-y-0.5">
 <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Strength & Form</span>
 <p className="font-bold text-[var(--text-primary)] text-sm truncate">
 {strength || '—'} {scanResult.form ? `(${scanResult.form})` : ''}
 </p>
 {scanResult.category && (
 <p className="text-[11px] text-[var(--text-muted)] truncate">{scanResult.category}</p>
 )}
 </div>
 </div>

 {/* ── Active Constituent Chemical Salts Decomposition Badges ── */}
 {salts.length > 0 && (
 <div className="p-3 bg-[var(--chassis-dark)]/80 rounded-xl border border-[rgba(255,255,255,0.4)] space-y-1.5 shadow-[var(--shadow-card)]">
 <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[var(--accent-primary)]">
 <FlaskConical className="w-3.5 h-3.5" />
 <span>Active Chemical Salts Breakdown:</span>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {salts.map((salt, sIdx) => (
 <span
 key={sIdx}
 className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--chassis)] border border-[var(--chassis-dark)] text-[var(--text-primary)] shadow-xs"
 >
 <Pill className="w-3 h-3 text-[var(--accent-primary)]" />
 {salt}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Prescriber line if extracted */}
 {prescriber && (
 <div className="flex items-center gap-2 p-2.5 bg-[var(--chassis-dark)] shadow-[var(--shadow-card)] rounded-xl border border-[var(--chassis-dark)] text-xs">
 <span className="font-bold text-[var(--accent-primary)]">Prescriber:</span>
 <span className="text-[var(--text-primary)] font-semibold">{prescriber.startsWith('Dr.') ? prescriber : `Dr. ${prescriber}`}</span>
 </div>
 )}

 {/* Non-editable frequency and duration prescription context */}
 {(frequency || duration) && (
 <div className="p-3 bg-[var(--chassis)]/70 rounded-xl border border-[var(--chassis-dark)] space-y-1">
 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-primary)]">
 {frequency && (
 <span><strong>Frequency:</strong> {frequency}</span>
 )}
 {duration && (
 <span><strong>Duration:</strong> {duration}</span>
 )}
 </div>
 <p className="text-[10px] text-[var(--text-muted)] italic">
 From your prescription — auto-filled in form below.
 </p>
 </div>
 )}

 {/* Dismissal footer */}
 <div className="flex items-center justify-between pt-1 text-xs">
 <span className="text-[11px] text-[var(--text-muted)]">Pre-filled in form below · fully editable</span>
 <button
 type="button"
 onClick={onDismiss}
 className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline cursor-pointer"
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

 // Form inputs (Organized by Medicine Packaging Label & Prescription Details)
 const [name, setName] = useState('');
 const [genericName, setGenericName] = useState('');
 const [compositionSalts, setCompositionSalts] = useState([]);
 const [form, setForm] = useState('tablet');
 const [type, setType] = useState('PRESCRIPTION');
 const [dosage, setDosage] = useState('');
 const [manufacturer, setManufacturer] = useState('');
 const [batchNo, setBatchNo] = useState('');
 const [expiryDate, setExpiryDate] = useState('');
 const [safetyWarning, setSafetyWarning] = useState('');
 const [frequency, setFrequency] = useState('once');
 const [timings, setTimings] = useState([]);
 const [prescriber, setPrescriber] = useState('');
 const [notes, setNotes] = useState('');
 const [isScanFilled, setIsScanFilled] = useState(false);
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
 if (sug.generic) setGenericName(sug.generic);
 if (sug.generic && sug.generic.includes('+')) {
 setCompositionSalts(sug.generic.split('+').map(s => s.trim()).filter(Boolean));
 }
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

  const handlePillFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    searchPillMutation.mutate({ file });
  };

 const handleSelectPillMatch = (match) => {
 setName(match.drugName);
 if (match.strength) setDosage(match.strength);
 if (match.shape) {
 const s = match.shape.toLowerCase();
 if (s.includes('capsule')) setForm('capsule');
 else setForm('tablet');
 }
 setType('PRESCRIPTION');
 setIsScanFilled(true);
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
 setName(extractedName);
 const genName = data.generic_name || data.genericName || '';
 setGenericName(genName);

 if (Array.isArray(data.composition) && data.composition.length > 0) {
 setCompositionSalts(data.composition);
 } else if (Array.isArray(data.genericSalts) && data.genericSalts.length > 0) {
 setCompositionSalts(data.genericSalts);
 } else if (genName && genName.includes('+')) {
 setCompositionSalts(genName.split('+').map(s => s.trim()).filter(Boolean));
 } else {
 setCompositionSalts([]);
 }

 const dosageVal = data.strength || data.suggestedDosage || '';
 setDosage(dosageVal);

 const formStr = (data.form || '').toLowerCase();
 if (formStr.includes('capsule')) setForm('capsule');
 else if (formStr.includes('syrup') || formStr.includes('liquid') || formStr.includes('suspension')) setForm('syrup');
 else if (formStr.includes('injection')) setForm('injection');
 else if (formStr.includes('ointment') || formStr.includes('cream') || formStr.includes('gel')) setForm('cream');
 else if (formStr.includes('drop')) setForm('drops');
 else if (formStr.includes('inhaler') || formStr.includes('respule')) setForm('inhaler');
 else setForm('tablet');

 if (data.suggestedType) {
 setType(data.suggestedType);
 } else if (formStr.includes('tablet') || formStr.includes('capsule')) {
 setType('PRESCRIPTION');
 }

 if (data.manufacturer) setManufacturer(data.manufacturer);
 if (data.batchNo) setBatchNo(data.batchNo);
 if (data.expiryDate) setExpiryDate(data.expiryDate);
 if (data.safetyTip) setSafetyWarning(data.safetyTip);

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

 const prescriberVal = data.prescriber || data.prescriberName;
 if (prescriberVal) setPrescriber(prescriberVal);

 if (data.foodInstruction) setNotes(data.foodInstruction);

 setIsScanFilled(true);

 setSelectedDrugInfo({
 name: extractedName,
 generic: genName || extractedName,
 rxcui: data.rxcui || data.standardizedCode,
 dosage: dosageVal,
 category: data.category || (type === 'HERBAL' ? 'Ayurvedic / Herbal' : 'Prescription Drug'),
 safetyTip: data.safetyTip || 'Verify dosage and administration instructions with your physician.',
 dosageOptions: data.dosageOptions || [],
 source: data.source || (data.rxcui ? 'rxnorm' : 'gemini'),
 });

 notify.success('Prescription Scanned & Auto-Filled', `Auto-filled "${extractedName}" from label. Review details below.`);
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
 if (drugData.generic_name) setGenericName(drugData.generic_name);
 if (drugData.strength) setDosage(drugData.strength);
 if (drugData.form) {
 const f = drugData.form.toLowerCase();
 if (f.includes('capsule')) setForm('capsule');
 else if (f.includes('syrup')) setForm('syrup');
 else if (f.includes('injection')) setForm('injection');
 else setForm('tablet');
 }
 if (drugData.foodInstruction) setNotes(drugData.foodInstruction);
 if (drugData.safetyTip) setSafetyWarning(drugData.safetyTip);
 setIsScanFilled(true);
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
 setIsScanFilled(false);
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
 const scheduleParts = [];

 if (dosage.trim()) scheduleParts.push(dosage.trim());
 if (form) {
 const formLabels = {
 tablet: 'Tablet',
 capsule: 'Capsule',
 syrup: 'Syrup / Liquid',
 injection: 'Injection',
 cream: 'Cream / Gel',
 drops: 'Drops',
 inhaler: 'Inhaler',
 };
 scheduleParts.push(formLabels[form] || form);
 }
 if (genericName.trim() && genericName.trim().toLowerCase() !== name.trim().toLowerCase()) {
 scheduleParts.push(`Salts: ${genericName.trim()}`);
 }

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
 if (manufacturer.trim()) {
 scheduleParts.push(`Mfr: ${manufacturer.trim()}`);
 }
 if (expiryDate.trim()) {
 scheduleParts.push(`Exp: ${expiryDate.trim()}`);
 }

 const formattedDosage = scheduleParts.join(' • ');

 addMutation.mutate({ name: name.trim(), type, dosage: formattedDosage || undefined });
 };

 const handleAddAnother = () => {
 setSubmitSuccess(null); setName(''); setGenericName(''); setCompositionSalts([]);
 setDosage(''); setManufacturer(''); setBatchNo(''); setExpiryDate(''); setSafetyWarning('');
 setScanState('idle'); setCheckState('idle'); setCheckResult(null);
 setSavedMedicineName(''); setIsScanFilled(false);
 };

 // ─── Post-submit: show interaction check panel then success ─────────────────
 if (submitSuccess) {
 const med = submitSuccess.medicine;
 const rxn = submitSuccess.rxNorm;

 return (
 <div className="min-h-[80vh] bg-[var(--chassis)] flex items-center justify-center px-4 py-12">
 <div className="max-w-md w-full space-y-5">

 {/* Medicine saved card */}
 <div className="polysafe-card p-7 space-y-5 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]" >
            {med.name} Added
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Saved to your medication list.</p>
        </div>

        {/* RxNorm status */}
        <div className={`flex items-start space-x-3 p-3.5 rounded-2xl border text-xs text-left ${
          rxn?.found
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--text-primary)]'
            : 'bg-[var(--chassis)] border-[var(--led-caution)]/30 text-[var(--text-primary)]'
        }`}>
          {rxn?.found ? <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" /> : <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--led-caution)]" />}
          <div>
            <p className="font-bold">{rxn?.found ? `RxNorm Standardized — CUI ${rxn.rxcui}` : 'Not in RxNorm database'}</p>
            <p className="mt-0.5 opacity-80">{rxn?.note}</p>
          </div>
        </div>
      </div>

      {/* ── Interaction check panel ─────────────────────────────────────── */}
      <div className="polysafe-card p-5 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl border ${
            checkState === 'checking' ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
            checkResult?.summary === 'flags-found' ? 'bg-rose-500/10 border-rose-500/25 text-rose-600' :
            'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
          }`}>
 {checkState === 'checking' ? <Activity className="w-4 h-4 animate-pulse" /> :
 checkResult?.summary === 'flags-found' ? <AlertOctagon className="w-4 h-4" /> :
 <ShieldCheck className="w-4 h-4" />}
 </div>
 <div className="flex-1">
 <h3 className="text-sm font-bold text-[var(--text-primary)]">
 {checkState === 'checking' ? 'Interaction Check' : 'Interaction Results'}
 </h3>
 {checkState === 'checking' && (
 <p className="text-[11px] text-[var(--text-muted)]">Checking against your DDInter-indexed medicines…</p>
 )}
 </div>
 </div>

 {/* Pulsing loading state */}
 {checkState === 'checking' && (
 <div className="flex items-center space-x-3 py-4 px-2">
 <PulsingDots />
 <p className="text-sm text-[var(--accent-primary)] font-semibold">
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
 <div className="min-h-[88vh] bg-[var(--chassis)] pb-12">
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
 className="p-2.5 rounded-xl border border-[var(--chassis-dark)] bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div>
 <h1 className="text-2xl font-bold text-[var(--text-primary)]">Add Medicine</h1>
 <p className="text-xs text-[var(--text-muted)]">Prescription, OTC, herbal — all tracked together</p>
 </div>
 </div>

 {/* Herbal notice */}
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/20 rounded-xl text-xs text-[var(--accent-primary)]">
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
 icon={<ScanLine className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="space-y-4"
 >
 {/* Mode Switcher: Single Photo vs Two-Sided Scan */}
					<div className="flex items-center gap-1.5 p-1.5 bg-[var(--chassis)] border border-[rgba(255,255,255,0.4)] rounded-2xl shadow-[var(--shadow-recessed)] mb-4">
						<button
							type="button"
							onClick={() => setScanMode('single')}
							className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
								scanMode === 'single'
									? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white font-bold shadow-sm border border-white/20'
									: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/40'
							}`}
						>
							<Camera className="w-3.5 h-3.5" />
							<span>Single Photo / Slip</span>
						</button>
						<button
							type="button"
							onClick={() => setScanMode('two_sided')}
							className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
								scanMode === 'two_sided'
									? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white font-bold shadow-sm border border-white/20'
									: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/40'
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
 className="p-4 rounded-2xl border border-[rgba(255,255,255,0.4)] bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
 >
 <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
 <Camera className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-primary)]">Live Camera</p>
 <p className="text-[10px] text-[var(--text-muted)]">Viewfinder & alignment</p>
 </div>
 </button>

 {/* Action 2: Upload Photo */}
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="p-4 rounded-2xl border border-[rgba(255,255,255,0.4)] bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
 >
 <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
 <FileImage className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-primary)]">Upload Photo</p>
 <p className="text-[10px] text-[var(--text-muted)]">Label, box, or slip</p>
 </div>
 </button>

 {/* Action 3: Box Barcode */}
 <button
 type="button"
 onClick={() => {
 if (isGuest) { requireAuth('scan barcodes'); return; }
 setIsBarcodeModalOpen(true);
 }}
 className="p-4 rounded-2xl border border-[rgba(255,255,255,0.4)] bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
 >
 <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
 <QrCode className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold text-[var(--text-primary)]">Scan Barcode</p>
 <p className="text-[10px] text-[var(--text-muted)]">Instant box code</p>
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
 className="p-4 rounded-2xl border-2 border-dashed border-[var(--chassis-dark)] bg-[var(--chassis)] hover:border-[var(--accent-primary)] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px]"
 >
 {frontPreview ? (
 <div className="relative w-full">
 <img src={frontPreview} alt="Front" className="w-full max-h-28 object-contain rounded-lg" />
 <span className="absolute top-1 right-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 backdrop-blur-xs shadow-xs">
 Front Selected 
 </span>
 </div>
 ) : (
 <>
 <div className="p-2.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
 <Camera className="w-5 h-5" />
 </div>
 <div className="text-center">
 <p className="text-xs font-bold text-[var(--text-primary)]">1. Front Side (Brand Name)</p>
 <p className="text-[10px] text-[var(--text-muted)]">Tap to select front photo</p>
 </div>
 </>
 )}
 </div>

 {/* Back Side */}
 <div
 onClick={() => backFileInputRef.current?.click()}
 className="p-4 rounded-2xl border-2 border-dashed border-[var(--chassis-dark)] bg-[var(--chassis)] hover:border-[var(--accent-primary)] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px]"
 >
 {backPreview ? (
 <div className="relative w-full">
 <img src={backPreview} alt="Back" className="w-full max-h-28 object-contain rounded-lg" />
 <span className="absolute top-1 right-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 backdrop-blur-xs shadow-xs">
 Back Selected 
 </span>
 </div>
 ) : (
 <>
 <div className="p-2.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
 <FlaskConical className="w-5 h-5" />
 </div>
 <div className="text-center">
 <p className="text-xs font-bold text-[var(--text-primary)]">2. Back Side (Salts Table)</p>
 <p className="text-[10px] text-[var(--text-muted)]">Tap to select back photo</p>
 </div>
 </>
 )}
 </div>
 </div>

 {(frontFile || backFile) && (
 <button
 type="button"
 onClick={handleTwoSidedAnalyze}
 className="w-full py-3 bg-[var(--accent-primary)] text-white font-bold rounded-2xl shadow-md hover:bg-[#23584B] active:scale-98 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
 >
 <Sparkles className="w-4 h-4" />
 <span>Analyze Front & Back (Multimodal AI)</span>
 </button>
 )}
 </div>
 )}

 {/* Sample Quick Try */}
 <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-card)]">
 <div className="flex items-center space-x-2">
 <FileImage className="w-4 h-4 text-[var(--accent-primary)]" />
 <span className="text-xs font-bold text-[var(--text-primary)]">Try Verified Clinical Sample</span>
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
 className="px-3 py-1.5 text-xs font-bold text-[var(--accent-primary)] bg-[var(--chassis)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] rounded-xl transition-all cursor-pointer"
 >
 Sample (Naxdom 500)
 </button>
 </div>
 </div>
 )}

 {scanState === 'scanning' && (
 <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-[var(--accent-primary)]/30 bg-[var(--chassis)]">
 {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-36 object-contain rounded-xl opacity-60" />}
 <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
 <div className="text-center">
 <p className="text-sm font-bold text-[var(--accent-primary)]">Multimodal Vision AI in Progress...</p>
 <p className="text-[11px] text-[var(--text-muted)]">Decomposing chemical salts, dosage, and prescriber</p>
 </div>
 </div>
 )}

 {scanState === 'error' && (
 <div className="space-y-3">
 <div className="flex items-start space-x-3 p-4 bg-[var(--chassis)] border-2 border-[var(--led-caution)]/40 rounded-2xl">
 <TriangleAlert className="w-5 h-5 text-[var(--led-caution)] flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">Scan unsuccessful</p>
 <p className="text-xs text-[var(--text-muted)] mt-0.5">{scanError}</p>
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
 <img src={previewUrl} alt="Prescription" className="w-full max-h-44 object-contain rounded-xl border border-[rgba(255,255,255,0.4)] bg-[var(--chassis)] p-1 shadow-[var(--shadow-card)]" />
 <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 backdrop-blur-xs shadow-xs">
 <Camera className="w-3 h-3 text-[var(--accent-primary)]" /> From scan
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
 <div className="p-3 bg-[var(--chassis)] shadow-[var(--shadow-card)] rounded-xl space-y-2">
 <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-muted)]">
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
 className="px-2.5 py-1 text-xs font-bold text-[var(--text-primary)] bg-[var(--chassis)] shadow-[var(--shadow-sm)] hover:text-[var(--accent-primary)] active:shadow-[var(--shadow-card)] rounded-lg transition-all cursor-pointer"
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
 className="text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
 >
 {pillModeOpen ? 'Hide Tool' : 'Open Tool'}
 </button>
 }
 className="space-y-4"
 >
 {/* Prominent Mandatory Safety Caveat */}
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--chassis)] border border-[var(--led-caution)]/30 rounded-xl text-xs text-[var(--text-primary)]">
 <TriangleAlert className="w-4 h-4 text-[var(--led-caution)] flex-shrink-0 mt-0.5" />
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
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
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
 <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--brand-paper)] px-2 py-0.5">
 or scan pill imprint
 </span>
 </div>

 <button
 type="button"
 onClick={() => pillFileInputRef.current?.click()}
 disabled={searchPillMutation.isPending}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--chassis-dark)] bg-[var(--chassis)] hover:bg-[var(--chassis)] hover:border-[var(--accent-primary)] text-xs font-bold text-[var(--text-primary)] transition-colors"
 >
 <Camera className="w-4 h-4 text-[var(--accent-primary)]" />
 <span>Upload or Snap Pill Photo</span>
 </button>

 {/* Pill Searching State */}
 {pillState === 'searching' && (
 <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-[var(--chassis)] border border-[var(--accent-primary)]/20 text-xs font-bold text-[var(--accent-primary)]">
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
 <p className="text-xs font-bold text-[var(--text-primary)]">
 Possible Reference Matches ({pillMatches.length})
 </p>
 <button
 type="button"
 onClick={handleDismissPillLookup}
 className="text-xs text-[var(--text-muted)] hover:underline cursor-pointer"
 >
 Clear Results
 </button>
 </div>

 {pillMatches.length === 0 ? (
 <div className="p-4 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-xl text-center space-y-2">
 <HelpCircle className="w-6 h-6 text-[var(--role-caregiver)] mx-auto" />
 <p className="text-xs font-bold text-[var(--text-primary)]">No matches found in reference dataset</p>
 <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
 Our reference database contains 25+ common formulations. If you cannot identify this pill, please take it to a pharmacy for professional confirmation.
 </p>
 </div>
 ) : (
 <div className="space-y-2.5">
 {pillMatches.map((match) => (
 <div
 key={match.id}
 className="p-3.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-card)] border border-[var(--chassis-dark)] hover:border-[var(--accent-primary)] space-y-2.5 transition-all"
 >
 <div className="flex items-start justify-between gap-2">
 <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
                    Imprint: {match.imprintCode}
                  </span>
 <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1">
 {match.drugName}
 </h4>
 </div>
 {match.strength && (
 <span className="text-xs font-bold text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 px-2.5 py-1 rounded-lg">
 {match.strength}
 </span>
 )}
 </div>

 <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
 {match.shape && <span>Shape: <strong>{match.shape}</strong></span>}
 {match.color && <span>Color: <strong>{match.color}</strong></span>}
 </div>

 <div className="flex gap-2 pt-1 border-t border-[var(--chassis-dark)]">
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

 <div className="p-3 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-xl text-center">
 <p className="text-[11px] text-[var(--text-muted)]">
 Selecting a pill pre-fills the form below for your final verification — PolySafe will <strong>never auto-save</strong> without your explicit confirmation.
 </p>
 </div>
 </div>
 )}
 </div>
 )}
 </Card>

 {/* ── FORM SECTION (Redesigned Around Medicine Label & Prescription) ── */}
 <form onSubmit={handleSubmit} className="space-y-6">
 <Card
 title="Medicine & Packaging Details"
 subtitle={
 isScanFilled
 ? "Auto-filled from your medicine packaging scan — verify chemical composition & directions"
 : "Enter or verify the details from the medicine label or prescription"
 }
 icon={<Pill className="w-4 h-4 text-[var(--accent-primary)]" />}
 badge={
 isScanFilled ? (
 <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-xs">
 <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
 <span>From Label Scan</span>
 </span>
 ) : null
 }
 className="space-y-6"
 >
 {/* Fallback candidate suggestions chip banner */}
 {scanState === 'confirm' && scanResult?.fallbackCandidates?.length > 0 && !scanResult?.candidate && (
 <div className="p-3.5 bg-[var(--chassis)] shadow-[var(--shadow-card)] rounded-2xl space-y-2 border border-[var(--chassis-dark)]/50">
 <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-muted)]">
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
 className="px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-primary)] bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:text-[var(--accent-primary)] active:shadow-[var(--shadow-card)] transition-all cursor-pointer flex items-center gap-1.5"
 >
 <span>{cand}</span>
 <Plus className="w-3 h-3 text-[var(--accent-primary)]" />
 </button>
 ))}
 </div>
 </div>
 )}

 {/* ════════════════════════════════════════════════════════════════════
 SECTION 1: MEDICINE IDENTITY & ACTIVE CHEMICAL COMPOSITION
 ════════════════════════════════════════════════════════════════════ */}
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.4)]">
 <div className="flex items-center gap-2">
 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-black">
 1
 </span>
 <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
 Medicine & Active Chemical Composition
 </h4>
 </div>
 {isScanFilled && (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
 <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
 Label Verified
 </span>
 )}
 </div>

 {/* Medicine / Brand Name with Autocomplete */}
 <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Medicine / Brand Name <span className="text-rose-500">*</span>
                </label>
                {name.trim().length > 1 && (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <span className="text-[10px] text-[var(--text-muted)] font-semibold">Pre-Add Harm Tier:</span>
                    <DrugHarmBadge category={selectedDrugInfo?.category || ''} name={name.trim()} size="sm" />
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="relative flex items-center w-full">
                  <PolySafeInput
                    ref={nameInputRef}
                    type="text"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Start typing — e.g. D3B12 PLUS, Augmentin 625 Duo, Warfarin"
                    leftIcon={<Pill className="w-4 h-4 text-[var(--accent-primary)]" />}
                    rightIcon={searchLoading ? <Loader2 className="w-4 h-4 text-[var(--accent-primary)] animate-spin" /> : null}
                    error={Boolean(submitError && !name.trim())}
                    className={`!pl-11 pr-24 ${isScanFilled ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}
                  />
                  {isScanFilled && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 px-2.5 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-xs">
                      <Camera className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span>From scan</span>
                    </div>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 left-0 right-0 top-full mt-2 bg-[var(--chassis)] border border-white/50 rounded-2xl shadow-[var(--shadow-floating)] overflow-hidden max-h-72 overflow-y-auto"
                  >
                    {suggestions.map((sug, idx) => {
                      const isSelected = idx === selectedIdx;
                      const sourceColor = sug.source === 'rxnorm' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25'
                        : sug.source === 'herbal' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : sug.source === 'ddinter' ? 'bg-[var(--chassis)] text-[var(--text-primary)]'
                        : 'bg-gray-100 text-gray-600';
                      const sourceLabel = sug.source === 'rxnorm' ? 'RxNorm'
                        : sug.source === 'herbal' ? 'Herbal'
                        : sug.source === 'ddinter' ? 'DDInter'
                        : sug.source === 'rxnorm-suggest' ? 'RxNorm'
                        : '—';
                      return (
                        <button
                          key={`${sug.name}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectSuggestion(sug)}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[var(--chassis-dark)]' : 'hover:bg-[var(--chassis-dark)]'
                          } ${idx > 0 ? 'border-t border-[var(--chassis-dark)]/50' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-[var(--text-primary)] truncate font-display">{sug.name}</p>
                              {sug.category && (
                                <DrugHarmBadge category={sug.category} name={sug.name} />
                              )}
                            </div>
                            {sug.generic !== sug.name && (
                              <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">Generic: {sug.generic}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {sug.dosage && (
                              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis)] px-1.5 py-0.5 rounded-md">
                                {sug.dosage}
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${sourceColor}`}>
                              {sourceLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <div className="px-4 py-2 bg-[var(--chassis)] border-t border-[var(--chassis-dark)]">
                      <p className="text-[10px] font-mono text-[var(--text-muted)] text-center">
                        {searchLoading ? 'Searching drug databases…' : `${suggestions.length} result${suggestions.length !== 1 ? 's' : ''} · type to refine`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {!showSuggestions && name.length === 0 && (
                <p className="text-[10px] font-mono text-[var(--text-muted)] px-1">
                  Smart search — matches 60+ common drugs, Indian brands, herbs & supplements instantly
                </p>
              )}
            </div>

            {/* Generic / Active Chemical Composition */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Generic / Active Chemical Composition
 </label>
 <span className="text-[10px] text-[var(--text-muted)]">Active salts from blister table</span>
 </div>
 <PolySafeInput
 type="text"
 value={genericName}
 onChange={(e) => {
 setGenericName(e.target.value);
 if (e.target.value.includes('+')) {
 setCompositionSalts(e.target.value.split('+').map(s => s.trim()).filter(Boolean));
 }
 }}
 placeholder="e.g. Methylcobalamin + Pyridoxine HCl + Folic Acid + Vitamin D3"
 leftIcon={<FlaskConical className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs font-medium"
 />

 {/* Decomposed Active Chemical Salts Badges */}
 {compositionSalts.length > 0 && (
 <div className="p-3 bg-[var(--chassis)] rounded-xl border border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-card)] space-y-1.5">
 <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
 Decomposed Chemical Salts ({compositionSalts.length}):
 </span>
 <div className="flex flex-wrap gap-1.5">
 {compositionSalts.map((salt, idx) => (
 <span
 key={idx}
 className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--chassis)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs"
 >
 <FlaskConical className="w-3 h-3 text-[var(--accent-primary)]" />
 <span>{salt}</span>
 </span>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Drug Verification Info Card — appears after selecting from autocomplete or OCR */}
 {selectedDrugInfo && name && (
 <div className="ps-card p-6 space-y-4 border border-[var(--accent-primary)]/30">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <LedIndicator status="online" size="sm" />
 <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
 <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
 {selectedDrugInfo.rxcui ? 'RxNorm Verified Medication' : 'Identified Medication'}
 </span>
 <DrugHarmBadge category={selectedDrugInfo.category} name={selectedDrugInfo.name} />
 </div>
 <button
 type="button"
 onClick={() => setSelectedDrugInfo(null)}
 className="w-7 h-7 rounded-lg bg-[var(--chassis)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] active:shadow-[var(--shadow-pressed)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-all border border-white/40"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Pre-Add Warning Banner */}
 <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] border border-[var(--chassis-dark)] flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-2.5">
 <LedIndicator status="caution" size="sm" />
 <span className="text-xs font-mono font-bold text-[var(--text-primary)]">Pre-Add Harm Classification:</span>
 </div>
 <DrugHarmBadge category={selectedDrugInfo.category} name={selectedDrugInfo.name} size="lg" />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="text-xs bg-[var(--chassis)] shadow-[var(--shadow-recessed)] p-3.5 rounded-2xl border border-[var(--chassis-dark)]">
 <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider block">Drug Name</span>
 <p className="font-extrabold text-[var(--text-primary)] mt-1 truncate font-display text-sm">{selectedDrugInfo.name}</p>
 </div>
 {selectedDrugInfo.generic && selectedDrugInfo.generic !== selectedDrugInfo.name && (
 <div className="text-xs bg-[var(--chassis)] shadow-[var(--shadow-recessed)] p-3.5 rounded-2xl border border-[var(--chassis-dark)]">
 <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider block">Active Generic</span>
 <p className="font-bold text-[var(--accent-primary)] mt-1 truncate font-mono text-xs">{selectedDrugInfo.generic}</p>
 </div>
 )}
 {selectedDrugInfo.category && (
 <div className="text-xs bg-[var(--chassis-dark)] shadow-[var(--shadow-card)] p-2.5 rounded-xl border border-[var(--chassis-dark)]">
 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Clinical Class</span>
 <p className="font-bold text-[var(--text-primary)] mt-0.5 truncate">{selectedDrugInfo.category}</p>
 </div>
 )}
 {selectedDrugInfo.rxcui && (
 <div className="text-xs bg-[var(--chassis-dark)] shadow-[var(--shadow-card)] p-2.5 rounded-xl border border-[var(--chassis-dark)]">
 <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">RxNorm CUI</span>
 <p className="font-bold text-[var(--accent-primary)] mt-0.5">#{selectedDrugInfo.rxcui}</p>
 </div>
 )}
 </div>

 {/* Clinical Safety Tip */}
 {selectedDrugInfo.safetyTip && (
 <div className="flex items-start gap-2 p-2.5 bg-[var(--chassis)]/80 border border-[var(--chassis-dark)] rounded-xl text-xs text-[var(--text-muted)]">
 <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
 <p className="leading-relaxed"><strong className="text-[var(--text-primary)]">Safety Note:</strong> {selectedDrugInfo.safetyTip}</p>
 </div>
 )}

 {/* Quick Dosage Presets */}
 {selectedDrugInfo.dosageOptions?.length > 0 && (
 <div className="space-y-1.5 pt-1">
 <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
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
 ? 'bg-[var(--accent-primary)] text-white shadow-sm'
 : 'bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--chassis)]'
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

 {/* Medicine Type — 3-way toggle */}
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Medicine Regulatory Class <span className="text-[var(--led-critical)]">*</span>
 </label>
 <div className="flex items-center p-1.5 gap-1.5 bg-[var(--chassis)] shadow-[var(--shadow-recessed)] rounded-2xl">
 {MEDICINE_TYPES.map((t) => {
 const isActive = type === t.value;
 return (
 <button
 key={t.value}
 type="button"
 id={`type-toggle-${t.value.toLowerCase()}`}
 onClick={() => setType(t.value)}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 active:shadow-[var(--shadow-card)] active:translate-y-px ${
 isActive
 ? 'bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--accent-primary)]'
 : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
 }`}
 >
 <span className="flex-shrink-0">{t.toggleIcon}</span>
 <span>{t.shortLabel}</span>
 </button>
 );
 })}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] px-1">
 {MEDICINE_TYPES.find((t) => t.value === type)?.description}
 </p>
 </div>

 {/* Dosage Form & Strength (Side by Side) */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Dosage Form <span className="normal-case font-normal text-[var(--text-muted)]">— from label</span>
 </label>
 <PolySafeSelect
 value={form}
 onChange={(e) => setForm(e.target.value)}
 leftIcon={<Package className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 >
 {DOSAGE_FORMS.map((f) => (
 <option key={f.value} value={f.value}>
 {f.icon} {f.label}
 </option>
 ))}
 </PolySafeSelect>
 </div>

 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Strength / Dosage <span className="normal-case font-normal text-[var(--text-muted)]">— from label</span>
 </label>
 <PolySafeInput
 type="text"
 value={dosage}
 onChange={(e) => setDosage(e.target.value)}
 placeholder="e.g. 500mg, 1500 mcg + 10mg"
 leftIcon={<Pill className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs font-medium"
 />
 </div>
 </div>
 </div>

 {/* ════════════════════════════════════════════════════════════════════
 SECTION 2: PACKAGING & MANUFACTURER DETAILS (STRIP / BOX)
 ════════════════════════════════════════════════════════════════════ */}
 <div className="space-y-4 pt-2">
 <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.4)]">
 <div className="flex items-center gap-2">
 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-black">
 2
 </span>
 <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
 Packaging & Manufacturer Details
 </h4>
 </div>
 <span className="text-[10px] text-[var(--text-muted)]">From Box / Strip</span>
 </div>

 {/* Manufacturer / Marketed By */}
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Manufacturer / Marketed By <span className="normal-case font-normal text-[var(--text-muted)]">— optional</span>
 </label>
 <PolySafeInput
 type="text"
 value={manufacturer}
 onChange={(e) => setManufacturer(e.target.value)}
 placeholder="e.g. Healing Pharma India Pvt. Ltd., Cipla, Sun Pharma"
 leftIcon={<Building2 className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 />
 </div>

 {/* Expiry Date + Batch / Lot No */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Expiry Date <span className="normal-case font-normal text-[var(--text-muted)]">— MM/YYYY</span>
 </label>
 <PolySafeInput
 type="text"
 value={expiryDate}
 onChange={(e) => setExpiryDate(e.target.value)}
 placeholder="e.g. 08/2027"
 leftIcon={<Calendar className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 />
 </div>

 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Batch / Lot No. <span className="normal-case font-normal text-[var(--text-muted)]">— optional</span>
 </label>
 <PolySafeInput
 type="text"
 value={batchNo}
 onChange={(e) => setBatchNo(e.target.value)}
 placeholder="e.g. B.No. T-1049"
 leftIcon={<Tag className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 />
 </div>
 </div>

 {/* Storage & Caution Warning */}
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Storage & Safety Warning <span className="normal-case font-normal text-[var(--text-muted)]">— from label</span>
 </label>
 <PolySafeInput
 type="text"
 value={safetyWarning}
 onChange={(e) => setSafetyWarning(e.target.value)}
 placeholder="e.g. Store below 25°C in a dry place. Schedule H Prescription Drug."
 leftIcon={<ShieldAlert className="w-4 h-4 text-[var(--led-caution)]" />}
 className="text-xs"
 />
 </div>
 </div>

 {/* ════════════════════════════════════════════════════════════════════
 SECTION 3: ⏰ DOSAGE SCHEDULE & ADMINISTRATION (PRESCRIPTION)
 ════════════════════════════════════════════════════════════════════ */}
 <div className="space-y-4 pt-2">
 <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.4)]">
 <div className="flex items-center gap-2">
 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-black">
 3
 </span>
 <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
 Dosage Schedule & Directions
 </h4>
 </div>
 <span className="text-[10px] text-[var(--text-muted)]">Prescription / Directions</span>
 </div>

 {/* Frequency Schedule */}
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Frequency Schedule
 </label>
 <PolySafeSelect
 value={frequency}
 onChange={(e) => {
 const newFreq = e.target.value;
 setFrequency(newFreq);
 if (newFreq === 'once') setTimings(['morning']);
 else if (newFreq === 'twice') setTimings(['morning', 'evening']);
 else if (newFreq === 'thrice') setTimings(['morning', 'afternoon', 'evening']);
 else if (newFreq === 'four') setTimings(['morning', 'afternoon', 'evening', 'bedtime']);
 }}
 leftIcon={<Clock className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs font-medium"
 >
 <option value="once">Once daily (OD)</option>
 <option value="twice">Twice daily (BD / BID)</option>
 <option value="thrice">3 times daily (TID)</option>
 <option value="four">4 times daily (QID)</option>
 <option value="weekly">Weekly</option>
 <option value="asneeded">As needed (PRN)</option>
 <option value="alternate">Alternate days</option>
 </PolySafeSelect>
 </div>

 {/* Time of Day Chips */}
 <div className="space-y-2">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Time of Day <span className="normal-case font-normal text-[var(--text-muted)]">— select dosage times</span>
 </label>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
 className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 active:shadow-[var(--shadow-card)] active:translate-y-px ${
 isActive
 ? 'bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
 : 'bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--text-muted)] border-transparent'
 }`}
 >
 <div className="flex items-center gap-1.5">
 {slot.icon}
 <span>{slot.label}</span>
 </div>
 <span className="text-[10px] font-normal opacity-60">{slot.time}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Meal Instructions + Prescribed By */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Meal Instructions <span className="normal-case font-normal text-[var(--text-muted)]">— optional</span>
 </label>
 <PolySafeSelect
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 leftIcon={<CalendarDays className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 >
 <option value="">No special instructions</option>
 <option value="after_food">Take after food (Post-meal)</option>
 <option value="before_food">Take before food (Pre-meal)</option>
 <option value="with_food">Take with food</option>
 <option value="empty_stomach">Take on empty stomach</option>
 <option value="with_water">Take with plenty of water</option>
 <option value="avoid_dairy">Avoid dairy products</option>
 </PolySafeSelect>
 </div>

 <div className="space-y-1.5">
 <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
 Prescribed By <span className="normal-case font-normal text-[var(--text-muted)]">— optional</span>
 </label>
 <PolySafeInput
 type="text"
 value={prescriber}
 onChange={(e) => setPrescriber(e.target.value)}
 placeholder="Doctor name or Self"
 leftIcon={<User className="w-4 h-4 text-[var(--accent-primary)]" />}
 className="text-xs"
 />
 </div>
 </div>
 </div>
 </Card>

 {/* Duplicate Conflict Resolver Banner */}
 {duplicateConflict && (
 <div className="p-4 rounded-2xl bg-[var(--chassis)] border-2 border-[var(--led-caution)]/50 space-y-3 shadow-sm">
 <div className="flex items-start gap-3">
 <TriangleAlert className="w-5 h-5 text-[var(--led-caution)] flex-shrink-0 mt-0.5" />
 <div className="space-y-1">
 <p className="text-sm font-bold text-[var(--text-primary)]">
 "{duplicateConflict.name}" is already in your active medicines
 </p>
 <p className="text-xs text-[var(--text-muted)] leading-relaxed">
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
 className="btn-primary w-full py-4 text-base shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card)]"
 >
 {addMutation.isPending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /><span>Checking RxNorm & saving...</span></>
 ) : (
 <><Plus className="w-5 h-5" /><span>Add to My Medicine List</span><ArrowRight className="w-5 h-5" /></>
 )}
 </button>

 {addMutation.isPending && (
 <p className="text-center text-[11px] text-[var(--text-muted)]">
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
