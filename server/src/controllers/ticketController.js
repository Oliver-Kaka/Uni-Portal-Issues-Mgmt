/**
 * Ticket controller — createTicket, getTicket, submitRating, reopenTicket.
 * Extension points are marked with // EXTENSION: comments.
 * Demo Only: Use Fictional Data
 */
import Ticket from '../models/Ticket.js';
import { triageIssue } from '../services/geminiService.js';
import { generateTrackingId } from '../services/trackingIdService.js';
import { SATISFACTION_RATINGS, REOPEN_WINDOW_DAYS } from '@helpdesk/shared';

// ---------------------------------------------------------------------------
// POST /api/tickets
// ---------------------------------------------------------------------------
export async function createTicket(req, res, next) {
  try {
    const { regNo, issueDate, description, phone } = req.body;

    // triageIssue runs PII masking internally before calling Gemini
    const triage = await triageIssue(description);

    const trackingId = await generateTrackingId();

    const ticket = await Ticket.create({
      trackingId,
      regNo,
      issueDate: new Date(issueDate),
      description,                          // raw original — never exposed publicly
      phone: phone || null,
      maskedDescription: triage.maskedDescription,
      hadPII: triage.hadPII,
      category: triage.category,
      priority: triage.priority,
      routeTo: triage.routeTo,
      canAutoResolve: triage.canAutoResolve,
      etaHours: triage.etaHours,
      summary: triage.summary,
      summaryEn: triage.summaryEn,
      detectedLanguage: triage.detectedLanguage,
      suggestedSteps: triage.suggestedSteps,
      aiConfidenceLow: triage.aiConfidenceLow,
      status: 'Open',
      statusHistory: [
        { status: 'Open', publicNote: 'Ticket received and logged.', changedAt: new Date() },
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
      summaryEn: ticket.summaryEn,
      detectedLanguage: ticket.detectedLanguage,
      suggestedSteps: ticket.suggestedSteps,
      aiConfidenceLow: ticket.aiConfidenceLow,
      // PII preview — the user sees what the AI received, not the raw text
      maskedDescription: ticket.maskedDescription,
      hadPII: ticket.hadPII,
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
 * Authoritative block-list — add fields here as the schema grows.
 */
const FORBIDDEN_FIELDS = [
  'regNo',
  'phone',
  'description',          // raw original description
  'issueDate',
  'internalNote',
  'summaryEn',            // English staff summary — not for public track page
  'hadPII',               // internal processing detail
];

export async function getTicket(req, res, next) {
  try {
    const { trackingId } = req.params;

    // Explicit projection — new schema fields are excluded by default
    const ticket = await Ticket.findOne(
      { trackingId },
      {
        trackingId: 1,
        status: 1,
        category: 1,
        priority: 1,
        etaHours: 1,
        summary: 1,
        detectedLanguage: 1,
        suggestedSteps: 1,
        aiConfidenceLow: 1,
        statusHistory: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
        // maskedDescription intentionally excluded — not needed on track page
      },
    ).lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Strip internalNote from statusHistory entries
    const publicHistory = (ticket.statusHistory || []).map(({ status, publicNote, changedAt }) => ({
      status,
      publicNote,
      changedAt,
    }));

    // EXTENSION: Apply additional PII masking to summary here when that feature is added.

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
        detectedLanguage: ticket.detectedLanguage,
        suggestedSteps: ticket.suggestedSteps,
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

// ---------------------------------------------------------------------------
// POST /api/tickets/:trackingId/rating
// ---------------------------------------------------------------------------

/**
 * Submit a satisfaction rating (1–5) for a Resolved or Closed ticket.
 * The submitter can only rate once; subsequent calls overwrite the rating.
 */
export async function submitRating(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { rating } = req.body;

    if (!SATISFACTION_RATINGS.includes(Number(rating))) {
      return res.status(400).json({
        success: false,
        message: `Rating must be one of ${SATISFACTION_RATINGS.join(', ')}.`,
      });
    }

    const ticket = await Ticket.findOne({ trackingId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (!['Resolved', 'Closed'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: 'Ratings can only be submitted for Resolved or Closed tickets.',
      });
    }

    ticket.satisfactionRating = Number(rating);
    await ticket.save();

    return res.json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      message: 'Thank you for your feedback.',
      satisfactionRating: ticket.satisfactionRating,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/tickets/:trackingId/reopen
// ---------------------------------------------------------------------------

/**
 * Reopen a Resolved or Closed ticket within REOPEN_WINDOW_DAYS days.
 * Requires a non-empty reason in the request body.
 */
export async function reopenTicket(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A reopen reason of at least 5 characters is required.',
      });
    }

    const ticket = await Ticket.findOne({ trackingId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (!['Resolved', 'Closed'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only Resolved or Closed tickets can be reopened.',
      });
    }

    // Find the most recent Resolved/Closed status history entry
    const resolvedEntry = [...ticket.statusHistory]
      .reverse()
      .find(h => ['Resolved', 'Closed'].includes(h.status));

    if (resolvedEntry) {
      const resolvedAt = new Date(resolvedEntry.changedAt);
      const windowMs   = REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - resolvedAt.getTime() > windowMs) {
        return res.status(400).json({
          success: false,
          message: `Tickets can only be reopened within ${REOPEN_WINDOW_DAYS} days of resolution.`,
        });
      }
    }

    ticket.status = 'Open';
    ticket.statusHistory.push({
      status: 'Open',
      publicNote: `Ticket reopened. Reason: ${reason.trim().slice(0, 200)}`,
      changedAt: new Date(),
    });
    await ticket.save();

    return res.json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      message: 'Ticket has been reopened.',
      trackingId: ticket.trackingId,
      status: ticket.status,
    });
  } catch (err) {
    next(err);
  }
}
