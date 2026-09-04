import type { Metadata } from 'next';
import {
  Plus_Jakarta_Sans,
  DM_Sans,
} from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';

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

        {/*
          * Real-user Core Web Vitals, reported per route.
          *
          * The server spans from instrumentation.ts say what the server spent
          * its time on; this says what the reader actually experienced, which
          * is the half that server timings cannot see -- LCP on a phone on
          * campus wifi is not a number any function duration contains.
          *
          * It renders no markup: the component returns null and appends the
          * script itself, which is also why it survives the strict-dynamic
          * CSP in src/proxy.ts. A script *tag* in this HTML would need the
          * per-request nonce and this package has no prop for one; a script
          * created by the already-trusted bundle inherits its trust. The
          * beacon it sends is same-origin (/_vercel/speed-insights), so
          * connect-src 'self' already covers it.
          *
          * Off Vercel the endpoint does not exist and it is inert.
          */}
        <SpeedInsights />
      </body>
    </html>
  );
}