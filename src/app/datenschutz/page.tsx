import type { Metadata } from 'next';
import Link from 'next/link';
import { CARD_SHADOW } from '@/constants';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · Reutlingen University Connect',
};

// Dynamic rendering keeps the HTML nonce in sync with the per-request CSP
// header set in src/proxy.ts.
export const dynamic = 'force-dynamic';

const RETENTION: Array<[string, string]> = [
  ['Anmelde-Token (nur SHA-256-Hash gespeichert)', '15 Minuten gültig, einmalig verwendbar; Reste werden spätestens 7 Tage nach Ablauf gelöscht'],
  ['Sitzungs-Cookie (signiertes JWT, HttpOnly)', '7 Tage, danach automatisch ungültig; Abmelden löscht es sofort'],
  ['IP-Adresse (Rate-Limiting beim Linkversand)', '6 Stunden, danach automatische Löschung'],
  ['Inserate (Titel, Beschreibung, Tags, Ort, E-Mail-Adresse)', 'Bis zur Löschung durch die inserierende Person'],
];

// Informationspflichten nach Art. 13 DSGVO. Die mit [ ] markierten
// Platzhalter müssen vor dem Produktivbetrieb gefüllt werden.
export default function DatenschutzPage() {
  return (
    <main className="min-h-screen p-6 py-12" style={{ background: '#f5f5f5' }}>
      <div
        className="mx-auto w-full max-w-3xl p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
      <h1
        style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: '24px', color: 'black' }}
      >
        Datenschutzerklärung
      </h1>

      <section className="mt-6 space-y-4 leading-relaxed" style={{ fontSize: '14px', fontWeight: 500, color: 'black' }}>
        <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
        <p>
          [Name und Anschrift des Verantwortlichen im Sinne von Art. 4 Nr. 7
          DSGVO — vor dem Pilotbetrieb eintragen], E-Mail:
          [Kontakt-E-Mail-Adresse].
          <br />
          Datenschutzbeauftragte/r: [Kontaktdaten der/des
          Datenschutzbeauftragten der Hochschule].
        </p>

        <h2 className="text-lg font-semibold">2. Zweck der Plattform</h2>
        <p>
          Die Plattform (erreichbar unter <code>feedmyfrog.click</code>)
          vermittelt Angebote und Gesuche zwischen Mitgliedern der Hochschule
          Reutlingen. Alle Inhalte sind ausschließlich für angemeldete
          Hochschulmitglieder sichtbar. Die Kontaktaufnahme erfolgt außerhalb
          der Plattform per E-Mail.
        </p>

        <h2 className="text-lg font-semibold">3. Verarbeitete Daten und Rechtsgrundlagen</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Hochschul-E-Mail-Adresse</strong> — zur Anmeldung
            (Magic-Link) und als Kontaktangabe auf eigenen Inseraten. Es
            werden keine Passwörter gespeichert und es existiert kein
            Nutzerkonto-Datensatz; als Kennung dient der SHA-256-Hash der
            Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzung der
            Plattform).
          </li>
          <li>
            <strong>Inseratsinhalte</strong> (Titel, Beschreibung, Tags,
            Ort) — von Ihnen selbst eingegeben. Rechtsgrundlage: Art. 6
            Abs. 1 lit. b DSGVO.
          </li>
          <li>
            <strong>IP-Adresse</strong> — kurzzeitig zur Begrenzung von
            Missbrauch des Anmeldelink-Versands (Rate-Limiting).
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Betriebssicherheit).
          </li>
          <li>
            <strong>Sitzungs-Cookie</strong> — ein einzelnes, technisch
            notwendiges HttpOnly-Cookie hält Ihre Anmeldung aufrecht. Es
            findet kein Tracking statt; Analyse- oder Marketing-Cookies
            werden nicht gesetzt. Das Cookie ist nach § 25 Abs. 2 Nr. 2
            TDDDG einwilligungsfrei; ein Cookie-Banner ist daher nicht
            erforderlich.
          </li>
          <li>
            <strong>Server-Logdaten</strong> — beim Aufruf der Plattform
            verarbeitet unser Hosting-Anbieter Vercel automatisch technische
            Zugriffsdaten (insbesondere IP-Adresse, Zeitpunkt des Zugriffs,
            aufgerufene URL, User-Agent), soweit dies für die Auslieferung
            der Seiten und die Sicherheit des Betriebs erforderlich ist. Eine
            Zusammenführung mit anderen Daten oder eine Profilbildung findet
            nicht statt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
            (technischer Betrieb und Absicherung der Plattform).
          </li>
        </ul>

        <h2 className="text-lg font-semibold">4. Sichtbarkeit Ihrer E-Mail-Adresse</h2>
        <p>
          Ihre Hochschul-E-Mail-Adresse wird auf Ihren Inseraten für andere
          angemeldete Hochschulmitglieder angezeigt, damit diese Sie
          kontaktieren können. Sie ist nicht öffentlich im Internet sichtbar.
        </p>

        <h2 className="text-lg font-semibold">5. Speicherdauer</h2>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b py-2 pr-4 font-semibold">Daten</th>
              <th className="border-b py-2 font-semibold">Speicherdauer</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION.map(([what, howLong]) => (
              <tr key={what}>
                <td className="border-b py-2 pr-4 align-top">{what}</td>
                <td className="border-b py-2 align-top">{howLong}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-lg font-semibold">6. Auftragsverarbeiter und Empfänger</h2>
        <p>
          Mit allen nachfolgend genannten Dienstleistern bestehen
          Auftragsverarbeitungsverträge nach Art. 28 DSGVO (jeweils über die
          vom Anbieter bereitgestellten Vertragswerke abgeschlossen):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Vercel Inc.</strong> (USA) — Hosting und Auslieferung der
            Anwendung unter <code>feedmyfrog.click</code>; verarbeitet dabei
            Server-Logdaten (siehe Abschnitt 3). Drittlandtransfer auf
            Grundlage der Zertifizierung nach dem EU-US Data Privacy
            Framework sowie EU-Standardvertragsklauseln. Details:
            vercel.com/legal/privacy-notice.
          </li>
          <li>
            <strong>Neon, Inc.</strong> (USA, ein Unternehmen von
            Databricks) — Betrieb der PostgreSQL-Datenbank. Die Datenbank
            liegt ausschließlich in der EU (Frankfurt, AWS eu-central-1) und
            das Projekt ist an diese Region gebunden. Für den
            US-Unternehmenssitz gelten EU-Standardvertragsklauseln als
            Transfergarantie.
          </li>
          <li>
            <strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017
            Paris, Frankreich, mit deutscher Niederlassung Brevo GmbH,
            Köpenicker Str. 126, 10179 Berlin) — Versand der
            Anmelde-E-Mails (Absender <code>noreply@feedmyfrog.click</code>).
            EU-Anbieter; Verarbeitung der Empfängeradresse zum Zweck des
            Linkversands.
          </li>
        </ul>
        <p>
          Schriftarten werden beim Build heruntergeladen und von der eigenen
          Domain ausgeliefert (Self-Hosting via <code>next/font</code>); beim
          Seitenaufruf wird keine Verbindung zu Google aufgebaut.
        </p>

        <h2 className="text-lg font-semibold">7. Ihre Rechte</h2>
        <p>
          Sie haben nach Art. 15–21 DSGVO das Recht auf Auskunft,
          Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch. Eigene Inserate können Sie
          jederzeit selbst unter <em>Meine Einträge</em> bearbeiten oder
          löschen; da kein weiteres Nutzerkonto existiert, sind damit alle zu
          Ihrer Person gespeicherten Inhalte entfernt. Für alle Anliegen
          wenden Sie sich an [Kontakt-E-Mail-Adresse]. Sie haben außerdem das
          Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO),
          z.&nbsp;B. beim Landesbeauftragten für den Datenschutz und die
          Informationsfreiheit Baden-Württemberg.
        </p>

        <p>
          <Link
            href="/impressum"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Impressum
          </Link>
        </p>
      </section>
      </div>
    </main>
  );
}
