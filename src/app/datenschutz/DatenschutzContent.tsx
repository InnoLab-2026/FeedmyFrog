'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const RETENTION_DE: Array<[string, string]> = [
  ['Anmelde-Token (nur SHA-256-Hash gespeichert)', '15 Minuten gültig, einmalig verwendbar; Reste werden spätestens 7 Tage nach Ablauf gelöscht'],
  ['Sitzungs-Cookie (signiertes JWT, HttpOnly)', '7 Tage, danach automatisch ungültig; Abmelden löscht es sofort'],
  ['IP-Adresse (Rate-Limiting beim Linkversand)', '6 Stunden, danach automatische Löschung'],
  ['Inserate (Titel, Beschreibung, Tags, Ort, E-Mail-Adresse)', 'Bis zur Löschung durch die inserierende Person'],
];

const RETENTION_EN: Array<[string, string]> = [
  ['Login token (only SHA-256 hash stored)', 'Valid for 15 minutes, single-use; leftovers deleted at latest 7 days after expiry'],
  ['Session cookie (signed JWT, HttpOnly)', '7 days, then invalid; logging out deletes it immediately'],
  ['IP address (rate limiting for link sending)', '6 hours, then automatic deletion'],
  ['Listings (title, description, tags, location, email address)', 'Until deleted by the person who created the listing'],
];

const RETENTION_FR: Array<[string, string]> = [
  ['Jeton de connexion (seul le hash SHA-256 est stocké)', 'Valable 15 minutes, usage unique ; suppression au plus tard 7 jours après expiration'],
  ['Cookie de session (JWT signé, HttpOnly)', '7 jours, puis invalidé ; la déconnexion le supprime immédiatement'],
  ['Adresse IP (limitation du nombre d’envois de liens)', '6 heures, puis suppression automatique'],
  ['Annonces (titre, description, tags, lieu, e-mail)', 'Jusqu’à suppression par la personne qui a créé l’annonce'],
];

const RETENTION_TR: Array<[string, string]> = [
  ['Giriş jetonu (yalnızca SHA-256 özeti saklanır)', '15 dakika geçerli, tek kullanımlık; en geç sürenin bitiminden 7 gün sonra silinir'],
  ['Oturum çerezi (imzalı JWT, HttpOnly)', '7 gün, sonra geçersiz; çıkış yapınca hemen silinir'],
  ['IP adresi (bağlantı gönderimi için hız sınırı)', '6 saat, sonra otomatik silme'],
  ['İlanlar (başlık, açıklama, etiketler, konum, e-posta)', 'İlanı oluşturan kişi silene kadar'],
];

const RETENTION_ES: Array<[string, string]> = [
  ['Token de acceso (solo se guarda el hash SHA-256)', 'Válido 15 minutos, un solo uso; se elimina como máximo 7 días después de caducar'],
  ['Cookie de sesión (JWT firmado, HttpOnly)', '7 días, luego deja de ser válida; al cerrar sesión se elimina de inmediato'],
  ['Dirección IP (límite de envío de enlaces)', '6 horas, luego se elimina automáticamente'],
  ['Anuncios (título, descripción, etiquetas, lugar, correo)', 'Hasta que la persona que lo creó lo elimine'],
];

export default function DatenschutzContent() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (lang.startsWith('en')) return <TextEn />;
  if (lang.startsWith('fr')) return <TextFr />;
  if (lang.startsWith('tr')) return <TextTr />;
  if (lang.startsWith('es')) return <TextEs />;
  return <TextDe />;
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="mt-6 space-y-4 leading-relaxed"
      style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}
    >
      {children}
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-family-display)',
        fontWeight: 700,
        fontSize: 'var(--fs-2xl)',
        color: 'black',
      }}
    >
      {children}
    </h1>
  );
}

