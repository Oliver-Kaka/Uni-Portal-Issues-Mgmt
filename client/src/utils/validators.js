/**
 * Client-side validation helpers.
 * All rules come from @helpdesk/shared — nothing is duplicated here.
 * Demo Only: Use Fictional Data
 */
import {
  isValidRegNo,
  isValidPhone,
  isValidIssueDate,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
} from '@helpdesk/shared';

/**
 * Validates the submit form fields.
 * @returns {Object} errors keyed by field name. Empty object means valid.
 */
export function validateSubmitForm({ regNo, issueDate, description, phone, consentGiven }) {
  const errors = {};

  if (!regNo || !isValidRegNo(regNo)) {
    errors.regNo =
      'Format: 3 uppercase letters + 3 digits – 4 digits / year. E.g. SCT221-0119/2024';
  }

  if (!issueDate || !isValidIssueDate(issueDate)) {
    errors.issueDate = 'Enter a valid date that is not in the future.';
  }

  const desc = (description || '').trim();
  if (desc.length < DESCRIPTION_MIN) {
    errors.description = `At least ${DESCRIPTION_MIN} characters required.`;
  } else if (desc.length > DESCRIPTION_MAX) {
    errors.description = `Maximum ${DESCRIPTION_MAX} characters.`;
  }

  if (phone && phone.trim() !== '' && !isValidPhone(phone.trim())) {
    errors.phone = 'Enter a valid Kenyan mobile number: +2547XXXXXXXX, 07XXXXXXXX, or 01XXXXXXXX.';
  }

  if (!consentGiven) {
    errors.consentGiven = 'You must consent to continue.';
  }

  return errors;
}
