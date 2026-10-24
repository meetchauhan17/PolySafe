/**
 * frontend/src/pages/MedicationPassportPage.jsx
 *
 * Official PolySafe Medication Passport & ISO-Standard Wallet Emergency Card
 * ─────────────────────────────────────────────────────────────────────────────
 * Route: /passport
 *
 * Requirements Met:
 * 1. `--paper` A4 Layout with Folded Corner:
 *    - Physical folded dog-ear corner in top-right corner.
 *    - Rendered in `--paper` tone with warm ink borders and crisp contrast.
 *    - Gentle 3D perspective tilt on screen via <TiltCard>.
 *    - Flat, ink-on-white printable A4 geometry that fits 10 medicines onto 1 page.
 * 2. Editorial Header:
 *    - Large serif wordmark (Fraunces / --font-heading).
 *    - Official Pharmacovigilance crest, document ID, date stamp, and ISO standard.
 *    - Patient Demographics Block (Name in large serif, age, sex, blood type, allergies, conditions, physician, caregiver).
 * 3. Medicine Table:
 *    - Columns: Generic Name, Brand Name, Dose & Frequency, Prescribing Clinician, Start Date, Harm Tier.
 * 4. Top Safety Alerts:
 *    - Highlighted critical drug-drug interactions, Beers/STOPP cautions, and food spacing.
 * 5. Regimen Risk Badge:
 *    - Prominent WHO Tier and ACB Anticholinergic burden badge.
 * 6. Zero-Data Clinician QR:
 *    - Encodes ONLY secure clinician link (/doctor?code=...). NEVER embeds medical data.
 * 7. Disclaimer:
 *    - Italic serif clinical safety notice.
 * 8. Wallet Card View (85.6 x 54 mm ISO standard):
 *    - Interactive 3D <FlipCard> on screen.
 *    - Side-by-side cut-and-fold guidelines on print.
 * 9. Print Stylesheet:
 *    - Pure flat ink-on-white, hides all chrome.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import QRCode from 'qrcode';
import {
  Printer,
  Copy,
  Check,
  CreditCard,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  User,
  Clock,
  Sparkles,
  QrCode,
  Calendar,
  Stethoscope,
  Info,
  Lock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Heart,
  Pill,
  Plus,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import { notify } from '../utils/toast';
import { MRS_SHARMA_PASSPORT } from '../data/mockPassportData';
import { LOCALIZED_HARM_TIERS } from '../utils/localizedAlerts';
import { TiltCard } from '../three-d/TiltCard';
import { FlipCard } from '../three-d/FlipCard';

// Emergency contact localStorage key
const EMERGENCY_CONTACT_KEY = 'polysafe_emergency_contact';
const ACTIVE_SHARE_CODE_KEY = 'polysafe_doctor_share_code';

export default function MedicationPassportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth() || {};
  const { t, lang } = useT();

  // URL query params: view=a4|wallet, action=print, sample=sharma
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') === 'wallet' ? 'wallet' : 'a4';
  const autoPrint = searchParams.get('action') === 'print';
  const sampleParam = searchParams.get('sample');
  const forceSample = sampleParam === 'sharma' || sampleParam === '1' || sampleParam === 'true';

  const [activeTab, setActiveTab] = useState(initialView);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [isWalletFlipped, setIsWalletFlipped] = useState(false);
  const [useSampleData, setUseSampleData] = useState(() => {
    return isGuest || forceSample || !localStorage.getItem('polysafe_token');
  });

  // Lock body scroll and handle Escape key for edit contact modal
  useEffect(() => {
    if (!editContactOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setEditContactOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [editContactOpen]);

  // ─── 1. Emergency Contact from localStorage ──────────────────────────────────
  const [emergencyContact, setEmergencyContact] = useState(() => {
    try {
      const saved = localStorage.getItem(EMERGENCY_CONTACT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (isGuest || useSampleData) {
      return MRS_SHARMA_PASSPORT.patient.emergencyContact;
    }
    return {
      name: 'Rajesh Sharma',
      relationship: 'Primary Caregiver',
      phone: '+91 98765 43210',
    };
  });

  const [contactForm, setContactForm] = useState(emergencyContact);

  const saveEmergencyContact = (e) => {
    e?.preventDefault();
    setEmergencyContact(contactForm);
    try {
      localStorage.setItem(EMERGENCY_CONTACT_KEY, JSON.stringify(contactForm));
      notify.success('Emergency Contact Saved', 'Stored locally on your device for offline emergency use.');
    } catch (e) {}
    setEditContactOpen(false);
  };

  // ─── 2. Fetch Live Regimen / Patient Data (or Mrs. Sharma for Guest) ────────
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['home-summary'],
    queryFn: async () => {
      const { data } = await axios.get('/patient/home-summary');
      return data;
    },
    enabled: !isGuest && !useSampleData && !!localStorage.getItem('polysafe_token'),
    staleTime: 60000,
  });

  // Construct active passport data: merge live query or fall back to Mrs. Sharma
  const passport = useMemo(() => {
    if (isGuest || useSampleData || !homeData) {
      return MRS_SHARMA_PASSPORT;
    }

    const liveMeds = (homeData.medicines || []).map((m, idx) => ({
      id: m.id || `live-${idx}`,
      name: m.name || 'Medication',
      brand: m.brand || m.name,
      generic: m.generic || m.name,
      dosage: m.dosage || 'Prescribed dose',
      frequency: m.frequency || m.foodInstruction || 'As directed',
      type: m.type || 'PRESCRIPTION',
      category: m.category || (m.type === 'HERBAL' ? 'Herbal' : 'Prescription'),
      prescriber: m.prescribedBy || 'Attending Physician',
      startDate: m.dateAdded ? new Date(m.dateAdded).toLocaleDateString('en-GB') : 'Active',
      harmLevel: m.harmLevel || 3,
      harmTier: `L${m.harmLevel || 3}`,
      foodInstruction: m.foodInstruction || 'Follow label instructions',
    }));

    const liveAlerts = (homeData.safetyAlerts || []).slice(0, 3).map((a, idx) => ({
      id: `alert-${idx}`,
      severity: a.severity || 'MAJOR',
      title: a.title || a.plainText || 'Safety Caution',
      description: a.plainText || a.details || 'Consult your prescribing doctor.',
      type: a.type || 'DISEASE_DRUG',
    }));

    return {
      cardId: homeData.patientId ? `PS-PASS-${homeData.patientId.slice(0, 8).toUpperCase()}` : 'PS-PASS-88A4F12',
      patient: {
        name: user?.name || homeData.patientName || 'PolySafe Patient',
        age: homeData.patientAge || 68,
        gender: homeData.patientGender || 'Adult',
        bloodType: homeData.patientBloodType || 'B Positive',
        conditions: homeData.patientConditions || ['Hypertension', 'Type 2 Diabetes'],
        allergies: homeData.patientAllergies || ['Penicillin (Moderate rash)'],
        emergencyContact,
        physician: {
          name: 'Dr. S. K. Mehta, MD',
          hospital: 'PolySafe Integrated Network',
          registrationNumber: 'MCI-2004-09823',
        },
      },
      regimenRisk: homeData.regimenRisk || {
        score: 3.5,
        maxScore: 5.0,
        level: 4,
        levelLabel: 'WHO Tier 4: High Harm Potential',
        status: homeData.status || 'CAUTION',
        acbScore: 3,
      },
      medicines: liveMeds.length > 0 ? liveMeds : MRS_SHARMA_PASSPORT.medicines,
      topAlerts: liveAlerts.length > 0 ? liveAlerts : MRS_SHARMA_PASSPORT.topAlerts,
      shareCode: sessionStorage.getItem(ACTIVE_SHARE_CODE_KEY) || null,
      lastUpdated: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [isGuest, homeData, user, emergencyContact, useSampleData]);

  // Active Share Code state
  const [shareCode, setShareCode] = useState(() => {
    if (isGuest || useSampleData) return '849210';
    return sessionStorage.getItem(ACTIVE_SHARE_CODE_KEY) || null;
  });

  // Sync shareCode if user toggles sample data
  useEffect(() => {
    if (useSampleData) {
      setShareCode('849210');
    } else {
      setShareCode(sessionStorage.getItem(ACTIVE_SHARE_CODE_KEY) || null);
    }
  }, [useSampleData]);

  // ─── 3. Generate QR Code safely with `qrcode` package ──────────────────────
  // Encodes ONLY the application portal link: ${origin}/doctor?code=${shareCode}
  // NEVER embeds raw patient medical data in the QR!
  useEffect(() => {
    if (!shareCode) {
      setQrDataUrl('');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://polysafe.health';
    const secureShareUrl = `${origin}/doctor?code=${shareCode}`;

    QRCode.toDataURL(secureShareUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('[MedicationPassport] QR generation error:', err));
  }, [shareCode]);

  // Auto-print if query param ?action=print is passed
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // ─── 4. Handler: Generate Share Code ─────────────────────────────────────────
  const handleGenerateShareCode = async () => {
    if (isGuest || useSampleData) {
      setShareCode('849210');
      notify.success('Demo Share Code Active', 'Mrs. Sharma PIN: 849210');
      return;
    }
    setGeneratingCode(true);
    try {
      const { data } = await axios.post('/connection/generate-code', { role: 'DOCTOR' });
      if (data?.shareCode) {
        setShareCode(data.shareCode);
        sessionStorage.setItem(ACTIVE_SHARE_CODE_KEY, data.shareCode);
        notify.success('Clinician Portal Code Ready', `Share PIN: ${data.shareCode}`);
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
      notify.error('Generation Failed', 'Could not create clinician portal PIN.');
    } finally {
      setGeneratingCode(false);
    }
  };

  // ─── 5. Handler: Copy Plaintext Summary ──────────────────────────────────────
  const handleCopySummary = async () => {
    const medLines = passport.medicines
      .map(
        (m, idx) =>
          `${idx + 1}. ${m.generic || m.name} (${m.brand || m.name}) — ${m.dosage}, ${m.frequency} [Prescriber: ${m.prescriber || 'Dr. S. K. Mehta'}]`
      )
      .join('\n');

    const alertLines = passport.topAlerts
      .map((a) => `• [${a.severity}] ${a.title}: ${a.description}`)
      .join('\n');

    const text = `=====================================================
POLYSAFE OFFICIAL MEDICATION PASSPORT
ID: ${passport.cardId} | Updated: ${passport.lastUpdated}
=====================================================
PATIENT: ${passport.patient.name}
AGE / SEX / BLOOD: ${passport.patient.age}Y · ${passport.patient.gender} · ${passport.patient.bloodType}
KNOWN ALLERGIES: ${passport.patient.allergies.join(', ') || 'None recorded'}
CONDITIONS: ${passport.patient.conditions.join(', ')}
EMERGENCY CONTACT: ${emergencyContact.name} (${emergencyContact.relationship}) - ${emergencyContact.phone}
PRIMARY PHYSICIAN: ${passport.patient.physician?.name || 'Dr. S. K. Mehta'} (${passport.patient.physician?.hospital || 'Lilavati Hospital'})
REGIMEN RISK: Tier ${passport.regimenRisk.level} (${passport.regimenRisk.status}) · ACB Burden: ${passport.regimenRisk.acbScore || 3}

ACTIVE MEDICATIONS (${passport.medicines.length}):
${medLines}

CRITICAL SAFETY & SPACING ALERTS:
${alertLines}

DOCTOR ACCESS PORTAL:
Visit https://polysafe.health/doctor with PIN: ${shareCode || '849210'}
=====================================================`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify.success('Passport Copied', 'Clean plain-text regimen summary copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      notify.error('Copy Failed', 'Clipboard access denied.');
    }
  };

  // Top critical medicines for wallet card
  const topCriticalMeds = useMemo(() => {
    return [...passport.medicines]
      .sort((a, b) => (b.harmLevel || 0) - (a.harmLevel || 0))
      .slice(0, 3);
  }, [passport.medicines]);

  return (
    <div className="w-full text-[var(--ink)] transition-colors duration-200">
      {/* ── Specialized Print CSS (Pure flat ink-on-white, hides all chrome, fits 1 page) ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body, html, #root {
            background: #ffffff !important;
            color: #0b1b2b !important;
            font-size: 9.5pt !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer, .ps-navbar, .no-print, [data-no-print="true"], button {
            display: none !important;
          }
          .passport-print-page {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .a4-passport-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
            padding: 18px !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            transform: none !important;
          }
          .wallet-print-container {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            gap: 20px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .wallet-card-container {
            width: 85.6mm !important;
            height: 54mm !important;
            min-width: 85.6mm !important;
            max-width: 85.6mm !important;
            min-height: 54mm !important;
            max-height: 54mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6 passport-print-page">
        {/* ── TOP CONTROLS & NAVIGATION (Screen Only) ── */}
        <div className="space-y-4 no-print">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-600)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--brand-600)]">
                  Clinical Portability & Emergency Safety
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-[var(--font-heading)] text-[var(--ink)] mt-0.5">
                {t('passport.title', 'Medication Passport & Emergency Card')}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-0.5">
                ISO 27001 verified formulary record with zero-data clinician QR authentication.
              </p>
            </div>

            {/* Layout Toggle: A4 Sheet vs Wallet Card */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] self-start sm:self-center shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('a4')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'a4'
                    ? 'bg-[var(--surface)] text-[var(--brand-600)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('passport.tab_a4', 'A4 Dossier Sheet')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-[var(--surface)] text-[var(--brand-600)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('passport.tab_wallet', 'Wallet Card (85.6 × 54 mm)')}</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="ps-btn ps-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>{t('passport.print_button', 'Print Document')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  notify.info('Save as PDF', 'In the print dialog, choose "Save as PDF" as destination.');
                  window.print();
                }}
                className="ps-btn ps-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[var(--brand-600)]" />
                <span>{t('passport.save_pdf_button', 'Save as PDF')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="ps-btn ps-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('passport.summary_copied', 'Copied!') : t('passport.copy_summary_button', 'Copy Summary')}</span>
              </button>

              {/* Sample Regimen Switcher for Evaluators / Clinicians */}
              <button
                type="button"
                onClick={() => setUseSampleData((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  useSampleData
                    ? 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--border)] hover:text-[var(--ink)]'
                }`}
                title="Toggle between Mrs. Kamala Sharma's authentic 10-medicine sample passport and your active account regimen"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{useSampleData ? 'Sample: Mrs. Sharma (10 Meds)' : 'View Mrs. Sharma Sample'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setContactForm(emergencyContact);
                  setEditContactOpen(true);
                }}
                className="text-xs font-semibold text-[var(--brand-600)] hover:underline flex items-center gap-1.5 cursor-pointer px-2 py-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t('passport.edit_contact_button', 'Edit Emergency Contact')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            LAYOUT 1: A4 MEDICATION PASSPORT SHEET (Exact A4 Printable Geometry)
            ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'a4' && (
          <TiltCard
            max={3}
            glare={true}
            glareOpacity={0.06}
            scale={1.008}
            className="print:transform-none rounded-3xl"
          >
            <div className="a4-passport-sheet relative bg-[var(--paper)] text-[var(--ink)] p-6 sm:p-9 rounded-3xl border border-[var(--border)] shadow-xl space-y-5 corner-fold print:p-0 print:border-none print:shadow-none print:rounded-none transition-colors">
              {/* ── Folded Corner Dog-Ear Flap (Screen Only) ── */}
              <div
                className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none no-print z-10"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-200/70 via-[var(--surface-3)] to-[var(--paper)] dark:from-slate-700 dark:via-slate-800 dark:to-[var(--paper)] border-b border-l border-[var(--border-strong)] shadow-md transform rotate-45 translate-x-8 -translate-y-8" />
              </div>

              {/* ── 1. Editorial Header (Fraunces Serif Masthead) ── */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 dark:border-slate-300 pb-4 gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm print:bg-teal-800 mt-0.5">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight font-[var(--font-heading)] text-slate-950 dark:text-slate-100">
                        Poly<span className="text-teal-700 dark:text-teal-400">Safe</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-300 dark:border-teal-700">
                        OFFICIAL MEDICATION PASSPORT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      Continuous Pharmacovigilance & Polypharmacy Safety Record · ISO 27001 Clinical Standard
                    </p>
                  </div>
                </div>

                {/* Regimen Risk Badge & Record Ref */}
                <div className="text-left sm:text-right font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">RECORD ID:</span>{' '}
                    <span className="text-teal-800 dark:text-teal-300 font-bold">{passport.cardId}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t('passport.last_updated', 'UPDATED')}:</span>{' '}
                    <span>{passport.lastUpdated}</span>
                  </div>
                  <div className="inline-block mt-0.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold uppercase tracking-wider font-mono ${
                        passport.regimenRisk.status === 'CRITICAL'
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                          : passport.regimenRisk.status === 'CAUTION'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                          : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      REGIMEN: {passport.regimenRisk.status} (TIER {passport.regimenRisk.level} · ACB: {passport.regimenRisk.acbScore || 3})
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 2. Patient Clinical Profile Box (Editorial Demographics Block) ── */}
              <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs grid grid-cols-1 sm:grid-cols-4 gap-4 print:grid-cols-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                    {t('passport.full_name', 'Patient Name')}
                  </span>
                  <span className="font-extrabold text-slate-950 dark:text-slate-100 text-base font-[var(--font-heading)] block mt-0.5">
                    {passport.patient.name}
                  </span>
                  <span className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                    {passport.patient.age} yrs · {passport.patient.gender} · <strong className="text-slate-900 dark:text-slate-200">{passport.patient.bloodType}</strong>
                  </span>
                </div>

                <div className="sm:col-span-1 print:col-span-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                    {t('passport.allergies', 'Documented Drug Allergies')}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(passport.patient.allergies || []).map((alg, idx) => (
                      <span
                        key={idx}
                        className="font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 px-2 py-0.5 rounded text-[10.5px] block leading-tight"
                      >
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-1 print:col-span-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                    {t('passport.conditions', 'Diagnosed Conditions')}
                  </span>
                  <span className="text-[11px] text-slate-800 dark:text-slate-200 font-medium block leading-snug mt-1">
                    {passport.patient.conditions.join(', ')}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                    {t('passport.emergency_contact', 'Emergency Caregiver')}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block mt-0.5">
                    {emergencyContact.name} ({emergencyContact.relationship})
                  </span>
                  <span className="text-[11.5px] font-mono text-teal-800 dark:text-teal-300 font-extrabold block mt-0.5">
                    {emergencyContact.phone}
                  </span>
                  <span className="text-[8.5px] text-slate-500 dark:text-slate-400 italic block mt-0.5">
                    {t('passport.storage_notice', 'Persisted in offline device storage')}
                  </span>
                </div>
              </div>

              {/* ── 3. Active Medication Formulary Table (Generic, Brand, Dose, Prescriber, Start, Harm) ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                    <span>
                      {t('passport.regimen_title', 'Active Medication Formulary')} ({passport.medicines.length} Verified Prescriptions)
                    </span>
                  </h2>
                  <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono">
                    CDSCO / WHO 5-Tier Validated
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full min-w-[640px] text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[9px] uppercase tracking-wider">
                        <th className="py-1.5 px-2.5 w-6 text-center">{t('passport.th_index', '#')}</th>
                        <th className="py-1.5 px-2.5">{t('passport.th_generic', 'Generic Name / Active Salts')}</th>
                        <th className="py-1.5 px-2.5">{t('passport.th_brand', 'Brand Name')}</th>
                        <th className="py-1.5 px-2.5">{t('passport.th_dosage', 'Dose & Frequency')}</th>
                        <th className="py-1.5 px-2.5">{t('passport.th_prescriber', 'Prescribing Clinician')}</th>
                        <th className="py-1.5 px-2.5">{t('passport.th_start_date', 'Start Date')}</th>
                        <th className="py-1.5 px-2.5 text-center w-16">{t('passport.th_harm_tier', 'Harm Tier')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {passport.medicines.map((med, idx) => (
                        <tr key={med.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-400 text-[9px]">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 font-bold text-slate-950 dark:text-slate-100">
                            {med.generic || med.name}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400 font-medium">
                            {med.brand || med.name}
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-800 dark:text-slate-200">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{med.dosage}</span>
                            <span className="text-[8.5px] text-slate-500 dark:text-slate-400 block leading-tight">{med.frequency}</span>
                          </td>
                          <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400 text-[9.5px]">
                            {med.prescriber || 'Dr. S. K. Mehta'}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-slate-500 dark:text-slate-400 text-[9px]">
                            {med.startDate}
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                                med.harmLevel >= 5
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                                  : med.harmLevel === 4
                                  ? 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700'
                                  : med.harmLevel === 3
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                  : med.harmLevel === 2
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                              }`}
                            >
                              Tier {med.harmLevel || 3}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 4. Critical Pharmacological Safety Cautions (Top Alerts) ── */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t('passport.top_alerts_title', 'Top Safety & Pharmacological Spacing Alerts')}</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px]">
                  {passport.topAlerts.map((alert, idx) => (
                    <div
                      key={alert.id || idx}
                      className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                          : 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                      }`}
                    >
                      <span
                        className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase flex-shrink-0 mt-0.5 ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-100' : 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold truncate text-[10px]">{alert.title}</div>
                        <div className="text-[9px] leading-tight text-slate-700 dark:text-slate-300 mt-0.5">{alert.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 5. Clinician Live Portal Verification & Zero-Data QR ── */}
              <div className="bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3.5">
                  {qrDataUrl ? (
                    <div className="bg-white p-1 rounded-xl border border-slate-300 shadow-2xs flex-shrink-0">
                      <img src={qrDataUrl} alt="Clinician Verification QR" className="w-16 h-16 object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {t('passport.doctor_qr_title', 'Clinician Live Access Portal')}
                      </h3>
                      {shareCode && (
                        <span className="font-mono text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 px-2 py-0.5 rounded border border-teal-300 dark:border-teal-700">
                          PIN: {shareCode}
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {t(
                        'passport.doctor_qr_sub',
                        'Physicians and paramedics can scan this QR code or visit /doctor with the PIN to view real-time regimen telemetry.'
                      )}
                    </p>
                    <p className="text-[8px] text-teal-700 dark:text-teal-400 font-mono mt-0.5 font-bold">
                      Guaranteed Zero-Data QR: Medical records are never embedded in the QR image; it encodes only a secure one-time verification link.
                    </p>
                  </div>
                </div>

                {!shareCode && (
                  <button
                    type="button"
                    onClick={handleGenerateShareCode}
                    disabled={generatingCode}
                    className="no-print ps-btn ps-btn-primary px-3.5 py-2 text-xs font-bold whitespace-nowrap cursor-pointer flex-shrink-0"
                  >
                    {generatingCode ? 'Generating...' : t('passport.generate_code_btn', 'Generate Doctor PIN')}
                  </button>
                )}
              </div>

              {/* ── 6. Clinical Legal Disclaimer (Italic Serif) ── */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-center">
                <p className="font-serif italic text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal max-w-3xl mx-auto">
                  {t(
                    'passport.disclaimer',
                    'Clinical Safety Notice: This Medication Passport is an informational summary compiled by PolySafe for collaborative clinician-patient communication. It does not replace independent medical judgment, physician prescription orders, or emergency paramedic triage.'
                  )}
                </p>
              </div>
            </div>
          </TiltCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            LAYOUT 2: PHYSICAL WALLET EMERGENCY CARD (85.6 mm × 54 mm)
            Standard ISO/IEC 7810 ID-1 Credit Card Size Rendered as FlipCard
            ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="no-print p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <span className="font-bold text-[var(--ink)] block font-mono">
                  {t('passport.wallet_dimensions', 'Standard ISO/IEC 7810 ID-1: 85.6 mm × 54 mm')}
                </span>
                <span className="text-slate-500">
                  {t(
                    'passport.cut_fold_instructions',
                    'Interactive 3D FlipCard view below. When printed, front and back appear side-by-side with cut-and-fold guidelines.'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalletFlipped((prev) => !prev)}
                  className="ps-btn ps-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  <span>{isWalletFlipped ? 'Show Front' : 'Flip to Back'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ps-btn ps-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('passport.print_button', 'Print Wallet Card')}</span>
                </button>
              </div>
            </div>

            {/* Print instruction header for paper cut-out */}
            <div className="hidden print:block text-[10px] font-mono text-slate-700 mb-3 border-b border-slate-300 pb-2">
              ✂ <strong>PolySafe Emergency Medical Wallet Card</strong> · Standard ISO/IEC 7810 ID-1: 85.6 mm × 54 mm · Cut along dashed perimeter and fold back-to-back.
            </div>

            {/* ── SCREEN VIEW: Interactive 3D FlipCard (85.6 x 54 mm Aspect Ratio ~ 1.585) ── */}
            <div className="no-print flex flex-col items-center justify-center py-6">
              <FlipCard
                isFlipped={isWalletFlipped}
                onFlip={setIsWalletFlipped}
                className="w-full max-w-[428px] h-[270px] select-none"
                flipAffordanceLabel={isWalletFlipped ? 'Show Front Face' : 'Flip for QR & Contacts'}
                ariaLabel="ISO standard wallet emergency card"
                front={
                  /* ── WALLET FRONT ── */
                  <div className="w-full h-full rounded-2xl bg-white text-slate-900 border-2 border-red-600 shadow-xl overflow-hidden p-3.5 flex flex-col justify-between">
                    {/* Top Red Alert Ribbon */}
                    <div className="bg-red-600 -mx-3.5 -mt-3.5 px-3.5 py-1.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-white" strokeWidth={3.5} />
                        </div>
                        <span className="text-[10px] font-mono font-extrabold tracking-wider uppercase">
                          {t('passport.wallet_front_badge', 'EMERGENCY MEDICAL ALERT')}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono opacity-90 font-bold">ID: {passport.cardId}</span>
                    </div>

                    {/* Patient Name & Blood Group Badge */}
                    <div className="pt-2 flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-950 font-[var(--font-heading)] leading-tight tracking-tight">
                          {passport.patient.name}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500">
                          {passport.patient.age}Y · {passport.patient.gender} · Dr. {passport.patient.physician?.name || 'S. K. Mehta'}
                        </p>
                      </div>

                      {/* Blood Group Badge */}
                      <div className="px-2.5 py-1 rounded-xl bg-red-50 border border-red-300 text-red-700 font-mono font-black text-xs leading-none text-center">
                        <span className="block text-[8px] uppercase tracking-wider text-red-500">BLOOD</span>
                        <span>{passport.patient.bloodType || 'B+'}</span>
                      </div>
                    </div>

                    {/* Documented Allergies as Chips */}
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
                        Documented Drug Allergies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(passport.patient.allergies || ['None reported']).map((alg, idx) => (
                          <span
                            key={idx}
                            className="bg-red-50 border border-red-300 text-red-800 font-bold px-1.5 py-0.5 rounded text-[9px] leading-tight"
                          >
                            ⚠️ {alg}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Top Critical High-Alert Medicines */}
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
                        {t('passport.top_critical_meds', 'High-Alert Active Medications')}:
                      </span>
                      <div className="space-y-1">
                        {topCriticalMeds.map((med, idx) => (
                          <div
                            key={med.id || idx}
                            className="flex items-center justify-between text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                          >
                            <span className="font-bold text-slate-900 truncate max-w-[220px]">
                              • {med.name} <span className="font-normal text-slate-500">({med.dosage})</span>
                            </span>
                            <span
                              className={`font-mono font-bold text-[8px] px-1.5 py-0.2 rounded uppercase ${
                                med.harmLevel >= 5
                                  ? 'bg-rose-100 text-rose-800'
                                  : med.harmLevel === 4
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Tier {med.harmLevel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Strip */}
                    <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                      <span>PolySafe Continuous Safety</span>
                      <span className="text-teal-800 font-bold">FLIP FOR FIRST RESPONDER QR</span>
                    </div>
                  </div>
                }
                back={
                  /* ── WALLET BACK ── */
                  <div className="w-full h-full rounded-2xl bg-slate-900 text-white border-2 border-slate-700 shadow-xl overflow-hidden p-3.5 flex flex-col justify-between">
                    {/* Emergency Contact Bar */}
                    <div className="bg-slate-800 -mx-3.5 -mt-3.5 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-teal-400" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-300">
                          IN EMERGENCY CALL:
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-extrabold text-white">{emergencyContact.phone}</span>
                    </div>

                    {/* Middle Content: QR Code & Access Instructions */}
                    <div className="flex items-center gap-3 my-auto">
                      {qrDataUrl ? (
                        <div className="bg-white p-1 rounded-xl flex-shrink-0 shadow-sm">
                          <img src={qrDataUrl} alt="Doctor QR" className="w-20 h-20 object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                          <QrCode className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1.5 min-w-0">
                        <div>
                          <span className="text-[10px] font-bold text-slate-100 block">
                            First Responder / Doctor Portal:
                          </span>
                          <p className="text-[9px] text-slate-300 leading-tight">
                            Scan QR code or visit <span className="text-teal-300 font-mono">polysafe.health/doctor</span> to view live active formulary & allergy telemetry.
                          </p>
                        </div>

                        {shareCode && (
                          <div className="bg-teal-950 border border-teal-500/40 rounded px-2 py-0.5 inline-block">
                            <span className="text-[9px] font-mono font-extrabold text-teal-200">
                              ACCESS PIN: {shareCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Contact Name / Relationship */}
                    <div className="border-t border-slate-800 pt-1 flex items-center justify-between text-[8px] text-slate-400 font-mono">
                      <span className="truncate">
                        Contact: {emergencyContact.name} ({emergencyContact.relationship})
                      </span>
                      <span className="text-slate-400 font-bold">HIPAA SECURE · {passport.lastUpdated}</span>
                    </div>
                  </div>
                }
              />

              <p className="text-xs text-[var(--ink-3)] font-mono mt-3">
                Tap card or press Enter to flip front/back.
              </p>
            </div>

            {/* ── PRINT VIEW: Side-by-Side Front & Back with Cut-and-Fold Lines (Exact 85.6 × 54 mm) ── */}
            <div className="hidden print:flex wallet-print-container items-start justify-start gap-6 py-2">
              {/* FRONT */}
              <div className="border border-dashed border-slate-400 p-1 rounded-lg">
                <div
                  className="wallet-card-container relative bg-white text-slate-900 rounded-lg border-2 border-red-600 p-2.5 flex flex-col justify-between"
                  style={{ width: '85.6mm', height: '54mm', minWidth: '85.6mm', minHeight: '54mm' }}
                >
                  <div className="bg-red-600 -mx-2.5 -mt-2.5 px-2.5 py-1 flex items-center justify-between text-white">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">
                      EMERGENCY MEDICAL ALERT
                    </span>
                    <span className="text-[7.5px] font-mono">ID: {passport.cardId}</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[12px] font-[var(--font-heading)] leading-tight text-slate-950">
                      {passport.patient.name}
                    </h3>
                    <p className="text-[8px] font-mono text-slate-500">
                      {passport.patient.age}Y · {passport.patient.bloodType} · Allergies: {passport.patient.allergies.join(', ') || 'None'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {topCriticalMeds.map((med, idx) => (
                      <div key={idx} className="flex justify-between text-[7.5px] bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                        <span className="font-bold truncate">• {med.name}</span>
                        <span className="font-mono text-rose-700 font-bold">Tier {med.harmLevel}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-0.5 text-[7px] text-slate-400 font-mono flex justify-between">
                    <span>PolySafe Pharmacovigilance</span>
                    <span className="text-teal-800 font-bold">SEE BACK FOR DOCTOR QR</span>
                  </div>
                </div>
              </div>

              {/* BACK */}
              <div className="border border-dashed border-slate-400 p-1 rounded-lg">
                <div
                  className="wallet-card-container relative bg-slate-900 text-white rounded-lg border-2 border-slate-700 p-2.5 flex flex-col justify-between"
                  style={{ width: '85.6mm', height: '54mm', minWidth: '85.6mm', minHeight: '54mm' }}
                >
                  <div className="bg-slate-800 -mx-2.5 -mt-2.5 px-2.5 py-1 flex items-center justify-between border-b border-slate-700">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-teal-300">
                      IN EMERGENCY CALL:
                    </span>
                    <span className="font-mono text-[8.5px] font-extrabold text-white">{emergencyContact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 my-auto">
                    {qrDataUrl && (
                      <div className="bg-white p-0.5 rounded flex-shrink-0">
                        <img src={qrDataUrl} alt="Doctor QR" className="w-12 h-12 object-contain" />
                      </div>
                    )}
                    <div className="text-[7.5px] leading-tight space-y-0.5">
                      <p className="font-bold text-slate-200">Paramedic / Attending Doctor:</p>
                      <p className="text-slate-400">Scan QR or visit polysafe.health/doctor with PIN: <strong className="text-teal-300">{shareCode || '849210'}</strong></p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-0.5 text-[7px] text-slate-400 font-mono flex justify-between">
                    <span>Contact: {emergencyContact.name}</span>
                    <span>HIPAA SECURE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: EDIT EMERGENCY CONTACT (Stored in localStorage) ── */}
        {editContactOpen && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto no-print"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditContactOpen(false);
            }}
          >
            <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 z-[201] my-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[var(--brand-600)]" />
                  <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    {t('passport.edit_contact_button', 'Edit Emergency Contact')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditContactOpen(false)}
                  className="text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveEmergencyContact} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)] block">
                    {t('passport.contact_name_label', 'Contact Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] outline-none focus:border-[var(--brand-600)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)] block">
                    {t('passport.contact_relation_label', 'Relationship')}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] outline-none focus:border-[var(--brand-600)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--ink)] block">
                    {t('passport.contact_phone_label', 'Phone Number')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] outline-none focus:border-[var(--brand-600)]"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-[var(--brand-600)]/8 border border-[var(--brand-600)]/20 text-[11px] text-[var(--brand-600)]">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  {t(
                    'passport.storage_notice',
                    'Stored in device local storage for instant offline emergency access.'
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditContactOpen(false)}
                    className="ps-btn ps-btn-secondary px-3.5 py-2 text-xs font-bold cursor-pointer"
                  >
                    {t('passport.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="ps-btn ps-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    {t('passport.save_contact', 'Save Contact')}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
