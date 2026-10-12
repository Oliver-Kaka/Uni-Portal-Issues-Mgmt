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
// PII placeholder tokens — canonical names used by maskPII() on the server
// and displayed in the "What the AI sees" preview on the client.
// ---------------------------------------------------------------------------

export const PII_PLACEHOLDERS = {
  REG_NO:    '[REG_NO]',
  PHONE:     '[PHONE]',
  EMAIL:     '[EMAIL]',
  ID_NUMBER: '[ID_NUMBER]',
  TXN_CODE:  '[TXN_CODE]',
};

// PII detection regexes (global flag so replaceAll works in one pass).
// Order matters: most-specific patterns MUST run before broad ones.
export const PII_PATTERNS = [
  // 1. Reg/staff number — most specific, run first to avoid partial matches
  { regex: /[A-Z]{3}\d{3}-\d{4}\/20[0-9]{2}/g, placeholder: PII_PLACEHOLDERS.REG_NO },
  // 2. Email address (before phone so user@07xx.com is caught as email)
  { regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, placeholder: PII_PLACEHOLDERS.EMAIL },
  // 3. Kenyan phone numbers — international +2547xx or local 07xx / 01xx, 10 digits total
  //    +2547XXXXXXXX : +254 then 7 then 8 digits
  //    07XXXXXXXX    : 0 then 7 then 8 digits
  //    01XXXXXXXX    : 0 then 1 then 8 digits (Telkom)
  { regex: /(?:\+254[71]\d{8}|0[71]\d{8})/g, placeholder: PII_PLACEHOLDERS.PHONE },
  // 4. Kenyan M-Pesa transaction code: letter-heavy 10-char alphanum, e.g. QHJ1234ABC
  //    Must run AFTER phone so 07xx numbers are not consumed here
  { regex: /\b[A-Z]{2,3}[0-9A-Z]{7,10}\b/g, placeholder: PII_PLACEHOLDERS.TXN_CODE },
  // 5. Passport-like: 1–2 uppercase letters followed by 6–8 digits
  { regex: /\b[A-Z]{1,2}\d{6,8}\b/g, placeholder: PII_PLACEHOLDERS.ID_NUMBER },
  // 6. Standalone 6–9 digit number (national ID fallback)
  { regex: /\b\d{6,9}\b/g, placeholder: PII_PLACEHOLDERS.ID_NUMBER },
];

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ['en', 'sw', 'mixed'];

export const LANGUAGE_LABELS = {
  en: 'English',
  sw: 'Kiswahili',
  mixed: 'Mixed',
};

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
// UI translations — English and Kiswahili
// All translatable strings live here; no translated text anywhere else.
// ---------------------------------------------------------------------------

