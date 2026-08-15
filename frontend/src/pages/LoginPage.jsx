import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  HeartHandshake, 
  Stethoscope, 
  ArrowRight, 
  ArrowLeft, 
  Phone, 
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
} from 'lucide-react';
import { authApi } from '../api/auth';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, enterGuestMode } = useAuth();

  // Selected Role: null (role select screen) | 'PATIENT' | 'CAREGIVER' | 'DOCTOR'
  const [selectedRole, setSelectedRole] = useState(null);

  // Patient / Caregiver phone & OTP state
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const otpInputRefs = useRef([]);

  // Doctor Auth state
  const [doctorMode, setDoctorMode] = useState('login'); // 'login' | 'signup'
  const [doctorForm, setDoctorForm] = useState({
    email: '',
    password: '',
    name: '',
    registrationNumber: '',
  });

  // Error & Status Messages
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── TanStack Query Mutations ──────────────────────────────────────────────

  // 1. Send OTP Mutation
  const sendOtpMutation = useMutation({
    mutationFn: (phoneNumber) => authApi.sendPatientOtp(phoneNumber),
    onSuccess: (data) => {
      setErrorMsg(null);
      setOtpSent(true);
      notify.success('Security Code Sent', `A 6-digit OTP has been sent to ${phone}.`);
      if (data._devOtp) {
        setDevOtpHint(data._devOtp);
      }
      // Focus first OTP box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Failed to send OTP. Please check the phone number.';
      setErrorMsg(msg);
      notify.error('OTP Dispatch Failed', msg);
    },
  });

  // 2. Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, code }) => authApi.verifyPatientOtp({ phone, code }),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (data.token) {
        login(data.token, selectedRole || 'PATIENT', data.user);
      }

      notify.success('Authentication Verified', 'Welcome to PolySafe Patient Portal.');

      // Navigate according to user role and onboarding status
      if (selectedRole === 'CAREGIVER') {
        navigate('/caregiver-view');
      } else if (data.isNewUser || data.message?.toLowerCase().includes('created') || !data.user?.patient) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Invalid or expired OTP. Please try again.';
      setErrorMsg(msg);
      notify.error('Verification Failed', msg);
    },
  });

  // 3. Doctor Login Mutation
  const doctorLoginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.doctorLogin({ email, password }),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (data.token) {
        login(data.token, 'DOCTOR', data.user);
      }
      notify.success('Doctor Login Successful', 'Welcome to your Clinical Workstation.');
      navigate('/doctor-dashboard');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Invalid email or password.';
      setErrorMsg(msg);
      notify.error('Login Failed', msg);
    },
  });

  // 4. Doctor Signup Mutation
  const doctorSignupMutation = useMutation({
    mutationFn: (payload) => authApi.doctorSignup(payload),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (data.token) {
        login(data.token, 'DOCTOR', data.user);
      }
      notify.success('Practice Account Created', 'Welcome to PolySafe Clinical Portal.');
      navigate('/doctor-dashboard');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Signup failed. Please verify credentials.';
      setErrorMsg(msg);
      notify.error('Registration Failed', msg);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSendOtp = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid phone number (e.g. +919876543210).');
      return;
    }
    sendOtpMutation.mutate(phone);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of multiple digits
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
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }
    verifyOtpMutation.mutate({ phone, code });
  };

  const handleFillDevOtp = () => {
    if (devOtpHint) {
      const digits = devOtpHint.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleDoctorSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (doctorMode === 'signup') {
      if (!doctorForm.name || !doctorForm.registrationNumber || !doctorForm.email || !doctorForm.password) {
        setErrorMsg('Please fill in all required doctor registration fields.');
        return;
      }
      if (doctorForm.password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      doctorSignupMutation.mutate(doctorForm);
    } else {
      if (!doctorForm.email || !doctorForm.password) {
        setErrorMsg('Please provide both email and password.');
        return;
      }
      doctorLoginMutation.mutate({
        email: doctorForm.email,
        password: doctorForm.password,
      });
    }
  };

  return (
    <PageTransition className="min-h-[88vh] bg-[#FBF8F2] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#2B6E5E]/10 rounded-2xl border-2 border-[#2B6E5E]/20 text-[#2B6E5E] mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl text-[#232724] font-bold tracking-tight">
            PolySafe
          </h1>
          <p className="text-sm text-[#6B726C] max-w-sm mx-auto">
            AI Polypharmacy Interaction & Cumulative Burden Protection System
          </p>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1: ROLE SELECTION CARDS
           ══════════════════════════════════════════════════════════════════ */}
        {!selectedRole && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                I am a...
              </h2>
              <p className="text-xs text-[#6B726C]">
                Select your account type to access the appropriate clinical or personal dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Card 1: Patient */}
              <div
                onClick={() => {
                  setSelectedRole('PATIENT');
                  setErrorMsg(null);
                  setOtpSent(false);
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer"
              >
                <div className="p-3.5 bg-[#2B6E5E]/10 text-[#2B6E5E] rounded-2xl group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#2B6E5E] transition-colors">
                      Patient
                    </h3>
                    <span className="text-[11px] font-bold bg-[#E7E1D3] text-[#2B6E5E] px-2.5 py-0.5 rounded-full">
                      Phone + OTP
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I manage my own medications, log daily symptoms, and monitor drug interaction alerts.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#2B6E5E] group-hover:translate-x-1 transition-all self-center" />
              </div>

              {/* Card 2: Caregiver */}
              <div
                onClick={() => {
                  setSelectedRole('CAREGIVER');
                  setErrorMsg(null);
                  setOtpSent(false);
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer"
              >
                <div className="p-3.5 bg-[#8A6D3B]/10 text-[#8A6D3B] rounded-2xl group-hover:bg-[#8A6D3B] group-hover:text-white transition-colors">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#8A6D3B] transition-colors">
                      Family / Caregiver
                    </h3>
                    <span className="text-[11px] font-bold bg-[#E7E1D3] text-[#8A6D3B] px-2.5 py-0.5 rounded-full">
                      Phone + OTP
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I help an elderly family member manage prescriptions, verify sedative risks, and receive reminders.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#8A6D3B] group-hover:translate-x-1 transition-all self-center" />
              </div>

              {/* Card 3: Doctor */}
              <div
                onClick={() => {
                  setSelectedRole('DOCTOR');
                  setErrorMsg(null);
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer"
              >
                <div className="p-3.5 bg-[#1B4B66]/10 text-[#1B4B66] rounded-2xl group-hover:bg-[#1B4B66] group-hover:text-white transition-colors">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#1B4B66] transition-colors">
                      Doctor / Clinician
                    </h3>
                    <span className="text-[11px] font-bold bg-[#E7E1D3] text-[#1B4B66] px-2.5 py-0.5 rounded-full">
                      Email + Password
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I am a prescribing physician reviewing patient timelines, DDInter pharmacology, and prescribing cascades.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#1B4B66] group-hover:translate-x-1 transition-all self-center" />
              </div>

              {/* Guest / Demo Mode */}
              <div className="pt-2 border-t border-[#E7E1D3] flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    enterGuestMode();
                    notify.info('Demo Mode Active', 'Exploring PolySafe with sample mock records.');
                    navigate('/home');
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#2B6E5E] hover:text-[#1f5246] py-2 px-4 rounded-xl hover:bg-[#E4F2E9] transition-all"
                >
                  <Compass className="w-4 h-4 text-[#2B6E5E]" />
                  <span>Explore Demo Patient (Guest Mode — No Login Required)</span>
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2: PATIENT / CAREGIVER PHONE + OTP FLOW
           ══════════════════════════════════════════════════════════════════ */}
        {(selectedRole === 'PATIENT' || selectedRole === 'CAREGIVER') && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D3]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setOtpSent(false);
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-[#6B726C] hover:text-[#2B6E5E] flex items-center space-x-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Role ({selectedRole === 'PATIENT' ? 'Patient' : 'Caregiver'})</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 bg-[#2B6E5E]/10 text-[#2B6E5E] rounded-lg">
                Secure Mobile Sign-In
              </span>
            </div>

            {!otpSent ? (
              // Step 2A: Phone Number Form
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                    Enter Your Mobile Number
                  </h2>
                  <p className="text-xs text-[#6B726C]">
                    We will send a 6-digit one-time password (OTP) via SMS to verify your identity.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                    Phone Number (E.164 with Country Code)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="+919876543210"
                      className={`input-field pl-10 text-base ${errorMsg ? 'input-error' : ''}`}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B726C]">
                    Example: <span className="font-semibold text-[#2B6E5E]">+919876543210</span> or <span className="font-semibold text-[#2B6E5E]">+14155552671</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendOtpMutation.isPending}
                  className="btn-primary w-full text-base py-3.5"
                >
                  {sendOtpMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Step 2B: 6-Digit OTP Form
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                    Enter 6-Digit Code
                  </h2>
                  <p className="text-xs text-[#6B726C]">
                    Code sent to <span className="font-bold text-[#232724]">{phone}</span>
                  </p>
                </div>

                {/* Dev Mode OTP auto-hint banner */}
                {devOtpHint && (
                  <div className="p-3 bg-[#2B6E5E]/10 border border-[#2B6E5E]/30 rounded-xl flex items-center justify-between text-xs text-[#2B6E5E]">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#2B6E5E]" />
                      <span><strong>Demo Mode OTP:</strong> {devOtpHint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDevOtp}
                      className="font-bold underline hover:text-[#1B453A] cursor-pointer"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                {/* 6 OTP Boxes */}
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => {
                        handleOtpChange(index, e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      onKeyDown={(e) => handleOtpKeyDown(index, e.target)}
                      className={`otp-box ${errorMsg ? 'input-error' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verifyOtpMutation.isPending}
                    className="btn-primary w-full text-base py-3.5"
                  >
                    {verifyOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setErrorMsg(null);
                      }}
                      className="font-bold text-[#6B726C] hover:text-[#2B6E5E]"
                    >
                      Change Phone Number
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="font-bold text-[#2B6E5E] hover:underline flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Resend Code</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3: DOCTOR EMAIL + PASSWORD FLOW (LOGIN / SIGNUP)
           ══════════════════════════════════════════════════════════════════ */}
        {selectedRole === 'DOCTOR' && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D3]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-[#6B726C] hover:text-[#2B6E5E] flex items-center space-x-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Role</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 bg-[#1B4B66]/10 text-[#1B4B66] rounded-lg">
                Physician Credentials
              </span>
            </div>

            {/* Login vs Signup Tab Switcher */}
            <div className="segmented-toggle-container w-full">
              <button
                type="button"
                onClick={() => {
                  setDoctorMode('login');
                  setErrorMsg(null);
                }}
                className={`segmented-toggle-btn flex-1 justify-center ${
                  doctorMode === 'login' ? 'active' : ''
                }`}
              >
                Doctor Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setDoctorMode('signup');
                  setErrorMsg(null);
                }}
                className={`segmented-toggle-btn flex-1 justify-center ${
                  doctorMode === 'signup' ? 'active' : ''
                }`}
              >
                Register New Practice
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              {doctorMode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                      Physician Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={doctorForm.name}
                        onChange={(e) => {
                          setDoctorForm({ ...doctorForm, name: e.target.value });
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Dr. Robert Chen, MD"
                        className={`input-field pl-10 ${errorMsg ? 'input-error' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                      Medical Registration / License No.
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={doctorForm.registrationNumber}
                        onChange={(e) => {
                          setDoctorForm({ ...doctorForm, registrationNumber: e.target.value });
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="MCI-2024-88492"
                        className={`input-field pl-10 ${errorMsg ? 'input-error' : ''}`}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Professional Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => {
                      setDoctorForm({ ...doctorForm, email: e.target.value });
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="dr.chen@hospital.org"
                    className={`input-field pl-10 ${errorMsg ? 'input-error' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Password {doctorMode === 'signup' && '(min. 8 characters)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={doctorForm.password}
                    onChange={(e) => {
                      setDoctorForm({ ...doctorForm, password: e.target.value });
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="••••••••••••"
                    className={`input-field pl-10 ${errorMsg ? 'input-error' : ''}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={doctorLoginMutation.isPending || doctorSignupMutation.isPending}
                className="btn-primary w-full text-base py-3.5 mt-2"
              >
                {(doctorLoginMutation.isPending || doctorSignupMutation.isPending) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    <span>
                      {doctorMode === 'signup' ? 'Create Doctor Account' : 'Sign In to Clinical Portal'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </Card>
        )}

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-[#6B726C]">
          <p>PolySafe is an informational clinical decision support system.</p>
          <p className="text-[11px] text-[#6B726C]/80 mt-0.5">
            Prescription changes must always be confirmed directly with your healthcare provider.
          </p>
        </div>

      </div>
    </PageTransition>
  );
}
