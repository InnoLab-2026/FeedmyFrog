'use client';

import { useTranslation } from 'react-i18next';
import type { Mode } from '@/types';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: Mode[] = ['need', 'offer'];

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useTranslation();

  const modeLabel: Record<Mode, string> = {
    need: t('mode_need'),
    offer: t('mode_offer'),
  };

  return (
    <div className="pt-4 pb-4 flex justify-center">
      <div
        className="inline-flex p-1"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--control-border)',
          borderRadius: '999px',
          boxShadow: 'var(--elevation-sm)',
        }}
      >
        {MODES.map((m) => {
          const active = mode === m;

          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className="transition-all duration-200"
              style={{
                minWidth: '110px',
                padding: '9px 22px',
                borderRadius: '999px',
                border: 'none',
                background: active ? '#8DC63F' : 'transparent',
                color: active ? 'var(--on-accent)' : 'var(--page-fg)',
                fontWeight: 600,
                fontSize: 'var(--fs-control-button)',
                cursor: 'pointer',
              }}
            >
              {modeLabel[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
