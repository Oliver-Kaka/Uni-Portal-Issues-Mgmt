/**
 * Admin Dashboard — KPI cards + Recharts charts.
 * Demo Only: Use Fictional Data
 */
import { useEffect, useState } from 'react';
import api from './api.js';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { CATEGORIES, PRIORITIES } from '@helpdesk/shared';

const CHART_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const PRIORITY_COLORS = { Urgent: '#dc2626', High: '#d97706', Medium: '#2563eb', Low: '#16a34a' };

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value ?? '—'}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{children}</h2>;
}

export default function AdminDashboard() {
  const [kpis,       setKpis]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [daily,      setDaily]      = useState([]);
  const [resolution, setResolution] = useState({ byCategory: [], byDept: [] });
  const [error,      setError]      = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/kpis'),
      api.get('/analytics/categories'),
      api.get('/analytics/priorities'),
      api.get('/analytics/daily?days=30'),
      api.get('/analytics/resolution'),
    ])
      .then(([k, c, p, d, r]) => {
        setKpis(k.data.kpis);
        setCategories(c.data.data);
        setPriorities(p.data.data);
        setDaily(d.data.data);
        setResolution(r.data);
      })
      .catch(() => setError('Failed to load analytics data.'));
  }, []);

  if (error) return <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>;
  if (!kpis)  return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Tickets" value={kpis.total} />
        <KpiCard label="Open"      value={kpis.open} />
        <KpiCard label="Resolved"  value={kpis.resolved} />
        <KpiCard label="Escalated" value={kpis.escalated} />
        <KpiCard label="In Progress" value={kpis.inProgress} />
        <KpiCard label="Closed"    value={kpis.closed} />
        <KpiCard
          label="Avg Resolution"
          value={kpis.avgResolutionHours != null ? `${kpis.avgResolutionHours.toFixed(1)}h` : '—'}
          sub="actual (resolved tickets)"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Categories bar chart */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <SectionTitle>Tickets by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories} margin={{ left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie chart */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <SectionTitle>Tickets by Priority</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorities} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label={d => d.priority}>
                {priorities.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.priority] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily volume line chart */}
        <div className="rounded-lg border p-4 md:col-span-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <SectionTitle>Tickets per Day (last 30 days)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(daily.length / 8)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1d4ed8" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution time by category */}
        {resolution.byCategory.length > 0 && (
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <SectionTitle>Avg Resolution Time by Category (hours)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resolution.byCategory} margin={{ left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgEta"    name="ETA (h)"    fill="#93c5fd" radius={[3,3,0,0]} />
                <Bar dataKey="avgActual" name="Actual (h)" fill="#1d4ed8" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resolution time by department */}
        {resolution.byDept.length > 0 && (
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <SectionTitle>Avg Resolution Time by Department (hours)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={resolution.byDept} margin={{ left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgEta"    name="ETA (h)"    fill="#93c5fd" radius={[3,3,0,0]} />
                <Bar dataKey="avgActual" name="Actual (h)" fill="#1d4ed8" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
