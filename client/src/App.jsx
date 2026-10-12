import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LanguageProvider, useLang } from './context/LanguageContext.jsx';
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import LanguageToggle from './components/LanguageToggle.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import TrackPage from './pages/TrackPage.jsx';
import AdminLogin from './admin/AdminLogin.jsx';
import AdminShell from './admin/AdminShell.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminTicketTable from './admin/AdminTicketTable.jsx';
import AdminTicketDetail from './admin/AdminTicketDetail.jsx';
import AdminReports from './admin/AdminReports.jsx';

function PublicShell() {
  const { pathname } = useLocation();
  const { t } = useLang();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <DemoBanner />
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
            Campus Help Desk
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/"      style={{ color: pathname === '/'       ? 'var(--color-accent)' : 'var(--color-muted)' }} className="hover:underline">{t.navSubmit}</Link>
            <Link to="/track" style={{ color: pathname.startsWith('/track') ? 'var(--color-accent)' : 'var(--color-muted)' }} className="hover:underline">{t.navTrack}</Link>
            <LanguageToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/"           element={<SubmitPage />} />
          <Route path="/track"      element={<TrackPage />} />
          <Route path="/track/:id"  element={<TrackPage />} />
        </Routes>
      </main>
      <footer className="text-center text-xs py-4" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
        Campus Help Desk Assistant · Demo Only: Use Fictional Data
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <LanguageProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/*" element={<PublicShell />} />

          {/* Admin login (no shell) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin area */}
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tickets"   element={<AdminTicketTable />} />
            <Route path="tickets/:trackingId" element={<AdminTicketDetail />} />
            <Route path="reports"   element={<AdminReports />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </AdminAuthProvider>
  );
}
