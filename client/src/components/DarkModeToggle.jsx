/**
 * DarkModeToggle — cycles through light → dark → system.
 * Aria-labelled for screen readers. Uses CSS tokens so it looks correct
 * in both light and dark modes without JavaScript.
 * Demo Only: Use Fictional Data
 */
import { useTheme } from '../context/ThemeContext.jsx';

const LABELS = {
  light:  '☀️ Light',
  dark:   '🌙 Dark',
  system: '💻 System',
};

const NEXT = { light: 'dark', dark: 'system', system: 'light' };

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Switch theme. Current: ${theme}`}
      title={`Theme: ${theme}`}
      className="text-xs px-2 py-1 rounded border"
      style={{
        borderColor: 'var(--color-border)',
        color: 'var(--color-muted)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {LABELS[theme]}
    </button>
  );
}
