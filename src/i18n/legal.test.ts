import { describe, expect, it } from 'vitest';

import i18n from './index';
import { LEGAL_NS, legalResources } from './legal';
import { LANGUAGES } from './translations';

/*
 * The legal pages used to be five hand-written component trees behind a
 * `lang.startsWith(...)` chain, and three of them had silently drifted from
 * the German original — the French, Turkish and Spanish versions collapsed
 * the Art. 28 processor list into one sentence and dropped parts of the
 * Art. 13/15-21 rights section. Nothing failed, because there was nothing to
 * compare against.
 *
 * These tests are that comparison: every locale must offer the same keys, and
 * none of them may be empty or left as an untranslated copy of the tag markup.
 */

type Json = string | { [key: string]: Json };

function flatten(value: Json, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();

  if (typeof value === 'string') {
    out.set(prefix, value);
    return out;
  }

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const [k, v] of flatten(child, path)) out.set(k, v);
  }

  return out;
}

const LOCALES = LANGUAGES.map((l) => l.code);
const flattened = new Map(
  LOCALES.map((code) => [code, flatten(legalResources[code] as unknown as Json)]),
);

const reference = flattened.get('de')!;

describe('legal resources', () => {
  it('covers every language the language switcher offers', () => {
    expect(Object.keys(legalResources).sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)('%s has exactly the same keys as the German original', (code) => {
    const keys = [...flattened.get(code)!.keys()].sort();
    expect(keys).toEqual([...reference.keys()].sort());
  });

  it.each(LOCALES)('%s has no empty strings', (code) => {
    const empty = [...flattened.get(code)!].filter(([, text]) => text.trim() === '');
    expect(empty.map(([key]) => key)).toEqual([]);
  });

  it.each(LOCALES)('%s closes every inline markup tag it opens', (code) => {
    const unbalanced: string[] = [];

    for (const [key, text] of flattened.get(code)!) {
      const opened = [...text.matchAll(/<([a-z]+)>/g)].map((m) => m[1]).sort();
      const closed = [...text.matchAll(/<\/([a-z]+)>/g)].map((m) => m[1]).sort();
      if (opened.join(',') !== closed.join(',')) unbalanced.push(key);
    }

    expect(unbalanced).toEqual([]);
  });

  it.each(LOCALES)('%s uses only inline tags the renderer knows', (code) => {
    // Mirrors INLINE_MARKUP in src/components/layout/LegalText.tsx — a tag
    // that is not listed there renders as literal text on the page.
    const known = new Set(['strong', 'em', 'code', 'br', 'privacy']);
    const unknown = new Set<string>();

    for (const [, text] of flattened.get(code)!) {
      for (const match of text.matchAll(/<\/?([a-z]+)\s*\/?>/g)) {
        if (!known.has(match[1])) unknown.add(match[1]);
      }
    }

    expect([...unknown]).toEqual([]);
  });

  it('links to the other legal page from the imprint in every language', () => {
    for (const code of LOCALES) {
      expect(flattened.get(code)!.get('imprint.hosting.body')).toContain('<privacy>');
    }
  });

  it('keeps the placeholders that still need filling in before launch', () => {
    // If these ever disappear from one language only, that language is
    // claiming details the others do not — worth failing over.
    for (const code of LOCALES) {
      const text = [...flattened.get(code)!.values()].join('\n');
      expect(text).toMatch(/\[[^\]]+\]/);
    }
  });
});

/*
 * The bundles are registered as a side effect of importing ./legal, so that
 * the two page components get them just by importing the module. These tests
 * pin that down: importing is enough, and every language resolves through
 * i18next rather than only existing in the exported object.
 */
describe('legal namespace registration', () => {
  it.each(LOCALES)('registers the %s bundle on the shared i18next instance', (code) => {
    expect(i18n.hasResourceBundle(code, LEGAL_NS)).toBe(true);
  });

  it.each(LOCALES)('resolves a %s key through i18next, not just the export', async (code) => {
    await i18n.changeLanguage(code);

    const title = i18n.t('privacy.title', { ns: LEGAL_NS });
    expect(title).toBe(legalResources[code].privacy.title);
    // A miss returns the key itself, which is the failure mode worth catching.
    expect(title).not.toBe('privacy.title');
  });

  it('leaves the main translation namespace untouched', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('logout')).toBe('Log out');
  });
});
