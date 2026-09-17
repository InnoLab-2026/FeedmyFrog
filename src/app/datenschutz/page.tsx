import type { Metadata } from 'next';
import { getRequestLanguage, serverLegalTitle } from '@/i18n/server';
import { APP_NAME, CARD_SHADOW } from '@/constants';
import LegalPageTopBar from '@/components/layout/LegalPageTopBar';
import DatenschutzContent from './DatenschutzContent';

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return { title: `${serverLegalTitle(language, 'privacy')} · ${APP_NAME}` };
}

// Dynamic rendering keeps the HTML nonce in sync with the per-request CSP
// header set in src/proxy.ts.
export const dynamic = 'force-dynamic';

// Informationspflichten nach Art. 13 DSGVO. Die mit [ ] markierten
// Platzhalter müssen vor dem Produktivbetrieb gefüllt werden. Der sichtbare
// Text steht — in allen fünf Sprachen — in DatenschutzContent.tsx.
export default function DatenschutzPage() {
  return (
      <main className="min-h-screen p-6 py-12" style={{ background: 'var(--page-bg)', color: 'var(--page-fg)' }}>
      <div className="mx-auto w-full max-w-3xl">
        <LegalPageTopBar />
      </div>
      <div
        className="mx-auto w-full max-w-3xl p-8 rounded-2xl"
        style={{
          background: 'var(--card-bg)',
          color: 'var(--page-fg)',
          border: '1px solid rgba(232,234,223,0.2)',
          boxShadow: CARD_SHADOW,
        }}
      >
        <DatenschutzContent />
      </div>
    </main>
  );
}
