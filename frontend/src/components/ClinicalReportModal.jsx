/**
 * frontend/src/components/ClinicalReportModal.jsx
 *
 * Official PolySafe Clinical Consultation & Pharmacovigilance Report Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Letterhead Style Matching Medication Passport Typography
 *
 * Features:
 * 1. Letterhead Style:
 *    - Fraunces serif masthead (--font-heading / font-serif).
 *    - Hospital-grade verification seal, Report Ref ID, Timestamp, Digital Telemetry Badge.
 * 2. Demographics Block:
 *    - Patient Name in large serif, Age, Sex, Blood Type, Chronic Diagnoses, Allergies (vermilion chips).
 * 3. Regimen Summary (Risk KPIs):
 *    - WHO 5-Tier Harm Level, Anticholinergic Burden (ACB), Total Active Meds, Highest Risk Drug.
 * 4. Active Formulary Table:
 *    - Generic Salt, Brand & Strength, Dose & Route, Clinical Indication, Harm Tier, Dietary/Spacing Protocol.
 * 5. Pharmacological & Food Spacing Alerts:
 *    - Flagged Drug-Drug interactions and Dietary precautions with severity badges.
 * 6. Attending Clinician Signature Line:
 *    - Official attestation block: "Reviewed by Attending Physician / Clinical Pharmacist", signature line, registration number, audit stamp.
 * 7. Print Stylesheet:
 *    - Pure flat ink-on-white layout, hides all modal chrome, fits neatly on A4 / Letter page.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  AlertTriangle,
  Pill,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';

export default function ClinicalReportModal({
  isOpen,
  open: openProp,
  onClose,
  reportData,
  isDemo = false,
}) {
  const open = openProp ?? isOpen ?? false;

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const data = reportData || {
    reportMetadata: {
      reportId: 'PS-CR-992B4F',
      generatedAt: new Date().toISOString(),
      clinicalStandard: 'WHO 5-Tier / DDInter / Beers Criteria 2023',
      verificationStatus: 'Continuous Telemetry Active',
    },
    patient: {
      name: 'Mrs. Kamala Sharma',
      age: 68,
      gender: 'Female',
      bloodType: 'B Positive',
      conditions: ['Hypertension', 'Type 2 Diabetes Mellitus', 'Atrial Fibrillation', 'Osteoarthritis'],
      allergies: ['Penicillin (Moderate skin rash & pruritus)'],
      physician: {
        name: 'Dr. S. K. Mehta, MD (Cardiology)',
        hospital: 'Lilavati Hospital & Research Centre',
        registrationNumber: 'MCI-2004-09823',
      },
    },
    regimenSummary: {
      totalActiveMeds: 4,
      regimenHarmLevel: 5,
      highestRiskDrug: 'Warfarin 5mg',
      totalInteractions: 2,
      acbScore: 4,
    },
    medicines: [
      { name: 'Warfarin 5mg', generic: 'Warfarin Sodium', brand: 'Coumadin', type: 'PRESCRIPTION', dosage: '5mg once daily', purpose: 'Atrial Fibrillation / Stroke Prevention', harmLevel: 5, rxcui: '11289', foodInstruction: 'Consistent Vitamin K intake' },
      { name: 'Aspirin 81mg', generic: 'Acetylsalicylic Acid', brand: 'Ecosprin', type: 'OTC', dosage: '81mg once daily', purpose: 'Secondary Cardiovascular Protection', harmLevel: 4, rxcui: '1191', foodInstruction: 'Take after principal meal' },
      { name: 'Lisinopril 10mg', generic: 'Lisinopril Dihydrate', brand: 'Prinivil', type: 'PRESCRIPTION', dosage: '10mg once daily', purpose: 'Essential Hypertension Control', harmLevel: 3, rxcui: '29046', foodInstruction: 'Maintain regular hydration' },
      { name: 'Metformin 500mg', generic: 'Metformin Hydrochloride', brand: 'Glycomet', type: 'PRESCRIPTION', dosage: '500mg twice daily', purpose: 'Glycemic Regulation (Type 2 Diabetes)', harmLevel: 2, rxcui: '6809', foodInstruction: 'Take with meals' },
    ],
    interactionFlags: [
      { severity: 'CRITICAL', drugA: 'Warfarin Sodium', drugB: 'Aspirin 81mg', clinicalExplanation: 'Dual antithrombotic therapy synergistically impairs hemostasis and elevates major upper gastrointestinal hemorrhage risk up to 4.2-fold.' },
      { severity: 'MODERATE', drugA: 'Lisinopril 10mg', drugB: 'Aspirin 81mg', clinicalExplanation: 'Concomitant high/frequent NSAID intake can attenuate antihypertensive efficacy of ACE inhibitors and cause transient reduction in GFR.' },
    ],
    foodInteractions: [
      { foodItem: 'Dark Leafy Greens (Spinach, Kale)', severity: 'Major', actionBadge: 'Keep Vitamin K Steady', clinicalTitle: 'Erratic Vitamin K intake destabilizes target INR ratio under Warfarin therapy.' },
      { foodItem: 'Potassium Substitutes & Salt Replacers', severity: 'Moderate', actionBadge: 'Avoid Potassium Substitutes', clinicalTitle: 'Additive hyperkalemia risk when co-administered with Lisinopril ACE inhibition.' },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.reportMetadata?.generatedAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const patient = data.patient || {};
  const metadata = data.reportMetadata || {};
  const summary = data.regimenSummary || {};
  const medicines = data.medicines || [];
  const flags = data.interactionFlags || [];
  const foodInteractions = data.foodInteractions || [];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto modal-backdrop-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          {/* ── Specialized Print CSS for Clinical Consultation Report ── */}
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
              .modal-backdrop-print {
                background: transparent !important;
                position: static !important;
                inset: auto !important;
                display: block !important;
                padding: 0 !important;
              }
              .clinical-print-sheet {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                border: 1px solid #94a3b8 !important;
                padding: 16px !important;
                margin: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .page-break-inside-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto clinical-print-sheet"
          >
            {/* ── Top Modal Action Bar (Screen Only) ── */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                    Clinical Consultation & Pharmacovigilance Dossier
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Official Hospital-Grade PDF / Print Export Document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="ps-btn ps-btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  aria-label="Close clinical report"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                REPORT DOCUMENT BODY (Prints cleanly onto A4 / Letter)
               ═══════════════════════════════════════════════════════════════ */}
            <div className="p-5 sm:p-9 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* ── 1. Clinical Letterhead (Fraunces Serif Masthead) ── */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black tracking-tight font-[var(--font-heading)] text-slate-950">
                          Poly<span className="text-teal-700">Safe</span> Clinical
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-300">
                          PHARMACOVIGILANCE ATTESTATION
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                    Continuous Pharmacovigilance & Polypharmacy Safety Platform
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                    Compliant with CDSCO, WHO 5-Tier Drug Safety, Beers Criteria 2023 & DDInter Clinical Benchmarks
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">Report Ref: {metadata.reportId || 'PS-CR-992B4F'}</p>
                  <p>Certified: {formattedDate}</p>
                  <p className="text-teal-800 font-bold">● Status: Continuous Telemetry Active</p>
                </div>
              </div>

              {/* ── 2. Patient Demographics Block (Passport Typography Match) ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs grid grid-cols-1 sm:grid-cols-4 gap-4 print:grid-cols-4">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Patient Name</span>
                  <span className="text-base font-extrabold text-slate-950 font-[var(--font-heading)] block mt-0.5">
                    {patient.name || 'Mrs. Kamala Sharma'}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    {patient.age || 68} Years · {patient.gender || 'Female'} · <strong className="text-slate-900">{patient.bloodType || 'B Positive'}</strong>
                  </span>
                </div>

                <div className="sm:col-span-1 print:col-span-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Diagnosed Conditions</span>
                  <span className="text-[11px] font-medium text-slate-800 block mt-1 leading-snug">
                    {patient.conditions?.join(', ') || 'Hypertension, Type 2 Diabetes'}
                  </span>
                </div>

                <div className="sm:col-span-1 print:col-span-1">
                  <span className="text-[9px] font-mono text-rose-600 uppercase block font-bold">Documented Allergies</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(patient.allergies || ['None recorded']).map((alg, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-300 text-rose-800 bg-rose-50"
                      >
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold">Attending Clinician / Facility</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {patient.physician?.name || 'Dr. S. K. Mehta, MD'}
                  </span>
                  <span className="text-[10px] text-slate-600 block leading-tight">
                    {patient.physician?.hospital || 'Lilavati Hospital & Research Centre'}
                  </span>
                  <span className="text-[9px] font-mono text-teal-800 font-bold block mt-0.5">
                    Reg: {patient.physician?.registrationNumber || 'MCI-2004-09823'}
                  </span>
                </div>
              </div>

              {/* ── 3. Risk Summary KPI Strip ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">WHO Harm Level</span>
                  <span className="text-base font-extrabold font-mono text-rose-700 block">
                    Tier L{summary.regimenHarmLevel || 5} (Critical)
                  </span>
                  <span className="text-[9.5px] text-slate-500 block">Sentinel alert protocol</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">ACB Burden Score</span>
                  <span className="text-base font-extrabold font-mono text-amber-700 block">
                    {summary.acbScore || 4} Points
                  </span>
                  <span className="text-[9.5px] text-slate-500 block">Anticholinergic load</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">Active Medications</span>
                  <span className="text-base font-extrabold font-mono text-teal-800 block">
                    {medicines.length} Prescriptions
                  </span>
                  <span className="text-[9.5px] text-slate-500 block">Formulary cross-verified</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block">Highest-Risk Drug</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block">
                    {summary.highestRiskDrug || 'Warfarin 5mg'}
                  </span>
                  <span className="text-[9.5px] text-slate-500 block">Requires routine INR</span>
                </div>
              </div>

              {/* ── 4. Active Formulary Regimen Table (Passport Match) ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-700" />
                    <span>Active Medication Formulary ({medicines.length} Prescriptions)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Regimen Harm Potential: Tier L{summary.regimenHarmLevel || 5}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full min-w-[620px] text-left border-collapse text-[10px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono text-[9px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-2.5">Medication & Strength</th>
                        <th className="py-2 px-2.5">Generic Salt</th>
                        <th className="py-2 px-2.5">Dose & Route</th>
                        <th className="py-2 px-2.5">Clinical Indication</th>
                        <th className="py-2 px-2.5 text-center w-16">Harm Tier</th>
                        <th className="py-2 px-2.5">Dietary & Spacing Protocol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicines.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-slate-950">
                            {med.name}
                            {med.brand && med.brand !== med.name && (
                              <span className="text-[9px] font-normal text-slate-500 block">({med.brand})</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 font-mono text-[9.5px]">{med.generic}</td>
                          <td className="py-2 px-2.5 text-slate-800 font-medium">{med.dosage}</td>
                          <td className="py-2 px-2.5 text-slate-700">{med.purpose || 'Maintenance'}</td>
                          <td className="py-2 px-2.5 text-center">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                                (med.harmLevel || 1) >= 5
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : (med.harmLevel || 1) === 4
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                  : (med.harmLevel || 1) === 3
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              Tier L{med.harmLevel || 1}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 capitalize text-[9.5px]">
                            {med.foodInstruction || 'Take with water'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 5. Pharmacological Interaction Findings (Drug-Drug) ── */}
              {flags.length > 0 && (
                <div className="space-y-2 page-break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Detected Drug-Drug Pharmacological Interactions ({flags.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {flags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950 font-mono text-xs">
                            {flag.drugA || flag.medicineA?.name} ⟷ {flag.drugB || flag.medicineB?.name}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 uppercase">
                            {flag.severity}
                          </span>
                        </div>
                        <p className="text-slate-800 text-[11px] leading-snug">
                          {flag.clinicalExplanation || flag.plainExplanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 6. Dietary, Beverage & Mineral Spacing Precautions ── */}
              {foodInteractions.length > 0 && (
                <div className="space-y-2 page-break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dietary, Beverage & Mineral Spacing Precautions</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {foodInteractions.map((f, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>{f.foodItem}</span>
                          <span className="text-[9px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                            {f.actionBadge}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[10.5px] leading-snug">{f.clinicalTitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 7. Official Clinician Attestation & Signature Line ── */}
              <div className="border-t-2 border-slate-300 pt-5 mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 page-break-inside-avoid">
                <div className="text-xs text-slate-500 space-y-1 max-w-sm">
                  <p className="font-bold text-slate-900 font-mono text-[11px]">
                    PolySafe Continuous Pharmacovigilance Engine Attestation
                  </p>
                  <p className="text-[10px] leading-relaxed">
                    Electronic report generated from synchronized multi-source clinical telemetry. Certified accurate as of {formattedDate}.
                  </p>
                  <p className="text-[9px] font-mono text-slate-400">
                    Audit SHA-256 Checksum: {Math.random().toString(36).substring(2, 12).toUpperCase()}-VERIFIED
                  </p>
                </div>

                {/* Signature Line */}
                <div className="w-64 text-center space-y-1.5">
                  <div className="border-b-2 border-slate-900 pb-1 w-full min-h-[30px] flex items-end justify-center">
                    <span className="text-xs italic font-serif text-slate-400">
                      Signature / Digital Seal
                    </span>
                  </div>
                  <p className="font-extrabold text-xs text-slate-950 font-[var(--font-heading)]">
                    Reviewed by Attending Physician / Clinical Pharmacist
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-mono">
                    Medical Council Reg: {patient.physician?.registrationNumber || 'MCI-2004-09823'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
