/**
 * SMS notification service — MOCK IMPLEMENTATION.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  PLUG-IN POINT: Africa's Talking (or any SMS gateway)       │
 * │                                                             │
 * │  To enable real SMS:                                        │
 * │  1. npm install africastalking --workspace=server           │
 * │  2. Add AT_API_KEY and AT_USERNAME to .env                  │
 * │  3. Replace the mock block below with the AT SDK call       │
 * │  4. Set ENABLE_REAL_SMS=true in your env                    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Demo Only: Use Fictional Data — no real SMS is ever sent.
 */
import Notification from '../models/Notification.js';

/**
 * Sends (or mocks) an SMS notification when a ticket status changes.
 *
 * @param {object} ticket   - The Mongoose Ticket document
 * @param {string} message  - The plain-text SMS body
 * @returns {Promise<void>}
 */
export async function sendStatusSMS(ticket, message) {
  if (!ticket.phone) return; // No phone — nothing to do

  const logPayload = {
    ticketId:   ticket._id,
    trackingId: ticket.trackingId,
    phone:      ticket.phone,
    message,
  };

  // ── MOCK block ─────────────────────────────────────────────────────────────
  // When ENABLE_REAL_SMS is not 'true', we write to MongoDB and return.
  if (process.env.ENABLE_REAL_SMS !== 'true') {
    await Notification.create({ ...logPayload, status: 'mock_sent' });
    console.log(`[SMS-MOCK] Would send to ${ticket.phone}: "${message}"`);
    return;
  }
  // ── END MOCK block — replace below with real gateway SDK ───────────────────

  // FUTURE: Africa's Talking example (commented out, not executed)
  // const AT = require('africastalking')({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
  // const sms = AT.SMS;
  // try {
  //   const result = await sms.send({ to: [ticket.phone], message, from: process.env.AT_SENDER_ID });
  //   await Notification.create({ ...logPayload, status: 'mock_sent', gatewayRef: result?.SMSMessageData?.Recipients?.[0]?.messageId });
  // } catch (err) {
  //   await Notification.create({ ...logPayload, status: 'failed' });
  //   console.error('[SMS] Gateway error:', err.message);
  // }
}

/**
 * Fetches all notifications for a given tracking ID (admin view only).
 */
export async function getNotificationsForTicket(trackingId) {
  return Notification.find({ trackingId }).sort({ sentAt: -1 }).lean();
}
