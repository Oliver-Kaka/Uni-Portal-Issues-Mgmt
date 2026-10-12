/**
 * Admin Ticket Table — search, filters, sort, pagination.
 * All enums imported from @helpdesk/shared — nothing hardcoded.
 * Demo Only: Use Fictional Data
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api.js';
import { CATEGORIES, PRIORITIES, STATUSES, SUPPORTED_LANGUAGES } from '@helpdesk/shared';
import PriorityBadge from '../components/PriorityBadge.jsx';
import NeedsReviewBadge from '../components/NeedsReviewBadge.jsx';

const PAGE_SIZE = 20;

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded border px-2 py-1.5 text-xs"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SortHeader({ label, field, sort, onSort }) {
  const active = sort === field || sort === `-${field}`;
  const asc    = sort === field;
  return (
    <button
      onClick={() => onSort(asc ? `-${field}` : field)}
      className="font-semibold text-xs text-left whitespace-nowrap"
      style={{ color: active ? 'var(--color-accent)' : 'var(--color-text)' }}
    >
      {label} {active ? (asc ? '↑' : '↓') : ''}
    </button>
  );
}

export default function AdminTicketTable() {
  const navigate = useNavigate();
  const [tickets, setTickets]  = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [filters, setFilters] = useState({
    search: '', category: '', priority: '', status: '', language: '',
    dateFrom: '', dateTo: '',
  });
  const [sort, setSort]   = useState('-createdAt');
  const [page, setPage]   = useState(1);

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  }

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort });
    if (filters.search)   params.set('search',   filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.status)   params.set('status',   filters.status);
    if (filters.language) params.set('language', filters.language);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params.set('dateTo',   filters.dateTo);

    api.get(`/tickets?${params}`)
      .then(r => {
        setTickets(r.data.data);
        setPagination(r.data.pagination);
      })
      .catch(() => setError('Failed to load tickets.'))
      .finally(() => setLoading(false));
  }, [page, sort, filters]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search ID, reg no, summary…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          className="rounded border px-2 py-1.5 text-xs flex-1 min-w-40"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <Select value={filters.category} onChange={v => setFilter('category', v)} options={CATEGORIES} placeholder="All categories" />
        <Select value={filters.priority} onChange={v => setFilter('priority', v)} options={PRIORITIES} placeholder="All priorities" />
        <Select value={filters.status}   onChange={v => setFilter('status',   v)} options={STATUSES}   placeholder="All statuses" />
        <Select value={filters.language} onChange={v => setFilter('language', v)} options={SUPPORTED_LANGUAGES} placeholder="All languages" />
        <input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} className="rounded border px-2 py-1.5 text-xs" style={{ borderColor: 'var(--color-border)' }} title="From date" />
        <input type="date" value={filters.dateTo}   onChange={e => setFilter('dateTo',   e.target.value)} className="rounded border px-2 py-1.5 text-xs" style={{ borderColor: 'var(--color-border)' }} title="To date" />
        <button
          onClick={() => { setFilters({ search: '', category: '', priority: '', status: '', language: '', dateFrom: '', dateTo: '' }); setPage(1); }}
          className="rounded border px-2 py-1.5 text-xs"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          Clear
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
      {loading && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-xs border-collapse">
          <thead style={{ backgroundColor: 'var(--color-surface)' }}>
            <tr>
              {[
                ['Tracking ID', 'trackingId'],
                ['Reg No',      'regNo'],
                ['Category',    'category'],
                ['Priority',    'priority'],
                ['Status',      'status'],
                ['Created',     'createdAt'],
              ].map(([label, field]) => (
                <th key={field} className="text-left px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <SortHeader label={label} field={field} sort={sort} onSort={setSort} />
                </th>
              ))}
              <th className="text-left px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>AI</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr
                key={t.trackingId}
                className="cursor-pointer hover:bg-blue-50"
                style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'var(--color-surface)' }}
                onClick={() => navigate(`/admin/tickets/${t.trackingId}`)}
              >
                <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-accent)' }}>{t.trackingId}</td>
                <td className="px-3 py-2" style={{ color: 'var(--color-muted)' }}>{t.regNo}</td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{t.category}</td>
                <td className="px-3 py-2"><PriorityBadge priority={t.priority} /></td>
                <td className="px-3 py-2" style={{ color: 'var(--color-text)' }}>{t.status}</td>
                <td className="px-3 py-2" style={{ color: 'var(--color-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2">{t.aiConfidenceLow && <NeedsReviewBadge />}</td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr><td colSpan={7} className="text-center px-3 py-6" style={{ color: 'var(--color-muted)' }}>No tickets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded border px-2 py-1 disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>← Prev</button>
        <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
        <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Next →</button>
      </div>
    </div>
  );
}
