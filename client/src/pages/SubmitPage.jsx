/**
 * Submit Issue page — Page 1.
 * Features: bilingual labels, FAQ tips, PII preview, AI disclaimer, confidence badge.
 * Demo Only: Use Fictional Data
 */
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { validateSubmitForm } from '../utils/validators.js';
import { useSubmitIssue } from '../hooks/useSubmitIssue.js';
import { useLang } from '../context/LanguageContext.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import NeedsReviewBadge from '../components/NeedsReviewBadge.jsx';
import PIIPreview from '../components/PIIPreview.jsx';
import FAQTips from '../components/FAQTips.jsx';
import AIDisclaimer from '../components/AIDisclaimer.jsx';
import { DESCRIPTION_MAX } from '@helpdesk/shared';

const todayISO = () => new Date().toISOString().split('T')[0];

// Naive category guesser from description — shows FAQ tips before submission.
// This is client-side only and does not contact the server.
function guessCategory(description) {
  const d = description.toLowerCase();
  if (/log.?in|password|account.?lock|portal.?access|sign.?in|login/i.test(d))
    return 'Portal Login Failure';
  if (/fee|payment|charge|balance|invoice|receipt|mpesa|m-pesa/i.test(d))
    return 'Fee Discrepancy';
  if (/register|registration|unit|course|enroll|enrol|hold/i.test(d))
    return 'Unit Registration';
  if (/graduat|email.?transfer|alumni|certificate|transcript/i.test(d))
    return 'Graduation / Email Transfer';
  if (/id.?card|student.?card|card.?lost|card.?stolen|card.?damage|replacement/i.test(d))
    return 'Student ID Replacement';
  return null;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs mt-1" style={{ color: '#dc2626' }}>
      {message}
    </p>
  );
}

