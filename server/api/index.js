/**
 * Vercel serverless entry point.
 * Exports the Express app — Vercel wraps it as a Function.
 * Demo Only: Use Fictional Data
 */
import 'dotenv/config';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';

// Connect lazily — the cached helper means this only connects once per cold start
connectDB().catch((err) => console.error('[Vercel] DB connection error:', err.message));

export default app;
