import type { Metadata } from 'next';
import { CARD_SHADOW } from '@/constants';
import LegalPageTopBar from '@/components/layout/LegalPageTopBar';
import DatenschutzContent from './DatenschutzContent';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · Reutlingen University Connect',
};

// Dynamic rendering keeps the HTML nonce in sync with the per-request CSP
// header set in src/proxy.ts.
export const dynamic = 'force-dynamic';

// Informationspflichten nach Art. 13 DSGVO. Die mit [ ] markierten
// Platzhalter müssen vor dem Produktivbetrieb gefüllt werden. Der sichtbare
// Text steht — in allen fünf Sprachen — in DatenschutzContent.tsx.
export default function DatenschutzPage() {
  return (
    <main className="min-h-screen p-6 py-12" style={{ background: '#f5f5f5' }}>
      <div className="mx-auto w-full max-w-3xl">
        <LegalPageTopBar />
      </div>
      <div
        className="mx-auto w-full max-w-3xl p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
        <DatenschutzContent />
      </div>
    </main>
  );
}
