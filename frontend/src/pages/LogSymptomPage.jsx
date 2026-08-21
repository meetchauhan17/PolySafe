import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HeartPulse,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Mic,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import Card from '../components/Card';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import PolySafeTextarea from '../components/PolySafeTextarea';
import PolySafeInput from '../components/PolySafeInput';

// ─── Quick-select symptom suggestions ────────────────────────────────────────
const QUICK_SYMPTOMS = [
  'Leg swelling',
  'Ankle swelling',
  'Confusion or memory problems',
  'Constipation',
  'Dizziness',
  'Dry mouth',
  'Nausea',
  'Heartburn or stomach pain',
  'Frequent urination',
  'Urinary retention',
  'Falls or unsteadiness',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function LogSymptomPage() {
  const navigate  = useNavigate();
  const { isGuest, openGuestLockModal } = useAuth();
  const textareaRef = useRef(null);

  const [description, setDescription] = useState('');
  const [dateLogged, setDateLogged]   = useState(todayISO());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState(null);

  // Quick-select appends / replaces
  const handleQuickSelect = (sym) => {
    const lower = sym.toLowerCase();
    if (description.toLowerCase().includes(lower)) return; // already mentioned
    setDescription((prev) => prev ? `${prev.trimEnd()}, ${lower}` : lower);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      openGuestLockModal('log symptoms and cross-reference cascades');
      return;
    }
    setError(null);

    if (!description.trim() || description.trim().length < 3) {
      setError("Please describe what you're experiencing in at least a few words.");
      notify.warning('Description Required', "Please describe your symptom in at least a few words.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post(
        '/symptom',
        { description: description.trim(), dateLogged: new Date(dateLogged).toISOString() }
      );

      notify.success('Symptom Logged Successfully', 'Cross-referencing against your medication timeline...');
      // Pass result to the result page via navigation state
      navigate('/symptom-result', { state: { result: data, description: description.trim() } });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to log symptom. Please try again.';
      setError(msg);
      notify.error('Could Not Log Symptom', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[88vh] bg-[var(--brand-clay)] pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary p-2.5 rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Log a Symptom
            </h1>
            <p className="text-[11px] text-[#5C6B64]">
              PolySafe checks if it could be a side effect of your medicines — a "prescribing cascade."
            </p>
          </div>
        </div>

        {/* ── Info card ────────────────────────────────────────────────────── */}
        <div className="flex items-start space-x-3 p-4 bg-[#E4F2E9] border-2 border-[#2F8558]/30 rounded-2xl shadow-sm">
          <Info className="w-4 h-4 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1A5C3A] leading-relaxed">
            A <strong>prescribing cascade</strong> happens when a medicine causes a side effect that looks like a new illness, 
            leading to another prescription. We'll check if your symptom matches known patterns — and help you have the right 
            conversation with your doctor.
          </p>
        </div>

        {/* ── Main form card ───────────────────────────────────────────────── */}
        <Card
          title="What are you experiencing?"
          subtitle="Describe in your own words — no medical terms needed."
          icon={<HeartPulse className="w-5 h-5 text-[#2B6E5E]" />}
          className="space-y-6"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Description textarea */}
            <div className="space-y-2">
              <PolySafeTextarea
                ref={textareaRef}
                id="symptom-description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. My ankles have been swelling for the past few days, and I feel a bit dizzy when I stand up..."
                error={Boolean(error && !description.trim())}
                className="resize-none leading-relaxed"
              />
              <p className="text-[10px] text-[#5C6B64] font-mono text-right">{description.length} characters</p>
            </div>

            {/* Quick-select symptom chips */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64]">
                Common symptoms to tap and add
              </p>
              <div className="flex flex-wrap gap-2.5">
                {QUICK_SYMPTOMS.map((sym) => {
                  const isSelected = description.toLowerCase().includes(sym.toLowerCase());
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleQuickSelect(sym)}
                      className={`text-xs px-3.5 py-1.5 rounded-full font-semibold cursor-pointer transition-all duration-180 ease-out ${
                        isSelected
                          ? 'bg-[#2B6E5E] text-white shadow-sm'
                          : 'bg-[var(--brand-clay)] text-[#1C2B27] shadow-[2px_2px_5px_rgba(191,180,155,0.45),-2px_-2px_5px_rgba(255,255,255,0.6)] hover:shadow-[3px_3px_7px_rgba(191,180,155,0.55),-3px_-3px_7px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5)] hover:text-[#2B6E5E]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <label htmlFor="date-logged" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6B726C]">
                <CalendarDays className="w-3.5 h-3.5" />
                When did it start?
              </label>
              <PolySafeInput
                id="date-logged"
                type="date"
                value={dateLogged}
                max={todayISO()}
                onChange={(e) => setDateLogged(e.target.value)}
                leftIcon={<CalendarDays className="w-4 h-4" />}
              />
              <p className="text-[10px] text-[#9CA3AF]">
                Defaults to today. Change it if symptoms started earlier.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border-2 border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="log-symptom-submit"
              disabled={isSubmitting || (!description.trim() && !isGuest)}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 relative"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking your medicines...</span>
                </>
              ) : (
                <>
                  <span>Check for Prescribing Cascades</span>
                  <ArrowRight className="w-4 h-4" />
                  {isGuest && <Lock className="w-4 h-4 text-[#E7E1D3] ml-1" />}
                </>
              )}
            </button>
          </form>
        </Card>

        {/* ── Footer disclaimer ─────────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-[#9CA3AF] leading-relaxed px-4">
          This tool helps you identify possible drug side effects — it is not a diagnosis.
          Always discuss any symptom with your healthcare provider.
        </p>
      </div>
    </div>
  );
}
