/**
 * Notification model — stores mock SMS notifications.
 * Real SMS delivery is NOT implemented. This collection is the
 * plug-in point for Africa's Talking or any other SMS gateway.
 *
 * To wire in Africa's Talking later, replace the body of
 * smsService.sendSMS() with their SDK call. The model stays the same.
 *
 * Demo Only: Use Fictional Data
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    ticketId:    { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    trackingId:  { type: String, required: true, index: true },
    phone:       { type: String, required: true },
    message:     { type: String, required: true },
    status:      { type: String, enum: ['mock_sent', 'failed', 'suppressed'], default: 'mock_sent' },
    /** When a real SMS gateway is wired in, store its response here */
    gatewayRef:  { type: String, default: null },
    sentAt:      { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
