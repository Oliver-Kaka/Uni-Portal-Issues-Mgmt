/**
 * @helpdesk/shared — validation config
 * Single source of truth for all regex patterns, enums and field limits.
 * Imported by both client and server. Do NOT duplicate rules elsewhere.
 *
 * Demo Only: Use Fictional Data
 */

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/**
 * Registration / Staff Number
 *
 * Structure:  [A-Z]{3}  \d{3}  -  \d{4}  /  20[0-9]{2}
 * Examples:   SCT221-0119/2024   HRD776-0987/2026
 *
 * Breakdown:
 *   ^          – start of string
 *   [A-Z]{3}   – exactly 3 uppercase ASCII letters (faculty/department code)
 *   \d{3}      – exactly 3 digits
 *   -          – literal hyphen separator
 *   \d{4}      – exactly 4 digits (enrolment sequence)
 *   \/         – literal forward slash
 *   20         – year must begin with "20" (covers 2000-2099)
 *   [0-9]{2}   – last two digits of the year
 *   $          – end of string
 */
export const REG_NUMBER_REGEX = /^[A-Z]{3}\d{3}-\d{4}\/20[0-9]{2}$/;

/**
 * Kenyan mobile phone number (optional field)
 *
 * Accepted formats:
 *   +2547XXXXXXXX  – international, Safaricom/Airtel 07xx series
 *   07XXXXXXXX     – local format starting with 07
 *   01XXXXXXXX     – local format, Telkom Kenya
 */
export const PHONE_REGEX = /^(\+2547\d{8}|07\d{8}|01\d{8})$/;

/**
 * Tracking ID
 *
 * Format:  HD-[A-Z0-9]{4}-[A-Z0-9]{4}
 * Example: HD-7K3Q-9XPM
 *
 *   HD-        – fixed "Help Desk" prefix
 *   [A-Z0-9]{4} – 4 uppercase alphanumeric chars (ambiguous chars excluded at gen time)
 *   -           – separator
 *   [A-Z0-9]{4} – 4 more uppercase alphanumeric chars
 */
export const TRACKING_ID_REGEX = /^HD-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// ---------------------------------------------------------------------------
// Field length limits
// ---------------------------------------------------------------------------

export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  'Portal Login Failure',
  'Fee Discrepancy',
  'Unit Registration',
  'Graduation / Email Transfer',
  'Student ID Replacement',
  'Needs Human Review',
];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const STATUSES = ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'];

// ---------------------------------------------------------------------------
// Convenience validation helpers (pure functions, no side-effects)
// ---------------------------------------------------------------------------

/** Returns true when the value is a valid reg/staff number. */
export const isValidRegNo = (v) => REG_NUMBER_REGEX.test(v);

/** Returns true when the value is a valid Kenyan phone number. */
export const isValidPhone = (v) => PHONE_REGEX.test(v);

/** Returns true when the value is a valid tracking ID. */
export const isValidTrackingId = (v) => TRACKING_ID_REGEX.test(v);

/**
 * Returns true when issueDate is:
 *   - a valid Date (or parseable string)
 *   - not in the future
 *   - not before 2000-01-01
 */
export const isValidIssueDate = (v) => {
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const min = new Date('2000-01-01');
  return d <= now && d >= min;
};
