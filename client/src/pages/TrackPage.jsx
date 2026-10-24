/**
 * Track Issue page — Page 2.
 * Features: bilingual labels, NeedsReviewBadge, AI disclaimer, suggestedSteps,
 *           detectedLanguage, satisfaction rating, reopen within window.
 * Demo Only: Use Fictional Data
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isValidTrackingId, SATISFACTION_RATINGS, REOPEN_WINDOW_DAYS } from '@helpdesk/shared';
import { useLang } from '../context/LanguageContext.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import NeedsReviewBadge from '../components/NeedsReviewBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import AIDisclaimer from '../components/AIDisclaimer.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const STATUS_COLOURS = {
  Open:          { bg: '#dbeafe', text: '#1e3a8a' },
  'In Progress': { bg: '#fef3c7', text: '#92400e' },
  Escalated:     { bg: '#fce7f3', text: '#9d174d' },
  Resolved:      { bg: '#dcfce7', text: '#14532d' },
  Closed:        { bg: '#f3f4f6', text: '#374151' },
};

export default function TrackPage() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  const [inputId,    setInputId]    = useState(paramId || '');
  const [inputError, setInputError] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [ticket,     setTicket]     = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Satisfaction rating state
  const [rating,      setRating]      = useState(0);
  const [ratingDone,  setRatingDone]  = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Reopen state
  const [reopenReason, setReopenReason] = useState('');
  const [reopenDone,   setReopenDone]   = useState(false);
  const [reopenError,  setReopenError]  = useState('');
  const [reopenBusy,   setReopenBusy]   = useState(false);

  useEffect(() => {
    if (paramId && isValidTrackingId(paramId)) {
      fetchTicket(paramId);
    }
  }, [paramId]);

  async function submitRating(star) {
    try {
      await axios.post(`${API_BASE}/api/tickets/${ticket.trackingId}/rating`, { rating: star });
      setRating(star);
      setRatingDone(true);
    } catch {
      setRatingError('Could not save rating. Please try again.');
    }
  }

  async function handleReopen(e) {
    e.preventDefault();
    if (reopenReason.trim().length < 5) {
      setReopenError('Please enter a reason of at least 5 characters.');
      return;
    }
    setReopenBusy(true);
    setReopenError('');
    try {
      await axios.post(`${API_BASE}/api/tickets/${ticket.trackingId}/reopen`, { reason: reopenReason });
      setReopenDone(true);
      // Refresh ticket to show updated status
      const res = await axios.get(`${API_BASE}/api/tickets/${ticket.trackingId}`);
      setTicket(res.data.ticket);
    } catch (err) {
      setReopenError(err.response?.data?.message || 'Could not reopen ticket. Please try again.');
    } finally {
      setReopenBusy(false);
    }
  }

  async function fetchTicket(id) {
    setLoading(true);
    setTicket(null);
    setFetchError('');
    setRating(0);
    setRatingDone(false);
    setReopenDone(false);
    try {
      const res = await axios.get(`${API_BASE}/api/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      if (err.response?.status === 404) {
        setFetchError(t.trackNotFound);
      } else if (err.response?.status === 429) {
        setFetchError(t.trackRateLimit);
      } else {
        setFetchError(t.trackError);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = inputId.trim().toUpperCase();
    setInputId(trimmed);
    if (!isValidTrackingId(trimmed)) {
      setInputError(t.trackInvalidId);
      return;
    }
    setInputError('');
    navigate(`/track/${trimmed}`, { replace: true });
    fetchTicket(trimmed);
  }

  const etaLabel = (hours) => {
    if (!hours) return '—';
    return hours < 24 ? `${hours}h` : `${hours / 24} day${hours / 24 !== 1 ? 's' : ''}`;
  };

  const statusStyle = ticket ? STATUS_COLOURS[ticket.status] ?? STATUS_COLOURS.Open : {};
  const langLabel =
    ticket?.detectedLanguage === 'sw' ? 'Kiswahili'
    : ticket?.detectedLanguage === 'mixed' ? 'Mixed'
    : 'English';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {t.trackTitle}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {t.trackSubtitle}
        </p>
      </div>

      {/* AI Disclaimer */}
      <AIDisclaimer />

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            placeholder={t.trackPlaceholder}
            maxLength={12}
            className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
            style={{ borderColor: inputError ? '#dc2626' : 'var(--color-border)' }}
            aria-label="Tracking ID"
          />
          {inputError && (
            <p role="alert" className="text-xs mt-1" style={{ color: '#dc2626' }}>
              {inputError}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          {loading ? t.btnTracking : t.btnTrack}
        </button>
      </form>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t.btnTracking}</p>
      )}

      {fetchError && !loading && (
        <div
          role="alert"
          className="rounded border p-3 text-sm"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          {fetchError}
        </div>
      )}

      {ticket && !loading && (
        <div className="space-y-5">
          {/* Header card */}
          <div
            className="rounded-lg border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-start justify-between gap-2 flex-wrap mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>
                  Tracking ID
                </p>
                <p className="font-mono font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                  {ticket.trackingId}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(ticket.aiConfidenceLow || ticket.category === 'Needs Human Review') && (
                  <NeedsReviewBadge />
                )}
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {ticket.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span style={{ color: 'var(--color-muted)' }}>{t.labelCategory}</span>
              <span style={{ color: 'var(--color-text)' }}>{ticket.category}</span>

              <span style={{ color: 'var(--color-muted)' }}>{t.labelPriority}</span>
              <span><PriorityBadge priority={ticket.priority} /></span>

              <span style={{ color: 'var(--color-muted)' }}>{t.labelEta}</span>
              <span style={{ color: 'var(--color-text)' }}>{etaLabel(ticket.etaHours)}</span>

              <span style={{ color: 'var(--color-muted)' }}>{t.labelSubmitted}</span>
              <span style={{ color: 'var(--color-text)' }}>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>

              {ticket.detectedLanguage && (
                <>
                  <span style={{ color: 'var(--color-muted)' }}>{t.labelDetectedLanguage}</span>
                  <span style={{ color: 'var(--color-text)' }}>{langLabel}</span>
                </>
              )}
            </div>

            <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{ticket.summary}</p>
          </div>

          {/* Suggested steps */}
          {ticket.suggestedSteps && ticket.suggestedSteps.length > 0 && (
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-accent)' }}>
                💡 {t.faqTitle}
              </p>
              <ul className="space-y-1">
                {ticket.suggestedSteps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
                    <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>›</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status timeline */}
          <div
            className="rounded-lg border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              {t.labelStatusHistory}
            </h2>
            <StatusTimeline history={ticket.statusHistory} />
          </div>

          {/* Satisfaction rating — shown when ticket is Resolved or Closed */}
          {['Resolved', 'Closed'].includes(ticket.status) && (
            <div
              className="rounded-lg border p-5 space-y-3"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Rate your experience
              </h2>
              {ratingDone ? (
                <p className="text-sm" style={{ color: '#14532d' }}>
                  ✓ Thank you for your feedback! You rated us {rating}/5.
                </p>
              ) : (
                <>
                  <div className="flex gap-2" role="group" aria-label="Satisfaction rating">
                    {SATISFACTION_RATINGS.map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => submitRating(star)}
                        aria-label={`Rate ${star} out of 5`}
                        className="text-2xl focus:outline-none"
                        style={{ color: star <= rating ? '#d97706' : 'var(--color-border)' }}
                        onMouseEnter={() => setRating(star)}
                        onMouseLeave={() => !ratingDone && setRating(0)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {ratingError && (
                    <p className="text-xs" style={{ color: '#dc2626' }}>{ratingError}</p>
                  )}
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Demo Only: Use Fictional Data</p>
                </>
              )}
            </div>
          )}

          {/* Reopen — shown when ticket is Resolved or Closed and not already reopened */}
          {['Resolved', 'Closed'].includes(ticket.status) && !reopenDone && (
            <div
              className="rounded-lg border p-5 space-y-3"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Issue not resolved?
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                You can reopen this ticket within {REOPEN_WINDOW_DAYS} days of resolution.
              </p>
              <form onSubmit={handleReopen} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Describe why you need the ticket reopened…"
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: reopenError ? '#dc2626' : 'var(--color-border)' }}
                  aria-label="Reopen reason"
                />
                {reopenError && (
                  <p className="text-xs" style={{ color: '#dc2626' }}>{reopenError}</p>
                )}
                <button
                  type="submit"
                  disabled={reopenBusy}
                  className="rounded px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  {reopenBusy ? 'Reopening…' : 'Request Reopen'}
                </button>
              </form>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Demo Only: Use Fictional Data</p>
            </div>
          )}

          {reopenDone && (
            <p
              className="text-sm rounded p-3"
              style={{ backgroundColor: '#dcfce7', color: '#14532d', border: '1px solid #86efac' }}
            >
              ✓ Your ticket has been reopened. The help desk will be in touch.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
