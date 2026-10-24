import React, { useState, useEffect } from 'react';
import {
  Activity, Server, Database, KeyRound, Wifi,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  ShieldCheck, Sparkles, Clock, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { performHealthCheck } from '../lib/healthCheck';
import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';

export default function StatusPage() {
  const { enterGuestMode } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await performHealthCheck();
      setHealth(res);
    } catch (err) {
      setHealth({
        apiReachable: false,
        dbReachable: false,
        demoMode: false,
        groqKeyPresent: false,
        geminiKeyPresent: false,
        socketConnected: false,
        latencyMs: 0,
        timestamp: new Date().toLocaleTimeString(),
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const allGood = health?.apiReachable && health?.dbReachable && health?.socketConnected;

  return (
    <div className="min-h-screen bg-[var(--canvas)] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ink-2)] hover:text-[var(--brand-600)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </Link>

          <button
            onClick={runCheck}
            disabled={loading}
            className="ps-btn ps-btn-secondary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run Diagnostics</span>
          </button>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">Pre-Stage Mission Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
            PolySafe System Diagnostic
          </h1>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Live technical verification of database pool, background workers, socket transport, and pharmacological APIs prior to live judging.
          </p>
        </div>

        {/* Global Verdict Banner */}
        <Card
          variant={allGood ? 'success' : 'caution'}
          className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              allGood ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'
            }`}>
              {allGood ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base text-[var(--ink)]">
                  {allGood ? 'System Stage-Ready' : 'Partial Service Notice'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  allGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {allGood ? '100% Operational' : 'Offline Fallback Available'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">
                Last checked at {health?.timestamp || '—'} · Round-trip latency: {health?.latencyMs ?? 0}ms
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              enterGuestMode();
              window.location.href = '/home';
            }}
            className="ps-btn ps-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Offline Guest Demo</span>
          </button>
        </Card>

        {/* Individual Component Audits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. API Reachability */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[var(--brand-600)] flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">API Backend Server</p>
                <p className="text-[11px] text-[var(--ink-3)]">Node Express 5 REST API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.apiReachable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-xs font-bold ${health?.apiReachable ? 'text-emerald-700' : 'text-rose-700'}`}>
                {health?.apiReachable ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* 2. Database Reachability */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">PostgreSQL Database</p>
                <p className="text-[11px] text-[var(--ink-3)]">Prisma ORM & Pool</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.dbReachable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-xs font-bold ${health?.dbReachable ? 'text-emerald-700' : 'text-rose-700'}`}>
                {health?.dbReachable ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          {/* 3. DEMO_MODE Status */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">DEMO_MODE Flag</p>
                <p className="text-[11px] text-[var(--ink-3)]">Deterministic mock fallbacks</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full font-mono ${
              health?.demoMode
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-stone-100 text-stone-700 border border-stone-200'
            }`}>
              {health?.demoMode ? 'ENABLED (SAFE)' : 'DISABLED'}
            </span>
          </div>

          {/* 4. Socket.IO Connection */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Socket.IO Transport</p>
                <p className="text-[11px] text-[var(--ink-3)]">Real-time doctor/patient sync</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.socketConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-xs font-bold ${health?.socketConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
                {health?.socketConnected ? 'SYNCED' : 'UNREACHABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Key Presence Box (Boolean Only - Zero Security Leakage) */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--brand-600)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                AI / LLM Cloud Provider Secrets (Boolean Only)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-3)]">Values redacted</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--ink-2)]">Groq Llama-3 API Key</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                health?.groqKeyPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {health?.groqKeyPresent ? 'PRESENT (TRUE)' : 'ABSENT (FALSE)'}
              </span>
            </div>

            <div className="p-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--ink-2)]">Google Gemini API Key</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                health?.geminiKeyPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {health?.geminiKeyPresent ? 'PRESENT (TRUE)' : 'ABSENT (FALSE)'}
              </span>
            </div>
          </div>
        </div>

        {/* Venue Fallback Advisory */}
        <div className="p-4 bg-[var(--canvas)] border border-[var(--border)] rounded-2xl text-[11px] text-[var(--ink-3)] space-y-1 leading-relaxed">
          <p className="font-bold text-[var(--ink)]">Venue Wifi Contingency:</p>
          <p>
            If stage wifi fails or latency exceeds 4000ms, PolySafe automatically switches to embedded mock resolvers and local service worker caches. No internet connection is strictly required for the demo.
          </p>
        </div>
      </div>
    </div>
  );
}
