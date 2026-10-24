/**
 * AuditLog model — records every admin action on a ticket.
 * Admin-only collection; never exposed to public endpoints.
 * Demo Only: Use Fictional Data
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    trackingId:    { type: String, required: true, index: true },
    adminUsername: { type: String, required: true },
    action:        { type: String, required: true },   // e.g. 'update_ticket', 'login', 'export_csv'
    details:       { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true, // createdAt = when the action happened
  },
);

auditLogSchema.index({ trackingId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