export const UI_STRINGS = {
  en: {
    // Nav
    navSubmit: 'Submit Issue',
    navTrack: 'Track Issue',
    // Submit form
    submitTitle: 'Submit an Issue',
    submitSubtitle: 'Describe your issue and our AI assistant will triage and route it to the right department.',
    fieldRegNo: 'Registration / Staff Number',
    fieldDate: 'Date of Issue',
    fieldDescription: 'Issue Description',
    fieldPhone: 'Phone Number (optional)',
    fieldConsent: 'I understand this is a demo system using fictional data only and consent to this information being processed for demonstration purposes.',
    btnSubmit: 'Submit Issue',
    btnSubmitting: 'Submitting…',
    descPlaceholder: 'Describe your issue in detail (minimum 20 characters)…',
    // Success
    successTitle: 'Issue Submitted ✓',
    successSubtitle: 'Your issue has been logged. Save your tracking ID to check the status later.',
    labelTrackingId: 'Your Tracking ID',
    labelCategory: 'Category',
    labelPriority: 'Priority',
    labelRouteTo: 'Routed to',
    labelEta: 'Est. resolution',
    labelAutoResolve: 'Can self-resolve',
    labelAutoResolveYes: 'Yes',
    labelAutoResolveNo: 'No — escalation needed',
    labelTriageSummary: 'Triage Summary',
    linkTrack: 'Track this issue →',
    btnCopy: 'Copy',
    btnCopied: 'Copied!',
    // PII preview
    piiPreviewTitle: 'What the AI sees',
    piiPreviewNote: 'Your personal identifiers have been replaced with placeholders before being sent to the AI.',
    piiNoneFound: 'No personal identifiers detected in your description.',
    // Confidence / review
    lowConfidenceWarning: 'This issue could not be automatically classified. A help desk agent will review it manually.',
    // Track page
    trackTitle: 'Track Your Issue',
    trackSubtitle: 'Enter your tracking ID to see the current status of your issue.',
    trackPlaceholder: 'HD-XXXX-XXXX',
    btnTrack: 'Track',
    btnTracking: 'Searching…',
    labelStatus: 'Status',
    labelSubmitted: 'Submitted',
    labelStatusHistory: 'Status History',
    trackNotFound: 'No ticket found for that ID. Please check and try again.',
    trackRateLimit: 'Too many requests. Please wait a moment and try again.',
    trackError: 'Could not retrieve ticket. Please try again.',
    trackInvalidId: 'Enter a valid tracking ID in the format HD-XXXX-XXXX.',
    labelDetectedLanguage: 'Detected language',
    // Language toggle
    langToggleLabel: 'Language',
    // FAQ
    faqTitle: 'Quick Tips',
    faqNote: 'Demo content — these tips are for illustration only.',
  },
  sw: {
    // Nav
    navSubmit: 'Wasilisha Tatizo',
    navTrack: 'Fuatilia Tatizo',
    // Submit form
    submitTitle: 'Wasilisha Tatizo',
    submitSubtitle: 'Eleza tatizo lako na msaidizi wetu wa AI atalisimamia na kulipeleka idara sahihi.',
    fieldRegNo: 'Nambari ya Usajili / Wafanyakazi',
    fieldDate: 'Tarehe ya Tatizo',
    fieldDescription: 'Maelezo ya Tatizo',
    fieldPhone: 'Nambari ya Simu (si lazima)',
    fieldConsent: 'Ninaelewa mfumo huu ni wa maonyesho tu unaotumia data ya kufikirika na ninakubali maelezo haya kuchakatwa kwa madhumuni ya maonyesho.',
    btnSubmit: 'Wasilisha Tatizo',
    btnSubmitting: 'Inatuma…',
    descPlaceholder: 'Eleza tatizo lako kwa undani (angalau herufi 20)…',
    // Success
    successTitle: 'Tatizo Limewasilishwa ✓',
    successSubtitle: 'Tatizo lako limerekodiwa. Hifadhi nambari yako ya ufuatiliaji ili kuangalia hali baadaye.',
    labelTrackingId: 'Nambari Yako ya Ufuatiliaji',
    labelCategory: 'Aina',
    labelPriority: 'Kipaumbele',
    labelRouteTo: 'Imepelekwa',
    labelEta: 'Muda wa kumaliza',
    labelAutoResolve: 'Inaweza kutatuliwa bila kupandishwa',
    labelAutoResolveYes: 'Ndiyo',
    labelAutoResolveNo: 'Hapana — inahitaji kupandishwa',
    labelTriageSummary: 'Muhtasari wa Uchunguzi',
    linkTrack: 'Fuatilia tatizo hili →',
    btnCopy: 'Nakili',
    btnCopied: 'Imenakiliwa!',
    // PII preview
    piiPreviewTitle: 'AI Inaona Nini',
    piiPreviewNote: 'Vitambulisho vyako vya kibinafsi vimebadilishwa na vibeba nafasi kabla ya kutumwa kwa AI.',
    piiNoneFound: 'Vitambulisho vya kibinafsi havikupatikana katika maelezo yako.',
    // Confidence / review
    lowConfidenceWarning: 'Tatizo hili halikuweza kuainishwa kiotomatiki. Wakala wa dawati la msaada ataliangalia.',
    // Track page
    trackTitle: 'Fuatilia Tatizo Lako',
    trackSubtitle: 'Ingiza nambari yako ya ufuatiliaji kuona hali ya tatizo lako.',
    trackPlaceholder: 'HD-XXXX-XXXX',
    btnTrack: 'Fuatilia',
    btnTracking: 'Inatafuta…',
    labelStatus: 'Hali',
    labelSubmitted: 'Iliwasilishwa',
    labelStatusHistory: 'Historia ya Hali',
    trackNotFound: 'Tikiti hazipatikani kwa kitambulisho hicho. Tafadhali angalia na ujaribu tena.',
    trackRateLimit: 'Maombi mengi sana. Tafadhali subiri na ujaribu tena.',
    trackError: 'Tikiti haikuweza kupatikana. Tafadhali jaribu tena.',
    trackInvalidId: 'Ingiza kitambulisho halali cha ufuatiliaji katika muundo HD-XXXX-XXXX.',
    labelDetectedLanguage: 'Lugha iliyotambuliwa',
    // Language toggle
    langToggleLabel: 'Lugha',
    // FAQ
    faqTitle: 'Vidokezo vya Haraka',
    faqNote: 'Maudhui ya maonyesho — vidokezo hivi ni kwa mfano tu.',
  },
};

