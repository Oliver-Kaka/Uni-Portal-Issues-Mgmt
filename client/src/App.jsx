import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DemoBanner from './components/DemoBanner.jsx';
import SubmitPage from './pages/SubmitPage.jsx';
import TrackPage from './pages/TrackPage.jsx';

export default function App() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <DemoBanner />

      {/* Nav */}
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
            Campus Help Desk
          </span>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/"
              className="hover:underline"
              style={{ color: pathname === '/' ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
              Submit Issue
            </Link>
            <Link
              to="/track"
              className="hover:underline"
              style={{ color: pathname === '/track' ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
              Track Issue
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/track/:id" element={<TrackPage />} />
        </Routes>
      </main>

      <footer className="text-center text-xs py-4" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}>
        Campus Help Desk Assistant · Demo Only: Use Fictional Data
      </footer>
    </div>
  );
}
