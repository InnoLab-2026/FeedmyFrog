'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/*
 * The switch, and the whole of the theme's client-side state.
 *
 * `dark` on <html> rather than a React context: the class has to be on the
 * document before the first paint, which is what the inline script in
 * app/layout.tsx does, and no React state can be read that early. Keeping the
 * one source of truth in the DOM means the script and this button cannot
 * disagree about which theme is on.
 */
function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const { t } = useTranslation();

  const toggle = () => {
    const next = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark';
    applyTheme(next);
    try {
      window.localStorage.setItem('theme', next);
    } catch {
      /*
       * Private browsing and blocked site data both throw here. The theme
       * still applies for this page view; only remembering it is lost, which
       * is not worth failing the click over.
       */
    }
  };

  /*
   * A label that names the action, not the state. Which theme is current is
   * only knowable on the client, so a label like "Switch to dark" would
   * either render wrong on the server or have to wait for an effect -- and a
   * button whose accessible name changes after hydration is worse for a
   * screen reader than one that simply says what it does.
   */
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme_switch')}
      title={t('theme_switch')}
      className="flex items-center justify-center rounded-xl"
      style={{
        width: '32px',
        height: '32px',
        background: 'var(--card-bg)',
        border: '1px solid var(--control-border)',
        color: 'var(--page-fg)',
        cursor: 'pointer',
      }}
    >
      {/*
       * Both icons ship and CSS picks one, so the right glyph is on screen in
       * the same paint as the theme itself. `dark:` resolves through the
       * `@custom-variant` in theme.css, so these follow the class the script
       * set rather than the operating system's preference.
       */}
      <Sun className="hidden dark:block" style={{ width: 16, height: 16 }} />
      <Moon className="dark:hidden" style={{ width: 16, height: 16 }} />
    </button>
  );
}
