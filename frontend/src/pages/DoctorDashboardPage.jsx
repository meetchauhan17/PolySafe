/**
 * DoctorDashboardPage.jsx — Clinical Physician Dashboard
 * Route: /doctor-dashboard
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Stethoscope, Loader2, AlertCircle, CheckCircle2, Clock,
  Pill, Leaf, ShoppingBag, AlertOctagon, ChevronRight,
  Users, Shield, Info, TriangleAlert, Plus, Search, X,
  FileText, Activity, Brain, ArrowDownCircle, Printer,
  Sparkles, Check, AlertTriangle,
  CalendarDays, Layers, Heart, FlaskConical,
  ArrowLeftRight, Send, MessageSquare, BarChart2,
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

async function substitutePatientDrug(payload) {
 const { data } = await axios.post('/connection/doctor-substitute', payload);
 return data;
}

async function publishDirective(payload) {
 const { data } = await axios.post('/connection/doctor-directive', payload);
 return data;
}

// ─── Severity colours ─────────────────────────────────────────────────────────
const SEV_CFG = {
 Contraindicated: { badge: 'bg-red-100 text-red-800 border-red-200', dot: '#B23D25', variant: 'danger' },
 Major: { badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: '#B23D25', variant: 'danger' },
 Moderate: { badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: '#B5791A', variant: 'caution' },
 Minor: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: '#A16207', variant: 'default' },
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/75 backdrop-blur-md overflow-y-auto animate-fade-in">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 10 }}
				className="w-full max-w-2xl bg-[var(--brand-surface)] border border-white/80 dark:border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[86vh] my-auto overflow-y-auto"
			>
				{/* Header */}
				<div className="flex items-start justify-between gap-4 border-b border-[var(--brand-border-subtle)] pb-4">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-[var(--role-doctor)]/10 border border-[var(--role-doctor)]/20 rounded-xl text-[var(--role-doctor)]">
							<Stethoscope className="w-6 h-6" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-[var(--text-primary)] font-display">
								Pre-Prescribing Safety Check
							</h2>
							<p className="text-xs text-[var(--text-muted)] mt-0.5">
								Patient (Age {patientAge || '—'}) · Real-time DDInter & Regimen Risk Simulator
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--chassis)] transition-colors cursor-pointer"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Clear Framing Notice */}
				<div className="flex items-start gap-2.5 p-3.5 bg-teal-500/10 border border-teal-500/25 rounded-xl text-xs text-[var(--text-primary)] leading-relaxed">
					<Info className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
					<p>
						<strong className="text-[var(--role-doctor)]">Clinical Simulator:</strong> Cross-checks the proposed drug against the patient's active medicines for direct DDInter flags and WHO/NCI tiered polypharmacy score changes before issuing a prescription.
					</p>
				</div>

				{/* Search & Input Form */}
				<form onSubmit={handleCheck} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{/* Drug Name with Autocomplete */}
						<div className="sm:col-span-2 space-y-1.5 relative">
							<label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
									className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
									autoFocus
								/>
								{checking && (
									<Loader2 className="w-4 h-4 text-[var(--role-doctor)] animate-spin absolute right-3 top-3" />
								)}
							</div>

							{/* Autocomplete Dropdown */}
							{showSuggestions && suggestions.length > 0 && (
								<div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--brand-surface)] border border-[var(--brand-border-subtle)] shadow-xl rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
									{suggestions.map((s, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => {
												setDrug(s.name);
												setShowSuggestions(false);
											}}
											className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--chassis)] flex items-center justify-between border-b border-[var(--brand-border-subtle)] last:border-0 cursor-pointer transition-colors"
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
							<label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
								Dosage (Optional)
							</label>
							<input
								type="text"
								value={dosage}
								onChange={(e) => setDosage(e.target.value)}
								placeholder="e.g. 500mg, 1 tab"
								className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2.5 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!drug.trim() || checking}
							className="btn-primary px-6 py-2.5 text-xs flex items-center gap-2 rounded-xl font-bold"
						>
							{checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
							<span>Simulate Safety Check</span>
						</button>
					</div>
				</form>

				{/* Error message */}
				{err && (
					<div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400">
						<AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
						<span>{err}</span>
					</div>
				)}

				{/* Result Evaluation Card */}
				{result && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-4 pt-3 border-t border-[var(--brand-border-subtle)]"
					>
						{/* Top Decision Banner */}
						<div
							className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
								result.decision === 'CRITICAL'
									? 'bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-300'
									: result.decision === 'CAUTION'
									? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-300'
									: 'bg-teal-500/10 border-teal-500/25 text-teal-900 dark:text-teal-300'
							}`}
						>
							<div className="flex items-center gap-3">
								{result.decision === 'CRITICAL' ? (
									<AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0" />
								) : result.decision === 'CAUTION' ? (
									<TriangleAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
								) : (
									<CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
								)}
								<div>
									<p className="text-sm font-bold uppercase tracking-wider font-display">
										Prescribing Decision: {result.decision}
									</p>
									<p className="text-xs opacity-90 mt-0.5 leading-relaxed">
										{result.decision === 'SAFE'
											? `No direct interaction detected with patient's ${result.currentRegimenCount} active medicines.`
											: result.decision === 'CRITICAL'
											? 'Severe pharmacological interaction or contraindicated combination identified.'
											: 'Moderate interaction or polypharmacy burden detected — clinical monitoring advised.'}
									</p>
								</div>
							</div>

							<span
								className={`text-xs font-black px-3 py-1 rounded-lg border shadow-2xs ${
									result.decision === 'CRITICAL'
										? 'bg-rose-100 text-rose-800 border-rose-300'
										: result.decision === 'CAUTION'
										? 'bg-amber-100 text-amber-900 border-amber-300'
										: 'bg-teal-100 text-teal-800 border-teal-300'
								}`}
							>
								{result.decision}
							</span>
						</div>

						{/* Drug Resolution & Regimen Impact Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Proposed Drug Details */}
							<div className="p-4 rounded-xl bg-[var(--chassis)] border border-[var(--chassis-dark)]/80 space-y-2 shadow-xs">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Proposed Drug</span>
									<DrugHarmBadge harmLevel={result.proposedDrug?.harmLevel} size="sm" />
								</div>
								<div>
									<p className="text-sm font-bold text-[var(--text-primary)] font-display">{result.proposedDrug?.name}</p>
									<p className="text-xs text-[var(--text-muted)] mt-0.5">
										Active Composition: <strong className="text-[var(--text-primary)]">{result.proposedDrug?.genericName}</strong>
									</p>
									{result.proposedDrug?.class && (
										<p className="text-[11px] text-[var(--text-muted)] mt-0.5">
											Class: {result.proposedDrug.class}
										</p>
									)}
								</div>
							</div>

							{/* Projected Regimen Impact */}
							<div className="p-4 rounded-xl bg-[var(--chassis)] border border-[var(--chassis-dark)]/80 space-y-2 shadow-xs">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Projected Regimen Risk</span>
									<span className="text-[10px] font-bold text-[var(--role-doctor)]">
										{result.currentRegimenCount + 1} total medicines
									</span>
								</div>
								<div className="flex items-baseline gap-2">
									<span className="text-xl font-black text-[var(--text-primary)] font-display">
										{result.projectedRegimenRisk}
									</span>
									{result.projectedAverageScore && (
										<span className="text-xs font-semibold text-[var(--text-muted)]">
											({result.projectedAverageScore} / 5.0 score)
										</span>
									)}
								</div>
								<p className="text-[11px] text-[var(--text-muted)] leading-tight">
									Calculated using WHO/NCI tiered polypharmacy index.
								</p>
							</div>
						</div>

						{/* Interaction Flags List */}
						{result.flags && result.flags.length > 0 && (
							<div className="space-y-2">
								<p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
									<AlertOctagon className="w-3.5 h-3.5" />
									<span>{result.flags.length} Interaction Flag{result.flags.length !== 1 ? 's' : ''} Detected</span>
								</p>
								<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
									{result.flags.map((flag, idx) => (
										<div
											key={idx}
											className="p-3.5 rounded-xl bg-[var(--chassis)] border border-[var(--chassis-dark)] shadow-xs space-y-1"
										>
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs font-bold text-[var(--text-primary)]">
													{result.proposedDrug?.name} ↔ {flag.counterpart || flag.interactingDrug}
												</p>
												<span
													className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
														flag.severity === 'Major' || flag.severity === 'Contraindicated'
															? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
															: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
													}`}
												>
													{flag.severity}
												</span>
											</div>
											<p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
												{flag.plainExplanation || flag.note}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Action Bar: Prescribe Directly Button */}
						<div className="pt-4 flex items-center justify-between gap-3 border-t border-[var(--brand-border-subtle)]">
							<span className="text-xs text-[var(--text-muted)]">
								Ready to prescribe for this patient?
							</span>
							<button
								type="button"
								onClick={handlePrescribeDirectly}
								disabled={prescribing}
								className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2 rounded-xl font-bold"
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

// ─── 2b. Drug Substitution Modal ─────────────────────────────────────────────────
function DrugSubstituteModal({ isOpen, onClose, patientId, medicines, onSuccess }) {
	const [oldMedId, setOldMedId] = useState('');
	const [newDrug, setNewDrug] = useState('');
	const [newDosage, setNewDosage] = useState('');
	const [rationale, setRationale] = useState('');
	const [err, setErr] = useState('');

	const substituteMutation = useMutation({
		mutationFn: substitutePatientDrug,
		onSuccess: (res) => {
			notify.success('Drug Substituted', res.message || 'Substitution complete.');
			onSuccess?.();
			onClose();
		},
		onError: (e) => {
			const msg = e?.response?.data?.error || 'Substitution failed.';
			setErr(msg);
			notify.error('Substitution Failed', msg);
		},
	});

	if (!isOpen) return null;

	const handleSubmit = (e) => {
		e.preventDefault();
		setErr('');
		if (!oldMedId || !newDrug.trim()) {
			setErr('Please select the current medicine and enter a replacement name.');
			return;
		}
		substituteMutation.mutate({ patientId, oldMedicineId: oldMedId, substituteDrugName: newDrug, substituteDosage: newDosage, rationale });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/75 backdrop-blur-md overflow-y-auto animate-fade-in">
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 10 }}
				className="w-full max-w-lg bg-[var(--brand-surface)] border border-white/80 dark:border-white/10 shadow-2xl rounded-2xl p-6 sm:p-7 space-y-5 max-h-[86vh] my-auto overflow-y-auto"
			>
				<div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-4">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
							<ArrowLeftRight className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-bold text-[var(--text-primary)] font-display">Drug Substitution Order</h3>
							<p className="text-xs text-[var(--text-muted)] mt-0.5">Switch an active prescription with automated deprescribing</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--chassis)] transition-colors cursor-pointer"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{err && (
					<div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-400">
						<AlertCircle className="w-4 h-4 flex-shrink-0" />
						<span>{err}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Discontinue (Current Medicine)</label>
						<select
							value={oldMedId}
							onChange={e => setOldMedId(e.target.value)}
							className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
						>
							<option value="">Select medicine to replace…</option>
							{medicines.map(m => (
								<option key={m.id} value={m.id}>{m.name} {m.dosage ? `(${m.dosage})` : ''}</option>
							))}
						</select>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Replacement Drug Name</label>
						<input
							type="text"
							placeholder="e.g. Ramipril, Amlodipine…"
							value={newDrug}
							onChange={e => setNewDrug(e.target.value)}
							className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Dosage (optional)</label>
						<input
							type="text"
							placeholder="e.g. 5mg once daily"
							value={newDosage}
							onChange={e => setNewDosage(e.target.value)}
							className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Clinical Rationale (optional)</label>
						<textarea
							placeholder="Reason for substitution…"
							value={rationale}
							onChange={e => setRationale(e.target.value)}
							rows={2}
							className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans resize-none"
						/>
					</div>

					<div className="flex items-center justify-end gap-2.5 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={substituteMutation.isPending}
							className="btn-primary px-6 py-2.5 text-xs flex items-center justify-center gap-2 rounded-xl font-bold shadow-md"
						>
							{substituteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
							<span>Confirm Substitution</span>
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}

// ─── 2c. Write Clinical Directive Panel ───────────────────────────────────────────
function WriteDirectivePanel({ patientId, onClose }) {
	const [text, setText] = useState('');
	const [category, setCategory] = useState('REGIMEN_ADVICE');
	const [priority, setPriority] = useState('HIGH');
	const [err, setErr] = useState('');

	const directiveMutation = useMutation({
		mutationFn: publishDirective,
		onSuccess: () => {
			notify.success('Directive Sent', 'Clinical directive published to patient.');
			onClose();
		},
		onError: (e) => {
			const msg = e?.response?.data?.error || 'Failed to publish directive.';
			setErr(msg);
			notify.error('Failed', msg);
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		setErr('');
		if (!text.trim()) { setErr('Directive text cannot be empty.'); return; }
		directiveMutation.mutate({ patientId, text, category, priority });
	};

	const CATEGORIES = [
		{ value: 'REGIMEN_ADVICE', label: 'Regimen Advice' },
		{ value: 'DIETARY_INSTRUCTION', label: 'Dietary Instruction' },
		{ value: 'LIFESTYLE_ORDER', label: 'Lifestyle Order' },
		{ value: 'MONITORING_INSTRUCTION', label: 'Monitoring Instruction' },
		{ value: 'FOLLOW_UP', label: 'Follow-Up Notice' },
	];

	return (
		<Card className="space-y-4 border-l-4 border-[var(--role-doctor)] p-5 rounded-2xl bg-[var(--brand-surface)]">
			<div className="flex items-center justify-between border-b border-[var(--brand-border-subtle)] pb-3">
				<div className="flex items-center gap-2.5">
					<div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
						<MessageSquare className="w-4 h-4" />
					</div>
					<div>
						<p className="text-sm font-bold text-[var(--text-primary)] font-display">Write Clinical Directive</p>
						<p className="text-xs text-[var(--text-muted)]">Sends a physician note directly to the patient's care dashboard</p>
					</div>
				</div>
				<button onClick={onClose} className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--chassis)] transition-colors"><X className="w-4 h-4" /></button>
			</div>
			{err && <p className="text-xs text-rose-700 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{err}</p>}
			<form onSubmit={handleSubmit} className="space-y-3.5">
				<textarea
					rows={3}
					placeholder="e.g. Avoid grapefruit juice while on Atorvastatin. Take with food. INR check in 7 days…"
					value={text}
					onChange={e => setText(e.target.value)}
					className="w-full text-sm py-2.5 px-3.5 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-sans resize-none"
				/>
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Category</label>
						<select
							value={category}
							onChange={e => setCategory(e.target.value)}
							className="w-full text-xs py-2 px-3 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-sans"
						>
							{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
						</select>
					</div>
					<div className="space-y-1.5">
						<label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Priority</label>
						<select
							value={priority}
							onChange={e => setPriority(e.target.value)}
							className="w-full text-xs py-2 px-3 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] border border-[var(--chassis-dark)] shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-sans"
						>
							<option value="URGENT">Urgent</option>
							<option value="HIGH">High</option>
							<option value="NORMAL">Normal</option>
						</select>
					</div>
				</div>
				<div className="flex justify-end gap-2 pt-1">
					<button
						type="button"
						onClick={onClose}
						className="btn-secondary px-4 py-2 text-xs rounded-xl"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={directiveMutation.isPending}
						className="btn-primary px-5 py-2 text-xs flex items-center justify-center gap-2 rounded-xl font-bold shadow-md"
					>
						{directiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
						<span>Publish Directive</span>
					</button>
				</div>
			</form>
		</Card>
	);
}

// ─── 2d. Organ Toxicity Radar Panel ───────────────────────────────────────────────
function OrganToxicityPanel({ patientId, medicines }) {
  const { data, isLoading } = useQuery({
    queryKey: ['clinical-summary-report', patientId],
    queryFn: () => fetchPatientClinicalSummary(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
  });

  const organTox = data?.organToxicity;

  const ORGANS = [
    {
      key: 'renal',
      label: 'Renal Toxicity',
      icon: <FlaskConical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      description: 'Nephrotoxic drug burden (NSAIDs, loop diuretics, aminoglycosides)',
    },
    {
      key: 'hepatic',
      label: 'Hepatic Toxicity',
      icon: <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      description: 'Hepatotoxic drug burden (statins, methotrexate, acetaminophen)',
    },
    {
      key: 'cardiovascular',
      label: 'Cardiovascular Risk',
      icon: <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      description: 'QT-prolonging / proarrhythmic drug burden & electrolyte shifting',
    },
    {
      key: 'cnsCognitive',
      label: 'CNS / Cognitive Burden',
      icon: <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      description: 'Anticholinergic Cognitive Burden & central sedation score',
    },
  ];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--role-doctor)]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Organ Toxicity Radar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[var(--chassis)] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[var(--brand-border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--role-doctor)]/10 text-[var(--role-doctor)] border border-[var(--role-doctor)]/20 shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">Organ & System Toxicity Radar</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Calculated from patient active prescriptions, OTC, and herbal interactions</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-medium px-3 py-1 rounded-full bg-[var(--chassis)] text-[var(--text-muted)] border border-[var(--chassis-dark)] shadow-xs">
            Real-Time Burden Model
          </span>
        </div>

        {/* Grid with proper margin & gap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {ORGANS.map((organ) => {
            const organData = organTox?.[organ.key];
            const score = organData?.score ?? 0;
            const level = organData?.level ?? 'Low';
            const flaggedMeds = (organData?.flaggedMeds || [])
              .filter((m) => m && typeof m === 'string' && m.trim().length > 0);

            const isSafe = level === 'Low' || level === 'Normal';
            const isMod = level === 'Moderate';
            const isHigh = level === 'High' || level === 'Critical';

            const badgeClasses = isHigh
              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
              : isMod
              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
              : 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20';

            const barGradient = isHigh
              ? 'from-rose-500 to-red-600'
              : isMod
              ? 'from-amber-400 to-amber-600'
              : 'from-[#0d9488] to-[#0f766e]';

            return (
              <motion.div
                key={organ.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="p-4.5 rounded-2xl bg-[var(--chassis)] border border-[var(--chassis-dark)]/80 shadow-[var(--shadow-sm)] hover:shadow-md transition-all space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--brand-surface)] border border-[var(--chassis-dark)]/50 shadow-xs">
                      {organ.icon}
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)] font-display">{organ.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs uppercase tracking-wider ${badgeClasses}`}>
                    {level}
                  </span>
                </div>

                {/* Score bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="h-2 bg-[var(--brand-surface)] rounded-full overflow-hidden border border-[var(--chassis-dark)] shadow-inner">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(score, 4))}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--text-muted)] line-clamp-1 flex-1 pr-2">{organ.description}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{score}/100</span>
                  </div>
                </div>

                {flaggedMeds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--brand-border-subtle)]">
                    {flaggedMeds.slice(0, 3).map((m, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-0.5 bg-[var(--brand-surface)] border border-[var(--chassis-dark)] rounded-full font-medium text-[var(--text-primary)] shadow-2xs">
                        {m}
                      </span>
                    ))}
                    {flaggedMeds.length > 3 && (
                      <span className="text-[10px] px-2.5 py-0.5 bg-[var(--brand-surface)] border border-[var(--chassis-dark)] rounded-full text-[var(--text-muted)]">
                        +{flaggedMeds.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ACB detail banner */}
        {data?.anticholinergicBurden && (
          <div className="p-4.5 rounded-2xl bg-[var(--chassis)] border border-[var(--chassis-dark)]/80 shadow-[var(--shadow-sm)] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-xs flex-shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] font-display">Anticholinergic Cognitive Burden (ACB Scale)</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20 shadow-2xs">
                    {data.anticholinergicBurden.level || 'Normal'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  {data.anticholinergicBurden.explanation || 'No significant anticholinergic or central sedative burden detected in current active regimen.'}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-[var(--brand-surface)] border border-[var(--chassis-dark)] shadow-xs text-center">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Score</span>
                <span className="text-2xl font-black text-[var(--text-primary)] font-display">
                  {data.anticholinergicBurden.totalScore ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/75 backdrop-blur-md overflow-y-auto animate-fade-in">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="w-full max-w-4xl bg-[var(--brand-surface)] border border-white/80 dark:border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 max-h-[86vh] my-auto overflow-y-auto print:max-h-none print:p-0 print:border-none print:shadow-none"
			>
				{/* Modal Top Bar (Hidden in Print) */}
				<div className="flex items-center justify-between gap-4 print:hidden border-b border-[var(--brand-border-subtle)] pb-4">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-[var(--role-doctor)]/10 text-[var(--role-doctor)] border border-[var(--role-doctor)]/20">
							<FileText className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-[var(--text-primary)] font-display">Clinical Consultation & Risk Assessment Report</h3>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handlePrint}
							className="btn-primary py-2 px-4 text-xs flex items-center gap-2 rounded-xl font-bold"
						>
							<Printer className="w-3.5 h-3.5" />
							<span>Print / Save PDF</span>
						</button>
						<button
							onClick={onClose}
							className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--chassis)] transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{isLoading ? (
					<div className="py-16 text-center space-y-3">
						<Loader2 className="w-8 h-8 text-[var(--role-doctor)] animate-spin mx-auto" />
						<p className="text-sm font-semibold text-[var(--text-muted)]">Compiling clinical pharmacovigilance data…</p>
					</div>
				) : !data ? (
					<div className="p-6 text-center text-sm text-rose-700">Failed to load clinical summary.</div>
				) : (
					<div className="space-y-6 text-[var(--text-primary)]">
						{/* Header Document Banner */}
						<div className="flex items-start justify-between border-b-2 border-[var(--role-doctor)] pb-4 flex-wrap gap-4">
							<div>
								<h1 className="text-2xl font-black text-[var(--role-doctor)] font-display">
									PolySafe Clinical Polypharmacy Report
								</h1>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">
									Automated Pharmacovigilance, Interaction Risk Matrix & Deprescribing Recommendations
								</p>
							</div>
							<div className="text-right text-xs text-[var(--text-muted)]">
								<p className="font-bold text-[var(--text-primary)]">Date: {new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
								<p className="mt-0.5">Status: <strong className="text-teal-700 dark:text-teal-400">Verified Clinical Record</strong></p>
							</div>
						</div>

						{/* Patient Demographics & Profile Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4.5 bg-[var(--chassis)] rounded-2xl border border-[var(--chassis-dark)] shadow-xs">
							<div>
								<span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Patient</span>
								<p className="text-sm font-bold text-[var(--text-primary)] font-display mt-0.5">{data.patient.contact}</p>
								<p className="text-xs text-[var(--text-muted)] mt-0.5">Age: {data.patient.age || '—'} years</p>
							</div>
							<div>
								<span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Diagnosed Conditions</span>
								<p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
									{data.patient.conditions?.length ? data.patient.conditions.join(', ') : 'None documented'}
								</p>
							</div>
							<div>
								<span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Regimen Risk Score</span>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-base font-black text-rose-700 font-display">
										{data.regimenRisk?.tier || 'L3'} ({data.regimenRisk?.label || 'Moderate'})
									</span>
									<span className="text-xs font-mono text-[var(--text-muted)]">Score: {data.regimenRisk?.averageRisk?.toFixed(1) || '3.0'}/5.0</span>
								</div>
							</div>
						</div>

						{/* Active Regimen Table */}
						<div className="space-y-2.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-[var(--role-doctor)] flex items-center gap-2 font-display">
								<Pill className="w-4 h-4" />
								<span>1. Active Medication Regimen ({data.activeMedicines?.length || 0})</span>
							</h4>
							<div className="border border-[var(--chassis-dark)] rounded-2xl overflow-hidden bg-[var(--brand-surface)] shadow-xs">
								<table className="w-full text-xs text-left">
									<thead className="bg-[var(--chassis)] text-[var(--text-muted)] font-bold border-b border-[var(--chassis-dark)]">
										<tr>
											<th className="p-3 font-semibold">Medication Name</th>
											<th className="p-3 font-semibold">Dosage</th>
											<th className="p-3 font-semibold">Type</th>
											<th className="p-3 font-semibold">WHO/NCI Harm Level</th>
											<th className="p-3 font-semibold">Prescribed By</th>
											<th className="p-3 font-semibold">Initiated Date</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[var(--brand-border-subtle)]">
										{data.activeMedicines?.map((m, i) => (
											<tr key={i} className="hover:bg-[var(--chassis)]/40 transition-colors">
												<td className="p-3 font-bold text-[var(--text-primary)]">{m.name}</td>
												<td className="p-3 text-[var(--text-muted)] font-mono">{m.dosage || 'Standard'}</td>
												<td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-[var(--chassis)] border border-[var(--chassis-dark)] text-[10px] font-bold text-[var(--text-muted)]">{m.type}</span></td>
												<td className="p-3"><DrugHarmBadge harmLevel={m.harmLevel} size="sm" /></td>
												<td className="p-3 text-[var(--text-muted)]">{m.prescribedBy}</td>
												<td className="p-3 text-[var(--text-muted)] font-mono">{fmt(m.dateAdded)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Drug Interactions Matrix */}
						<div className="space-y-2.5">
							<h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2 font-display">
								<AlertOctagon className="w-4 h-4" />
								<span>2. DDInter Drug Interaction Risk Matrix ({data.flags?.length || 0} Flags)</span>
							</h4>
							{data.flags?.length === 0 ? (
								<p className="text-xs text-teal-800 dark:text-teal-300 p-3.5 bg-teal-500/10 rounded-xl border border-teal-500/20 font-medium">
									No severe or contraindicated drug-drug interactions detected across active medicines.
								</p>
							) : (
								<div className="space-y-2">
									{data.flags?.map((f, i) => (
										<div key={i} className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1.5">
											<div className="flex items-center justify-between">
												<strong className="text-rose-950 dark:text-rose-200 font-bold">{f.drugA} ↔ {f.drugB}</strong>
												<span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-500/30">
													{f.severity}
												</span>
											</div>
											<p className="text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">{f.explanation}</p>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Anticholinergic & Cognitive Burden Index */}
						<div className="p-4.5 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-2xl space-y-2 shadow-xs">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<h4 className="text-xs font-bold uppercase tracking-wider text-[var(--role-doctor)] flex items-center gap-2 font-display">
									<Brain className="w-4 h-4 text-purple-600" />
									<span>3. Cumulative Anticholinergic & Sedative Cognitive Burden</span>
								</h4>
								<span className="text-xs font-bold px-3 py-1 rounded-xl bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20 shadow-2xs">
									ACB Score: {data.anticholinergicBurden?.totalScore || 0} ({data.anticholinergicBurden?.level || 'Normal'})
								</span>
							</div>
							<p className="text-xs text-[var(--text-muted)] leading-relaxed">
								{data.anticholinergicBurden?.explanation || 'Regimen evaluated against validated Anticholinergic Cognitive Burden (ACB) scales.'}
							</p>
						</div>

						{/* Deprescribing & Optimization Recommendations */}
						{data.deprescribingCandidates?.length > 0 && (
							<div className="p-4.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
								<h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2 font-display">
									<Sparkles className="w-4 h-4 text-amber-600" />
									<span>4. Clinical Deprescribing & Optimization Recommendations</span>
								</h4>
								<div className="space-y-2">
									{data.deprescribingCandidates.map((c, i) => (
										<div key={i} className="p-3.5 bg-[var(--brand-surface)] border border-amber-500/30 rounded-xl text-xs space-y-1.5 shadow-2xs">
											<div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
												<span>{c.name} ({c.dosage || 'Active'})</span>
												<DrugHarmBadge harmLevel={c.harmLevel} size="sm" />
											</div>
											<p className="text-amber-900 dark:text-amber-300 text-[11px]"><strong>Clinical Rationale:</strong> {c.reason}</p>
											<p className="text-teal-900 dark:text-teal-300 text-[11px]"><strong>Recommendation:</strong> {c.recommendation}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Doctor Sign-off */}
						<div className="pt-8 border-t border-[var(--brand-border-subtle)] flex items-end justify-between text-xs text-[var(--text-muted)]">
							<div>
								<p>Reviewed by: <strong className="text-[var(--text-primary)]">Attending Physician</strong></p>
								<p className="text-[10px] text-[var(--text-muted)] mt-0.5">PolySafe AI Clinical Decision Support Engine v2.0</p>
							</div>
							<div className="border-t border-[var(--text-primary)] w-48 text-center pt-1">
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
 const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'deprescribing' | 'symptoms' | 'toxicity' | 'directives'
 const [showSafetyCheckModal, setShowSafetyCheckModal] = useState(false);
 const [showReportModal, setShowReportModal] = useState(false);
 const [showSubstituteModal, setShowSubstituteModal] = useState(false);
 const [showDirectivePanel, setShowDirectivePanel] = useState(false);

 const { data, isLoading, isError, error } = useQuery({
 queryKey: ['patient-timeline', patientId],
 queryFn: () => fetchPatientTimeline(patientId),
 enabled: !!patientId,
 refetchInterval: 2000,
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
	const flags = data?.flags ?? [];
	const patient = data?.patient ?? {};
	const activeMeds = medicines.filter((m) => !m.discontinued);
	const discontinuedMeds = medicines.filter((m) => m.discontinued);

	return (
		<div className="space-y-6">
			{/* Patient profile banner + Action bar */}
			<Card className="p-6 space-y-4">
				{/* Top Section: Patient Identity & Primary Action */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3.5 min-w-0">
						<div className="w-12 h-12 rounded-2xl bg-[var(--role-doctor)]/10 text-[var(--role-doctor)] border border-[var(--role-doctor)]/20 flex items-center justify-center flex-shrink-0 shadow-xs">
							<Users className="w-6 h-6" />
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2.5 flex-wrap">
								<h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
									{patient.name || patient.patientName || (patient.age ? `Patient (Age ${patient.age})` : 'Patient Record')}
								</h2>
								<span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#0f766e] dark:text-[#2dd4bf] bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full shadow-2xs">
									<Shield className="w-3 h-3" />
									CONSENT APPROVED
								</span>
							</div>
							<p className="text-xs text-[var(--text-muted)] mt-0.5">
								Connected clinical health record & active pharmacological telemetry
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={() => setShowSafetyCheckModal(true)}
						className="btn-primary py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer rounded-xl font-bold flex-shrink-0"
					>
						<Stethoscope className="w-4 h-4" />
						<span>Safety Check / Prescribe</span>
					</button>
				</div>

				{/* Middle Section: Metadata Chips & Secondary Action Tools */}
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-[var(--brand-border-subtle)]">
					{/* Clinical Chips */}
					<div className="flex items-center gap-2 flex-wrap text-xs">
						{patient.age && (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--chassis)] border border-[var(--chassis-dark)] text-xs text-[var(--text-muted)] font-medium shadow-2xs">
								<span>Age:</span>
								<strong className="text-[var(--text-primary)] font-semibold">{patient.age} yrs</strong>
							</span>
						)}
						{patient.conditions?.length > 0 && (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--chassis)] border border-[var(--chassis-dark)] text-xs text-[var(--text-muted)] font-medium shadow-2xs">
								<span>Conditions:</span>
								<strong className="text-[var(--text-primary)] font-semibold">{patient.conditions.join(', ')}</strong>
							</span>
						)}
						{patient.allergies?.length > 0 && (
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-400 font-medium shadow-2xs">
								<AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
								<span>Allergies:</span>
								<strong className="font-bold text-rose-800 dark:text-rose-300">{patient.allergies.join(', ')}</strong>
							</span>
						)}
					</div>

					{/* Secondary Action Toolbar */}
					<div className="flex items-center gap-2 flex-wrap">
						<button
							type="button"
							onClick={() => setShowReportModal(true)}
							className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs rounded-xl"
						>
							<FileText className="w-3.5 h-3.5 text-[var(--role-doctor)]" />
							<span>Clinical Report</span>
						</button>

						<button
							type="button"
							onClick={() => setShowSubstituteModal(true)}
							className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs rounded-xl"
						>
							<ArrowLeftRight className="w-3.5 h-3.5 text-[var(--role-doctor)]" />
							<span>Substitute Drug</span>
						</button>

						<button
							type="button"
							onClick={() => setShowDirectivePanel(prev => !prev)}
							className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs rounded-xl"
						>
							<MessageSquare className="w-3.5 h-3.5 text-purple-600" />
							<span>Write Directive</span>
						</button>
					</div>
				</div>

				{/* Write Directive inline panel */}
				{showDirectivePanel && (
					<WriteDirectivePanel patientId={patientId} onClose={() => setShowDirectivePanel(false)} />
				)}

				{/* Tab Navigation */}
				<div className="flex items-center gap-1.5 p-1.5 bg-[var(--chassis)] border border-[var(--chassis-dark)]/80 shadow-[var(--shadow-recessed)] rounded-2xl overflow-x-auto mt-2">
					<button
						type="button"
						onClick={() => setActiveTab('timeline')}
						className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
							activeTab === 'timeline'
								? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm'
								: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
						}`}
					>
						<Layers className="w-3.5 h-3.5" />
						<span>Regimen Timeline</span>
						<span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
							activeTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-[var(--chassis-dark)] text-[var(--text-muted)]'
						}`}>
							{activeMeds.length}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab('deprescribing')}
						className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
							activeTab === 'deprescribing'
								? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm'
								: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
						}`}
					>
						<Sparkles className="w-3.5 h-3.5" />
						<span>Deprescribing Assistant</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab('symptoms')}
						className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
							activeTab === 'symptoms'
								? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm'
								: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
						}`}
					>
						<Activity className="w-3.5 h-3.5" />
						<span>Patient Symptoms</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab('toxicity')}
						className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
							activeTab === 'toxicity'
								? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm'
								: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
						}`}
					>
						<BarChart2 className="w-3.5 h-3.5" />
						<span>Organ Toxicity</span>
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

 {/* Drug Substitution Modal */}
 <DrugSubstituteModal
 isOpen={showSubstituteModal}
 onClose={() => setShowSubstituteModal(false)}
 patientId={patientId}
 medicines={medicines}
 onSuccess={() => {
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
							Medication History & Timeline ({activeMeds.length} Active{discontinuedMeds.length > 0 ? `, ${discontinuedMeds.length} Discontinued` : ''})
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
								<div className="space-y-6">
									<AnimatePresence initial={false}>
										{medicines.map((med, index) => {
											const isDiscontinued = !!med.discontinued || !!med.removedAt;
											const isFlagged = !isDiscontinued && med.flagged && med.flags?.length > 0;
											const typeIcon = med.type === 'HERBAL'
												? <Leaf className="w-3.5 h-3.5 text-[#2B6E5E]" />
												: med.type === 'OTC'
												? <ShoppingBag className="w-3.5 h-3.5 text-[#8A6D3B]" />
												: <Pill className="w-3.5 h-3.5 text-[#1B4B66]" />;

											return (
												<motion.div
													key={med.id}
													layout={!shouldReduceMotion}
													initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
													animate={{ opacity: 1, y: 0 }}
													exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
													transition={{
														duration: shouldReduceMotion ? 0 : 0.28,
														delay: shouldReduceMotion ? 0 : index * 0.05,
														ease: [0.25, 1, 0.5, 1],
													}}
													className="relative z-10 flex items-start gap-4"
												>
													{/* Dot */}
													<div
														className="w-10 h-10 rounded-full bg-[var(--chassis)] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] border-[3px] flex items-center justify-center flex-shrink-0"
														style={{
															borderColor: isDiscontinued ? '#9CA3AF' : isFlagged ? '#B23D25' : '#2B6E5E',
														}}
													>
														{typeIcon}
													</div>

													{/* Entry card matching Patient Timeline */}
													<Card
														hideScrews={true}
														className={`flex-1 space-y-3 transition-all ${
															isDiscontinued
																? '!bg-[#f8f6f0] dark:!bg-white/[0.03] opacity-75 !border-[var(--chassis-dark,#D5CEBF)]'
																: isFlagged
																? '!bg-[#fef2f2] dark:!bg-rose-950/20 !border-rose-400/50 dark:!border-rose-500/40 shadow-[0_2px_14px_rgba(225,29,72,0.08)]'
																: 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)] hover:shadow-[var(--shadow-card)]'
														}`}
													>
														<div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[rgba(255,255,255,0.25)] dark:border-white/5">
															<span
																className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
																	isDiscontinued
																		? 'bg-[var(--chassis-dark,#E0DACE)]/60 text-[var(--text-muted,#5C6B64)] border border-[var(--chassis-dark,#D5CEBF)]'
																		: isFlagged
																		? 'bg-white/80 dark:bg-black/30 text-[var(--accent-primary,#2B6E5E)] border border-rose-300/40 shadow-xs'
																		: 'bg-[#2B6E5E]/10 text-[#2B6E5E] border border-[#2B6E5E]/25 shadow-xs'
																}`}
															>
																<span className={`w-1.5 h-1.5 rounded-full ${isDiscontinued ? 'bg-[#9CA3AF]' : 'bg-[#2B6E5E]'}`} />
																{med.addedByUser?.role === 'DOCTOR' ? 'Prescribed by Physician' : 'Self-logged'} · {med.type}
															</span>

															<div className="flex items-center gap-2">
																{isDiscontinued && (
																	<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
																		Discontinued {med.removedAt ? `on ${fmt(med.removedAt)}` : ''}
																	</span>
																)}
																<span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted,#5C6B64)] font-medium">
																	<CalendarDays className="w-3.5 h-3.5 text-[#9CA3AF]" />
																	Started {fmt(med.dateAdded)}
																</span>
															</div>
														</div>

														<div className="flex items-center justify-between gap-2 flex-wrap">
															<div className="flex items-center gap-2.5 flex-wrap">
																<h4 className={`text-base font-bold font-display ${isDiscontinued ? 'text-[#5C6B64] line-through' : 'text-[#1C2B27]'}`}>
																	{med.name}
																</h4>
																<DrugHarmBadge harmLevel={med.harmLevel} size="sm" />
																{isDiscontinued && (
																	<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
																		Discontinued
																	</span>
																)}
															</div>
														</div>

														{med.dosage && (
															<p className="text-xs text-[var(--text-muted,#5C6B64)] font-mono">
																Dose: {med.dosage}
															</p>
														)}

														{/* Flag note */}
														{isFlagged && (
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
									</AnimatePresence>
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

 {/* Tab 4: Organ Toxicity Radar */}
 {activeTab === 'toxicity' && (
 <OrganToxicityPanel patientId={patientId} medicines={medicines} />
 )}
 </div>
 );
}

// ─── 6. Claim Code Panel ───────────────────────────────────────────────────────
function ClaimPanel({ onSuccess }) {
 const [code, setCode] = useState('');
 const [error, setError] = useState('');

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
 Ask your patient to open PolySafe to "Share with Doctor" and provide their 6-digit access code.
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
    queryFn: fetchMyConnections,
    refetchInterval: 2000,
  });

  const rawConnections = data?.connections ?? [];
  const connections = [];
  const seenPatients = new Set();
  for (const c of rawConnections) {
    if (!seenPatients.has(c.patientId)) {
      seenPatients.add(c.patientId);
      connections.push(c);
    }
  }

  const filtered = connections.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = (c.patientName || c.name || '').toLowerCase();
    const age = String(c.patientAge || '');
    return name.includes(term) || age.includes(term) || (c.label || '').toLowerCase().includes(term);
  });

  if (isLoading) {
    return <DoctorPatientListSkeleton />;
  }

  if (connections.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--chassis)] border border-[var(--brand-border-subtle)] shadow-[var(--shadow-recessed)] rounded-2xl space-y-2">
        <EmptyDoctorListIllustration className="w-16 h-16 mx-auto" />
        <div>
          <p className="font-bold text-[var(--text-primary)]">No approved patients yet</p>
          <p className="mt-1 leading-relaxed text-[11px]">
            Click "+ Enter Patient Code" above to link a patient via their 6-digit access code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Search */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter connected patients…"
          className="w-full text-xs py-2.5 pl-9 pr-3.5 rounded-xl bg-[var(--brand-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/70 border border-[var(--chassis-dark)] shadow-[var(--shadow-recessed)] focus:outline-none focus:ring-2 focus:ring-[var(--role-doctor)]/40 transition-all font-sans"
        />
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
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-[var(--brand-surface)] border-[var(--role-doctor)] shadow-[var(--shadow-sm)] ring-2 ring-[var(--role-doctor)]/20'
                    : 'bg-[var(--brand-surface)]/70 hover:bg-[var(--brand-surface)] border-[rgba(255,255,255,0.6)] dark:border-white/5 hover:border-[var(--role-doctor)]/30 hover:shadow-[var(--shadow-xs)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white shadow-xs' : 'bg-[var(--role-doctor)]/10 text-[var(--role-doctor)]'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate font-display">
                      {c.patientName || c.name || (c.patientAge ? `Patient (Age ${c.patientAge})` : 'Connected Patient')}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Age {c.patientAge || '—'} · {c.recentMeds?.length ?? 0} active meds
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[var(--role-doctor)] translate-x-0.5' : 'text-[#9CA3AF]'}`} />
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

 const [step, setStep] = useState('list'); // 'list' | 'claim' | 'claimed' | 'viewing'
 const [selectedPatient, setSelectedPatient] = useState(null); // { patientId, connectionId }

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
