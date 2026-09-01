import type { Metadata } from 'next';
import { getRequestLanguage, serverLegalTitle } from '@/i18n/server';
import { APP_NAME, CARD_SHADOW } from '@/constants';
import LegalPageTopBar from '@/components/layout/LegalPageTopBar';
import ImpressumContent from './ImpressumContent';

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return { title: `${serverLegalTitle(language, 'imprint')} · ${APP_NAME}` };
}

// Dynamic rendering keeps the HTML nonce in sync with the per-request CSP
// header set in src/proxy.ts.
export const dynamic = 'force-dynamic';

// Angaben gemäß § 5 DDG. Die mit [ ] markierten Platzhalter müssen vor dem
// Produktivbetrieb (interner Pilot) mit den Angaben des tatsächlichen
// Betreibers gefüllt werden.
// Der sichtbare Text steht — in allen fünf Sprachen — in ImpressumContent.tsx.
export default function ImpressumPage() {
  return (
    <main className="min-h-screen p-6 py-12" style={{ background: '#f5f5f5' }}>
      <div className="mx-auto w-full max-w-3xl">
        <LegalPageTopBar />
      </div>
      <div
        className="mx-auto w-full max-w-3xl p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
        <ImpressumContent />
      </div>
    </main>
  );
}
