import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  DM_Sans,
} from 'next/font/google';

import I18nProvider from '@/i18n/Provider';
import { getRequestLanguage, serverT } from '@/i18n/server';
import { APP_NAME } from '@/constants';

import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

// The description is the one piece of the root metadata that is prose rather
// than a product name, so it is the one piece that has to be translated.
export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return {
    title: APP_NAME,
    description: serverT(language, 'app_description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved from the `lang` cookie or Accept-Language before anything
  // renders, so the markup is in the reader's language from the first byte
  // instead of being corrected after hydration.
  const language = await getRequestLanguage();

  return (
    <html
      lang={language}
      className={`${jakarta.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          background: '#f5f5f5',
        }}
      >
        <I18nProvider language={language}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}