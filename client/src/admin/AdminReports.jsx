/**
 * Admin Reports page — date range picker, summary KPIs, CSV and PDF download.
 * Demo Only: Use Fictional Data
 */
import { useState } from 'react';
import api from './api.js';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AdminReports() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function fetchReport() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to',   to);
      const r = await api.get(`/report?${params}`);
      setReport(r.data.report);
    } catch {
      setError('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  }

  function downloadURL(fmt) {
    const params = new URLSearchParams({ from, to });
    // Open in same tab to trigger browser download via Content-Disposition header
    window.open(`${BASE}/api/admin/report/${fmt}?${params}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Reports</h1>
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Demo Only: Use Fictional Data</p>

      {/* Date range */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <button onClick={fetchReport} disabled={loading} className="rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: 'var(--color-accent)' }}>
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
        <button onClick={() => downloadURL('csv')} className="rounded border px-3 py-2 text-sm font-medium" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
          Export CSV
        </button>
        <button onClick={() => downloadURL('pdf')} className="rounded border px-3 py-2 text-sm font-medium" style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
          Export PDF
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}

      {report && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Total Tickets',         report.total],
              ['Escalation Rate',       `${report.escalationRate}%`],
              ['AI Correction Rate',    `${report.aiCorrectionRate}%`],
              ['Period',                `${report.period.from} → ${report.period.to}`],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Status Breakdown</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(report.byStatus).map(([s, c]) => (
                <span key={s} className="text-xs rounded px-2 py-1" style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}>{s}: {c}</span>
              ))}
            </div>
          </div>

          {/* Top categories */}
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Top Issue Categories</h2>
            <table className="w-full text-xs">
              <thead><tr><th className="text-left py-1">Category</th><th className="text-right py-1">Count</th></tr></thead>
              <tbody>
                {report.topCategories.map(c => (
                  <tr key={c._id}><td className="py-1" style={{ color: 'var(--color-text)' }}>{c._id}</td><td className="text-right py-1 font-semibold">{c.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SLA table */}
          {report.sla.length > 0 && (
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>SLA Performance (ETA vs Actual)</h2>
              <table className="w-full text-xs">
                <thead><tr><th className="text-left py-1">Category</th><th className="text-right py-1">Avg ETA (h)</th><th className="text-right py-1">Avg Actual (h)</th><th className="text-right py-1">Count</th></tr></thead>
                <tbody>
                  {report.sla.map(s => (
                    <tr key={s._id}>
                      <td className="py-1" style={{ color: 'var(--color-text)' }}>{s._id}</td>
                      <td className="text-right py-1">{s.avgEta?.toFixed(1)}</td>
                      <td className="text-right py-1" style={{ color: s.avgActual > s.avgEta ? '#dc2626' : '#16a34a' }}>{s.avgActual?.toFixed(1)}</td>
                      <td className="text-right py-1">{s.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
