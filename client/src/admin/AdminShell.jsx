/**
 * AdminShell — persistent nav + route guard for all /admin/* pages.
 * Unauthenticated users are redirected to /admin/login.
 * Demo Only: Use Fictional Data
 */
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.jsx';
import DemoBanner from '../components/DemoBanner.jsx';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/tickets',   label: 'Tickets' },
  { to: '/admin/reports',   label: 'Reports' },
];

export default function AdminShell() {
  const { admin, checking, logout } = useAdminAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen text-sm" style={{ color: 'var(--color-muted)' }}>Checking session…</div>;
  }

  if (!admin) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <DemoBanner />
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            Help Desk Admin
          </span>
          <nav className="flex items-center gap-4 text-sm flex-1">
            {NAV_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="hover:underline"
                style={{ color: location.pathname.startsWith(l.to) ? 'var(--color-accent)' : 'var(--color-muted)' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>{admin.username}</span>
            <button
              onClick={handleLogout}
              className="rounded border px-2 py-1 hover:bg-gray-50"
              style={{ borderColor: 'var(--color-border)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
