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
    need:  t('mode_need'),
    offer: t('mode_offer'),
  };

  return (
    <div className="pb-6 flex justify-center">
      <div className="relative inline-flex p-1 rounded-full" style={{ background: 'white', border: '2px solid black' }}>
        {/* Sliding pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full"
          style={{ background: 'black', left: mode === 'need' ? 4 : '50%', right: mode === 'offer' ? 4 : '50%' }}
        />
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className="relative z-10 rounded-full"
            style={{ color: mode === m ? 'white' : 'black', fontWeight: 600, fontSize: '18px', minWidth: '144px', padding: '14.4px 38.4px' }}
          >
            {modeLabel[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
