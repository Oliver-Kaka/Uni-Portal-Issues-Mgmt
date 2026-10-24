/**
 * Mongoose schema for Ticket.
 * Demo Only: Use Fictional Data
 */
import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES, DEPARTMENTS } from '@helpdesk/shared';

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    // publicNote is shown to the submitter on the Track page
    publicNote: { type: String, default: '' },
    // internalNote is admin-only and NEVER returned to the client
    internalNote: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ticketSchema = new Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },

    // Submitter fields — NEVER returned to the Track page
    regNo:   { type: String, required: true },
    phone:   { type: String, default: null },

    // Issue details — NEVER returned to the Track page
    issueDate:   { type: Date,   required: true },
    description: { type: String, required: true },   // raw original text

    // PII masking — maskedDescription is what Gemini saw; only this is ever
    // shared externally. originalDescription is kept for admin audit only.
    maskedDescription: { type: String, default: '' },
    hadPII:            { type: Boolean, default: false },

    // AI triage fields
    category:       { type: String, enum: CATEGORIES, required: true },
    priority:       { type: String, enum: PRIORITIES, required: true },
    routeTo:        { type: String, required: true },
    canAutoResolve: { type: Boolean, required: true },
    etaHours:       { type: Number, required: true },

    // summary: in the user's detected language (shown to submitter)
    summary:   { type: String, required: true },
    // summaryEn: English version for staff review
    summaryEn: { type: String, default: '' },

    // Multilingual
    detectedLanguage: { type: String, enum: ['en', 'sw', 'mixed'], default: 'en' },

    // Self-service suggestions from Gemini (in user language)
    suggestedSteps: { type: [String], default: [] },

    // Flag set when AI fallback was triggered (public) or confidence < threshold
    aiConfidenceLow: { type: Boolean, default: false },

    // ---------------------------------------------------------------------------
    // Admin-only fields — NEVER returned by public endpoints
    // ---------------------------------------------------------------------------

    // Admin can override the AI-assigned category (tracks accuracy)
    adminCategory: { type: String, enum: [...CATEGORIES, null], default: null },

    // Actual hours taken to resolve (set by admin on closure)
    actualResolutionHours: { type: Number, default: null },

    // Lifecycle
    status:        { type: String, enum: STATUSES, default: 'Open', required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    // Submitter satisfaction rating (1–5), submitted after resolution
    satisfactionRating: { type: Number, min: 1, max: 5, default: null },

    // Optional attachment filename (stored name only, not the file itself)
    attachmentFilename: { type: String, default: null },

    // Seed flag
    isDemoSeed: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  },
);

// Indexes for admin list, filters and analytics
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ category: 1, createdAt: -1 });
ticketSchema.index({ priority: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
