/**
 * Input sanitisation middleware.
 * Strips HTML tags and trims all string fields in req.body.
 * Applied before validation middleware on all POST routes.
 * Demo Only: Use Fictional Data
 */
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS = { allowedTags: [], allowedAttributes: {} };

function sanitizeValue(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, SANITIZE_OPTIONS).trim();
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      req.body[key] = sanitizeValue(req.body[key]);
    }
  }
  next();
}
