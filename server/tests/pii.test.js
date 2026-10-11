/**
 * Unit tests for maskPII().
 * 20 cases: standard PII, edge cases, mixed, and clean text.
 * Demo Only: Use Fictional Data
 */
import { maskPII } from '../src/services/piiService.js';

describe('maskPII()', () => {
  // -------------------------------------------------------------------------
  // 1. Reg/staff number
  // -------------------------------------------------------------------------
  test('masks a standalone reg number', () => {
    const { masked } = maskPII('My reg number is SCT221-0119/2024.');
    expect(masked).not.toContain('SCT221-0119/2024');
    expect(masked).toContain('[REG_NO]');
  });

  test('masks a reg number at the start of a sentence', () => {
    const { masked } = maskPII('HRD776-0987/2026 is my staff number.');
    expect(masked).toContain('[REG_NO]');
    expect(masked).not.toContain('HRD776-0987/2026');
  });

  // -------------------------------------------------------------------------
  // 2. Email address
  // -------------------------------------------------------------------------
  test('masks an email address mid-sentence', () => {
    const { masked } = maskPII('Please contact me at student@university.ac.ke for follow-up.');
    expect(masked).toContain('[EMAIL]');
    expect(masked).not.toContain('student@university.ac.ke');
  });

  test('masks an email with subdomain', () => {
    const { masked } = maskPII('Send the reply to john.doe@mail.example.com please.');
    expect(masked).toContain('[EMAIL]');
  });

  // -------------------------------------------------------------------------
  // 3. Kenyan phone numbers
  // -------------------------------------------------------------------------
  test('masks a phone number in international format', () => {
    const { masked } = maskPII('Call me on +254712345678 after 5pm.');
    expect(masked).toContain('[PHONE]');
    expect(masked).not.toContain('+254712345678');
  });

  test('masks a local 07xx format phone number', () => {
    const { masked } = maskPII('My number is 0723456789 if you need to reach me.');
    expect(masked).toContain('[PHONE]');
  });

  test('masks a 01xx Telkom format phone number', () => {
    const { masked } = maskPII('You can reach me on 0112345678.');
    expect(masked).toContain('[PHONE]');
  });

  // -------------------------------------------------------------------------
  // 4. M-Pesa transaction codes
  // -------------------------------------------------------------------------
  test('masks an M-Pesa transaction code', () => {
    const { masked } = maskPII('I paid using M-Pesa. Transaction code: QHJ1234ABC.');
    expect(masked).toContain('[TXN_CODE]');
    expect(masked).not.toContain('QHJ1234ABC');
  });

  test('masks a transaction code embedded in a sentence without punctuation', () => {
    const { masked } = maskPII('My mpesa ref is PGX9876ZYW and payment was confirmed');
    expect(masked).toContain('[TXN_CODE]');
  });

  // -------------------------------------------------------------------------
  // 5. National ID / passport-like numbers
  // -------------------------------------------------------------------------
  test('masks a standalone 8-digit national ID number', () => {
    const { masked } = maskPII('My national ID is 12345678 and I need assistance.');
    expect(masked).toContain('[ID_NUMBER]');
    expect(masked).not.toContain('12345678');
  });

  test('masks a passport-like alphanumeric code', () => {
    const { masked } = maskPII('My passport number is A1234567 for verification.');
    expect(masked).toContain('[ID_NUMBER]');
  });

  // -------------------------------------------------------------------------
  // 6. Multiple PII items in one text
  // -------------------------------------------------------------------------
  test('masks multiple different PII types in one string', () => {
    const input =
      'Hi, I am SCT221-0119/2024. My email is test@example.com and phone 0712345678. ' +
      'I paid via QHJ1234ABC.';
    const { masked } = maskPII(input);
    expect(masked).toContain('[REG_NO]');
    expect(masked).toContain('[EMAIL]');
    expect(masked).toContain('[PHONE]');
    expect(masked).toContain('[TXN_CODE]');
    expect(masked).not.toContain('SCT221-0119/2024');
    expect(masked).not.toContain('test@example.com');
    expect(masked).not.toContain('0712345678');
    expect(masked).not.toContain('QHJ1234ABC');
  });

  test('masks two phone numbers in one string', () => {
    const { masked } = maskPII('Primary: 0712345678, backup: 0723456789.');
    expect((masked.match(/\[PHONE\]/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------------------
  // 7. Numbers inside sentences (edge cases)
  // -------------------------------------------------------------------------
  test('does not mask a short 4-digit number (not a national ID)', () => {
    const { masked } = maskPII('The fee is KES 5000 and due on the 15th.');
    // 5000 is 4 digits — below the 6-digit threshold, should not become [ID_NUMBER]
    expect(masked).not.toContain('[ID_NUMBER]');
  });

  test('hadPII is false when no PII is present', () => {
    const { hadPII } = maskPII('I cannot log into the portal. Please help me reset my password.');
    expect(hadPII).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 8. Text with no PII — original and masked must be identical
  // -------------------------------------------------------------------------
  test('returns identical original and masked when no PII found', () => {
    const text = 'My student portal login stopped working after the system update.';
    const { original, masked } = maskPII(text);
    expect(original).toBe(text);
    expect(masked).toBe(text);
  });

  // -------------------------------------------------------------------------
  // 9. Edge: empty and non-string inputs
  // -------------------------------------------------------------------------
  test('handles empty string gracefully', () => {
    const { masked, hadPII } = maskPII('');
    expect(masked).toBe('');
    expect(hadPII).toBe(false);
  });

  test('handles non-string input gracefully without throwing', () => {
    expect(() => maskPII(null)).not.toThrow();
    expect(() => maskPII(undefined)).not.toThrow();
    expect(() => maskPII(12345)).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // 10. Original is always preserved unchanged
  // -------------------------------------------------------------------------
  test('always returns the original text unchanged', () => {
    const text = 'Please check my account SCT221-0456/2023 and email me at x@y.com.';
    const { original } = maskPII(text);
    expect(original).toBe(text);
  });

  // -------------------------------------------------------------------------
  // 11. Mixed case — email masking is case-insensitive for domain part
  // -------------------------------------------------------------------------
  test('masks email with mixed case', () => {
    const { masked } = maskPII('Reach me at Student.Name@University.AC.KE for help.');
    expect(masked).toContain('[EMAIL]');
  });

  // -------------------------------------------------------------------------
  // 12. hadPII flag is true when PII is found
  // -------------------------------------------------------------------------
  test('hadPII is true when PII is detected', () => {
    const { hadPII } = maskPII('My reg number is SCT221-0119/2024.');
    expect(hadPII).toBe(true);
  });
});
