/**
 * Ticket controller — createTicket and getTicket.
 * Extension points are marked with // EXTENSION: comments.
 * Demo Only: Use Fictional Data
 */
import Ticket from '../models/Ticket.js';
import { triageIssue } from '../services/geminiService.js';
import { generateTrackingId } from '../services/trackingIdService.js';

// ---------------------------------------------------------------------------
// POST /api/tickets
// ---------------------------------------------------------------------------
export async function createTicket(req, res, next) {
  try {
    const { regNo, issueDate, description, phone, consentGiven } = req.body;

    // Call Gemini — always resolves (fallback on failure)
    const triage = await triageIssue(description);

    const trackingId = await generateTrackingId();

    const ticket = await Ticket.create({
      trackingId,
      regNo,
      issueDate: new Date(issueDate),
      description,
      phone: phone || null,
      ...triage,
      status: 'Open',
      statusHistory: [
        {
          status: 'Open',
          publicNote: 'Ticket received and logged.',
          changedAt: new Date(),
        },
      ],
    });

    // EXTENSION: Send email/SMS confirmation here when notifications are added.

    return res.status(201).json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      trackingId: ticket.trackingId,
      category: ticket.category,
      priority: ticket.priority,
      routeTo: ticket.routeTo,
      canAutoResolve: ticket.canAutoResolve,
      etaHours: ticket.etaHours,
      summary: ticket.summary,
      aiConfidenceLow: ticket.aiConfidenceLow,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/tickets/:trackingId
// ---------------------------------------------------------------------------

/**
 * Fields that must NEVER be returned to the Track page.
 * This list is the authoritative block-list — add fields here as the schema grows.
 */
const FORBIDDEN_FIELDS = ['regNo', 'phone', 'description', 'issueDate', 'internalNote'];

export async function getTicket(req, res, next) {
  try {
    const { trackingId } = req.params;

    // Select only the fields the Track page is allowed to see.
    // Using an explicit projection ensures new schema fields default to excluded.
    const ticket = await Ticket.findOne(
      { trackingId },
      {
        trackingId: 1,
        status: 1,
        category: 1,
        priority: 1,
        etaHours: 1,
        summary: 1,
        aiConfidenceLow: 1,
        statusHistory: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    ).lean();

    if (!ticket) {
      // Generic message — identical for unknown and malformed IDs
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Strip internalNote from each statusHistory entry before sending
    const publicHistory = (ticket.statusHistory || []).map(({ status, publicNote, changedAt }) => ({
      status,
      publicNote,
      changedAt,
    }));

    // EXTENSION: Apply PII masking to summary here when that feature is added.

    return res.status(200).json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      ticket: {
        trackingId: ticket.trackingId,
        status: ticket.status,
        category: ticket.category,
        priority: ticket.priority,
        etaHours: ticket.etaHours,
        summary: ticket.summary,
        aiConfidenceLow: ticket.aiConfidenceLow,
        statusHistory: publicHistory,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
