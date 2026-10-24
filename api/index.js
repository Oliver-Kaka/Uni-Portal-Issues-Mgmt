/**
 * Vercel serverless entry point — repo-root api/ directory.
 * Vercel requires serverless functions to live in the top-level api/ folder.
 * This file loads dotenv, connects to MongoDB, and re-exports the Express app
 * from the server workspace.
 * Demo Only: Use Fictional Data
 */
import 'dotenv/config';
import { connectDB } from '../server/src/config/db.js';
import app from '../server/src/app.js';

// Connect lazily — the cached helper means this only connects once per cold start
connectDB().catch((err) => console.error('[Vercel] DB connection error:', err.message));

export default app;
