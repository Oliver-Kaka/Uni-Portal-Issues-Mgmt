/**
 * Colour-coded priority chip.
 * Demo Only: Use Fictional Data
 */
const PRIORITY_STYLES = {
  Urgent: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  High:   { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  Medium: { backgroundColor: '#dbeafe', color: '#1e3a8a', border: '1px solid #93c5fd' },
  Low:    { backgroundColor: '#dcfce7', color: '#14532d', border: '1px solid #86efac' },
};

export default function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Medium;
  return (
    <span
      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
      style={style}
    >
      {priority}
    </span>
  );
}
