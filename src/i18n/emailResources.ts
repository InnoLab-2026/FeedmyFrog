import type { LangCode } from './translations';

/**
 * Wording for the transactional emails, in every language the app offers.
 *
 * Plain data with `{{placeholder}}` interpolation, the same shape as every
 * other translation in the app, rather than the per-language functions that
 * built the body by concatenating string literals. Concatenation forces one
 * language's sentence order on all five and gives a translator half-sentences
 * to work from; a whole sentence with a placeholder in it does neither.
 *
 * Held to one key set across locales by src/i18n/emailResources.test.ts.
 *
 * No emoji, and no marketing voice: this is the mail that stands between
 * someone and their account, and it has to survive a plain-text client.
 */

export interface MagicLinkCopy {
  /** Inbox subject line. The sender name carries the product name already. */
  subject: string;
  /** Preview line most clients show next to the subject. */
  preheader: string;
  greeting: string;
  intro: string;
  /** Label on the button, and on the plain-text link that replaces it. */
  action: string;
  validity: string;
  fallbackIntro: string;
  ignore: string;
}

export interface EmailBundle {
  magicLink: MagicLinkCopy;
}

export const emailResources: Record<LangCode, EmailBundle> = {
  en: {
    magicLink: {
      subject: 'Your login link',
      preheader: 'This link signs you in and expires in {{minutes}} minutes.',
      greeting: 'Hello,',
      intro: 'Use the button below to sign in.',
      action: 'Sign in',
      validity:
        'The link is valid for {{minutes}} minutes and can only be used once.',
      fallbackIntro:
        'If the button does not work, copy this address into your browser:',
      ignore: 'If you did not request this email, you can safely ignore it.',
    },
  },

  de: {
    magicLink: {
      subject: 'Ihr Anmeldelink',
      preheader:
        'Mit diesem Link melden Sie sich an. Er läuft in {{minutes}} Minuten ab.',
      greeting: 'Hallo,',
      intro: 'Melden Sie sich über die folgende Schaltfläche an.',
      action: 'Jetzt anmelden',
      validity:
        'Der Link ist {{minutes}} Minuten gültig und kann nur einmal verwendet werden.',
      fallbackIntro:
        'Falls die Schaltfläche nicht funktioniert, kopieren Sie diese Adresse in Ihren Browser:',
      ignore:
        'Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.',
    },
  },

  fr: {
    magicLink: {
      subject: 'Votre lien de connexion',
      preheader:
        'Ce lien vous connecte et expire dans {{minutes}} minutes.',
      greeting: 'Bonjour,',
      intro: 'Utilisez le bouton ci-dessous pour vous connecter.',
      action: 'Se connecter',
      validity:
        'Le lien est valable {{minutes}} minutes et ne peut être utilisé qu’une seule fois.',
      fallbackIntro:
        'Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :',
      ignore:
        'Si vous n’avez pas demandé cet e-mail, vous pouvez l’ignorer.',
    },
  },

  tr: {
    magicLink: {
      subject: 'Giriş bağlantınız',
      preheader:
        'Bu bağlantı sizi oturuma alır ve {{minutes}} dakika içinde geçersiz olur.',
      greeting: 'Merhaba,',
      intro: 'Giriş yapmak için aşağıdaki düğmeyi kullanın.',
      action: 'Giriş yap',
      validity:
        'Bağlantı {{minutes}} dakika geçerlidir ve yalnızca bir kez kullanılabilir.',
      fallbackIntro:
        'Düğme çalışmazsa bu adresi tarayıcınıza kopyalayın:',
      ignore:
        'Bu e-postayı siz talep etmediyseniz göz ardı edebilirsiniz.',
    },
  },

  es: {
    magicLink: {
      subject: 'Tu enlace de acceso',
      preheader:
        'Este enlace inicia tu sesión y caduca en {{minutes}} minutos.',
      greeting: 'Hola,',
      intro: 'Usa el botón de abajo para iniciar sesión.',
      action: 'Iniciar sesión',
      validity:
        'El enlace es válido durante {{minutes}} minutos y solo se puede usar una vez.',
      fallbackIntro:
        'Si el botón no funciona, copia esta dirección en tu navegador:',
      ignore: 'Si no has solicitado este correo, puedes ignorarlo.',
    },
  },
};

/**
 * Fills `{{name}}` placeholders. Deliberately tiny and dependency-free —
 * i18next lives on the client side of this app, and the mail is rendered on
 * the server where a shared instance would be the wrong tool.
 *
 * A placeholder with no value is left untouched rather than blanked, so a
 * missing value shows up in the output instead of silently producing a
 * sentence with a hole in it.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
