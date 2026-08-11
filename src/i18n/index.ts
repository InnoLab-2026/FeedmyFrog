'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './translations';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false,
    },
  });
}

/*
 * Wichtig für Next.js / Hot Reload:
 * Neue oder geänderte Übersetzungen werden auch dann
 * in die bereits laufende i18n-Instanz übernommen,
 * wenn i18n schon initialisiert wurde.
 */
Object.entries(resources).forEach(
  ([language, resource]) => {
    i18n.addResourceBundle(
      language,
      'translation',
      resource.translation,
      true,
      true,
    );
  },
);

export default i18n;