function RetentionTable({
  rows,
  col1,
  col2,
}: {
  rows: Array<[string, string]>;
  col1: string;
  col2: string;
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className="border-b py-2 pr-4 font-semibold">{col1}</th>
          <th className="border-b py-2 font-semibold">{col2}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([what, howLong]) => (
          <tr key={what}>
            <td className="border-b py-2 pr-4 align-top">{what}</td>
            <td className="border-b py-2 align-top">{howLong}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TextDe() {
  return (
    <>
      <Title>Datenschutzerklärung</Title>
      <Section>
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
        <RetentionTable rows={RETENTION_DE} col1="Daten" col2="Speicherdauer" />

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
      </Section>
    </>
  );
}

function TextEn() {
  return (
    <>
      <Title>Privacy Policy</Title>
      <Section>
        <h2 className="text-lg font-semibold">1. Controller</h2>
        <p>
          [Name and address of the controller under Art. 4(7) GDPR — to be
          added before pilot operation], email: [contact email].
          <br />
          Data protection officer: [contact details of the university DPO].
        </p>

        <h2 className="text-lg font-semibold">2. Purpose of the platform</h2>
        <p>
          The platform (available at <code>feedmyfrog.click</code>) connects
          offers and requests among members of Reutlingen University. All
          content is visible only to signed-in university members. Contact
          takes place outside the platform by email.
        </p>

        <h2 className="text-lg font-semibold">3. Processed data and legal bases</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>University email address</strong> — for login (magic
            link) and as contact details on your own listings. No passwords
            are stored and there is no user-account record; the identifier is
            the SHA-256 hash of the address. Legal basis: Art. 6(1)(b) GDPR
            (use of the platform).
          </li>
          <li>
            <strong>Listing content</strong> (title, description, tags,
            location) — entered by you. Legal basis: Art. 6(1)(b) GDPR.
          </li>
          <li>
            <strong>IP address</strong> — briefly, to limit abuse of login
            link sending (rate limiting). Legal basis: Art. 6(1)(f) GDPR
            (operational security).
          </li>
          <li>
            <strong>Session cookie</strong> — a single technically necessary
            HttpOnly cookie keeps you signed in. There is no tracking; no
            analytics or marketing cookies are set. The cookie is exempt from
            consent under § 25(2) no. 2 TDDDG; a cookie banner is therefore
            not required.
          </li>
          <li>
            <strong>Server logs</strong> — when you visit the platform, our
            hosting provider Vercel automatically processes technical access
            data (in particular IP address, time of access, requested URL,
            user agent) as far as needed to deliver pages and keep the
            service secure. Data is not combined for profiling. Legal basis:
            Art. 6(1)(f) GDPR.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">4. Visibility of your email address</h2>
        <p>
          Your university email address is shown on your listings to other
          signed-in university members so they can contact you. It is not
          publicly visible on the internet.
        </p>

        <h2 className="text-lg font-semibold">5. Retention</h2>
        <RetentionTable rows={RETENTION_EN} col1="Data" col2="Retention period" />

        <h2 className="text-lg font-semibold">6. Processors and recipients</h2>
        <p>
          Data processing agreements under Art. 28 GDPR are in place with the
          following providers:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Vercel Inc.</strong> (USA) — hosting and delivery of the
            app at <code>feedmyfrog.click</code>; processes server logs (see
            section 3). Third-country transfer based on the EU-US Data
            Privacy Framework and EU standard contractual clauses.
          </li>
          <li>
            <strong>Neon, Inc.</strong> (USA, a Databricks company) —
            PostgreSQL database. The database is in the EU (Frankfurt, AWS
            eu-central-1). EU standard contractual clauses apply for the US
            company seat.
          </li>
          <li>
            <strong>Brevo</strong> (Sendinblue SAS, France / Brevo GmbH,
            Berlin) — sending login emails from
            <code>noreply@feedmyfrog.click</code>.
          </li>
        </ul>
        <p>
          Fonts are downloaded at build time and served from this domain
          (self-hosting via <code>next/font</code>); no connection to Google
          is made when the page is opened.
        </p>

        <h2 className="text-lg font-semibold">7. Your rights</h2>
        <p>
          Under Art. 15–21 GDPR you have the right of access, rectification,
          erasure, restriction of processing, data portability and objection.
          You can edit or delete your own listings at any time under
          <em> My listings</em>. There is no additional user account, so this
          removes the content stored about you. For all requests contact
          [contact email]. You may also lodge a complaint with a supervisory
          authority (Art. 77 GDPR), e.g. the data protection authority of
          Baden-Württemberg.
        </p>

        <p>
          <Link
            href="/impressum"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Imprint
          </Link>
        </p>
      </Section>
    </>
  );
}

function TextFr() {
  return (
    <>
      <Title>Politique de confidentialité</Title>
      <Section>
        <h2 className="text-lg font-semibold">1. Responsable</h2>
        <p>
          [Nom et adresse du responsable au sens de l’art. 4, point 7, du
          RGPD], e-mail : [adresse de contact].
          <br />
          Délégué(e) à la protection des données : [coordonnées du DPO de
          l’université].
        </p>

        <h2 className="text-lg font-semibold">2. Objet de la plateforme</h2>
        <p>
          La plateforme (<code>feedmyfrog.click</code>) met en relation les
          offres et demandes des membres de la Hochschule Reutlingen. Les
          contenus ne sont visibles que pour les membres connectés. Le
          contact se fait par e-mail en dehors de la plateforme.
        </p>

        <h2 className="text-lg font-semibold">3. Données traitées et bases juridiques</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Adresse e-mail universitaire</strong> — connexion
            (lien magique) et contact sur vos annonces. Aucun mot de passe
            n’est stocké. Base juridique : art. 6, § 1, b) RGPD.
          </li>
          <li>
            <strong>Contenu des annonces</strong> — saisi par vous. Base
            juridique : art. 6, § 1, b) RGPD.
          </li>
          <li>
            <strong>Adresse IP</strong> — temporairement, pour limiter les
            abus. Base juridique : art. 6, § 1, f) RGPD.
          </li>
          <li>
            <strong>Cookie de session</strong> — cookie technique HttpOnly,
            sans tracking.
          </li>
          <li>
            <strong>Journaux serveur</strong> — traités par Vercel pour
            l’hébergement et la sécurité.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">4. Visibilité de votre e-mail</h2>
        <p>
          Votre e-mail universitaire apparaît sur vos annonces pour les
          autres membres connectés. Il n’est pas public sur Internet.
        </p>

        <h2 className="text-lg font-semibold">5. Durée de conservation</h2>
        <RetentionTable rows={RETENTION_FR} col1="Données" col2="Durée" />

        <h2 className="text-lg font-semibold">6. Sous-traitants</h2>
        <p>Vercel Inc., Neon, Inc. et Brevo, avec contrats art. 28 RGPD.</p>

        <h2 className="text-lg font-semibold">7. Vos droits</h2>
        <p>
          Droits d’accès, de rectification, d’effacement, de limitation, de
          portabilité et d’opposition (art. 15–21 RGPD). Vous pouvez aussi
          saisir une autorité de contrôle (art. 77 RGPD).
        </p>

        <p>
          <Link
            href="/impressum"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Mentions légales
          </Link>
        </p>
      </Section>
    </>
  );
}

