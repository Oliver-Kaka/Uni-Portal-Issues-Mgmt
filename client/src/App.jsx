import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LanguageProvider, useLang } from './context/LanguageContext.jsx';
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import LanguageToggle from './components/LanguageToggle.jsx';
import DarkModeToggle from './components/DarkModeToggle.jsx';
import OutageBanner from './components/OutageBanner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Eagerly loaded — public pages must be fast
import SubmitPage from './pages/SubmitPage.jsx';
import TrackPage from './pages/TrackPage.jsx';

// Lazily loaded — admin section is only needed when the admin logs in
const AdminLogin   = lazy(() => import('./admin/AdminLogin.jsx'));
const AdminShell   = lazy(() => import('./admin/AdminShell.jsx'));
const AdminDashboard    = lazy(() => import('./admin/AdminDashboard.jsx'));
const AdminTicketTable  = lazy(() => import('./admin/AdminTicketTable.jsx'));
const AdminTicketDetail = lazy(() => import('./admin/AdminTicketDetail.jsx'));
const AdminReports      = lazy(() => import('./admin/AdminReports.jsx'));

// 404 page
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center py-16 text-sm"
      style={{ color: 'var(--color-muted)' }}
      role="status"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}

function PublicShell() {
  const { pathname } = useLocation();
  const { t } = useLang();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <DemoBanner />
      <OutageBanner />
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
            Campus Help Desk
          </span>
          <nav className="flex items-center gap-4 text-sm flex-wrap">
            <Link
              to="/"
              className="hover:underline"
              style={{ color: pathname === '/' ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
              {t.navSubmit}
            </Link>
            <Link
              to="/track"
              className="hover:underline"
              style={{ color: pathname.startsWith('/track') ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
              {t.navTrack}
            </Link>
            <LanguageToggle />
            <DarkModeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <ErrorBoundary>
          <Routes>
            <Route path="/"           element={<SubmitPage />} />
            <Route path="/track"      element={<TrackPage />} />
            <Route path="/track/:id"  element={<TrackPage />} />
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFoundPage />
              </Suspense>
            } />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer
        className="text-center text-xs py-4"
        style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}
      >
        Campus Help Desk Assistant · Demo Only: Use Fictional Data
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <LanguageProvider>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </LanguageProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
