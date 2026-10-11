/**
 * Submit Issue page — Page 1.
 * Demo Only: Use Fictional Data
 */
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { validateSubmitForm } from '../utils/validators.js';
import { useSubmitIssue } from '../hooks/useSubmitIssue.js';
import PriorityBadge from '../components/PriorityBadge.jsx';
import { DESCRIPTION_MAX } from '@helpdesk/shared';

const todayISO = () => new Date().toISOString().split('T')[0];

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
        {label}{required && <span aria-hidden="true" style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export default function SubmitPage() {
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

  // --- Success screen ---
  if (result?.success) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Issue Submitted ✓
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Your issue has been logged. Save your tracking ID to check the status later.
        </p>

        {/* Tracking ID card */}
        <div
          className="rounded-lg border p-5 mb-6"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>
            Your Tracking ID
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
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                backgroundColor: 'transparent',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Triage results */}
        <div
          className="rounded-lg border p-5 space-y-3 mb-6"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Triage Summary
          </h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span style={{ color: 'var(--color-muted)' }}>Category</span>
            <span style={{ color: 'var(--color-text)' }}>{result.category}</span>

            <span style={{ color: 'var(--color-muted)' }}>Priority</span>
            <span><PriorityBadge priority={result.priority} /></span>

            <span style={{ color: 'var(--color-muted)' }}>Routed to</span>
            <span style={{ color: 'var(--color-text)' }}>{result.routeTo}</span>

            <span style={{ color: 'var(--color-muted)' }}>Est. resolution</span>
            <span style={{ color: 'var(--color-text)' }}>
              {result.etaHours < 24
                ? `${result.etaHours} hour${result.etaHours !== 1 ? 's' : ''}`
                : `${result.etaHours / 24} day${result.etaHours / 24 !== 1 ? 's' : ''}`}
            </span>

            <span style={{ color: 'var(--color-muted)' }}>Can self-resolve</span>
            <span style={{ color: 'var(--color-text)' }}>{result.canAutoResolve ? 'Yes' : 'No — escalation needed'}</span>
          </div>

          {result.aiConfidenceLow && (
            <p className="text-xs p-2 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              ⚠ This issue could not be automatically classified. A help desk agent will review it manually.
            </p>
          )}

          <hr style={{ borderColor: 'var(--color-border)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>{result.summary}</p>
        </div>

        <Link
          to={`/track/${result.trackingId}`}
          className="inline-block text-sm underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Track this issue →
        </Link>
      </div>
    );
  }

  // --- Form screen ---
  const descLen = (form.description || '').length;
  const isFormValid =
    Object.keys(validateSubmitForm(form)).length === 0;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Submit an Issue
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Describe your issue and our AI assistant will triage and route it to the right department.
      </p>

      {networkError && (
        <div
          role="alert"
          className="rounded border p-3 mb-4 text-sm"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          {networkError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Registration / Staff Number */}
        <InputWrapper label="Registration / Staff Number" htmlFor="regNo" required error={errors.regNo}>
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
            style={{
              borderColor: errors.regNo ? '#dc2626' : 'var(--color-border)',
              focusRingColor: 'var(--color-accent)',
            }}
          />
        </InputWrapper>

        {/* Issue Date */}
        <InputWrapper label="Date of Issue" htmlFor="issueDate" required error={errors.issueDate}>
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
        <InputWrapper label="Issue Description" htmlFor="description" required error={errors.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Describe your issue in detail (minimum 20 characters)…"
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

        {/* Phone (optional) */}
        <InputWrapper label="Phone Number (optional)" htmlFor="phone" error={errors.phone}>
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
              I understand this is a demo system using fictional data only and consent to this information
              being processed for demonstration purposes.
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
          {loading ? 'Submitting…' : 'Submit Issue'}
        </button>
      </form>
    </div>
  );
}
