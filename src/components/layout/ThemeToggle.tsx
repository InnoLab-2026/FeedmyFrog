'use client';

import { Moon, Sun } from 'lucide-react';

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const toggle = () => {
    const next = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark';
    applyTheme(next);
    try {
      window.localStorage.setItem('theme', next);
    } catch {
      /* private mode */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Farbschema umschalten"
      className="flex items-center justify-center rounded-xl"
      style={{
        width: '32px',
        height: '32px',
        background: 'var(--card-bg)',
        border: '1px solid rgba(47,47,47,0.18)',
        color: 'var(--page-fg)',
        cursor: 'pointer',
      }}
    >
      <Sun className="hidden dark:block" style={{ width: 16, height: 16 }} />
      <Moon className="dark:hidden" style={{ width: 16, height: 16 }} />
    </button>
  );
}