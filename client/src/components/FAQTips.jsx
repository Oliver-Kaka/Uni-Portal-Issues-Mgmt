/**
 * FAQTips — self-service suggestions shown before submission.
 * Tips come from @helpdesk/shared FAQ_TIPS keyed by detected category.
 * Clearly labelled as demo content.
 * Demo Only: Use Fictional Data
 */
import { FAQ_TIPS } from '@helpdesk/shared';
import { useLang } from '../context/LanguageContext.jsx';

export default function FAQTips({ category }) {
  const { lang, t } = useLang();
  if (!category) return null;

  const tips = FAQ_TIPS[category];
  if (!tips) return null;

  const list = tips[lang] ?? tips['en'];

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>
        💡 {t.faqTitle}
      </p>
      <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
        {t.faqNote}
      </p>
      <ul className="space-y-1">
        {list.map((tip, i) => (
          <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--color-text)' }}>
            <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>›</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
