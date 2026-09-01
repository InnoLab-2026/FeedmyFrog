'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { getI18nInstance } from './index';
import type { LangCode } from './translations';
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, normalizeLanguage } from './matchLanguage';

/**
 * `language` is resolved on the server (see ./server.ts) and handed down, so
 * the very first render — on the server and again during hydration — is
 * already in the reader's language. There is no post-hydration detection
 * step and therefore no flash of English, and `<html lang>` is correct
 * before any JavaScript runs.
 */
export default function I18nProvider({
  language,
  children,
}: {
  language: LangCode;
  children: ReactNode;
}) {
  const i18n = useMemo(() => getI18nInstance(language), [language]);

  useEffect(() => {
    /*
     * One-time migration for anyone who chose a language before it was kept
     * in a cookie. Without this their stored preference would be silently
     * dropped the next time they visited, because the server cannot see
     * localStorage.
     */
    try {
      const hasCookie = document.cookie
        .split('; ')
        .some((entry) => entry.startsWith(`${LANG_COOKIE}=`));

      if (!hasCookie) {
        const stored = normalizeLanguage(window.localStorage.getItem('i18nextLng'));
        if (stored) {
          document.cookie = `${LANG_COOKIE}=${stored}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`;
          if (stored !== i18n.language) i18n.changeLanguage(stored);
        }
      }
    } catch {
      // Storage can be unavailable (private browsing, blocked cookies); the
      // server-resolved language still applies.
    }
  }, [i18n]);

  useEffect(() => {
    const onChange = (lng: string) => {
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
