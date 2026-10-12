/**
 * Express application.
 * Does NOT call app.listen() — entry point handles that separately
 * so this file can be exported as a Vercel serverless function.
 * Demo Only: Use Fictional Data
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware/rateLimiter.js';
import ticketRoutes from './routes/tickets.js';
import adminRoutes from './routes/admin.js';
import mongoose from 'mongoose';

const app = express();

// ---------------------------------------------------------------------------
// CORS — credentials must be allowed for httpOnly cookie to work
// ---------------------------------------------------------------------------
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Rate limiting — global guard
// ---------------------------------------------------------------------------
app.use('/api', globalLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    _demo: 'Demo Only: Use Fictional Data',
  });
});

// ---------------------------------------------------------------------------
// 404 catch-all for unknown API routes
// ---------------------------------------------------------------------------
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ---------------------------------------------------------------------------
// Central error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'An unexpected error occurred.';
  console.error(`[Error] ${status} ${req.method} ${req.path}:`, err);
  res.status(status).json({ success: false, message });
});

export default app;
