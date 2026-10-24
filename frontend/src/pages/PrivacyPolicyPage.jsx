import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Server, Database, UserX, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';

export default function PrivacyPolicyPage() {
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
            <span>Last Updated: October 2026</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> HIPAA & GDPR Compliant
            </span>
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-8 sm:p-10 border border-[var(--border)] shadow-sm mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20 flex items-center justify-center mb-6">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-[var(--font-heading)] mb-3">
            PolySafe Privacy Policy & Clinical Data Protection
          </h1>
          <p className="text-base text-[var(--ink-3)] leading-relaxed">
            Your medical records and medication history are strictly confidential. PolySafe is built on zero-knowledge architecture, state-of-the-art cryptography, and strict patient-first privacy principles.
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1">Zero Commercialization</h3>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              We never sell, rent, monetize, or broker your health data to pharmaceutical companies, advertisers, or third-party data brokers.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1">End-to-End Encryption</h3>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              All data in transit is encrypted using TLS 1.3, and all clinical records at rest are secured with AES-256 bit database encryption.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1">Deterministic Local Safety</h3>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              Core interaction checks and ACB calculations execute on deterministic verified local tables without sending records across public AI clouds.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
              <UserX className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1">Right to Erasure (GDPR)</h3>
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">
              You retain total control over your health records. You can export or permanently delete your account and all medical logs at any time.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-8 sm:p-10 border border-[var(--border)] space-y-8 text-sm leading-relaxed text-[var(--ink-2)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
              1. Information We Collect
            </h2>
            <p className="mb-2">We collect only information necessary to ensure safe polypharmacy evaluation:</p>
            <ul className="list-disc pl-6 space-y-1 text-xs text-[var(--ink-3)]">
              <li><strong>Account Credentials:</strong> Email address, hashed password (salted with 12 bcrypt rounds), and role type (Patient, Caregiver, Doctor).</li>
              <li><strong>Medication Records:</strong> Active medication names, dosages, frequencies, dates added, and prescription notes.</li>
              <li><strong>Patient Profile:</strong> Age, diagnosed chronic conditions, and documented allergies (for Beers Criteria and contraindication checks).</li>
              <li><strong>Symptom Logs:</strong> Patient-reported side effects used solely for prescribing cascade loop detection.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
              2. How Your Clinical Data Is Processed
            </h2>
            <p className="text-xs text-[var(--ink-3)]">
              Your medication lists are cross-referenced with verified clinical pharmacopeias (DDInter, FDA OFFSIDES, and AGS Beers Criteria). When AI-powered plain language explanations are generated, requests are scrubbed of direct identifiers (names, emails, phone numbers) before passing through ephemeral inference APIs with zero data retention agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
              3. Caregiver & Physician Sharing
            </h2>
            <p className="text-xs text-[var(--ink-3)]">
              Your clinical dashboard is strictly private by default. Access by caregivers or attending physicians requires mutual cryptographic connection confirmation (QR code scan or invitation code). You can revoke access at any time from the Connected People panel with instantaneous effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--brand-600)]" />
              4. Data Retention & Account Deletion
            </h2>
            <p className="text-xs text-[var(--ink-3)]">
              In accordance with GDPR Article 17 and HIPAA guidelines, clicking "Delete Account" in your profile triggers an immediate cascading deletion of your user profile, patient dossier, prescriptions, interaction flags, and dose tracking history from our primary database and cache.
            </p>
          </section>

          <section className="pt-6 border-t border-[var(--border)] text-xs text-[var(--ink-3)] flex items-center justify-between flex-wrap gap-4">
            <p>For questions or privacy inquiries, contact our Data Protection Officer at: <strong className="text-[var(--ink)]">privacy@polysafe.app</strong></p>
            <Link to="/terms" className="text-[var(--brand-600)] hover:underline font-semibold">
              Read Terms of Service →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
