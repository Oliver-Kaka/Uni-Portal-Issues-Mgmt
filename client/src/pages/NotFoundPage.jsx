/**
 * NotFoundPage — 404 fallback for unknown routes.
 * Demo Only: Use Fictional Data
 */
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      style={{ color: 'var(--color-text)' }}
    >
      <p className="text-6xl font-black" style={{ color: 'var(--color-accent)' }}>404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm max-w-xs" style={{ color: 'var(--color-muted)' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          to="/"
          className="text-sm px-4 py-2 rounded"
          style={{ backgroundColor: 'var(--color-accent)', color: '#ffffff' }}
        >
          Submit an Issue
        </Link>
        <Link
          to="/track"
          className="text-sm px-4 py-2 rounded border"
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
          Track a Ticket
        </Link>
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
        Demo Only: Use Fictional Data
      </p>
    </div>
  );
}
