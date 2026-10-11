/**
 * Persistent amber banner shown on every page.
 * Demo Only: Use Fictional Data
 */
export default function DemoBanner() {
  return (
    <div
      role="status"
      aria-label="Demo notice"
      className="w-full text-center text-sm font-medium px-4 py-2"
      style={{
        backgroundColor: 'var(--color-demo-bg)',
        borderBottom: '2px solid var(--color-demo-border)',
        color: 'var(--color-demo-text)',
      }}
    >
      ⚠️ Demo Only: Use Fictional Data — this app is not connected to any real university system
    </div>
  );
}
