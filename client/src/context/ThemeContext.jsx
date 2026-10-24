/**
 * ThemeContext — manages light/dark/system theme preference.
 * Persists the user's choice in localStorage.
 * Applies data-theme attribute to <html> so CSS variables pick it up.
 * Demo Only: Use Fictional Data
 */
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/** Reads preference from localStorage; defaults to 'system'. */
function getStored() {
  try {
    return localStorage.getItem('helpdesk-theme') || 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(pref) {
  const root = document.documentElement;
  if (pref === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (pref === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // 'system' — remove attribute so CSS media query takes over
    root.removeAttribute('data-theme');
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getStored());

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('helpdesk-theme', theme); } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns { theme, setTheme } — theme is 'light' | 'dark' | 'system' */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
