/**
 * Input sanitisation middleware.
 * Strips HTML tags and trims all string fields in req.body.
 * Applied before validation middleware on all POST routes.
 *
 * Uses no third-party library — built-in regex only.
 * This avoids the sanitize-html → htmlparser2 CJS/ESM conflict on Vercel.
 *
 * What it removes:
 *   - Any content between < and > (HTML/XML tags)
 *   - ASCII control characters (0x00–0x1F except tab/newline/CR, and 0x7F)
 * What it keeps:
 *   - All plain text, Unicode, punctuation, spaces, newlines
 *
 * Demo Only: Use Fictional Data
 */

/** Strip HTML tags and control characters, then trim. */
function sanitizeString(value) {
  return value
    .replace(/<[^>]*>/g, '')          // remove <anything>
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim();
}

function sanitizeValue(value) {
  if (typeof value !== 'string') return value;
  return sanitizeString(value);
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      req.body[key] = sanitizeValue(req.body[key]);
    }
  }
  next();
}
