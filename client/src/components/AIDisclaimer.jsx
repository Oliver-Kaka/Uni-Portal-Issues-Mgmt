/**
 * AI Disclaimer component — mandatory on Submit, Result and Track pages.
 * Text comes from @helpdesk/shared AI_DISCLAIMER constant.
 * Demo Only: Use Fictional Data
 */
import { AI_DISCLAIMER } from '@helpdesk/shared';

export default function AIDisclaimer() {
  return (
    <div
      role="note"
      aria-label="AI disclaimer"
      className="rounded border p-3 text-xs leading-relaxed"
      style={{
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        color: '#1e3a8a',
      }}
    >
      <span className="font-semibold">ℹ️ </span>
      {AI_DISCLAIMER}
    </div>
  );
}
