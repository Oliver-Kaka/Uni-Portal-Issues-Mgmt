/**
 * Admin Ticket Detail — full record, status update, reassign, internal notes, resolution time.
 * All enums from @helpdesk/shared.
 * Demo Only: Use Fictional Data
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api.js';
import { STATUSES, CATEGORIES, DEPARTMENTS } from '@helpdesk/shared';
import PriorityBadge from '../components/PriorityBadge.jsx';
import NeedsReviewBadge from '../components/NeedsReviewBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span className="text-sm break-words" style={{ color: 'var(--color-text)' }}>{value ?? '—'}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg border p-5 space-y-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {title && <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h2>}
      {children}
    </div>
  );
}

export default function AdminTicketDetail() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const [form, setForm] = useState({
    status: '', routeTo: '', publicNote: '', internalNote: '',
    adminCategory: '', actualResolutionHours: '',
  });

  useEffect(() => {
    api.get(`/tickets/${trackingId}`)
      .then(r => {
        const t = r.data.ticket;
        setTicket(t);
        setForm({
          status:                t.status       || '',
          routeTo:               t.routeTo      || '',
          publicNote:            '',
          internalNote:          '',
          adminCategory:         t.adminCategory || '',
          actualResolutionHours: t.actualResolutionHours ?? '',
        });
      })
      .catch(() => setError('Ticket not found.'))
      .finally(() => setLoading(false));
  }, [trackingId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        status:  form.status  || undefined,
        routeTo: form.routeTo || undefined,
        publicNote:   form.publicNote   || undefined,
        internalNote: form.internalNote || undefined,
        adminCategory: form.adminCategory || undefined,
        actualResolutionHours: form.actualResolutionHours !== '' ? parseFloat(form.actualResolutionHours) : undefined,
      };
      const r = await api.patch(`/tickets/${trackingId}`, payload);
      setTicket(r.data.ticket);
      setForm(f => ({ ...f, publicNote: '', internalNote: '' }));
      setSaved(true);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>;
  if (error)   return <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>;
  if (!ticket) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/admin/tickets')} className="text-xs underline" style={{ color: 'var(--color-accent)' }}>← Back</button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{ticket.trackingId}</h1>
        {(ticket.aiConfidenceLow || ticket.category === 'Needs Human Review') && <NeedsReviewBadge />}
        <PriorityBadge priority={ticket.priority} />
        <span className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}>{ticket.status}</span>
      </div>

      {saved && <p className="text-xs rounded p-2" style={{ backgroundColor: '#dcfce7', color: '#14532d' }}>Changes saved ✓</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Submitter info (full, admin-only) */}
        <Card title="Submitter">
          <Field label="Reg / Staff No." value={ticket.regNo} />
          <Field label="Phone"           value={ticket.phone} />
          <Field label="Issue Date"      value={ticket.issueDate ? new Date(ticket.issueDate).toLocaleDateString() : '—'} />
          <Field label="Detected Lang"   value={ticket.detectedLanguage} />
        </Card>

        {/* AI triage */}
        <Card title="AI Triage">
          <Field label="AI Category"    value={ticket.category} />
          <Field label="Admin Category" value={ticket.adminCategory || 'Not overridden'} />
          <Field label="Priority"       value={ticket.priority} />
          <Field label="Route To"       value={ticket.routeTo} />
          <Field label="ETA"            value={ticket.etaHours ? `${ticket.etaHours}h` : '—'} />
          <Field label="Actual"         value={ticket.actualResolutionHours != null ? `${ticket.actualResolutionHours}h` : '—'} />
          <Field label="Confidence Low" value={String(ticket.aiConfidenceLow)} />
        </Card>

        {/* Original description */}
        <Card title="Original Description (admin only)">
          <p className="text-xs font-mono whitespace-pre-wrap break-words p-2 rounded" style={{ backgroundColor: '#f3f4f6', color: 'var(--color-text)' }}>
            {ticket.description}
          </p>
        </Card>

        {/* Masked description */}
        <Card title="Masked Description (what Gemini saw)">
          <p className="text-xs font-mono whitespace-pre-wrap break-words p-2 rounded" style={{ backgroundColor: '#f0fdf4', color: '#14532d' }}>
            {ticket.maskedDescription || '(same as original — no PII detected)'}
          </p>
        </Card>

        {/* Summary */}
        <Card title="AI Summary">
          <Field label="User language"   value={ticket.summary} />
          <Field label="English (staff)" value={ticket.summaryEn} />
        </Card>

        {/* Status History (full, including internal notes) */}
        <Card title="Status History (full)">
          <ol className="space-y-3">
            {(ticket.statusHistory || []).map((h, i) => (
              <li key={i} className="text-xs border-l-2 pl-3" style={{ borderColor: 'var(--color-accent)' }}>
                <p className="font-semibold" style={{ color: 'var(--color-accent)' }}>{h.status}</p>
                {h.publicNote   && <p style={{ color: 'var(--color-text)' }}>Public: {h.publicNote}</p>}
                {h.internalNote && <p style={{ color: '#92400e' }}>Internal: {h.internalNote}</p>}
                <p style={{ color: 'var(--color-muted)' }}>{new Date(h.changedAt).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Update form */}
      <Card title="Update Ticket">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Reassign Department</label>
              <select value={form.routeTo} onChange={e => setForm(f => ({ ...f, routeTo: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Override AI Category</label>
              <select value={form.adminCategory} onChange={e => setForm(f => ({ ...f, adminCategory: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                <option value="">— no override —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Actual Resolution (hours)</label>
              <input type="number" min="0" step="0.5" value={form.actualResolutionHours} onChange={e => setForm(f => ({ ...f, actualResolutionHours: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Public Note (visible to submitter)</label>
            <textarea rows={2} value={form.publicNote} onChange={e => setForm(f => ({ ...f, publicNote: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: '#92400e' }}>Internal Note (admin only — never shown publicly)</label>
            <textarea rows={2} value={form.internalNote} onChange={e => setForm(f => ({ ...f, internalNote: e.target.value }))} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: '#fcd34d' }} />
          </div>
          <button type="submit" disabled={saving} className="rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-accent)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Card>
    </div>
  );
}
