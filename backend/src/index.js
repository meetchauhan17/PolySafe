const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  pingTimeout: 30000,
  pingInterval: 25000,
  connectTimeout: 20000,
  allowEIO3: true,
});

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Global API Rate Limiter (Item 8: Rate Limiting)
const rateLimit = require('express-rate-limit');
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP address. Please slow down and try again shortly.',
  },
});
app.use('/api', globalApiLimiter);

// Ensure req.body is safely initialized to an object for all requests
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  next();
});

// Make io available to route handlers via req.app.get('io')
app.set('io', io);

// ─── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const medicineRoutes = require('./routes/medicine');
const scanRoutes = require('./routes/scan');
const interactionFlagRoutes = require('./routes/interactionFlag');
const symptomRoutes          = require('./routes/symptom');
const connectionRoutes       = require('./routes/connection');
const caregiverRoutes        = require('./routes/caregiver');
const analyticsRoutes        = require('./routes/analytics');
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/medicine', medicineRoutes);
app.use('/medicine', scanRoutes); // /medicine/scan lives here
app.use('/interaction-flag', interactionFlagRoutes);
app.use('/symptom', symptomRoutes);
app.use('/connection', connectionRoutes);
app.use('/caregiver', caregiverRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    const prisma = require('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (_e) {
    dbOk = false;
  }

  res.status(200).json({
    status: 'ok',
    api: true,
    db: dbOk,
    demoMode: process.env.DEMO_MODE === 'true',
    groqKey: !!process.env.GROQ_API_KEY,
    geminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] Connected: ${socket.id}`);

  socket.on('join-patient-room', (data) => {
    if (typeof data === 'object') {
      const rooms = new Set();
      if (data?.patientId) rooms.add(`patient-${data.patientId}`);
      if (data?.userId) rooms.add(`patient-${data.userId}`);
      rooms.forEach((r) => {
        socket.join(r);
        console.log(`[socket] Socket ${socket.id} joined room: ${r}`);
      });
    } else if (data) {
      socket.join(`patient-${data}`);
      console.log(`[socket] Socket ${socket.id} joined room: patient-${data}`);
    }
  });

  socket.on('join-caregiver-room', (data) => {
    const id = typeof data === 'object' ? (data?.caregiverId || data?.userId || data?.patientId) : data;
    if (id) {
      socket.join(`caregiver-${id}`);
      socket.join(`caregiver-patient-${id}`);
      console.log(`[socket] Socket ${socket.id} joined caregiver room: caregiver-${id}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] Disconnected: ${socket.id} (${reason})`);
  });
});

// ─── Overdue Dose Sweeper Job (MISSED Status) ─────────────────────────────────
const { checkOverdueDoses } = require('./services/doseService');
const isFastDoseTiming = process.env.DEMO_DOSE_TIMING === 'fast';
const DOSE_CHECK_INTERVAL = isFastDoseTiming ? 10 * 1000 : 5 * 60 * 1000;

setInterval(() => {
  checkOverdueDoses(io);
}, DOSE_CHECK_INTERVAL);

// Run initial check after 5 seconds on startup
setTimeout(() => {
  checkOverdueDoses(io);
}, 5000);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`PolySafe Backend → http://0.0.0.0:${PORT}`);
    console.log(`Email OTP: ${process.env.SMTP_USER ? `SMTP Live (${process.env.SMTP_USER})` : (process.env.RESEND_API_KEY ? 'Resend Live' : 'Console Stub')}`);
    console.log(`Dose Sweeper Active (Timing: ${isFastDoseTiming ? 'FAST (10s interval, 1m overdue)' : 'Standard (5m interval, 60m overdue)'})`);
  });
}

module.exports = app;


