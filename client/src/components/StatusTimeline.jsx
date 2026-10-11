/**
 * Status timeline — renders statusHistory[] as a vertical list.
 * Demo Only: Use Fictional Data
 */
export default function StatusTimeline({ history = [] }) {
  if (!history.length) return null;

  return (
    <ol className="relative border-l-2 pl-5" style={{ borderColor: 'var(--color-border)' }}>
      {history.map((entry, idx) => (
        <li key={idx} className="mb-5 last:mb-0">
          {/* Dot */}
          <span
            className="absolute -left-[9px] w-4 h-4 rounded-full border-2 bg-white"
            style={{ borderColor: 'var(--color-accent)' }}
          />
          <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
            {entry.status}
          </p>
          {entry.publicNote && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>
              {entry.publicNote}
            </p>
          )}
          <time className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ''}
          </time>
        </li>
      ))}
    </ol>
  );
}