function TextTr() {
  return (
    <>
      <Title>Gizlilik Politikası</Title>
      <Section>
        <h2 className="text-lg font-semibold">1. Veri sorumlusu</h2>
        <p>
          [GDPR md. 4/7 kapsamındaki sorumlu kişinin adı ve adresi], e-posta:
          [iletişim e-postası].
          <br />
          Veri koruma görevlisi: [üniversite DPO iletişim bilgileri].
        </p>

        <h2 className="text-lg font-semibold">2. Platformun amacı</h2>
        <p>
          Platform (<code>feedmyfrog.click</code>) Reutlingen Üniversitesi
          üyeleri arasında ilanları bir araya getirir. İçerikler yalnızca
          giriş yapmış üyeler tarafından görülür. İletişim platform dışında
          e-posta ile yapılır.
        </p>

        <h2 className="text-lg font-semibold">3. İşlenen veriler ve hukuki dayanaklar</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Üniversite e-posta adresi</strong> — giriş (sihirli
            bağlantı) ve ilanlarda iletişim için. Parola saklanmaz. Hukuki
            dayanak: GDPR md. 6/1/b.
          </li>
          <li>
            <strong>İlan içeriği</strong> — sizin girdiğiniz veriler. GDPR
            md. 6/1/b.
          </li>
          <li>
            <strong>IP adresi</strong> — kısa süreli kötüye kullanımı
            önlemek için. GDPR md. 6/1/f.
          </li>
          <li>
            <strong>Oturum çerezi</strong> — teknik HttpOnly çerez, izleme
            yok.
          </li>
          <li>
            <strong>Sunucu günlükleri</strong> — Vercel tarafından barındırma
            ve güvenlik için işlenir.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">4. E-posta görünürlüğü</h2>
        <p>
          Üniversite e-postanız ilanlarınızda diğer giriş yapmış üyelere
          gösterilir. İnternette herkese açık değildir.
        </p>

        <h2 className="text-lg font-semibold">5. Saklama süresi</h2>
        <RetentionTable rows={RETENTION_TR} col1="Veri" col2="Süre" />

        <h2 className="text-lg font-semibold">6. İşleyenler</h2>
        <p>Vercel Inc., Neon, Inc. ve Brevo, GDPR md. 28 sözleşmeleri ile.</p>

        <h2 className="text-lg font-semibold">7. Haklarınız</h2>
        <p>
          GDPR md. 15–21 kapsamındaki erişim, düzeltme, silme, kısıtlama,
          taşınabilirlik ve itiraz hakları. Ayrıca bir denetim makamına
          şikayette bulunabilirsiniz (md. 77).
        </p>

        <p>
          <Link
            href="/impressum"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Künye
          </Link>
        </p>
      </Section>
    </>
  );
}

