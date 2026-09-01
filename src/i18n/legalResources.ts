import type { LangCode } from './translations';

/**
 * Wording for /datenschutz and /impressum, in every language the app offers.
 *
 * Plain data with no framework imports on purpose: the page components render
 * it on the client through i18next, and `generateMetadata` reads the titles
 * straight out of it on the server. A module marked 'use client' could not be
 * read from the server at all.
 *
 * It is not part of translations.ts because that file is loaded by the root
 * layout and would ship this text on every route; here it stays in the two
 * legal route chunks (plus the tiny title lookup the server does).
 *
 * The five locales are held to the same key set by src/i18n/legal.test.ts.
 * They have to be: Art. 13 GDPR owes every reader the same disclosure, and
 * before this was data rather than five hand-written component trees, three
 * of them had quietly drifted.
 *
 * Inline markup (<strong>, <em>, <code>, <br />, and <privacy> for the
 * cross-link) is rendered by react-i18next's <Trans> — see INLINE_MARKUP in
 * src/components/layout/LegalText.tsx for the tags a translator may use.
 */
export const LEGAL_NS = 'legal';

interface RetentionRow {
  data: string;
  period: string;
}

interface LegalBundle {
  privacy: {
    title: string;
    controller: { heading: string; body: string };
    purpose: { heading: string; body: string };
    data: {
      heading: string;
      email: string;
      listing: string;
      ip: string;
      cookie: string;
      logs: string;
    };
    visibility: { heading: string; body: string };
    retention: {
      heading: string;
      columns: { data: string; period: string };
      rows: {
        token: RetentionRow;
        session: RetentionRow;
        ip: RetentionRow;
        listings: RetentionRow;
      };
    };
    processors: {
      heading: string;
      intro: string;
      vercel: string;
      neon: string;
      brevo: string;
      fonts: string;
    };
    rights: { heading: string; body: string };
    imprint_link: string;
  };
  imprint: {
    title: string;
    operator: { heading: string; body: string };
    contact: { heading: string; body: string };
    responsible: { heading: string; body: string };
    note: { heading: string; body: string };
    hosting: { heading: string; body: string };
    privacy_link: string;
  };
}

