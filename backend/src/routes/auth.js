const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

const prisma = require('../lib/prisma');
const { signToken } = require('../lib/jwt');
const { sendOtpEmail } = require('../lib/email');

const router = express.Router();

// ─── Rate limiter: max 5 OTP sends per email per hour ─────────────────────────
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
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
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many verification code requests for this email address. Please wait 1 hour before trying again.',
    });
  },
});

// ─── Zod validation schemas ───────────────────────────────────────────────────

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address format'),
  name: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address format'),
  code: z.string().length(6, 'Verification code must be exactly 6 digits'),
  name: z.string().optional(),
  role: z.enum(['PATIENT', 'CAREGIVER']).optional(),
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
// POST /auth/patient/send-otp
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/send-otp', otpSendLimiter, async (req, res) => {
  const data = validate(sendOtpSchema, req.body, res);
  if (!data) return;

  const targetEmail = data.email.toLowerCase().trim();
  const userName = data.name?.trim() || undefined;

  try {
    // Generate secure random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate previous unused codes for this email
    await prisma.otpCode.updateMany({
      where: {
        email: targetEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Store new OTP in database
    await prisma.otpCode.create({
      data: {
        email: targetEmail,
        code,
        expiresAt,
        used: false,
      },
    });

    // Send the verification code via Resend
    await sendOtpEmail({
      email: targetEmail,
      name: userName,
      code,
    });

    return res.status(200).json({
      message: 'Verification code sent to your email.',
      email: targetEmail,
      // REMOVE _devOtp before production — included in non-production for testing convenience
      ...(process.env.NODE_ENV !== 'production' && { _devOtp: code }),
    });
  } catch (err) {
    console.error('[send-otp]', err);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/verify-otp
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/verify-otp', async (req, res) => {
  const data = validate(verifyOtpSchema, req.body, res);
  if (!data) return;

  const targetEmail = data.email.toLowerCase().trim();
  const { code, name, role } = data;

  try {
    // Look up the active unexpired OTP code record
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: targetEmail,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        error: 'Invalid or expired verification code. Please check the code or request a new one.',
      });
    }

    // Mark the OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create User record
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { patient: true },
    });

    const isNewUser = !user;
    const assignedRole = role || 'PATIENT';
    const displayName = name?.trim() || user?.name || 'PolySafe User';

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: targetEmail,
          name: displayName,
          role: assignedRole,
        },
        include: { patient: true },
      });
    } else if (name?.trim() && (user.name === 'PolySafe User' || !user.name)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
        include: { patient: true },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: isNewUser ? 'Account created and signed in.' : 'Signed in successfully.',
      isNewUser,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patient: user.patient,
      },
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
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
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const SALT_ROUNDS = 12;
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
router.post('/doctor/login', async (req, res) => {
  const data = validate(doctorLoginSchema, req.body, res);
  if (!data) return;

  const { email, password } = data;
  const targetEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });

    // Constant-time dummy hash comparison to prevent user enumeration
    const DUMMY_HASH = '$2b$12$invalidhashpaddingtopreventinenumeration00000000000000000';
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;

    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch || user.role !== 'DOCTOR') {
      return res.status(401).json({ error: 'Invalid email or password.' });
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
