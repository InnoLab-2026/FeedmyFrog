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
    <div className="pb-6 flex justify-center">
      <div
        className="inline-flex p-1"
        style={{
          background: 'white',
          border: '1px solid rgba(47,47,47,0.18)',
          borderRadius: '999px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
                minWidth: '150px',
                padding: '13px 34px',
                borderRadius: '999px',
                border: 'none',
                background: active ? '#8DC63F' : 'transparent',
                color: active ? '#1a3200' : '#2f2f2f',
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