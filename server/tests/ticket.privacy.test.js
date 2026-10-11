/**
 * Tests for GET /api/tickets/:trackingId
 * Asserts that sensitive fields are NEVER present in the response.
 * Demo Only: Use Fictional Data
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import Ticket from '../src/models/Ticket.js';

const FORBIDDEN_FIELDS = ['regNo', 'phone', 'description', 'issueDate', 'internalNote'];

let testTrackingId;

beforeAll(async () => {
  await connectDB();

  // Insert a test ticket directly so we don't need Gemini/API key in tests
  testTrackingId = 'HD-TEST-0001';
  await Ticket.deleteOne({ trackingId: testTrackingId });
  await Ticket.create({
    trackingId: testTrackingId,
    regNo: 'SCT221-0001/2024',
    phone: '0712345678',
    issueDate: new Date('2024-01-15'),
    description: 'This is a test description with enough characters to pass validation.',
    category: 'Portal Login Failure',
    priority: 'Medium',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 24,
    summary: 'Test summary.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', internalNote: 'INTERNAL NOTE - SECRET', changedAt: new Date() },
    ],
    isDemoSeed: true,
  });
});

afterAll(async () => {
  await Ticket.deleteOne({ trackingId: testTrackingId });
  await mongoose.connection.close();
});

describe('GET /api/tickets/:trackingId — privacy', () => {
  test('returns 200 for a known tracking ID', async () => {
    const res = await request(app).get(`/api/tickets/${testTrackingId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('response body does not contain forbidden top-level fields', async () => {
    const res = await request(app).get(`/api/tickets/${testTrackingId}`);
    const body = JSON.stringify(res.body);

    for (const field of FORBIDDEN_FIELDS) {
      // Check the key is absent from the top-level ticket object
      expect(res.body.ticket).not.toHaveProperty(field);
    }
  });

  test('statusHistory entries do not expose internalNote', async () => {
    const res = await request(app).get(`/api/tickets/${testTrackingId}`);
    const history = res.body.ticket?.statusHistory ?? [];
    for (const entry of history) {
      expect(entry).not.toHaveProperty('internalNote');
    }
  });

  test('returns expected public fields', async () => {
    const res = await request(app).get(`/api/tickets/${testTrackingId}`);
    const ticket = res.body.ticket;
    expect(ticket).toHaveProperty('trackingId');
    expect(ticket).toHaveProperty('status');
    expect(ticket).toHaveProperty('category');
    expect(ticket).toHaveProperty('priority');
    expect(ticket).toHaveProperty('etaHours');
    expect(ticket).toHaveProperty('summary');
    expect(ticket).toHaveProperty('statusHistory');
    expect(ticket).toHaveProperty('createdAt');
    expect(ticket).toHaveProperty('updatedAt');
  });

  test('returns generic 404 for unknown tracking ID', async () => {
    const res = await request(app).get('/api/tickets/HD-UNKN-0000');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Ticket not found.');
  });

  test('returns generic 404 for malformed tracking ID', async () => {
    const res = await request(app).get('/api/tickets/INVALID-ID');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Ticket not found.');
  });

  test('_demo flag is present in response', async () => {
    const res = await request(app).get(`/api/tickets/${testTrackingId}`);
    expect(res.body._demo).toBe('Demo Only: Use Fictional Data');
  });
});
