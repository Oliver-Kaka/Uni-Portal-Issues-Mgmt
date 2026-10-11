/**
 * PII masking utility — SERVER SIDE ONLY.
 * Replaces personal identifiers in free text with safe placeholder tokens
 * BEFORE any text is sent to the Gemini API or stored in a public field.
 *
 * Placeholder constants live in @helpdesk/shared so the client can display them
 * in the "What the AI sees" preview without knowing the masking logic.
 *
 * Demo Only: Use Fictional Data
 */
import { PII_PATTERNS } from '@helpdesk/shared';

/**
 * Masks PII in a string, returning both the original and the masked version.
 *
 * Rules (applied in order — more specific patterns run first):
 *   1. M-Pesa transaction codes  → [TXN_CODE]
 *   2. Reg/staff numbers         → [REG_NO]
 *   3. Email addresses           → [EMAIL]
 *   4. Kenyan phone numbers      → [PHONE]
 *   5. Passport-like identifiers → [ID_NUMBER]
 *   6. Standalone 6–9 digit nums → [ID_NUMBER]
 *
 * @param {string} text - Raw user input.
 * @returns {{ original: string, masked: string, hadPII: boolean }}
 */
export function maskPII(text) {
  if (typeof text !== 'string') {
    return { original: String(text), masked: String(text), hadPII: false };
  }

  let masked = text;

  for (const { regex, placeholder } of PII_PATTERNS) {
    // Reset lastIndex — regex objects with /g flag carry state between calls
    regex.lastIndex = 0;
    masked = masked.replace(regex, placeholder);
  }

  // Reset all regex lastIndex after use (defensive — patterns are module-level)
  for (const { regex } of PII_PATTERNS) regex.lastIndex = 0;

  const hadPII = masked !== text;
  return { original: text, masked, hadPII };
}
