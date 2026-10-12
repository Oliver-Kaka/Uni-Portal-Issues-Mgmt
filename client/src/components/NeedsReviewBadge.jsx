/**
 * NeedsReviewBadge — shown when aiConfidenceLow is true or
 * category is "Needs Human Review".
 * Demo Only: Use Fictional Data
 */
export default function NeedsReviewBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
      aria-label="Needs human review"
    >
      ⚠ Needs Human Review
    </span>
  );
}