function TextEs() {
  return (
    <>
      <Title>Política de privacidad</Title>
      <Section>
        <h2 className="text-lg font-semibold">1. Responsable</h2>
        <p>
          [Nombre y dirección del responsable según el art. 4.7 del RGPD],
          correo: [correo de contacto].
          <br />
          Delegado de protección de datos: [datos de contacto del DPO de la
          universidad].
        </p>

        <h2 className="text-lg font-semibold">2. Finalidad de la plataforma</h2>
        <p>
          La plataforma (<code>feedmyfrog.click</code>) conecta ofertas y
          solicitudes entre miembros de la Universidad de Reutlingen. El
          contenido solo es visible para miembros con sesión iniciada. El
          contacto se hace por correo fuera de la plataforma.
        </p>

        <h2 className="text-lg font-semibold">3. Datos tratados y bases jurídicas</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Correo universitario</strong> — inicio de sesión (enlace
            mágico) y contacto en tus anuncios. No se guardan contraseñas.
            Base jurídica: art. 6.1.b RGPD.
          </li>
          <li>
            <strong>Contenido de los anuncios</strong> — introducido por ti.
            Art. 6.1.b RGPD.
          </li>
          <li>
            <strong>Dirección IP</strong> — de forma breve para limitar
            abusos. Art. 6.1.f RGPD.
          </li>
          <li>
            <strong>Cookie de sesión</strong> — cookie técnica HttpOnly, sin
            seguimiento.
          </li>
          <li>
            <strong>Registros del servidor</strong> — tratados por Vercel
            para el alojamiento y la seguridad.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">4. Visibilidad del correo</h2>
        <p>
          Tu correo universitario se muestra en tus anuncios a otros
          miembros con sesión iniciada. No es público en internet.
        </p>

        <h2 className="text-lg font-semibold">5. Plazo de conservación</h2>
        <RetentionTable rows={RETENTION_ES} col1="Datos" col2="Plazo" />

        <h2 className="text-lg font-semibold">6. Encargados del tratamiento</h2>
        <p>Vercel Inc., Neon, Inc. y Brevo, con contratos art. 28 RGPD.</p>

        <h2 className="text-lg font-semibold">7. Tus derechos</h2>
        <p>
          Derechos de acceso, rectificación, supresión, limitación,
          portabilidad y oposición (art. 15–21 RGPD). También puedes
          presentar una reclamación ante una autoridad de control (art. 77
          RGPD).
        </p>

        <p>
          <Link
            href="/impressum"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Aviso legal
          </Link>
        </p>
      </Section>
    </>
  );
}
