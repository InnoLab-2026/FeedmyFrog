'use client';
import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './index';
import { detectBrowserLanguage } from './detectLanguage';

export default function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const detected = detectBrowserLanguage();
    if (detected && detected !== i18n.language) {
      i18n.changeLanguage(detected);
    }

    document.documentElement.lang = i18n.language;
    const onChange = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
