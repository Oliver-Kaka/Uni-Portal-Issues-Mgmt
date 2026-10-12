/**
 * Language context — provides the current UI language ('en' | 'sw')
 * and a toggle function throughout the app.
 * All translated strings come from @helpdesk/shared — nothing hardcoded here.
 * Demo Only: Use Fictional Data
 */
import { createContext, useContext, useState } from 'react';
import { UI_STRINGS } from '@helpdesk/shared';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const toggle = () => setLang((l) => (l === 'en' ? 'sw' : 'en'));
  const t = UI_STRINGS[lang];
  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook — returns { lang, toggle, t } */
export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
