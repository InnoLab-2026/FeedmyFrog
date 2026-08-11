'use client';

import LanguageDetector from 'i18next-browser-languagedetector';
import { LANGUAGES, type LangCode } from './translations';

const SUPPORTED = new Set<string>(LANGUAGES.map((l) => l.code));

/*
 * Kept out of i18n/index.ts's module-level init so the server-rendered HTML
 * and the client's first hydration pass both start on the same language —
 * this only runs client-side, after mount, so a detected switch is a normal
 * post-hydration re-render instead of a hydration mismatch.
 */
export function detectBrowserLanguage(): LangCode | null {
  const detector = new LanguageDetector();

  detector.init(
    {},
    {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  );

  const detected = detector.detect();
  const candidates = Array.isArray(detected) ? detected : [detected];

  for (const raw of candidates) {
    if (!raw) continue;
    const code = raw.slice(0, 2).toLowerCase();
    if (SUPPORTED.has(code)) return code as LangCode;
  }

  return null;
}
