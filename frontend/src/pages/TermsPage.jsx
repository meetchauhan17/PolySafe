import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, AlertTriangle, ShieldCheck, HeartPulse, Stethoscope, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-xs font-semibold"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-2 text-xs text-[var(--ink-3)] font-mono">
            <span>Effective Date: October 2026</span>
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-8 sm:p-10 border border-[var(--border)] shadow-sm mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20 flex items-center justify-center mb-6">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-[var(--font-heading)] mb-3">
            Terms of Service & Medical Disclaimer
          </h1>
          <p className="text-base text-[var(--ink-3)] leading-relaxed">
            Please read these terms carefully before utilizing the PolySafe platform. By accessing or using PolySafe, you agree to be bound by these clinical terms and responsibilities.
          </p>
        </div>

        {/* Emergency Alert Banner */}
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 mb-8 text-rose-800 dark:text-rose-200">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1">Emergency Medical Notice</h3>
              <p className="text-xs leading-relaxed opacity-95">
                PolySafe is NOT an emergency response service. If you or a loved one are experiencing severe chest pain, shortness of breath, sudden weakness, allergic anaphylaxis, acute confusion, or symptoms of medical poisoning, immediately contact emergency services (<strong>108 / 112 in India</strong>, <strong>911 in the US</strong>) or report to the nearest hospital emergency room.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-8 text-sm leading-relaxed text-[var(--ink-2)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[var(--brand-600)]" />
              1. Informational Clinical Support — Not Medical Advice
            </h2>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              PolySafe provides algorithmic screening, pharmacovigilance calculations, and educational summaries derived from published medical guidelines (WHO, DDInter, FDA OFFSIDES, AGS Beers Criteria). The platform is intended to assist patients, caregivers, and clinicians in identifying potential risks. <strong>PolySafe does not provide formal medical diagnoses, nor does it replace the clinical judgment of a licensed physician or pharmacist.</strong> Never discontinue, initiate, or alter prescribed medication dosages without direct consultation with your healthcare provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-[var(--brand-600)]" />
              2. Accuracy of Patient-Logged Medications
            </h2>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              The precision of PolySafe's interaction detection, Anticholinergic Cognitive Burden (ACB) calculations, and cascade identification relies directly on the completeness and accuracy of medications logged by the user. While our Indian Brand Resolver and Optical Character Recognition (OCR) systems provide automated matching, patients and caregivers must verify that listed active salts and dosages correspond to current physician prescriptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--brand-600)]" />
              3. User Accounts and Security
            </h2>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              Users are responsible for maintaining the confidentiality of their login credentials. PolySafe employs two-factor verification codes, bcrypt password salting, and automated account lockouts after consecutive failed attempts. Sharing access with caregivers or physicians should be conducted solely through authorized connection approval tokens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
              4. Limitation of Liability
            </h2>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              To the maximum extent permitted by applicable law, PolySafe and its clinical developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform, including any adverse drug reactions or delays in seeking medical attention.
            </p>
          </section>

          <section className="pt-6 border-t border-[var(--border)] text-xs text-[var(--ink-3)] flex items-center justify-between flex-wrap gap-4">
            <p>For legal or governance inquiries: <strong className="text-[var(--ink)]">legal@polysafe.app</strong></p>
            <Link to="/privacy" className="text-[var(--brand-600)] hover:underline font-semibold">
              Read Privacy Policy →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
