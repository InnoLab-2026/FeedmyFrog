'use client';

import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources, type LangCode } from './translations';
import { DEFAULT_LANGUAGE } from './matchLanguage';

function build(language: LangCode): I18n {
  const instance = createInstance();

  // Synchronous: every translation is bundled, so there is no backend to
  // wait on and `t` works on the very first render.
  instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      // React escapes for us; escaping here would double-encode.
      escapeValue: false,
    },
  });

  return instance;
}

let clientInstance: I18n | null = null;

/**
 * The i18next instance for a render.
 *
 * On the server this returns a **new instance every time**. The module is
 * shared by every concurrent request, so a single mutable instance whose
 * language is set per request would let one reader's language leak into
 * another reader's HTML — a render that yields at an await can resume after
 * someone else has changed the language out from under it.
 *
 * On the client there is only ever one reader, so the instance is created
 * once — with the language the server already resolved, which is what keeps
 * hydration from having to correct itself.
 */
export function getI18nInstance(language: LangCode = DEFAULT_LANGUAGE): I18n {
  if (typeof window === 'undefined') return build(language);

  if (!clientInstance) clientInstance = build(language);
  return clientInstance;
}
