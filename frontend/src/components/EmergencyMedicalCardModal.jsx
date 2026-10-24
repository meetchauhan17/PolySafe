import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  User,
  AlertTriangle,
  QrCode,
  Printer,
  Copy,
  Check,
  HeartPulse,
  Pill,
  Clock,
  ShieldAlert,
  RotateCw,
  Plus,
  Stethoscope,
} from 'lucide-react';
import QRCode from 'qrcode';
import { notify } from '../utils/toast';
import { FlipCard } from '../three-d/FlipCard';
import Logo, { LogoMark } from './Logo';

export default function EmergencyMedicalCardModal({
  isOpen,
  open: openProp,
  onClose,
  data,
  isDemo = false,
}) {
  const show = openProp ?? isOpen ?? false;
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fallback demo emergency record
  const patient = data?.patient || {
    name: 'Priya Sharma',
    age: 68,
    bloodType: 'O Positive',
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Osteoarthritis'],
    allergies: ['Penicillin', 'Sulfa Antibiotics'],
  };

  const highAlertMeds = data?.highAlertMeds?.length > 0
    ? data.highAlertMeds
    : [
        { name: 'Warfarin 5mg', dosage: '5mg daily', category: 'Anticoagulant (Blood Thinner)', harmLevel: 5 },
        { name: 'Aspirin 81mg', dosage: '81mg daily', category: 'Antiplatelet', harmLevel: 4 },
        { name: 'Lisinopril 10mg', dosage: '10mg daily', category: 'ACE Inhibitor', harmLevel: 3 },
      ];

  const anticoagulants = highAlertMeds.filter(
    (m) =>
      m.name.toLowerCase().includes('warfarin') ||
      m.name.toLowerCase().includes('aspirin') ||
      m.name.toLowerCase().includes('apixaban') ||
      m.name.toLowerCase().includes('clopidogrel') ||
      m.name.toLowerCase().includes('heparin') ||
      (m.category && m.category.toLowerCase().includes('anticoagulant'))
  );

  const emergencyContacts = data?.emergencyContacts?.length > 0
    ? data.emergencyContacts
    : [
        { name: 'Dr. Jane Foster', phone: '+91 98200 12345', relationship: 'Attending Cardiologist' },
        { name: 'Rahul Sharma', phone: '+91 98450 67890', relationship: 'Primary Caregiver (Son)' },
      ];

  const primaryPhysician = emergencyContacts.find(
    (c) => c.relationship.toLowerCase().includes('doctor') || c.relationship.toLowerCase().includes('physician') || c.relationship.toLowerCase().includes('cardio')
  ) || emergencyContacts[0];

  const primaryCaregiver = emergencyContacts.find(
    (c) => c !== primaryPhysician
  ) || emergencyContacts[1] || emergencyContacts[0];

  const cardId = data?.cardId || 'PS-EMR-88A4F12';
  const qrVerificationUrl = data?.qrVerificationUrl || `https://polysafe.health/emergency/${cardId}`;

  // Close on Escape key
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [show]);

  // Generate real QR code data URL safely
  useEffect(() => {
    if (show) {
      const generateQR = QRCode?.toDataURL || QRCode?.default?.toDataURL;
      if (typeof generateQR === 'function') {
        generateQR(qrVerificationUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })
          .then((url) => setQrDataUrl(url))
          .catch((err) => console.warn('QR code notice:', err.message));
      }
    }
  }, [show, qrVerificationUrl]);

  const handleCopySummary = () => {
    const text = `[POLYSAFE EMERGENCY MEDICAL IDENTITY CARD]
Card ID: ${cardId}
Patient: ${patient.name} (${patient.age} yrs)
Blood Group: ${patient.bloodType || 'O Positive'}
Allergies: ${(patient.allergies || []).join(', ') || 'None recorded'}
Active Anticoagulants: ${anticoagulants.map((m) => m.name).join(', ') || 'None'}
Primary Physician: ${primaryPhysician.name} (${primaryPhysician.phone})
Emergency Caregiver: ${primaryCaregiver.name} (${primaryCaregiver.phone})
Verification URL: ${qrVerificationUrl}`;

    try {
      navigator.clipboard?.writeText?.(text);
      setCopied(true);
      notify.success('Copied to Clipboard', 'Emergency medical card summary copied.');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          {/* Print Style Injections */}
          <style>{`
            @media print {
              nav, header, aside, .no-print, button { display: none !important; }
              body, main { background: #FFFFFF !important; color: #000000 !important; }
              .emergency-card-container { box-shadow: none !important; border: 2px solid #000 !important; }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-full h-full sm:h-auto sm:max-w-xl bg-[var(--surface)] text-[var(--ink)] sm:rounded-3xl shadow-2xl border border-[var(--border)] overflow-y-auto max-h-[100dvh] sm:max-h-[92vh] flex flex-col justify-between my-auto"
          >
            {/* Top Modal Bar — Screen Only */}
            <div className="p-4 sm:px-6 bg-[var(--surface-2)] border-b border-[var(--border)] flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
                  Paramedic & First Responder Card
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                aria-label="Close emergency card modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── FlipCard Container ── */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center">
              <FlipCard
                isFlipped={isFlipped}
                onFlip={setIsFlipped}
                className="w-full max-w-lg min-h-[420px] sm:min-h-[400px]"
                flipAffordanceLabel={isFlipped ? 'Show Front' : 'Flip for QR & Contacts'}
                ariaLabel="Emergency medical identity card"
                front={
                  /* ── CARD FRONT ── */
                  <div className="w-full h-full min-h-[420px] sm:min-h-[400px] rounded-3xl bg-[var(--surface)] border-2 border-[var(--border)] shadow-md overflow-hidden flex flex-col justify-between emergency-card-container">
                    {/* Bold Vermilion Header Band with Medical Cross */}
                    <div className="bg-[#EF4444] text-white px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center flex-shrink-0">
                          <LogoMark size={28} concept="cross" variant="white" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest leading-none font-mono">
                            EMERGENCY MEDICAL CARD
                          </p>
                          <p className="text-[10px] opacity-90 font-mono mt-0.5">
                            Paramedic & Clinical First Responders
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black bg-white/20 px-2.5 py-1 rounded-full border border-white/30">
                        {cardId}
                      </span>
                    </div>

                    {/* Front Body: High contrast, readable at arm's length */}
                    <div className="p-5 sm:p-6 space-y-4 flex-1">
                      {/* Name & Blood Group Badge */}
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-[var(--font-heading)] leading-tight tracking-tight">
                            {patient.name}
                          </h2>
                          <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5">
                            Age: {patient.age} yrs · ID: {cardId}
                          </p>
                        </div>

                        {/* Blood Group in Big Badge */}
                        <div className="flex flex-col items-center justify-center p-2.5 px-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-700 dark:text-rose-400 flex-shrink-0 shadow-2xs">
                          <span className="text-[9px] font-mono uppercase font-black tracking-wider">Blood Group</span>
                          <span className="text-xl font-black font-mono leading-tight">{patient.bloodType || 'O+'}</span>
                        </div>
                      </div>

                      {/* Active Anticoagulants Highlighted */}
                      {anticoagulants.length > 0 && (
                        <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase font-mono tracking-wider">
                            <AlertTriangle className="w-4 h-4 text-white" />
                            <span>CRITICAL: ON ANTICOAGULANT THERAPY</span>
                          </div>
                          <p className="text-xs font-medium opacity-95">
                            Active: {anticoagulants.map((m) => m.name).join(' + ')}. Severe bleeding & hemorrhage propensity. Check INR/PTT immediately.
                          </p>
                        </div>
                      )}

                      {/* Allergies as Vermilion-Outlined Chips */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono">
                          Documented Drug Allergies
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(patient.allergies || ['None recorded']).map((alg, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-bold px-3 py-1 rounded-full border-2 border-[#EF4444] text-[#B91C1C] dark:text-rose-300 bg-rose-500/10 shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{alg}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Primary Physician Contact */}
                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-[var(--ink)]">{primaryPhysician.name}</p>
                            <p className="text-[11px] text-[var(--ink-3)] font-mono">{primaryPhysician.relationship}</p>
                          </div>
                        </div>
                        <a
                          href={`tel:${primaryPhysician.phone}`}
                          data-no-flip="true"
                          className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20"
                        >
                          {primaryPhysician.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                }
                back={
                  /* ── CARD BACK ── */
                  <div className="w-full h-full min-h-[420px] sm:min-h-[400px] rounded-3xl bg-[var(--surface)] border-2 border-[var(--border)] shadow-md overflow-hidden flex flex-col justify-between emergency-card-container">
                    {/* Header */}
                    <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-wider font-mono">
                          Paramedic Telemetry & Verification
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Encrypted EMR Link
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* QR Code */}
                        <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm flex-shrink-0">
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt="Emergency Paramedic Verification QR Code"
                              className="w-32 h-32 object-contain"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
                              QR Code Loading…
                            </div>
                          )}
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-3 min-w-0 flex-1">
                          <div>
                            <span className="text-[10px] font-mono uppercase font-bold text-[var(--ink-3)]">
                              Primary Family Caregiver Contact
                            </span>
                            <p className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                              {primaryCaregiver.name}
                            </p>
                            <p className="text-xs text-[var(--ink-3)] font-mono">
                              {primaryCaregiver.relationship}
                            </p>
                            <a
                              href={`tel:${primaryCaregiver.phone}`}
                              data-no-flip="true"
                              className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 mt-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{primaryCaregiver.phone}</span>
                            </a>
                          </div>

                          <div className="pt-2 border-t border-[var(--border)] text-[11px] font-mono text-[var(--ink-3)] space-y-0.5">
                            <p>
                              Last Verified:{' '}
                              <strong className="text-[var(--ink)]">
                                {new Date().toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </strong>
                            </p>
                            <p>EMR Verification: PolySafe Telemetry Active</p>
                          </div>
                        </div>
                      </div>

                      {/* Notice */}
                      <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--ink-3)] leading-relaxed">
                        Scan with any smartphone camera to open authenticated hospital verification directives and complete medication lists.
                      </div>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Bottom Controls: Copy, Print, Close */}
            <div className="p-4 sm:px-6 bg-[var(--surface-2)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2 text-xs text-[var(--ink-3)] font-mono">
                <RotateCw className="w-3.5 h-3.5 text-[var(--accent-500)]" />
                <span>Tap card to toggle front and back</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="ps-btn ps-btn-secondary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="ps-btn ps-btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Card</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="ps-btn ps-btn-secondary py-2 px-3 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
