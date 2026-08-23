import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  HeartHandshake, 
  Stethoscope, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  KeyRound,
  Compass,
  Check,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { authApi } from '../api/auth';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import PolySafeInput from '../components/PolySafeInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, token, login, enterGuestMode } = useAuth();

  // ─── On Mount: Redirect already authenticated sessions (replace: true) ─────
  useEffect(() => {
    if (user && !user.isGuest && token) {
      const userRole = (user.role || 'PATIENT').toUpperCase();
      if (userRole === 'DOCTOR') {
        navigate('/doctor-dashboard', { replace: true });
      } else if (userRole === 'CAREGIVER') {
        navigate('/caregiver-view', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [user, token, navigate]);

  // Selected Role: null | 'PATIENT' | 'CAREGIVER' | 'DOCTOR'
  const [selectedRole, setSelectedRole] = useState(null);

  // Auth Mode: 'login' (Sign In) | 'signup' (Create Account) | 'otp' (Verify OTP)
  const [authMode, setAuthMode] = useState('login');

  // Global error message displayed in the error banner
  const [errorMsg, setErrorMsg] = useState(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [doctorRegNum, setDoctorRegNum] = useState('');
  const [doctorRegNumTouched, setDoctorRegNumTouched] = useState(false);

  // Lockout State
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [lockoutSecsLeft, setLockoutSecsLeft] = useState(0);

  // ─── Real-time 1-Second Countdown for Lockout ──────────────────────────────
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutSecsLeft(0);
      return;
    }

    const calcSecs = () => {
      const ms = new Date(lockoutUntil).getTime() - Date.now();
      const secs = ms > 0 ? Math.ceil(ms / 1000) : 0;
      setLockoutSecsLeft(secs);
      if (secs <= 0) {
        setLockoutUntil(null);
        setErrorMsg(null);
      }
    };

    calcSecs();
    const interval = setInterval(calcSecs, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // OTP state (only used in 'otp' mode)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const countdownTimerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Remind Me state
  const [remindMe, setRemindMe] = useState(() => {
    return localStorage.getItem('polysafe_remind_me') !== 'false';
  });

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('polysafe_saved_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // ─── Countdown Timer for OTP Resend ─────────────────────────────────────────
  useEffect(() => {
    if (authMode === 'otp' && countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearTimeout(countdownTimerRef.current);
    }
    return () => clearTimeout(countdownTimerRef.current);
  }, [authMode, countdown]);

  // ─── Signup password strength calculation ───────────────────────────────────
  const calcStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'var(--text-muted)', hasLen: false, hasNum: false, hasSpecial: false };
    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);
    let score = 0;
    if (hasLen) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;
    let label = 'Weak', color = 'var(--led-critical)';
    if (score === 2) { label = 'Moderate'; color = 'var(--led-caution)'; }
    else if (score === 3) { label = 'Strong'; color = 'var(--accent-primary)'; }
    return { score, label, color, hasLen, hasNum, hasSpecial };
  };

  const passwordStrength = useMemo(() => calcStrength(password), [password]);

  // Field validation errors
  const emailError = useMemo(() => {
    if (!emailTouched) return null;
    const trimmed = email.trim();
    if (!trimmed) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
    return null;
  }, [email, emailTouched]);

  const passwordError = useMemo(() => {
    if (!passwordTouched) return null;
    if (!password) return 'Password is required.';
    if (authMode === 'signup' && password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  }, [password, passwordTouched, authMode]);

  const nameError = useMemo(() => {
    if (!nameTouched || authMode !== 'signup') return null;
    if (!name.trim() || name.trim().length < 2) return 'Full name must be at least 2 characters.';
    return null;
  }, [name, nameTouched, authMode]);

  const doctorRegNumError = useMemo(() => {
    if (!doctorRegNumTouched || authMode !== 'signup' || selectedRole !== 'DOCTOR') return null;
    if (!doctorRegNum.trim() || doctorRegNum.trim().length < 3) return 'Medical registration number is required.';
    return null;
  }, [doctorRegNum, doctorRegNumTouched, authMode, selectedRole]);

  // ─── Auth Success Handler ──────────────────────────────────────────────────
  const handleAuthSuccess = (data, isNewUser) => {
    setErrorMsg(null);
    if (remindMe) {
      localStorage.setItem('polysafe_saved_email', email.trim());
    } else {
      localStorage.removeItem('polysafe_saved_email');
    }
    const role = (data.user?.role || selectedRole || 'PATIENT').toUpperCase();
    if (data.token) {
      login(data.token, role, data.user);
    }
    notify.success('Welcome to PolySafe', isNewUser ? 'Your account has been verified and created.' : 'Signed in successfully.');
    if (role === 'DOCTOR') {
      navigate('/doctor-dashboard', { replace: true });
    } else if (role === 'CAREGIVER') {
      navigate('/caregiver-view', { replace: true });
    } else if (isNewUser || !data.user?.patient) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  // 1. Send OTP Mutation (New Registration only)
  const signupSendOtpMutation = useMutation({
    mutationFn: ({ name, email, password, role, registrationNumber }) => 
      authApi.signupSendOtp({ name, email, password, role, registrationNumber }),
    onSuccess: (data) => {
      setErrorMsg(null);
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setAuthMode('otp');
      notify.success('Verification Code Dispatched', `A 6-digit code was emailed to ${email.trim()}.`);
      if (data._devOtp) setDevOtpHint(data._devOtp);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to send verification code.';
      setErrorMsg(msg);
      notify.error('Send Failed', msg);
    },
  });

  // 2. Verify OTP Mutation (New Registration only)
  const verifySignupOtpMutation = useMutation({
    mutationFn: ({ email, code }) => authApi.verifySignupOtp({ email, code }),
    onSuccess: (data) => handleAuthSuccess(data, true),
    onError: (err) => {
      const msg = err.response?.data?.error || 'Invalid or expired verification code.';
      setErrorMsg(msg);
      notify.error('Verification Failed', msg);
    },
  });

  // 3. Login Mutation (Sign In with password — zero OTP)
  const loginMutation = useMutation({
    mutationFn: ({ email, password, role }) => authApi.patientLogin({ email, password, role }),
    onSuccess: (data) => handleAuthSuccess(data, false),
    onError: (err) => {
      const errData = err.response?.data;
      const msg = errData?.error || 'Invalid email or password.';
      if (errData?.lockedUntil) setLockoutUntil(errData.lockedUntil);
      setErrorMsg(msg);
      notify.error('Sign In Failed', msg);
    },
  });

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const resetFormState = () => {
    setPassword('');
    setPasswordTouched(false);
    setName('');
    setNameTouched(false);
    setDoctorRegNum('');
    setDoctorRegNumTouched(false);
    setLockoutUntil(null);
    setOtp(['', '', '', '', '', '']);
    setDevOtpHint(null);
    setErrorMsg(null);
  };

  const handleSignInSubmit = (e) => {
    e?.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    loginMutation.mutate({ email: cleanEmail, password, role: selectedRole || 'PATIENT' });
  };

  const handleSignUpSubmit = (e) => {
    e?.preventDefault();
    setEmailTouched(true);
    setNameTouched(true);
    setPasswordTouched(true);
    setDoctorRegNumTouched(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (selectedRole === 'DOCTOR' && (!doctorRegNum.trim() || doctorRegNum.trim().length < 3)) {
      setErrorMsg('Please enter your medical registration / license number.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    signupSendOtpMutation.mutate({
      name: cleanName,
      email: cleanEmail,
      password,
      role: selectedRole || 'PATIENT',
      registrationNumber: selectedRole === 'DOCTOR' ? doctorRegNum.trim() : undefined,
    });
  };

  const handleResendOtp = () => {
    setErrorMsg(null);
    setOtp(['', '', '', '', '', '']);
    setCountdown(30);
    signupSendOtpMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role: selectedRole || 'PATIENT',
      registrationNumber: selectedRole === 'DOCTOR' ? doctorRegNum.trim() : undefined,
    });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, idx) => {
        if (index + idx < 6) {
          newOtp[index + idx] = d;
        }
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      notify.warning('Code Incomplete', 'Please enter all 6 digits.');
      return;
    }
    verifySignupOtpMutation.mutate({
      email: email.trim(),
      code,
    });
  };

  const roleLabels = {
    PATIENT: { title: 'Patient', subtitle: 'Self medication & interaction safety', color: 'text-[var(--role-patient)]', badge: 'bg-[var(--role-patient)]/10 text-[var(--role-patient)] border-[var(--role-patient)]/20' },
    CAREGIVER: { title: 'Family / Caregiver', subtitle: 'Dose schedules & caregiver oversight', color: 'text-[var(--role-caregiver)]', badge: 'bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)] border-[var(--role-caregiver)]/20' },
    DOCTOR: { title: 'Doctor / Clinician', subtitle: 'Clinical oversight, deprescribing & EHR', color: 'text-[var(--role-doctor)]', badge: 'bg-[var(--role-doctor)]/10 text-[var(--role-doctor)] border-[var(--role-doctor)]/20' },
  };

  return (
    <PageTransition className="min-h-[88vh] bg-[var(--chassis)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="icon-well w-16 h-16 mx-auto mb-2">
            <ShieldCheck className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h1 className="text-3xl md:text-4xl text-[var(--text-primary)] font-bold tracking-tight font-display">
            PolySafe
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto font-mono">
            AI Polypharmacy Interaction & Cumulative Burden Protection System
          </p>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-[var(--chassis)] border-2 border-[var(--led-critical)]/30 rounded-2xl flex items-start space-x-3 text-[var(--led-critical)] text-sm animate-fadeIn shadow-xs">
            <AlertCircle className="w-5 h-5 text-[var(--led-critical)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 0: ROLE SELECTION CARDS
        ══════════════════════════════════════════════════════════════════ */}
        {!selectedRole && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                Select Your Role
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Sign In with password or create a new verified account
              </p>
            </div>

            {/* Three primary tappable role cards */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* Card 1: Patient */}
              <div
                onClick={() => {
                  setSelectedRole('PATIENT');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="p-5 flex items-start space-x-4 group cursor-pointer bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] active:shadow-[var(--shadow-pressed)] rounded-2xl transition-all duration-180 border border-[rgba(255,255,255,0.4)]"
              >
                <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors font-display">
                      Patient
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2.5 py-0.5 rounded-full">
                      Sign In / Sign Up
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Track prescriptions, OTC drugs, herbal remedies, and get real-time interaction alerts.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
              </div>

              {/* Card 2: Caregiver */}
              <div
                onClick={() => {
                  setSelectedRole('CAREGIVER');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="p-5 flex items-start space-x-4 group cursor-pointer bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] active:shadow-[var(--shadow-pressed)] rounded-2xl transition-all duration-180 border border-[rgba(255,255,255,0.4)]"
              >
                <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-6 h-6 text-[var(--role-caregiver)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--role-caregiver)] transition-colors font-display">
                      Family / Caregiver
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[var(--role-caregiver)]/20 text-[var(--role-caregiver)] px-2.5 py-0.5 rounded-full">
                      Sign In / Sign Up
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Monitor family member dose schedules, check safety statuses, and send check-in reminders.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--role-caregiver)] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
              </div>

              {/* Card 3: Doctor */}
              <div
                onClick={() => {
                  setSelectedRole('DOCTOR');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="p-5 flex items-start space-x-4 group cursor-pointer bg-[var(--chassis)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] active:shadow-[var(--shadow-pressed)] rounded-2xl transition-all duration-180 border border-[rgba(255,255,255,0.4)]"
              >
                <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-6 h-6 text-[var(--accent-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)] transition-colors font-display">
                      Doctor / Clinician
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] px-2.5 py-0.5 rounded-full">
                      Sign In / Sign Up
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Access patient timelines, pre-prescribing safety simulations, deprescribing tools, and EHR notes.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent-secondary)] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[rgba(255,255,255,0.4)] w-full" />
              <span className="bg-[var(--chassis)] px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider absolute font-mono">
                or explore without an account
              </span>
            </div>

            {/* Card 4: Continue as Guest */}
            <div
              onClick={() => {
                enterGuestMode();
                notify.info('Demo Mode Active', 'Exploring PolySafe with realistic sample data.');
                navigate('/home', { replace: true });
              }}
              className="p-4 rounded-2xl border-2 border-[var(--chassis-dark)] hover:border-[var(--accent-primary)] bg-[var(--chassis)] hover:bg-[var(--accent-primary-light)]/20 flex items-center space-x-3.5 group cursor-pointer transition-all duration-180"
            >
              <div className="p-2.5 bg-[var(--chassis)] shadow-[var(--shadow-card)] border border-[var(--chassis-dark)] text-[var(--accent-primary)] rounded-xl group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors font-display">
                    Continue as Guest
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent-primary)]/30 shadow-xs">
                    <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                    Instant Demo
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                  Browse sample medications, risk graphs, and timeline cascades.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE AUTH CARD (EXPLICIT SIGN IN VS SIGN UP TABS FOR ALL 3 ROLES)
        ══════════════════════════════════════════════════════════════════ */}
        {selectedRole && (
          <Card className="p-6 md:p-8 space-y-6">
            {/* Card Header: Back button + Role pill */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--chassis-dark)]">
              <button
                type="button"
                onClick={() => {
                  if (authMode === 'otp') {
                    setAuthMode('signup');
                    setErrorMsg(null);
                  } else {
                    setSelectedRole(null);
                    resetFormState();
                  }
                }}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center space-x-1 transition-colors cursor-pointer font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{authMode === 'otp' ? 'Back to Form' : 'Change Role'}</span>
              </button>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border font-mono ${roleLabels[selectedRole]?.badge}`}>
                {roleLabels[selectedRole]?.title}
              </span>
            </div>

            {/* Explicit Segmented Switcher: Sign In vs Sign Up */}
            {authMode !== 'otp' && (
              <div className="flex items-center gap-1.5 p-1.5 bg-[var(--chassis)] border border-[rgba(255,255,255,0.4)] rounded-2xl shadow-[var(--shadow-recessed)] w-full">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white font-bold shadow-sm border border-white/20'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
                  }`}
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white font-bold shadow-sm border border-white/20'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/50'
                  }`}
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            {/* ── 1. SIGN IN (LOGIN) FORM — Password only, Zero OTP ── */}
            {authMode === 'login' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                    {roleLabels[selectedRole]?.title} Sign In
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Enter your email and password to access your account.
                  </p>
                </div>

                {/* Lockout banner */}
                {lockoutSecsLeft > 0 && (
                  <div className="p-4 bg-[var(--chassis)] border-2 border-[var(--led-caution)] rounded-2xl text-sm text-[var(--text-primary)] space-y-1 shadow-sm font-mono">
                    <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                      <AlertCircle className="w-4 h-4 text-[var(--led-caution)] flex-shrink-0" />
                      Account temporarily locked
                    </div>
                    <p className="text-xs text-[var(--text-primary)] pl-6">
                      Too many failed attempts. Try again in{' '}
                      <strong className="font-bold font-mono text-[var(--text-primary)]">
                        {lockoutSecsLeft} second{lockoutSecsLeft !== 1 ? 's' : ''}
                      </strong>.
                    </p>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Email Address
                  </label>
                  <PolySafeInput
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    placeholder="name@example.com"
                    error={Boolean(emailError)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    className="text-base"
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <PolySafeInput
                    type="password"
                    required
                    value={password}
                    onBlur={() => setPasswordTouched(true)}
                    onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    placeholder="••••••••••••"
                    disabled={lockoutSecsLeft > 0}
                    error={Boolean(passwordError)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="text-base"
                  />
                  {passwordError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                    </p>
                  )}
                </div>

                {/* Remind Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer select-none font-mono">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                      className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--chassis-dark)] cursor-pointer"
                    />
                    <span className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Remember email on this device
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending || lockoutSecsLeft > 0}
                  className="btn-primary w-full text-base py-3.5 mt-1 cursor-pointer"
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing In...</span></>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                {/* Switch to sign up */}
                <p className="text-center text-xs text-[var(--text-muted)] font-mono pt-2">
                  New to PolySafe?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                    className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Create a new account
                  </button>
                </p>
              </form>
            )}

            {/* ── 2. SIGN UP FORM — Name + (Doctor Reg) + Password → Sends 1-time OTP ── */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                    Create {roleLabels[selectedRole]?.title} Account
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    A 6-digit OTP code will be sent to your email to verify your account once.
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    {selectedRole === 'DOCTOR' ? 'Physician Full Name' : 'Full Name'}
                  </label>
                  <PolySafeInput
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onBlur={() => setNameTouched(true)}
                    onChange={(e) => { setName(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    placeholder={selectedRole === 'DOCTOR' ? 'Dr. Priya Sharma, MD' : 'e.g. Priya Sharma'}
                    error={Boolean(nameError)}
                    leftIcon={<User className="w-4 h-4" />}
                    className="text-base"
                  />
                  {nameError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{nameError}
                    </p>
                  )}
                </div>

                {/* Doctor Medical Registration Number */}
                {selectedRole === 'DOCTOR' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                      Medical Registration / License No.
                    </label>
                    <PolySafeInput
                      type="text"
                      required
                      value={doctorRegNum}
                      onBlur={() => setDoctorRegNumTouched(true)}
                      onChange={(e) => { setDoctorRegNum(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder="MCI-2024-88492"
                      error={Boolean(doctorRegNumError)}
                      leftIcon={<FileText className="w-4 h-4" />}
                      className="text-base"
                    />
                    {doctorRegNumError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />{doctorRegNumError}
                      </p>
                    )}
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Email Address
                  </label>
                  <PolySafeInput
                    type="email"
                    required
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    placeholder="name@example.com"
                    error={Boolean(emailError)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    className="text-base"
                  />
                  {emailError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Password (min. 8 characters)
                  </label>
                  <PolySafeInput
                    type="password"
                    required
                    value={password}
                    onBlur={() => setPasswordTouched(true)}
                    onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    placeholder="••••••••••••"
                    error={Boolean(passwordError)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="text-base"
                  />
                  {passwordError && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                    </p>
                  )}
                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1.5 p-2.5 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-xl text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[var(--text-muted)]">Password Strength:</span>
                        <span className="font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--chassis-dark)] shadow-[var(--shadow-recessed)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(passwordStrength.score / 3) * 100}%`, backgroundColor: passwordStrength.color }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasLen ? <Check className="w-3 h-3 text-[var(--accent-primary)]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
                          <span className={passwordStrength.hasLen ? 'text-[var(--text-primary)] font-medium' : ''}>8+ characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasNum ? <Check className="w-3 h-3 text-[var(--accent-primary)]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
                          <span className={passwordStrength.hasNum ? 'text-[var(--text-primary)] font-medium' : ''}>Contains number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remind Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer select-none font-mono">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                      className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--chassis-dark)] cursor-pointer"
                    />
                    <span className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Remember email on this device
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={signupSendOtpMutation.isPending}
                  className="btn-primary w-full text-base py-3.5 mt-1 cursor-pointer"
                >
                  {signupSendOtpMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending Verification Code...</span></>
                  ) : (
                    <><span>Create Account & Send Code</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                {/* Switch to sign in */}
                <p className="text-center text-xs text-[var(--text-muted)] font-mono pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                    className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Sign in with password
                  </button>
                </p>
              </form>
            )}

            {/* ── 3. OTP VERIFICATION (New Registration Only) ── */}
            {authMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                      Verify Your Email
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Enter the 6-digit code sent to <strong className="text-[var(--text-primary)]">{email}</strong>.
                  </p>
                </div>

                {/* Dev OTP quick fill helper in dev mode */}
                {devOtpHint && (
                  <div className="p-3 bg-[var(--chassis)] border border-[var(--accent-primary)]/40 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)]">Dev Code: <strong className="text-[var(--accent-primary)]">{devOtpHint}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtpHint.split('');
                        setOtp(digits);
                        otpInputRefs.current[5]?.focus();
                      }}
                      className="px-2 py-1 bg-[var(--accent-primary)] text-white font-bold rounded-lg cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                {/* 6 OTP Boxes with auto-advance and backspace */}
                <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => { handleOtpChange(index, e.target.value); if (errorMsg) setErrorMsg(null); }}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      style={{ width: '48px', height: '56px' }}
                      className={`otp-box ${errorMsg ? 'input-error' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verifySignupOtpMutation.isPending}
                    className="btn-primary w-full text-base py-3.5 cursor-pointer"
                  >
                    {verifySignupOtpMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Activating Account...</span></>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" /><span>Verify & Create Account</span></>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setOtp(['', '', '', '', '', '']); setErrorMsg(null); }}
                      className="font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] cursor-pointer"
                    >
                      Edit Info
                    </button>

                    {countdown > 0 ? (
                      <span className="text-[var(--text-muted)] font-medium">
                        Resend in <strong className="text-[var(--text-primary)]">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={signupSendOtpMutation.isPending}
                        className="font-bold text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /><span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
