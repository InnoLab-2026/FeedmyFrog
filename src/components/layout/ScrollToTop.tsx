'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Nach oben"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 40,
        width: '48px',
        height: '48px',
        borderRadius: '999px',
        border: '1px solid #8DC63F',
        background: '#8DC63F',
        color: '#1a3200',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}