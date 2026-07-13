import type { Metadata } from 'next';
import Link from 'next/link';
import { CARD_SHADOW } from '@/constants';

export const metadata: Metadata = {
  title: 'Impressum · Reutlingen University Connect',
};

// Dynamic rendering keeps the HTML nonce in sync with the per-request CSP
// header set in src/proxy.ts.
export const dynamic = 'force-dynamic';

// Angaben gemäß § 5 DDG. Die mit [ ] markierten Platzhalter müssen vor dem
// Produktivbetrieb (interner Pilot) mit den Angaben des tatsächlichen
// Betreibers gefüllt werden.
export default function ImpressumPage() {
  return (
    <main className="min-h-screen p-6 py-12" style={{ background: '#f5f5f5' }}>
      <div
        className="mx-auto w-full max-w-3xl p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
      <h1
        style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: '24px', color: 'black' }}
      >
        Impressum
      </h1>

      <section className="mt-6 space-y-4" style={{ fontSize: '14px', fontWeight: 500, color: 'black' }}>
        <h2 className="text-lg font-semibold">Angaben gemäß § 5 DDG</h2>
        <p>
          [Name des Betreibers / der verantwortlichen Organisationseinheit]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ und Ort]
        </p>

        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p>
          E-Mail: [Kontakt-E-Mail-Adresse]
          <br />
          Telefon: [Telefonnummer]
        </p>

        <h2 className="text-lg font-semibold">Verantwortlich für den Inhalt</h2>
        <p>[Name und Anschrift der inhaltlich verantwortlichen Person]</p>

        <h2 className="text-lg font-semibold">Hinweis</h2>
        <p>
          Dieses Angebot ist eine hochschulinterne Vermittlungsplattform für
          Studierende und Beschäftigte der Hochschule Reutlingen, erreichbar
          unter <code>feedmyfrog.click</code>. Der Zugang ist auf
          authentifizierte Mitglieder der Hochschule beschränkt. Inserate
          werden von den Nutzerinnen und Nutzern selbst eingestellt; die
          Kontaktaufnahme und Abwicklung erfolgt außerhalb der Plattform.
        </p>

        <h2 className="text-lg font-semibold">Hosting</h2>
        <p>
          Die Anwendung wird bei Vercel Inc. (USA) gehostet; die Datenbank
          wird von Neon, Inc. ausschließlich in der EU (Frankfurt) betrieben;
          Anmelde-E-Mails werden über Brevo (Sendinblue SAS, Frankreich)
          versandt. Einzelheiten zur Datenverarbeitung enthält die{' '}
          <Link
            href="/datenschutz"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Datenschutzerklärung
          </Link>
          .
        </p>

        <p>
          <Link
            href="/datenschutz"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Datenschutzerklärung
          </Link>
        </p>
      </section>
      </div>
    </main>
  );
}
