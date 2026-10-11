/**
 * Track Issue page — Page 2.
 * Demo Only: Use Fictional Data
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isValidTrackingId } from '@helpdesk/shared';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const STATUS_COLOURS = {
  Open:        { bg: '#dbeafe', text: '#1e3a8a' },
  'In Progress': { bg: '#fef3c7', text: '#92400e' },
  Escalated:   { bg: '#fce7f3', text: '#9d174d' },
  Resolved:    { bg: '#dcfce7', text: '#14532d' },
  Closed:      { bg: '#f3f4f6', text: '#374151' },
};

export default function TrackPage() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  const [inputId, setInputId] = useState(paramId || '');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // If a tracking ID is in the URL, fetch immediately
  useEffect(() => {
    if (paramId && isValidTrackingId(paramId)) {
      fetchTicket(paramId);
    }
  }, [paramId]);

  async function fetchTicket(id) {
    setLoading(true);
    setTicket(null);
    setFetchError('');
    try {
      const res = await axios.get(`${API_BASE}/api/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      if (err.response?.status === 404) {
        setFetchError('No ticket found for that ID. Please check and try again.');
      } else if (err.response?.status === 429) {
        setFetchError('Too many requests. Please wait a moment and try again.');
      } else {
        setFetchError('Could not retrieve ticket. Please try again.');
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
      setInputError('Enter a valid tracking ID in the format HD-XXXX-XXXX.');
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

  return (
    <div>
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Track Your Issue
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Enter your tracking ID to see the current status of your issue.
      </p>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            placeholder="HD-XXXX-XXXX"
            maxLength={12}
            className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
            style={{
              borderColor: inputError ? '#dc2626' : 'var(--color-border)',
              textTransform: 'uppercase',
            }}
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
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>
      )}

      {/* Error */}
      {fetchError && !loading && (
        <div
          role="alert"
          className="rounded border p-3 text-sm"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}
        >
          {fetchError}
        </div>
      )}

      {/* Ticket result */}
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
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {ticket.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Category</span>
              <span style={{ color: 'var(--color-text)' }}>{ticket.category}</span>

              <span style={{ color: 'var(--color-muted)' }}>Priority</span>
              <span><PriorityBadge priority={ticket.priority} /></span>

              <span style={{ color: 'var(--color-muted)' }}>Est. resolution</span>
              <span style={{ color: 'var(--color-text)' }}>{etaLabel(ticket.etaHours)}</span>

              <span style={{ color: 'var(--color-muted)' }}>Submitted</span>
              <span style={{ color: 'var(--color-text)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>

            {ticket.aiConfidenceLow && (
              <p className="mt-3 text-xs p-2 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                ⚠ This ticket is awaiting manual review by a help desk agent.
              </p>
            )}

            <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>{ticket.summary}</p>
          </div>

          {/* Status timeline */}
          <div
            className="rounded-lg border p-5"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Status History
            </h2>
            <StatusTimeline history={ticket.statusHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
