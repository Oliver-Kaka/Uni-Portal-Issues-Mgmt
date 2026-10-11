/**
 * Tracking ID generator.
 * Uses crypto.randomBytes (not Math.random) for unpredictability.
 * Excludes visually ambiguous characters (0/O, 1/I/L).
 * Format: HD-XXXX-XXXX
 * Demo Only: Use Fictional Data
 */
import crypto from 'crypto';
import Ticket from '../models/Ticket.js';

// 32-character alphabet — no 0, O, 1, I, L to avoid confusion when read aloud
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SEGMENT_LEN = 4;
const MAX_RETRIES = 5;

function generateSegment() {
  const bytes = crypto.randomBytes(SEGMENT_LEN);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
}

function buildId() {
  return `HD-${generateSegment()}-${generateSegment()}`;
}

/**
 * Generates a unique tracking ID, retrying on collision up to MAX_RETRIES times.
 * @returns {Promise<string>} A unique tracking ID.
 */
export async function generateTrackingId() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const id = buildId();
    const exists = await Ticket.exists({ trackingId: id });
    if (!exists) return id;
    console.warn(`[TrackingID] Collision on attempt ${attempt}: ${id}`);
  }
  throw new Error('Failed to generate a unique tracking ID after maximum retries.');
}
