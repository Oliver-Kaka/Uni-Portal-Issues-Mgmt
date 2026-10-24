/**
 * Vercel serverless entry point — repo-root api/ directory (ESM).
 *
 * Vercel requires serverless functions to live in a top-level api/ folder.
 * "type":"module" in api/package.json (and root package.json) ensures Node
 * treats this file as ESM so all relative imports resolve correctly.
 *
 * MongoDB is connected lazily inside the exported handler so the cached
 * connection survives across warm invocations without blocking module load.
 *
 * Demo Only: Use Fictional Data
 */
import 'dotenv/config';
import { connectDB } from '../server/src/config/db.js';
import app from '../server/src/app.js';

/**
 * Vercel calls the default export as the serverless handler.
 * We connect to MongoDB on every cold start (the cached connectDB()
 * helper is a no-op if the connection is already open).
 */
export default async function handler(req, res) {
  await connectDB().catch((err) =>
    console.error('[Vercel] DB connection error:', err.message),
  );
  return app(req, res);
}
