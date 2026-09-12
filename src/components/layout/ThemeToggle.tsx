'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    const next =
      stored === 'dark' || stored === 'light' ? stored : systemTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem('theme', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Hell' : 'Dunkel'}
      aria-label={theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
      className="flex items-center justify-center rounded-xl"
      style={{
        width: '32px',
        height: '32px',
        background: 'var(--card-bg)',
        color: 'var(--page-fg)',
        border: '1px solid rgba(232,234,223,0.2)',
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? (
        <Sun style={{ width: '16px', height: '16px' }} />
      ) : (
        <Moon style={{ width: '16px', height: '16px' }} />
      )}
    </button>
  );
}