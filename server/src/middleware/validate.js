/**
 * Request validation middleware.
 * Uses shared regex/rules from @helpdesk/shared only — no duplicated rules here.
 * Demo Only: Use Fictional Data
 */
import {
  isValidRegNo,
  isValidPhone,
  isValidIssueDate,
  isValidTrackingId,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
} from '@helpdesk/shared';

/**
 * Builds a 400 response with a structured errors array.
 */
function fail(res, errors) {
  return res.status(400).json({ success: false, errors });
}

/**
 * Validates POST /api/tickets request body.
 */
export function validateSubmit(req, res, next) {
  const errors = [];
  const { regNo, issueDate, description, phone, consentGiven } = req.body;

  if (!regNo || !isValidRegNo(regNo)) {
    errors.push({
      field: 'regNo',
      message:
        'Registration/staff number is required. Format: 3 uppercase letters + 3 digits + hyphen + 4 digits + slash + 4-digit year (2000–2099). E.g. SCT221-0119/2024',
    });
  }

  if (!issueDate || !isValidIssueDate(issueDate)) {
    errors.push({
      field: 'issueDate',
      message: 'Issue date is required, must be a valid date, not in the future, and not before 2000-01-01.',
    });
  }

  const desc = typeof description === 'string' ? description : '';
  if (desc.length < DESCRIPTION_MIN) {
    errors.push({
      field: 'description',
      message: `Description must be at least ${DESCRIPTION_MIN} characters.`,
    });
  } else if (desc.length > DESCRIPTION_MAX) {
    errors.push({
      field: 'description',
      message: `Description must not exceed ${DESCRIPTION_MAX} characters.`,
    });
  }

  if (phone && phone !== '' && !isValidPhone(phone)) {
    errors.push({
      field: 'phone',
      message: 'Enter a valid Kenyan mobile number: +2547XXXXXXXX, 07XXXXXXXX, or 01XXXXXXXX.',
    });
  }

  // consentGiven arrives as a string "true"/"false" from JSON body
  const consent = consentGiven === true || consentGiven === 'true';
  if (!consent) {
    errors.push({
      field: 'consentGiven',
      message: 'You must consent to data processing before submitting.',
    });
  }

  if (errors.length > 0) return fail(res, errors);
  next();
}

/**
 * Validates GET /api/tickets/:trackingId param.
 * Returns an identical generic 404 for both missing and malformed IDs
 * to prevent enumeration. We validate format here to avoid a DB hit on
 * obviously invalid strings, but respond with 404 not 400.
 */
export function validateTrackingIdParam(req, res, next) {
  const { trackingId } = req.params;
  if (!trackingId || !isValidTrackingId(trackingId)) {
    // Intentional generic 404 — do not reveal why the ID was rejected
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }
  next();
}
