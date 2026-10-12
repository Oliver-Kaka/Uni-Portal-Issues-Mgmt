/**
 * Admin Login page.
 * Demo credentials come from .env — never hardcoded here.
 * Demo Only: Use Fictional Data
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.jsx';
import DemoBanner from '../components/DemoBanner.jsx';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <DemoBanner />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Admin Login
          </h1>
          <p className="text-xs mb-4 rounded p-2" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
            Demo admin: fictional accounts only. Do not use real credentials.
          </p>

          {error && (
            <div className="rounded border p-3 mb-4 text-sm" style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Username</label>
              <input
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
