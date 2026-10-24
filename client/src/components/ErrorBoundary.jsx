/**
 * ErrorBoundary — catches render errors in child components and shows
 * a friendly fallback rather than a blank screen.
 * Demo Only: Use Fictional Data
 */
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to an error monitoring service.
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-lg border p-6 text-center space-y-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <p className="text-base font-semibold">Something went wrong</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm px-4 py-2 rounded border"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Refresh
          </button>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Demo Only: Use Fictional Data
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