function InputWrapper({ label, htmlFor, required, children, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
        {required && <span aria-hidden="true" style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export default function SubmitPage() {
  const { t } = useLang();
  const [form, setForm] = useState({
    regNo: '',
    issueDate: '',
    description: '',
    phone: '',
    consentGiven: false,
  });
  const [clientErrors, setClientErrors] = useState({});
  const { submit, loading, result, serverErrors, networkError } = useSubmitIssue();
  const trackingRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const errors = { ...clientErrors, ...serverErrors };
  const guessedCategory = guessCategory(form.description);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    const errs = validateSubmitForm(form);
    if (errs[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: errs[name] }));
    } else {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateSubmitForm(form);
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }
    setClientErrors({});
    await submit(form);
  }

  function copyTrackingId() {
    if (result?.trackingId) {
      navigator.clipboard.writeText(result.trackingId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const etaLabel = (hours) => {
    if (!hours) return '—';
    return hours < 24 ? `${hours}h` : `${hours / 24} day${hours / 24 !== 1 ? 's' : ''}`;
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result?.success) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            {t.successTitle}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {t.successSubtitle}
          </p>
        </div>

        {/* AI Disclaimer */}
        <AIDisclaimer />

        {/* Tracking ID card */}
        <div
          className="rounded-lg border p-5"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>
            {t.labelTrackingId}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              ref={trackingRef}
              className="text-2xl font-mono font-bold tracking-widest"
              style={{ color: 'var(--color-accent)' }}
            >
              {result.trackingId}
            </span>
            <button
              onClick={copyTrackingId}
              className="text-xs px-3 py-1 rounded border font-medium"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'transparent' }}
            >
              {copied ? t.btnCopied : t.btnCopy}
            </button>
          </div>
        </div>

        {/* Triage results */}
        <div
          className="rounded-lg border p-5 space-y-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {t.labelTriageSummary}
            </h2>
            {(result.aiConfidenceLow || result.category === 'Needs Human Review') && (
              <NeedsReviewBadge />
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span style={{ color: 'var(--color-muted)' }}>{t.labelCategory}</span>
            <span style={{ color: 'var(--color-text)' }}>{result.category}</span>

            <span style={{ color: 'var(--color-muted)' }}>{t.labelPriority}</span>
            <span><PriorityBadge priority={result.priority} /></span>

            <span style={{ color: 'var(--color-muted)' }}>{t.labelRouteTo}</span>
            <span style={{ color: 'var(--color-text)' }}>{result.routeTo}</span>

            <span style={{ color: 'var(--color-muted)' }}>{t.labelEta}</span>
            <span style={{ color: 'var(--color-text)' }}>{etaLabel(result.etaHours)}</span>

            <span style={{ color: 'var(--color-muted)' }}>{t.labelAutoResolve}</span>
            <span style={{ color: 'var(--color-text)' }}>
              {result.canAutoResolve ? t.labelAutoResolveYes : t.labelAutoResolveNo}
            </span>

            {result.detectedLanguage && (
              <>
                <span style={{ color: 'var(--color-muted)' }}>{t.labelDetectedLanguage}</span>
                <span style={{ color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {result.detectedLanguage === 'sw' ? 'Kiswahili' : result.detectedLanguage === 'mixed' ? 'Mixed' : 'English'}
                </span>
              </>
            )}
          </div>

          <hr style={{ borderColor: 'var(--color-border)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{result.summary}</p>
        </div>

        {/* PII preview */}
        <PIIPreview maskedDescription={result.maskedDescription} hadPII={result.hadPII} />

        {/* Self-service suggestions from AI */}
        {result.suggestedSteps && result.suggestedSteps.length > 0 && (
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-accent)' }}>
              💡 {t.faqTitle}
            </p>
            <ul className="space-y-1">
              {result.suggestedSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                  <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>›</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          to={`/track/${result.trackingId}`}
          className="inline-block text-sm underline"
          style={{ color: 'var(--color-accent)' }}
        >
          {t.linkTrack}
        </Link>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  const descLen = (form.description || '').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {t.submitTitle}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {t.submitSubtitle}
        </p>
      </div>

      {/* AI Disclaimer */}
      <AIDisclaimer />

      {networkError && (
        <div
          role="alert"
          className="rounded border p-3 text-sm"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          {networkError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Reg/Staff Number */}
        <InputWrapper label={t.fieldRegNo} htmlFor="regNo" required error={errors.regNo}>
          <input
            id="regNo"
            name="regNo"
            type="text"
            autoComplete="off"
            placeholder="e.g. SCT221-0119/2024"
            value={form.regNo}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: errors.regNo ? '#dc2626' : 'var(--color-border)' }}
          />
        </InputWrapper>

        {/* Issue Date */}
        <InputWrapper label={t.fieldDate} htmlFor="issueDate" required error={errors.issueDate}>
          <input
            id="issueDate"
            name="issueDate"
            type="date"
            max={todayISO()}
            min="2000-01-01"
            value={form.issueDate}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: errors.issueDate ? '#dc2626' : 'var(--color-border)' }}
          />
        </InputWrapper>

        {/* Description */}
        <InputWrapper label={t.fieldDescription} htmlFor="description" required error={errors.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder={t.descPlaceholder}
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={DESCRIPTION_MAX}
            className="w-full rounded border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2"
            style={{ borderColor: errors.description ? '#dc2626' : 'var(--color-border)' }}
          />
          <p className="text-xs text-right" style={{ color: descLen > DESCRIPTION_MAX * 0.9 ? '#d97706' : 'var(--color-muted)' }}>
            {descLen}/{DESCRIPTION_MAX}
          </p>
        </InputWrapper>

        {/* FAQ Tips — shown when a category can be guessed from the description */}
        {guessedCategory && descLen >= 20 && <FAQTips category={guessedCategory} />}

        {/* Phone (optional) */}
        <InputWrapper label={t.fieldPhone} htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 0712345678 or +254712345678"
            value={form.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: errors.phone ? '#dc2626' : 'var(--color-border)' }}
          />
        </InputWrapper>

        {/* Consent */}
        <div className="flex items-start gap-2">
          <input
            id="consentGiven"
            name="consentGiven"
            type="checkbox"
            checked={form.consentGiven}
            onChange={handleChange}
            className="mt-1"
          />
          <div>
            <label htmlFor="consentGiven" className="text-sm" style={{ color: 'var(--color-text)' }}>
              {t.fieldConsent}
            </label>
            <FieldError message={errors.consentGiven} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {loading ? t.btnSubmitting : t.btnSubmit}
        </button>
      </form>
    </div>
  );
}
