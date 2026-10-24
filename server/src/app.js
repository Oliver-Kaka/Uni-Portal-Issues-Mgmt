/**
 * Express application.
 * Does NOT call app.listen() — entry point handles that separately
 * so this file can be exported as a Vercel serverless function.
 * Demo Only: Use Fictional Data
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { globalLimiter } from './middleware/rateLimiter.js';
import ticketRoutes from './routes/tickets.js';
import adminRoutes from './routes/admin.js';
import mongoose from 'mongoose';

const app = express();

// ---------------------------------------------------------------------------
// Security headers — helmet (must be before all other middleware)
// ---------------------------------------------------------------------------
app.use(
  helmet({
    // Allow the SPA to load in a frame on the same origin only (admin dashboard)
    frameguard: { action: 'sameorigin' },
    // CSP: restricts resources to same origin; Gemini calls are server-side so no external
    // fetch needed from the browser.
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],   // Tailwind injects inline styles at build
        imgSrc:         ["'self'", 'data:'],
        connectSrc:     ["'self'"],
        fontSrc:        ["'self'"],
        objectSrc:      ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // Prevent MIME sniffing
    noSniff: true,
    // Disable X-Powered-By
    hidePoweredBy: true,
    // Enforce HTTPS in production via HSTS
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    // Disable caching for API responses that may contain sensitive data
    // Individual routes override this where caching is acceptable
    noCache: false, // We handle this per-route
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// Prevent clients from caching any /api responses (they may contain ticket data)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

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