export const legalResources: Record<LangCode, LegalBundle> = {
  de: {
    privacy: {
      title: 'Datenschutzerklärung',
      controller: {
        heading: '1. Verantwortlicher',
        body:
          '[Name und Anschrift des Verantwortlichen im Sinne von Art. 4 Nr. 7 DSGVO — vor dem Pilotbetrieb eintragen], E-Mail: [Kontakt-E-Mail-Adresse].<br />Datenschutzbeauftragte/r: [Kontaktdaten der/des Datenschutzbeauftragten der Hochschule].',
      },
      purpose: {
        heading: '2. Zweck der Plattform',
        body:
          'Die Plattform (erreichbar unter <code>feedmyfrog.click</code>) vermittelt Angebote und Gesuche zwischen Mitgliedern der Hochschule Reutlingen. Alle Inhalte sind ausschließlich für angemeldete Hochschulmitglieder sichtbar. Die Kontaktaufnahme erfolgt außerhalb der Plattform per E-Mail.',
      },
      data: {
        heading: '3. Verarbeitete Daten und Rechtsgrundlagen',
        email:
          '<strong>Hochschul-E-Mail-Adresse</strong> — zur Anmeldung (Magic-Link) und als Kontaktangabe auf eigenen Inseraten. Es werden keine Passwörter gespeichert und es existiert kein Nutzerkonto-Datensatz; als Kennung dient der SHA-256-Hash der Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzung der Plattform).',
        listing:
          '<strong>Inseratsinhalte</strong> (Titel, Beschreibung, Tags, Ort) — von Ihnen selbst eingegeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
        ip:
          '<strong>IP-Adresse</strong> — kurzzeitig zur Begrenzung von Missbrauch des Anmeldelink-Versands (Rate-Limiting). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Betriebssicherheit).',
        cookie:
          '<strong>Sitzungs-Cookie</strong> — ein einzelnes, technisch notwendiges HttpOnly-Cookie hält Ihre Anmeldung aufrecht. Es findet kein Tracking statt; Analyse- oder Marketing-Cookies werden nicht gesetzt. Das Cookie ist nach § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei; ein Cookie-Banner ist daher nicht erforderlich.',
        logs:
          '<strong>Server-Logdaten</strong> — beim Aufruf der Plattform verarbeitet unser Hosting-Anbieter Vercel automatisch technische Zugriffsdaten (insbesondere IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene URL, User-Agent), soweit dies für die Auslieferung der Seiten und die Sicherheit des Betriebs erforderlich ist. Eine Zusammenführung mit anderen Daten oder eine Profilbildung findet nicht statt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (technischer Betrieb und Absicherung der Plattform).',
      },
      visibility: {
        heading: '4. Sichtbarkeit Ihrer E-Mail-Adresse',
        body:
          'Ihre Hochschul-E-Mail-Adresse wird auf Ihren Inseraten für andere angemeldete Hochschulmitglieder angezeigt, damit diese Sie kontaktieren können. Sie ist nicht öffentlich im Internet sichtbar.',
      },
      retention: {
        heading: '5. Speicherdauer',
        columns: { data: 'Daten', period: 'Speicherdauer' },
        rows: {
          token: {
            data: 'Anmelde-Token (nur SHA-256-Hash gespeichert)',
            period:
              '15 Minuten gültig, einmalig verwendbar; Reste werden spätestens 7 Tage nach Ablauf gelöscht',
          },
          session: {
            data: 'Sitzungs-Cookie (signiertes JWT, HttpOnly)',
            period: '7 Tage, danach automatisch ungültig; Abmelden löscht es sofort',
          },
          ip: {
            data: 'IP-Adresse (Rate-Limiting beim Linkversand)',
            period: '6 Stunden, danach automatische Löschung',
          },
          listings: {
            data: 'Inserate (Titel, Beschreibung, Tags, Ort, E-Mail-Adresse)',
            period: 'Bis zur Löschung durch die inserierende Person',
          },
        },
      },
      processors: {
        heading: '6. Auftragsverarbeiter und Empfänger',
        intro:
          'Mit allen nachfolgend genannten Dienstleistern bestehen Auftragsverarbeitungsverträge nach Art. 28 DSGVO (jeweils über die vom Anbieter bereitgestellten Vertragswerke abgeschlossen):',
        vercel:
          '<strong>Vercel Inc.</strong> (USA) — Hosting und Auslieferung der Anwendung unter <code>feedmyfrog.click</code>; verarbeitet dabei Server-Logdaten (siehe Abschnitt 3). Drittlandtransfer auf Grundlage der Zertifizierung nach dem EU-US Data Privacy Framework sowie EU-Standardvertragsklauseln. Details: vercel.com/legal/privacy-notice.',
        neon:
          '<strong>Neon, Inc.</strong> (USA, ein Unternehmen von Databricks) — Betrieb der PostgreSQL-Datenbank. Die Datenbank liegt ausschließlich in der EU (Frankfurt, AWS eu-central-1) und das Projekt ist an diese Region gebunden. Für den US-Unternehmenssitz gelten EU-Standardvertragsklauseln als Transfergarantie.',
        brevo:
          '<strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017 Paris, Frankreich, mit deutscher Niederlassung Brevo GmbH, Köpenicker Str. 126, 10179 Berlin) — Versand der Anmelde-E-Mails (Absender <code>noreply@feedmyfrog.click</code>). EU-Anbieter; Verarbeitung der Empfängeradresse zum Zweck des Linkversands.',
        fonts:
          'Schriftarten werden beim Build heruntergeladen und von der eigenen Domain ausgeliefert (Self-Hosting via <code>next/font</code>); beim Seitenaufruf wird keine Verbindung zu Google aufgebaut.',
      },
      rights: {
        heading: '7. Ihre Rechte',
        body:
          'Sie haben nach Art. 15–21 DSGVO das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eigene Inserate können Sie jederzeit selbst unter <em>Meine Einträge</em> bearbeiten oder löschen; da kein weiteres Nutzerkonto existiert, sind damit alle zu Ihrer Person gespeicherten Inhalte entfernt. Für alle Anliegen wenden Sie sich an [Kontakt-E-Mail-Adresse]. Sie haben außerdem das Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO), z. B. beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg.',
      },
      imprint_link: 'Impressum',
    },
    imprint: {
      title: 'Impressum',
      operator: {
        heading: 'Angaben gemäß § 5 DDG',
        body:
          '[Name des Betreibers / der verantwortlichen Organisationseinheit]<br />[Straße und Hausnummer]<br />[PLZ und Ort]',
      },
      contact: {
        heading: 'Kontakt',
        body: 'E-Mail: [Kontakt-E-Mail-Adresse]<br />Telefon: [Telefonnummer]',
      },
      responsible: {
        heading: 'Verantwortlich für den Inhalt',
        body: '[Name und Anschrift der inhaltlich verantwortlichen Person]',
      },
      note: {
        heading: 'Hinweis',
        body:
          'Dieses Angebot ist eine hochschulinterne Vermittlungsplattform für Studierende und Beschäftigte der Hochschule Reutlingen, erreichbar unter <code>feedmyfrog.click</code>. Der Zugang ist auf authentifizierte Mitglieder der Hochschule beschränkt. Inserate werden von den Nutzerinnen und Nutzern selbst eingestellt; die Kontaktaufnahme und Abwicklung erfolgt außerhalb der Plattform.',
      },
      hosting: {
        heading: 'Hosting',
        body:
          'Die Anwendung wird bei Vercel Inc. (USA) gehostet; die Datenbank wird von Neon, Inc. ausschließlich in der EU (Frankfurt) betrieben; Anmelde-E-Mails werden über Brevo (Sendinblue SAS, Frankreich) versandt. Einzelheiten zur Datenverarbeitung enthält die <privacy>Datenschutzerklärung</privacy>.',
      },
      privacy_link: 'Datenschutzerklärung',
    },
  },

  en: {
    privacy: {
      title: 'Privacy Policy',
      controller: {
        heading: '1. Controller',
        body:
          '[Name and address of the controller under Art. 4(7) GDPR — to be added before pilot operation], email: [contact email].<br />Data protection officer: [contact details of the university DPO].',
      },
      purpose: {
        heading: '2. Purpose of the platform',
        body:
          'The platform (available at <code>feedmyfrog.click</code>) connects offers and requests among members of Reutlingen University. All content is visible only to signed-in university members. Contact takes place outside the platform by email.',
      },
      data: {
        heading: '3. Processed data and legal bases',
        email:
          '<strong>University email address</strong> — for login (magic link) and as contact details on your own listings. No passwords are stored and there is no user-account record; the identifier is the SHA-256 hash of the address. Legal basis: Art. 6(1)(b) GDPR (use of the platform).',
        listing:
          '<strong>Listing content</strong> (title, description, tags, location) — entered by you. Legal basis: Art. 6(1)(b) GDPR.',
        ip:
          '<strong>IP address</strong> — briefly, to limit abuse of login link sending (rate limiting). Legal basis: Art. 6(1)(f) GDPR (operational security).',
        cookie:
          '<strong>Session cookie</strong> — a single technically necessary HttpOnly cookie keeps you signed in. There is no tracking; no analytics or marketing cookies are set. The cookie is exempt from consent under § 25(2) no. 2 TDDDG; a cookie banner is therefore not required.',
        logs:
          '<strong>Server logs</strong> — when you visit the platform, our hosting provider Vercel automatically processes technical access data (in particular IP address, time of access, requested URL, user agent) as far as needed to deliver pages and keep the service secure. Data is not combined with other data and no profiling takes place. Legal basis: Art. 6(1)(f) GDPR (technical operation and security of the platform).',
      },
      visibility: {
        heading: '4. Visibility of your email address',
        body:
          'Your university email address is shown on your listings to other signed-in university members so they can contact you. It is not publicly visible on the internet.',
      },
      retention: {
        heading: '5. Retention',
        columns: { data: 'Data', period: 'Retention period' },
        rows: {
          token: {
            data: 'Login token (only SHA-256 hash stored)',
            period:
              'Valid for 15 minutes, single-use; leftovers deleted at latest 7 days after expiry',
          },
          session: {
            data: 'Session cookie (signed JWT, HttpOnly)',
            period: '7 days, then invalid; logging out deletes it immediately',
          },
          ip: {
            data: 'IP address (rate limiting for link sending)',
            period: '6 hours, then automatic deletion',
          },
          listings: {
            data: 'Listings (title, description, tags, location, email address)',
            period: 'Until deleted by the person who created the listing',
          },
        },
      },
      processors: {
        heading: '6. Processors and recipients',
        intro:
          'Data processing agreements under Art. 28 GDPR are in place with all of the providers named below (each concluded through the contract documents the provider supplies):',
        vercel:
          '<strong>Vercel Inc.</strong> (USA) — hosting and delivery of the app at <code>feedmyfrog.click</code>; processes server logs in doing so (see section 3). Third-country transfer based on certification under the EU-US Data Privacy Framework and on EU standard contractual clauses. Details: vercel.com/legal/privacy-notice.',
        neon:
          '<strong>Neon, Inc.</strong> (USA, a Databricks company) — operation of the PostgreSQL database. The database is located exclusively in the EU (Frankfurt, AWS eu-central-1) and the project is pinned to that region. EU standard contractual clauses serve as the transfer guarantee for the US company seat.',
        brevo:
          '<strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017 Paris, France, with the German branch Brevo GmbH, Köpenicker Str. 126, 10179 Berlin) — sending the login emails (sender <code>noreply@feedmyfrog.click</code>). EU provider; processes the recipient address for the purpose of sending the link.',
        fonts:
          'Fonts are downloaded at build time and served from this domain (self-hosting via <code>next/font</code>); no connection to Google is made when the page is opened.',
      },
      rights: {
        heading: '7. Your rights',
        body:
          'Under Art. 15–21 GDPR you have the right of access, rectification, erasure, restriction of processing, data portability and objection. You can edit or delete your own listings at any time under <em>My listings</em>; there is no further user account, so this removes all content stored about you. For all requests contact [contact email]. You may also lodge a complaint with a supervisory authority (Art. 77 GDPR), e.g. the State Commissioner for Data Protection and Freedom of Information of Baden-Württemberg.',
      },
      imprint_link: 'Imprint',
    },
    imprint: {
      title: 'Imprint',
      operator: {
        heading: 'Information according to § 5 DDG',
        body:
          '[Name of the operator / responsible organisational unit]<br />[Street and number]<br />[Postcode and city]',
      },
      contact: {
        heading: 'Contact',
        body: 'Email: [contact email]<br />Phone: [phone number]',
      },
      responsible: {
        heading: 'Responsible for the content',
        body: '[Name and address of the person responsible for the content]',
      },
      note: {
        heading: 'Note',
        body:
          'This service is an internal university exchange platform for students and staff of Reutlingen University, available at <code>feedmyfrog.click</code>. Access is limited to authenticated university members. Listings are posted by users themselves; contact and arrangements take place outside the platform.',
      },
      hosting: {
        heading: 'Hosting',
        body:
          'The app is hosted by Vercel Inc. (USA); the database is operated by Neon, Inc. exclusively in the EU (Frankfurt); login emails are sent via Brevo (Sendinblue SAS, France). Details on data processing are in the <privacy>Privacy Policy</privacy>.',
      },
      privacy_link: 'Privacy Policy',
    },
  },

  fr: {
    privacy: {
      title: 'Politique de confidentialité',
      controller: {
        heading: '1. Responsable du traitement',
        body:
          '[Nom et adresse du responsable au sens de l’art. 4, point 7, du RGPD — à compléter avant la mise en service pilote], e-mail : [adresse de contact].<br />Délégué(e) à la protection des données : [coordonnées du DPO de l’université].',
      },
      purpose: {
        heading: '2. Objet de la plateforme',
        body:
          'La plateforme (accessible à l’adresse <code>feedmyfrog.click</code>) met en relation les offres et les demandes des membres de la Hochschule Reutlingen. Tous les contenus ne sont visibles que par les membres connectés. La prise de contact se fait par e-mail, en dehors de la plateforme.',
      },
      data: {
        heading: '3. Données traitées et bases juridiques',
        email:
          '<strong>Adresse e-mail universitaire</strong> — pour la connexion (lien magique) et comme coordonnée de contact sur vos propres annonces. Aucun mot de passe n’est stocké et aucun enregistrement de compte utilisateur n’existe ; l’identifiant est le hachage SHA-256 de l’adresse. Base juridique : art. 6, § 1, b) RGPD (utilisation de la plateforme).',
        listing:
          '<strong>Contenu des annonces</strong> (titre, description, tags, lieu) — saisi par vous-même. Base juridique : art. 6, § 1, b) RGPD.',
        ip:
          '<strong>Adresse IP</strong> — brièvement, afin de limiter les abus lors de l’envoi des liens de connexion (limitation du débit). Base juridique : art. 6, § 1, f) RGPD (sécurité d’exploitation).',
        cookie:
          '<strong>Cookie de session</strong> — un unique cookie HttpOnly techniquement nécessaire maintient votre connexion. Aucun suivi n’est effectué ; aucun cookie d’analyse ou de marketing n’est déposé. Ce cookie est dispensé de consentement au titre du § 25, al. 2, n° 2 TDDDG ; aucune bannière de cookies n’est donc requise.',
        logs:
          '<strong>Journaux serveur</strong> — lors de la consultation de la plateforme, notre hébergeur Vercel traite automatiquement des données d’accès techniques (notamment adresse IP, date et heure de l’accès, URL appelée, agent utilisateur), dans la mesure nécessaire à la diffusion des pages et à la sécurité de l’exploitation. Aucun recoupement avec d’autres données ni profilage n’a lieu. Base juridique : art. 6, § 1, f) RGPD (exploitation technique et sécurisation de la plateforme).',
      },
      visibility: {
        heading: '4. Visibilité de votre adresse e-mail',
        body:
          'Votre adresse e-mail universitaire est affichée sur vos annonces à l’attention des autres membres connectés, afin qu’ils puissent vous contacter. Elle n’est pas visible publiquement sur Internet.',
      },
      retention: {
        heading: '5. Durée de conservation',
        columns: { data: 'Données', period: 'Durée de conservation' },
        rows: {
          token: {
            data: 'Jeton de connexion (seul le hash SHA-256 est stocké)',
            period:
              'Valable 15 minutes, usage unique ; suppression au plus tard 7 jours après expiration',
          },
          session: {
            data: 'Cookie de session (JWT signé, HttpOnly)',
            period: '7 jours, puis invalidé ; la déconnexion le supprime immédiatement',
          },
          ip: {
            data: 'Adresse IP (limitation du nombre d’envois de liens)',
            period: '6 heures, puis suppression automatique',
          },
          listings: {
            data: 'Annonces (titre, description, tags, lieu, e-mail)',
            period: 'Jusqu’à suppression par la personne qui a créé l’annonce',
          },
        },
      },
      processors: {
        heading: '6. Sous-traitants et destinataires',
        intro:
          'Des contrats de sous-traitance au sens de l’art. 28 RGPD ont été conclus avec l’ensemble des prestataires nommés ci-dessous (chaque fois au moyen des documents contractuels fournis par le prestataire) :',
        vercel:
          '<strong>Vercel Inc.</strong> (États-Unis) — hébergement et diffusion de l’application sous <code>feedmyfrog.click</code> ; traite à cette occasion les journaux serveur (voir section 3). Transfert vers un pays tiers fondé sur la certification au titre du EU-US Data Privacy Framework ainsi que sur les clauses contractuelles types de l’UE. Détails : vercel.com/legal/privacy-notice.',
        neon:
          '<strong>Neon, Inc.</strong> (États-Unis, société du groupe Databricks) — exploitation de la base de données PostgreSQL. La base est située exclusivement dans l’UE (Francfort, AWS eu-central-1) et le projet est rattaché à cette région. Les clauses contractuelles types de l’UE servent de garantie de transfert pour le siège social américain.',
        brevo:
          '<strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017 Paris, France, avec l’établissement allemand Brevo GmbH, Köpenicker Str. 126, 10179 Berlin) — envoi des e-mails de connexion (expéditeur <code>noreply@feedmyfrog.click</code>). Prestataire de l’UE ; traite l’adresse du destinataire aux fins de l’envoi du lien.',
        fonts:
          'Les polices de caractères sont téléchargées lors de la compilation et servies depuis notre propre domaine (auto-hébergement via <code>next/font</code>) ; aucune connexion à Google n’est établie lors de l’ouverture de la page.',
      },
      rights: {
        heading: '7. Vos droits',
        body:
          'Vous disposez, au titre des art. 15 à 21 du RGPD, d’un droit d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité et d’opposition. Vous pouvez à tout moment modifier ou supprimer vous-même vos annonces sous <em>Mes annonces</em> ; aucun autre compte utilisateur n’existant, tous les contenus enregistrés à votre sujet sont alors supprimés. Pour toute demande, adressez-vous à [adresse de contact]. Vous avez en outre le droit d’introduire une réclamation auprès d’une autorité de contrôle (art. 77 RGPD), par exemple auprès du délégué régional à la protection des données et à la liberté d’information du Bade-Wurtemberg.',
      },
      imprint_link: 'Mentions légales',
    },
    imprint: {
      title: 'Mentions légales',
      operator: {
        heading: 'Informations selon le § 5 DDG',
        body:
          '[Nom de l’exploitant / de l’unité organisationnelle responsable]<br />[Rue et numéro]<br />[Code postal et ville]',
      },
      contact: {
        heading: 'Contact',
        body: 'E-mail : [adresse de contact]<br />Téléphone : [numéro de téléphone]',
      },
      responsible: {
        heading: 'Responsable du contenu',
        body: '[Nom et adresse de la personne responsable du contenu]',
      },
      note: {
        heading: 'Remarque',
        body:
          'Cette offre est une plateforme d’échange interne à la Hochschule Reutlingen, destinée aux étudiants et au personnel, accessible sous <code>feedmyfrog.click</code>. L’accès est réservé aux membres authentifiés de l’établissement. Les annonces sont publiées par les utilisateurs eux-mêmes ; la prise de contact et les arrangements se font en dehors de la plateforme.',
      },
      hosting: {
        heading: 'Hébergement',
        body:
          'L’application est hébergée par Vercel Inc. (États-Unis) ; la base de données est exploitée par Neon, Inc. exclusivement dans l’UE (Francfort) ; les e-mails de connexion sont envoyés via Brevo (Sendinblue SAS, France). Les détails du traitement des données figurent dans la <privacy>politique de confidentialité</privacy>.',
      },
      privacy_link: 'Politique de confidentialité',
    },
  },

  tr: {
    privacy: {
      title: 'Gizlilik Politikası',
      controller: {
        heading: '1. Veri sorumlusu',
        body:
          '[GDPR md. 4/7 kapsamındaki veri sorumlusunun adı ve adresi — pilot işletimden önce doldurulacak], e-posta: [iletişim e-postası].<br />Veri koruma görevlisi: [üniversitenin veri koruma görevlisinin iletişim bilgileri].',
      },
      purpose: {
        heading: '2. Platformun amacı',
        body:
          'Platform (<code>feedmyfrog.click</code> adresinden erişilebilir) Reutlingen Üniversitesi üyeleri arasındaki teklif ve talepleri bir araya getirir. Tüm içerikler yalnızca giriş yapmış üniversite üyelerine görünür. İletişim, platform dışında e-posta yoluyla kurulur.',
      },
      data: {
        heading: '3. İşlenen veriler ve hukuki dayanaklar',
        email:
          '<strong>Üniversite e-posta adresi</strong> — giriş (sihirli bağlantı) ve kendi ilanlarınızdaki iletişim bilgisi için. Parola saklanmaz ve bir kullanıcı hesabı kaydı bulunmaz; tanımlayıcı olarak adresin SHA-256 özeti kullanılır. Hukuki dayanak: GDPR md. 6/1/b (platformun kullanımı).',
        listing:
          '<strong>İlan içeriği</strong> (başlık, açıklama, etiketler, konum) — sizin girdiğiniz veriler. Hukuki dayanak: GDPR md. 6/1/b.',
        ip:
          '<strong>IP adresi</strong> — giriş bağlantısı gönderiminin kötüye kullanılmasını sınırlamak amacıyla kısa süreli (hız sınırlama). Hukuki dayanak: GDPR md. 6/1/f (işletme güvenliği).',
        cookie:
          '<strong>Oturum çerezi</strong> — oturumunuzu açık tutan, teknik olarak zorunlu tek bir HttpOnly çerezi. İzleme yapılmaz; analiz veya pazarlama çerezi yerleştirilmez. Çerez, TDDDG § 25/2 no. 2 uyarınca onaydan muaftır; bu nedenle çerez bandına gerek yoktur.',
        logs:
          '<strong>Sunucu günlükleri</strong> — platform açıldığında barındırma sağlayıcımız Vercel, sayfaların sunulması ve işletme güvenliği için gerekli olduğu ölçüde teknik erişim verilerini (özellikle IP adresi, erişim zamanı, çağrılan URL, kullanıcı aracısı) otomatik olarak işler. Başka verilerle birleştirme veya profil oluşturma yapılmaz. Hukuki dayanak: GDPR md. 6/1/f (platformun teknik işletimi ve güvenliği).',
      },
      visibility: {
        heading: '4. E-posta adresinizin görünürlüğü',
        body:
          'Üniversite e-posta adresiniz, sizinle iletişime geçebilmeleri için ilanlarınızda diğer giriş yapmış üniversite üyelerine gösterilir. İnternette herkese açık şekilde görünmez.',
      },
      retention: {
        heading: '5. Saklama süresi',
        columns: { data: 'Veri', period: 'Saklama süresi' },
        rows: {
          token: {
            data: 'Giriş jetonu (yalnızca SHA-256 özeti saklanır)',
            period:
              '15 dakika geçerli, tek kullanımlık; en geç sürenin bitiminden 7 gün sonra silinir',
          },
          session: {
            data: 'Oturum çerezi (imzalı JWT, HttpOnly)',
            period: '7 gün, sonra geçersiz; çıkış yapınca hemen silinir',
          },
          ip: {
            data: 'IP adresi (bağlantı gönderimi için hız sınırı)',
            period: '6 saat, sonra otomatik silme',
          },
          listings: {
            data: 'İlanlar (başlık, açıklama, etiketler, konum, e-posta)',
            period: 'İlanı oluşturan kişi silene kadar',
          },
        },
      },
      processors: {
        heading: '6. Veri işleyenler ve alıcılar',
        intro:
          'Aşağıda adı geçen tüm hizmet sağlayıcılarla GDPR md. 28 uyarınca veri işleme sözleşmeleri bulunmaktadır (her biri sağlayıcının sunduğu sözleşme metinleri üzerinden akdedilmiştir):',
        vercel:
          '<strong>Vercel Inc.</strong> (ABD) — uygulamanın <code>feedmyfrog.click</code> altında barındırılması ve sunulması; bu sırada sunucu günlüklerini işler (bkz. bölüm 3). Üçüncü ülkeye aktarım, EU-US Data Privacy Framework sertifikasyonuna ve AB standart sözleşme maddelerine dayanır. Ayrıntılar: vercel.com/legal/privacy-notice.',
        neon:
          '<strong>Neon, Inc.</strong> (ABD, bir Databricks şirketi) — PostgreSQL veritabanının işletilmesi. Veritabanı yalnızca AB’de (Frankfurt, AWS eu-central-1) bulunur ve proje bu bölgeye sabitlenmiştir. ABD merkezli şirket için AB standart sözleşme maddeleri aktarım güvencesi olarak geçerlidir.',
        brevo:
          '<strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017 Paris, Fransa; Almanya şubesi Brevo GmbH, Köpenicker Str. 126, 10179 Berlin) — giriş e-postalarının gönderimi (gönderen <code>noreply@feedmyfrog.click</code>). AB sağlayıcısı; alıcı adresini bağlantının gönderilmesi amacıyla işler.',
        fonts:
          'Yazı tipleri derleme sırasında indirilir ve kendi alan adımızdan sunulur (<code>next/font</code> ile kendi sunucumuzda barındırma); sayfa açılırken Google ile bağlantı kurulmaz.',
      },
      rights: {
        heading: '7. Haklarınız',
        body:
          'GDPR md. 15–21 uyarınca erişim, düzeltme, silme, işlemenin kısıtlanması, veri taşınabilirliği ve itiraz haklarına sahipsiniz. Kendi ilanlarınızı istediğiniz zaman <em>İlanlarım</em> bölümünden düzenleyebilir veya silebilirsiniz; başka bir kullanıcı hesabı bulunmadığından bu işlemle hakkınızda saklanan tüm içerik kaldırılmış olur. Tüm talepleriniz için [iletişim e-postası] adresine yazabilirsiniz. Ayrıca bir denetim makamına şikâyette bulunma hakkınız vardır (GDPR md. 77), örneğin Baden-Württemberg Eyalet Veri Koruma ve Bilgi Edinme Özgürlüğü Görevlisi’ne.',
      },
      imprint_link: 'Künye',
    },
    imprint: {
      title: 'Künye',
      operator: {
        heading: '§ 5 DDG uyarınca bilgiler',
        body:
          '[İşletmecinin / sorumlu organizasyon biriminin adı]<br />[Sokak ve numara]<br />[Posta kodu ve şehir]',
      },
      contact: {
        heading: 'İletişim',
        body: 'E-posta: [iletişim e-postası]<br />Telefon: [telefon numarası]',
      },
      responsible: {
        heading: 'İçerikten sorumlu kişi',
        body: '[İçerikten sorumlu kişinin adı ve adresi]',
      },
      note: {
        heading: 'Not',
        body:
          'Bu hizmet, Reutlingen Üniversitesi öğrencileri ve çalışanları için üniversite içi bir aracılık platformudur ve <code>feedmyfrog.click</code> adresinden erişilebilir. Erişim yalnızca kimliği doğrulanmış üniversite üyeleriyle sınırlıdır. İlanları kullanıcılar kendileri ekler; iletişim ve anlaşma platform dışında gerçekleşir.',
      },
      hosting: {
        heading: 'Barındırma',
        body:
          'Uygulama Vercel Inc. (ABD) tarafından barındırılır; veritabanı Neon, Inc. tarafından yalnızca AB’de (Frankfurt) işletilir; giriş e-postaları Brevo (Sendinblue SAS, Fransa) üzerinden gönderilir. Veri işlemeye ilişkin ayrıntılar <privacy>gizlilik politikasında</privacy> yer alır.',
      },
      privacy_link: 'Gizlilik Politikası',
    },
  },

  es: {
    privacy: {
      title: 'Política de privacidad',
      controller: {
        heading: '1. Responsable del tratamiento',
        body:
          '[Nombre y dirección del responsable según el art. 4.7 del RGPD — completar antes de la fase piloto], correo: [correo de contacto].<br />Delegado de protección de datos: [datos de contacto del DPO de la universidad].',
      },
      purpose: {
        heading: '2. Finalidad de la plataforma',
        body:
          'La plataforma (disponible en <code>feedmyfrog.click</code>) conecta ofertas y solicitudes entre miembros de la Universidad de Reutlingen. Todo el contenido es visible únicamente para los miembros con sesión iniciada. El contacto se realiza por correo electrónico fuera de la plataforma.',
      },
      data: {
        heading: '3. Datos tratados y bases jurídicas',
        email:
          '<strong>Correo electrónico universitario</strong> — para el inicio de sesión (enlace mágico) y como dato de contacto en tus propios anuncios. No se almacenan contraseñas ni existe un registro de cuenta de usuario; el identificador es el hash SHA-256 de la dirección. Base jurídica: art. 6.1.b RGPD (uso de la plataforma).',
        listing:
          '<strong>Contenido de los anuncios</strong> (título, descripción, etiquetas, lugar) — introducido por ti. Base jurídica: art. 6.1.b RGPD.',
        ip:
          '<strong>Dirección IP</strong> — de forma breve, para limitar el abuso en el envío de enlaces de acceso (limitación de frecuencia). Base jurídica: art. 6.1.f RGPD (seguridad operativa).',
        cookie:
          '<strong>Cookie de sesión</strong> — una única cookie HttpOnly técnicamente necesaria mantiene tu sesión iniciada. No se realiza seguimiento; no se instalan cookies de análisis ni de marketing. La cookie está exenta de consentimiento conforme al § 25.2 n.º 2 TDDDG; por tanto no se requiere un aviso de cookies.',
        logs:
          '<strong>Registros del servidor</strong> — al acceder a la plataforma, nuestro proveedor de alojamiento Vercel trata automáticamente datos técnicos de acceso (en particular dirección IP, momento del acceso, URL solicitada y agente de usuario), en la medida necesaria para servir las páginas y garantizar la seguridad del servicio. No se combinan con otros datos ni se elaboran perfiles. Base jurídica: art. 6.1.f RGPD (funcionamiento técnico y protección de la plataforma).',
      },
      visibility: {
        heading: '4. Visibilidad de tu correo electrónico',
        body:
          'Tu correo universitario se muestra en tus anuncios a otros miembros con sesión iniciada para que puedan ponerse en contacto contigo. No es visible públicamente en internet.',
      },
      retention: {
        heading: '5. Plazo de conservación',
        columns: { data: 'Datos', period: 'Plazo de conservación' },
        rows: {
          token: {
            data: 'Token de acceso (solo se guarda el hash SHA-256)',
            period:
              'Válido 15 minutos, un solo uso; se elimina como máximo 7 días después de caducar',
          },
          session: {
            data: 'Cookie de sesión (JWT firmado, HttpOnly)',
            period: '7 días, luego deja de ser válida; al cerrar sesión se elimina de inmediato',
          },
          ip: {
            data: 'Dirección IP (límite de envío de enlaces)',
            period: '6 horas, luego se elimina automáticamente',
          },
          listings: {
            data: 'Anuncios (título, descripción, etiquetas, lugar, correo)',
            period: 'Hasta que la persona que lo creó lo elimine',
          },
        },
      },
      processors: {
        heading: '6. Encargados del tratamiento y destinatarios',
        intro:
          'Con todos los proveedores indicados a continuación existen contratos de encargo del tratamiento conforme al art. 28 RGPD (celebrados mediante la documentación contractual facilitada por cada proveedor):',
        vercel:
          '<strong>Vercel Inc.</strong> (EE. UU.) — alojamiento y entrega de la aplicación en <code>feedmyfrog.click</code>; trata para ello los registros del servidor (véase la sección 3). La transferencia a un tercer país se basa en la certificación del EU-US Data Privacy Framework y en las cláusulas contractuales tipo de la UE. Detalles: vercel.com/legal/privacy-notice.',
        neon:
          '<strong>Neon, Inc.</strong> (EE. UU., empresa de Databricks) — explotación de la base de datos PostgreSQL. La base de datos se encuentra exclusivamente en la UE (Fráncfort, AWS eu-central-1) y el proyecto está fijado a esa región. Para la sede estadounidense se aplican las cláusulas contractuales tipo de la UE como garantía de transferencia.',
        brevo:
          '<strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017 París, Francia, con la sucursal alemana Brevo GmbH, Köpenicker Str. 126, 10179 Berlín) — envío de los correos de acceso (remitente <code>noreply@feedmyfrog.click</code>). Proveedor de la UE; trata la dirección del destinatario con el fin de enviar el enlace.',
        fonts:
          'Las fuentes se descargan durante la compilación y se sirven desde nuestro propio dominio (autoalojamiento mediante <code>next/font</code>); al abrir la página no se establece ninguna conexión con Google.',
      },
      rights: {
        heading: '7. Tus derechos',
        body:
          'Conforme a los art. 15 a 21 del RGPD tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición. Puedes editar o eliminar tus propios anuncios en cualquier momento en <em>Mis anuncios</em>; al no existir ninguna otra cuenta de usuario, con ello se elimina todo el contenido almacenado sobre ti. Para cualquier solicitud escribe a [correo de contacto]. Además, tienes derecho a presentar una reclamación ante una autoridad de control (art. 77 RGPD), por ejemplo ante el Comisionado Estatal para la Protección de Datos y la Libertad de Información de Baden-Wurtemberg.',
      },
      imprint_link: 'Aviso legal',
    },
    imprint: {
      title: 'Aviso legal',
      operator: {
        heading: 'Datos según el § 5 DDG',
        body:
          '[Nombre del operador / de la unidad organizativa responsable]<br />[Calle y número]<br />[Código postal y ciudad]',
      },
      contact: {
        heading: 'Contacto',
        body: 'Correo: [correo de contacto]<br />Teléfono: [número de teléfono]',
      },
      responsible: {
        heading: 'Responsable del contenido',
        body: '[Nombre y dirección de la persona responsable del contenido]',
      },
      note: {
        heading: 'Nota',
        body:
          'Este servicio es una plataforma interna de intermediación de la Universidad de Reutlingen para estudiantes y personal, disponible en <code>feedmyfrog.click</code>. El acceso está limitado a miembros autenticados de la universidad. Los anuncios los publican las propias personas usuarias; el contacto y la gestión se realizan fuera de la plataforma.',
      },
      hosting: {
        heading: 'Alojamiento',
        body:
          'La aplicación está alojada en Vercel Inc. (EE. UU.); la base de datos la opera Neon, Inc. exclusivamente en la UE (Fráncfort); los correos de acceso se envían mediante Brevo (Sendinblue SAS, Francia). Los detalles sobre el tratamiento de datos figuran en la <privacy>política de privacidad</privacy>.',
      },
      privacy_link: 'Política de privacidad',
    },
  },
};
