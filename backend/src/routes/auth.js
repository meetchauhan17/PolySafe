const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

const prisma = require('../lib/prisma');
const { signToken } = require('../lib/jwt');
const { sendOtpEmail } = require('../lib/email');
const { auth } = require('../middleware/auth');

const router = express.Router();

const SALT_ROUNDS = 12;
const DUMMY_HASH = '$2b$12$invalidhashpaddingtopreventinenumeration00000000000000000';

// ─── Rate limiters ─────────────────────────────────────────────────────────────

/** 5 OTP send requests per email per hour */
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase()?.trim();
    if (email) return `otp-email:${email}`;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    return `otp-ip:${ip}`;
  },
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many code requests for this email. Please wait 1 hour.',
    });
  },
});

/** 10 login attempts per IP per 15 minutes */
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many login attempts from this network. Please wait 15 minutes.',
    });
  },
});

// ─── Zod schemas ───────────────────────────────────────────────────────────────

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['PATIENT', 'CAREGIVER']),
});

const signupSendOtpSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'CAREGIVER']),
});

const verifySignupOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

const patientLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['PATIENT', 'CAREGIVER']),
});

const doctorSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  registrationNumber: z.string().min(3, 'Medical registration number is required'),
});

const doctorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate req.body against a Zod schema; sends 400 on failure. */
function validate(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues ?? result.error.errors ?? [];
    const message = issues[0]?.message ?? 'Validation error.';
    res.status(400).json({ error: message });
    return null;
  }
  return result.data;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/check-email
