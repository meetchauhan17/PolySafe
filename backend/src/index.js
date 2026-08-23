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
});

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/medicine', medicineRoutes);
app.use('/medicine', scanRoutes); // /medicine/scan lives here
app.use('/interaction-flag', interactionFlagRoutes);
app.use('/symptom', symptomRoutes);
app.use('/connection', connectionRoutes);
app.use('/caregiver', caregiverRoutes);

// Health check
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-patient-room', (data) => {
    const id = typeof data === 'object' ? (data?.patientId || data?.userId) : data;
    if (id) {
      socket.join(`patient-${id}`);
      console.log(`[socket] Socket ${socket.id} joined room: patient-${id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`PolySafe Backend → http://localhost:${PORT}`);
  console.log(`Email OTP: ${process.env.SMTP_USER ? `SMTP Live (${process.env.SMTP_USER})` : (process.env.RESEND_API_KEY ? 'Resend Live' : 'Console Stub')}`);
});
