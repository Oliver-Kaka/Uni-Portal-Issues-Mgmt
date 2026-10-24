/**
 * Outage detection service.
 * Checks whether any category has OUTAGE_TICKET_THRESHOLD or more tickets
 * created within the last OUTAGE_WINDOW_MINUTES.
 * Thresholds live in @helpdesk/shared so they are configurable in one place.
 * Demo Only: Use Fictional Data
 */
import Ticket from '../models/Ticket.js';
import { OUTAGE_TICKET_THRESHOLD, OUTAGE_WINDOW_MINUTES, CATEGORIES } from '@helpdesk/shared';

/**
 * Returns an array of active outage objects.
 * Each object: { category, count, windowMinutes, threshold }
 * An empty array means no outage is detected.
 */
export async function detectOutages() {
  const since = new Date(Date.now() - OUTAGE_WINDOW_MINUTES * 60 * 1000);

  const results = await Ticket.aggregate([
    { $match: { createdAt: { $gte: since }, category: { $in: CATEGORIES } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $match: { count: { $gte: OUTAGE_TICKET_THRESHOLD } } },
    { $sort: { count: -1 } },
  ]);

  return results.map(r => ({
    category:      r._id,
    count:         r.count,
    windowMinutes: OUTAGE_WINDOW_MINUTES,
    threshold:     OUTAGE_TICKET_THRESHOLD,
  }));
}
