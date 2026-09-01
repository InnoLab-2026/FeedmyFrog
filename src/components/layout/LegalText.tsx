'use client';

import type { ReactElement, ReactNode } from 'react';
import Link from 'next/link';
import { Trans } from 'react-i18next';

import { LEGAL_NS } from '@/i18n/legal';

/*
 * Shared building blocks for /datenschutz and /impressum. Both pages used to
 * carry their own copies of these, five times over — once per language — so
 * a styling change had to be made in ten places and could be forgotten in
 * nine of them.
 */

const LINK_STYLE = {
  color: 'black',
  fontWeight: 700,
  textDecoration: 'underline',
} as const;

/**
 * Inline markup a translator may use inside any legal string. Tag names are
 * part of the translation contract: keep them short and semantic, because
 * translators see them in the string and have to move them to wherever their
 * language puts the emphasis.
 */
const INLINE_MARKUP: Record<string, ReactElement> = {
  strong: <strong />,
  em: <em />,
  code: <code />,
  br: <br />,
  privacy: <Link href="/datenschutz" className="hover:underline" style={LINK_STYLE} />,
};

export function LegalTitle({ children }: { children: ReactNode }) {
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

export function LegalSection({ children }: { children: ReactNode }) {
  return (
    <section
      className="mt-6 space-y-4 leading-relaxed"
      style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}
    >
      {children}
    </section>
  );
}

export function LegalHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

/**
 * One translated string with its inline markup resolved. Rendered through
 * <Trans> rather than assembled from `pre`/`post` fragments so word order
 * around emphasis and links stays the translator's decision.
 */
export function LegalRichText({ i18nKey }: { i18nKey: string }) {
  return <Trans ns={LEGAL_NS} i18nKey={i18nKey} components={INLINE_MARKUP} />;
}

export function LegalParagraph({ i18nKey }: { i18nKey: string }) {
  return (
    <p>
      <LegalRichText i18nKey={i18nKey} />
    </p>
  );
}

/** A bulleted list whose items are separate translation keys. */
export function LegalList({ itemKeys }: { itemKeys: readonly string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {itemKeys.map((key) => (
        <li key={key}>
          <LegalRichText i18nKey={key} />
        </li>
      ))}
    </ul>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p>
      <Link href={href} className="hover:underline" style={LINK_STYLE}>
        {children}
      </Link>
    </p>
  );
}
