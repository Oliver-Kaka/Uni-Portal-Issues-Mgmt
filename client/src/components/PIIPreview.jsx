/**
 * PIIPreview — shows the user what the AI sees (masked description).
 * Bilingual label from language context.
 * Demo Only: Use Fictional Data
 */
import { useLang } from '../context/LanguageContext.jsx';
import { PII_PLACEHOLDERS } from '@helpdesk/shared';

// Highlight placeholder tokens visually so they stand out
function highlightPlaceholders(text) {
  const tokens = Object.values(PII_PLACEHOLDERS);
  // Split on placeholder tokens, wrap matches in a styled span
  const parts = text.split(/(\[REG_NO\]|\[PHONE\]|\[EMAIL\]|\[ID_NUMBER\]|\[TXN_CODE\])/g);
  return parts.map((part, i) =>
    tokens.includes(part) ? (
      <mark
        key={i}
        className="rounded px-0.5 font-mono text-xs font-semibold"
        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function PIIPreview({ maskedDescription, hadPII }) {
  const { t } = useLang();
  if (!maskedDescription) return null;

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: '#14532d' }}>
        🔍 {t.piiPreviewTitle}
      </p>
      <p className="text-xs mb-2" style={{ color: '#166534' }}>
        {hadPII ? t.piiPreviewNote : t.piiNoneFound}
      </p>
      {hadPII && (
        <p
          className="text-xs font-mono rounded p-2 whitespace-pre-wrap break-words"
          style={{ backgroundColor: '#dcfce7', color: '#14532d' }}
        >
          {highlightPlaceholders(maskedDescription)}
        </p>
      )}
    </div>
  );
}