// Checks whether an email+role combination already has an account.
// Frontend uses the response to decide: show signup form or login form.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/check-email', async (req, res) => {
  const data = validate(checkEmailSchema, req.body, res);
  if (!data) return;

  const targetEmail = data.email.toLowerCase().trim();

  try {
    const user = await prisma.user.findFirst({
      where: { email: targetEmail, role: data.role },
      select: { id: true },
    });
    return res.status(200).json({ exists: !!user });
  } catch (err) {
    console.error('[check-email]', err);
    res.status(500).json({ error: 'Could not check email. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/signup-send-otp
// New-account flow: validates password, hashes it, stores a PendingSignup
// row (not a real User yet), then emails the OTP.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/signup-send-otp', otpSendLimiter, async (req, res) => {
  const data = validate(signupSendOtpSchema, req.body, res);
  if (!data) return;

  const { name, password, role } = data;
  const targetEmail = data.email.toLowerCase().trim();

  try {
    // Guard: don't let someone re-signup with an email that already exists for this role
    const existing = await prisma.user.findFirst({
      where: { email: targetEmail, role },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous pending signups for this email+role
    await prisma.pendingSignup.updateMany({
      where: { email: targetEmail, role, used: false },
      data: { used: true },
    });

    // Create new pending signup row
    await prisma.pendingSignup.create({
      data: {
        name: name.trim(),
        email: targetEmail,
        passwordHash,
        role,
        code,
        expiresAt,
      },
    });

    // Send OTP via Resend
    await sendOtpEmail({ email: targetEmail, name: name.trim(), code });

    return res.status(200).json({
      message: 'Verification code sent to your email. It expires in 10 minutes.',
      email: targetEmail,
      // Dev-only hint so you can test without an inbox
      ...(process.env.NODE_ENV !== 'production' && { _devOtp: code }),
    });
  } catch (err) {
    console.error('[signup-send-otp]', err);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/verify-signup-otp
// Validates OTP, creates the real User record from PendingSignup, returns JWT.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/verify-signup-otp', async (req, res) => {
  const data = validate(verifySignupOtpSchema, req.body, res);
  if (!data) return;

  const targetEmail = data.email.toLowerCase().trim();
  const { code } = data;

  try {
    // Find the most recent valid pending signup for this email+code
    const pending = await prisma.pendingSignup.findFirst({
      where: {
        email: targetEmail,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check the code or request a new one.',
      });
    }

    // Mark pending signup as used
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { used: true },
    });

    // Guard: parallel race — ensure the user hasn't been created already
    let user = await prisma.user.findFirst({
      where: { email: targetEmail, role: pending.role },
      include: { patient: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: pending.name,
          passwordHash: pending.passwordHash,
          role: pending.role,
          ...(pending.role === 'PATIENT'
            ? {
                patient: {
                  create: {
                    age: 65,
                    conditions: [],
                    allergies: [],
                  },
                },
              }
            : {}),
        },
        include: { patient: true },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      message: 'Account created and signed in.',
      isNewUser: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        patient: user.patient,
      },
    });
  } catch (err) {
    console.error('[verify-signup-otp]', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /auth/me
// Returns current authenticated user and linked patient profile
// ═════════════════════════════════════════════════════════════════════════════
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        patient: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user, patient: user.patient });
  } catch (err) {
    console.error('[GET /auth/me]', err);
    return res.status(500).json({ error: 'Failed to fetch user session.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/login
// Returning-user login: email + password only, no OTP.
// Two-layer rate limiting: IP-level (above) + per-account lockout.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/login', loginIpLimiter, async (req, res) => {
  const data = validate(patientLoginSchema, req.body, res);
  if (!data) return;

  const { password, role } = data;
  const targetEmail = data.email.toLowerCase().trim();
  const GENERIC_ERROR = 'Invalid email or password.';

  try {
    const user = await prisma.user.findFirst({
      where: { email: targetEmail, role },
      include: { patient: true },
    });

    // ── Per-account lockout check ──────────────────────────────────────────
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingSecs = Math.ceil(remainingMs / 1000);
      return res.status(429).json({
        error: `Account is temporarily locked after too many failed attempts. Try again in ${remainingSecs} second${remainingSecs !== 1 ? 's' : ''}.`,
        lockedUntil: user.lockedUntil.toISOString(),
      });
    }

    // ── Password comparison (constant-time even if no user found) ──────────
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      // Increment failed attempts (only if the user actually exists)
      if (user) {
        const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
        const lockout = newAttempts >= 5 ? new Date(Date.now() + 20 * 1000) : null;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newAttempts,
            ...(lockout ? { lockedUntil: lockout } : {}),
          },
        });
      }
      return res.status(401).json({ error: GENERIC_ERROR });
    }

    // ── Success: reset lockout counters ────────────────────────────────────
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        patient: user.patient,
      },
    });
  } catch (err) {
    console.error('[patient/login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/doctor/signup
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor/signup', async (req, res) => {
  const data = validate(doctorSignupSchema, req.body, res);
  if (!data) return;

  const { email, password, name, registrationNumber } = data;
  const targetEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: targetEmail,
        name: name.trim(),
        passwordHash,
        role: 'DOCTOR',
      },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      message: 'Doctor account created successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber,
      },
    });
  } catch (err) {
    console.error('[doctor/signup]', err);
    res.status(500).json({ error: 'Account creation failed. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/doctor/login
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor/login', loginIpLimiter, async (req, res) => {
  const data = validate(doctorLoginSchema, req.body, res);
  if (!data) return;

  const { email, password } = data;
  const targetEmail = email.toLowerCase().trim();
  const GENERIC_ERROR = 'Invalid email or password.';

  try {
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });

    // ── Per-account lockout check ──────────────────────────────────────────
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingSecs = Math.ceil(remainingMs / 1000);
      return res.status(429).json({
        error: `Account is temporarily locked after too many failed attempts. Try again in ${remainingSecs} second${remainingSecs !== 1 ? 's' : ''}.`,
        lockedUntil: user.lockedUntil.toISOString(),
      });
    }

    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch || user.role !== 'DOCTOR') {
      if (user) {
        const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
        const lockout = newAttempts >= 5 ? new Date(Date.now() + 20 * 1000) : null;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newAttempts,
            ...(lockout ? { lockedUntil: lockout } : {}),
          },
        });
      }
      return res.status(401).json({ error: GENERIC_ERROR });
    }

    // ── Success: reset lockout counters ────────────────────────────────────
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[doctor/login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
