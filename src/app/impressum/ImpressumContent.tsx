'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ImpressumContent() {
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
    <section className="mt-6 space-y-4" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}>
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

function PrivacyLink({ label }: { label: string }) {
  return (
    <Link
      href="/datenschutz"
      className="hover:underline"
      style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
    >
      {label}
    </Link>
  );
}

function TextDe() {
  return (
    <>
      <Title>Impressum</Title>
      <Section>
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
          <PrivacyLink label="Datenschutzerklärung" />.
        </p>

        <p>
          <PrivacyLink label="Datenschutzerklärung" />
        </p>
      </Section>
    </>
  );
}

function TextEn() {
  return (
    <>
      <Title>Imprint</Title>
      <Section>
        <h2 className="text-lg font-semibold">Information according to § 5 DDG</h2>
        <p>
          [Name of the operator / responsible organisational unit]
          <br />
          [Street and number]
          <br />
          [Postcode and city]
        </p>

        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          Email: [contact email]
          <br />
          Phone: [phone number]
        </p>

        <h2 className="text-lg font-semibold">Responsible for the content</h2>
        <p>[Name and address of the person responsible for the content]</p>

        <h2 className="text-lg font-semibold">Note</h2>
        <p>
          This service is an internal university exchange platform for
          students and staff of Reutlingen University, available at{' '}
          <code>feedmyfrog.click</code>. Access is limited to authenticated
          university members. Listings are posted by users themselves;
          contact and arrangements take place outside the platform.
        </p>

        <h2 className="text-lg font-semibold">Hosting</h2>
        <p>
          The app is hosted by Vercel Inc. (USA); the database is operated by
          Neon, Inc. exclusively in the EU (Frankfurt); login emails are sent
          via Brevo (Sendinblue SAS, France). Details on data processing are
          in the <PrivacyLink label="Privacy Policy" />.
        </p>

        <p>
          <PrivacyLink label="Privacy Policy" />
        </p>
      </Section>
    </>
  );
}

function TextFr() {
  return (
    <>
      <Title>Mentions légales</Title>
      <Section>
        <h2 className="text-lg font-semibold">Informations selon § 5 DDG</h2>
        <p>
          [Nom de l’exploitant]
          <br />
          [Rue et numéro]
          <br />
          [Code postal et ville]
        </p>

        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          E-mail : [adresse de contact]
          <br />
          Téléphone : [numéro]
        </p>

        <h2 className="text-lg font-semibold">Responsable du contenu</h2>
        <p>[Nom et adresse de la personne responsable du contenu]</p>

        <h2 className="text-lg font-semibold">Remarque</h2>
        <p>
          Cette offre est une plateforme interne à la Hochschule Reutlingen,
          accessible sous <code>feedmyfrog.click</code>. L’accès est réservé
          aux membres authentifiés. Les annonces sont publiées par les
          utilisateurs ; le contact se fait en dehors de la plateforme.
        </p>

        <h2 className="text-lg font-semibold">Hébergement</h2>
        <p>
          Application hébergée par Vercel Inc. (USA) ; base de données Neon
          dans l’UE (Francfort) ; e-mails de connexion via Brevo. Détails :
          {' '}
          <PrivacyLink label="Politique de confidentialité" />.
        </p>

        <p>
          <PrivacyLink label="Politique de confidentialité" />
        </p>
      </Section>
    </>
  );
}

function TextTr() {
  return (
    <>
      <Title>Künye</Title>
      <Section>
        <h2 className="text-lg font-semibold">§ 5 DDG uyarınca bilgiler</h2>
        <p>
          [İşletmecinin adı]
          <br />
          [Sokak ve no]
          <br />
          [Posta kodu ve şehir]
        </p>

        <h2 className="text-lg font-semibold">İletişim</h2>
        <p>
          E-posta: [iletişim e-postası]
          <br />
          Telefon: [telefon numarası]
        </p>

        <h2 className="text-lg font-semibold">İçerikten sorumlu kişi</h2>
        <p>[İçerikten sorumlu kişinin adı ve adresi]</p>

        <h2 className="text-lg font-semibold">Not</h2>
        <p>
          Bu hizmet Reutlingen Üniversitesi öğrencileri ve çalışanları için
          iç kullanım platformudur (<code>feedmyfrog.click</code>). Erişim
          yalnızca doğrulanmış üyelere açıktır. İlanları kullanıcılar
          kendileri ekler; iletişim platform dışında yapılır.
        </p>

        <h2 className="text-lg font-semibold">Barındırma</h2>
        <p>
          Uygulama Vercel Inc. (ABD) üzerinde barınır; veritabanı Neon
          tarafından yalnızca AB’de (Frankfurt) işletilir; giriş e-postaları
          Brevo üzerinden gönderilir. Ayrıntılar:{' '}
          <PrivacyLink label="Gizlilik Politikası" />.
        </p>

        <p>
          <PrivacyLink label="Gizlilik Politikası" />
        </p>
      </Section>
    </>
  );
}

function TextEs() {
  return (
    <>
      <Title>Aviso legal</Title>
      <Section>
        <h2 className="text-lg font-semibold">Datos según § 5 DDG</h2>
        <p>
          [Nombre del operador]
          <br />
          [Calle y número]
          <br />
          [Código postal y ciudad]
        </p>

        <h2 className="text-lg font-semibold">Contacto</h2>
        <p>
          Correo: [correo de contacto]
          <br />
          Teléfono: [número de teléfono]
        </p>

        <h2 className="text-lg font-semibold">Responsable del contenido</h2>
        <p>[Nombre y dirección de la persona responsable del contenido]</p>

        <h2 className="text-lg font-semibold">Nota</h2>
        <p>
          Este servicio es una plataforma interna de la Universidad de
          Reutlingen, disponible en <code>feedmyfrog.click</code>. El acceso
          está limitado a miembros autenticados. Los anuncios los publican
          las propias personas usuarias; el contacto se hace fuera de la
          plataforma.
        </p>

        <h2 className="text-lg font-semibold">Alojamiento</h2>
        <p>
          La aplicación está alojada en Vercel Inc. (EE. UU.); la base de
          datos la opera Neon solo en la UE (Fráncfort); los correos de
          acceso se envían con Brevo. Detalles:{' '}
          <PrivacyLink label="Política de privacidad" />.
        </p>

        <p>
          <PrivacyLink label="Política de privacidad" />
        </p>
      </Section>
    </>
  );
}
