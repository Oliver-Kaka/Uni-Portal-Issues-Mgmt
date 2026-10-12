/**
 * Jest mock for sanitize-html.
 * The sanitize-html library has a CJS/ESM incompatibility in Jest's
 * --experimental-vm-modules mode. For testing purposes, we replace it
 * with a simple pass-through that strips obvious HTML tags.
 * This mock is ONLY loaded by the test runner, never in production.
 */
export default function sanitizeHtml(input, _options) {
  if (typeof input !== 'string') return '';
  // Strip any HTML tags (simple regex — sufficient for tests)
  return input.replace(/<[^>]*>/g, '').trim();
}
