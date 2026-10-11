/**
 * Mongoose schema for Ticket.
 * Demo Only: Use Fictional Data
 */
import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, STATUSES } from '@helpdesk/shared';

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

    // Submitter fields — never returned to the Track page
    regNo: { type: String, required: true },
    phone: { type: String, default: null },

    // Issue details — never returned to the Track page
    issueDate: { type: Date, required: true },
    description: { type: String, required: true },

    // AI triage fields
    category: { type: String, enum: CATEGORIES, required: true },
    priority: { type: String, enum: PRIORITIES, required: true },
    routeTo: { type: String, required: true },
    canAutoResolve: { type: Boolean, required: true },
    etaHours: { type: Number, required: true },
    // summary is the AI plain-language summary shown to the submitter on the
    // confirmation screen. It is also returned (masked if needed) on the track page.
    summary: { type: String, required: true },
    // Flag set when the AI fallback was triggered
    aiConfidenceLow: { type: Boolean, default: false },

    // Lifecycle
    status: { type: String, enum: STATUSES, default: 'Open', required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },

    // Seed flag — never filter these out in production queries
    isDemoSeed: { type: Boolean, default: false },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  },
);

// Index for admin list queries (future use)
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
