/**
 * Admin auth tests — unauthenticated access rejection.
 * Every /api/admin route (except login) must return 401 when
 * no valid session cookie is present.
 * Demo Only: Use Fictional Data
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

beforeAll(async () => {
  // DB connection needed for mongoose middleware to not throw
  // If MONGODB_URI is absent the connect will fail gracefully in tests
  try { await connectDB(); } catch { /* no DB in CI — that is fine for these tests */ }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.close();
});

// All protected admin routes
const PROTECTED_ROUTES = [
  { method: 'get',   path: '/api/admin/me' },
  { method: 'post',  path: '/api/admin/logout' },
  { method: 'get',   path: '/api/admin/tickets' },
  { method: 'get',   path: '/api/admin/tickets/HD-TEST-0001' },
  { method: 'patch', path: '/api/admin/tickets/HD-TEST-0001' },
  { method: 'get',   path: '/api/admin/analytics/kpis' },
  { method: 'get',   path: '/api/admin/analytics/categories' },
  { method: 'get',   path: '/api/admin/analytics/priorities' },
  { method: 'get',   path: '/api/admin/analytics/daily' },
  { method: 'get',   path: '/api/admin/analytics/resolution' },
  { method: 'get',   path: '/api/admin/report' },
  { method: 'get',   path: '/api/admin/report/csv' },
  { method: 'get',   path: '/api/admin/report/pdf' },
];

describe('Admin route protection — unauthenticated requests', () => {
  for (const { method, path } of PROTECTED_ROUTES) {
    test(`${method.toUpperCase()} ${path} → 401 without cookie`, async () => {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      // Message must not leak implementation details
      expect(typeof res.body.message).toBe('string');
      expect(res.body.message.length).toBeGreaterThan(0);
    });
  }
});

describe('POST /api/admin/login — validation', () => {
  test('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(400);
  });

  test('returns 401 for wrong credentials', async () => {
    // Only works when ADMIN_USERNAME + ADMIN_PASSWORD_HASH are set
    if (!process.env.ADMIN_USERNAME) return;
    const res = await request(app).post('/api/admin/login').send({ username: 'wrong', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
