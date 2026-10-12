/**
 * LanguageToggle — EN / SW switcher shown in the nav.
 * Demo Only: Use Fictional Data
 */
import { useLang } from '../context/LanguageContext.jsx';

export default function LanguageToggle() {
  const { lang, toggle, t } = useLang();
  return (
    <button
      onClick={toggle}
      aria-label={`${t.langToggleLabel}: ${lang === 'en' ? 'English' : 'Kiswahili'}`}
      className="text-xs font-semibold px-2 py-1 rounded border"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-muted)',
        backgroundColor: 'transparent',
      }}
    >
      {lang === 'en' ? 'SW' : 'EN'}
    </button>
  );
}