// ---------------------------------------------------------------------------
// Self-service FAQ — keyed by category, bilingual (en + sw)
// Demo content only. No real university procedures.
// ---------------------------------------------------------------------------

export const FAQ_TIPS = {
  'Portal Login Failure': {
    en: [
      'Try resetting your password via the "Forgot Password" link on the login page.',
      'Clear your browser cache and cookies, then try a different browser.',
      'Check that Caps Lock is off — passwords are case-sensitive.',
    ],
    sw: [
      'Jaribu kubadilisha nywila yako kupitia kiungo cha "Nimesahau Nywila" kwenye ukurasa wa kuingia.',
      'Futa cache na vidakuzi vya kivinjari chako, kisha jaribu kivinjari kingine.',
      'Hakikisha Caps Lock imezimwa — nywila zinazingatia herufi kubwa na ndogo.',
    ],
  },
  'Fee Discrepancy': {
    en: [
      'Download your official fee statement from the Finance portal before contacting support.',
      'Keep your payment receipt or M-Pesa confirmation message ready for reference.',
      'Check whether the charge relates to a supplementary exam, late registration, or library fine.',
    ],
    sw: [
      'Pakua taarifa rasmi ya ada kutoka kwenye mfumo wa Fedha kabla ya kuwasiliana na msaada.',
      'Hifadhi risiti yako ya malipo au ujumbe wa uthibitisho wa M-Pesa kwa kumbukumbu.',
      'Angalia kama ada hiyo inahusiana na mtihani wa ziada, usajili wa kuchelewa, au faini ya maktaba.',
    ],
  },
  'Unit Registration': {
    en: [
      'Confirm you have met all prerequisites for the unit in your academic record.',
      'Check if your account has any holds (financial, library, or academic) that block registration.',
      'Registration windows are strictly enforced — note the open and close dates on the academic calendar.',
    ],
    sw: [
      'Thibitisha umekidhi mahitaji yote ya awali ya somo katika rekodi yako ya masomo.',
      'Angalia kama akaunti yako ina vizuizi vyovyote (fedha, maktaba, au masomo) vinavyozuia usajili.',
      'Muda wa usajili unazingatiwa kwa ukali — kumbuka tarehe za kufungua na kufunga kwenye kalenda ya masomo.',
    ],
  },
  'Graduation / Email Transfer': {
    en: [
      'Allow up to 14 working days after graduation confirmation for email migration.',
      'Check your spam folder for the alumni account activation email.',
      'Ensure your personal email address on file is current and accessible.',
    ],
    sw: [
      'Ruhusu hadi siku 14 za kazi baada ya uthibitisho wa kuhitimu kwa uhamishaji wa barua pepe.',
      'Angalia folda yako ya spam kwa barua pepe ya uanzishaji wa akaunti ya wahitimu.',
      'Hakikisha anwani yako ya barua pepe ya kibinafsi iliyorekodiwa ni ya sasa na inafikiwa.',
    ],
  },
  'Student ID Replacement': {
    en: [
      'Visit Student Services in person with a secondary ID (e.g. national ID or passport).',
      'A temporary access pass can be issued on the same day while your card is processed.',
      'Report a stolen card to campus security as well as the help desk.',
    ],
    sw: [
      'Tembelea Huduma za Wanafunzi mwenyewe na kitambulisho kingine (k.m. kitambulisho cha taifa au pasi).',
      'Kibali cha ufikiaji wa muda kinaweza kutolewa siku hiyo hiyo wakati kadi yako inashughulikiwa.',
      'Ripoti kadi iliyoibiwa kwa usalama wa chuo pamoja na dawati la msaada.',
    ],
  },
  'Needs Human Review': {
    en: [
      'A help desk agent will contact you within 48 hours to discuss your issue.',
      'Gather any relevant documents (receipts, screenshots, letters) to speed up resolution.',
    ],
    sw: [
      'Wakala wa dawati la msaada atawasiliana nawe ndani ya masaa 48 kujadili tatizo lako.',
      'Kusanya nyaraka zozote muhimu (risiti, picha za skrini, barua) ili kuharakisha utatuzi.',
    ],
  },
};

// ---------------------------------------------------------------------------
// AI Disclaimer — mandatory text, shown on Submit, Result and Track pages.
// Exact wording approved by project brief; do not alter without approval.
// ---------------------------------------------------------------------------

export const AI_DISCLAIMER =
  'AI Notice: The AI model used in this prototype has not been validated for accuracy, fairness, or completeness. ' +
  'All triage results are suggestions only and must be reviewed by a qualified help desk agent before any action is taken. ' +
  'Do not submit real personal data. This system uses fictional demo data only.';

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
