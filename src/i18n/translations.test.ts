import { describe, expect, it } from 'vitest';

import { LANGUAGES, resources, type LangCode } from './translations';

/*
 * The guard rails the UI translations never had.
 *
 * Every problem checked here is one that actually shipped: a key updated in
 * four locales and forgotten in the fifth (`manage_listings`), a sentence
 * whose meaning was dropped in one language only (`more_categories` lost
 * "more" in Spanish), and strings assembled from `_pre`/`_post` fragments
 * that pinned word order to German. None of it failed anything, because
 * nothing compared the locales to each other.
 */

const LOCALES = LANGUAGES.map((l) => l.code);
const REFERENCE: LangCode = 'en';

function entries(code: LangCode): Record<string, string> {
  return resources[code].translation as unknown as Record<string, string>;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]).sort();
}

function tags(text: string): string[] {
  return [...text.matchAll(/<\/?([a-z]+)\s*\/?>/g)].map((m) => m[1]);
}

/** Inline tags the components pass to <Trans>; anything else renders literally. */
const KNOWN_TAGS = new Set(['domain', 'strong', 'em', 'code', 'br']);

describe('translations', () => {
  it('has a bundle for every language the switcher offers', () => {
    expect(Object.keys(resources).sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)('%s defines exactly the same keys as English', (code) => {
    expect(Object.keys(entries(code)).sort()).toEqual(
      Object.keys(entries(REFERENCE)).sort(),
    );
  });

  it.each(LOCALES)('%s has no empty strings', (code) => {
    const empty = Object.entries(entries(code))
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key);

    expect(empty).toEqual([]);
  });

  it.each(LOCALES)('%s interpolates the same placeholders as English', (code) => {
    // A locale that drops {{city}} renders a sentence with a hole in it, and
    // one that invents {{town}} renders the braces verbatim.
    const mismatches: string[] = [];
    const reference = entries(REFERENCE);

    for (const [key, text] of Object.entries(entries(code))) {
      const expected = placeholders(reference[key]);
      if (placeholders(text).join(',') !== expected.join(',')) mismatches.push(key);
    }

    expect(mismatches).toEqual([]);
  });

  it.each(LOCALES)('%s closes every inline tag it opens', (code) => {
    const unbalanced = Object.entries(entries(code))
      .filter(([, text]) => {
        const opened = [...text.matchAll(/<([a-z]+)>/g)].map((m) => m[1]).sort();
        const closed = [...text.matchAll(/<\/([a-z]+)>/g)].map((m) => m[1]).sort();
        return opened.join(',') !== closed.join(',');
      })
      .map(([key]) => key);

    expect(unbalanced).toEqual([]);
  });

  it.each(LOCALES)('%s uses only inline tags the renderer knows', (code) => {
    const unknown = new Set<string>();

    for (const text of Object.values(entries(code))) {
      for (const tag of tags(text)) if (!KNOWN_TAGS.has(tag)) unknown.add(tag);
    }

    expect([...unknown]).toEqual([]);
  });

  it('keeps no `_pre` / `_post` sentence fragments', () => {
    // Splitting a sentence in two fixes the word order around whatever sits
    // between the halves, which is a decision only the translator can make.
    const fragments = Object.keys(entries(REFERENCE)).filter((key) =>
      /_(pre|post)$/.test(key),
    );

    expect(fragments).toEqual([]);
  });

  it('gives every language a distinct endonym and code', () => {
    expect(new Set(LANGUAGES.map((l) => l.name)).size).toBe(LANGUAGES.length);
    expect(new Set(LANGUAGES.map((l) => l.code)).size).toBe(LANGUAGES.length);
  });

  it.each(LOCALES)('%s carries no emoji', (code) => {
    /*
     * Emoji render differently on every platform, are read aloud by screen
     * readers ("envelope"), and carry meaning that does not survive
     * translation. UI copy states things in words instead.
     */
    const EMOJI =
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;

    const offenders = Object.entries(entries(code))
      .filter(([, text]) => EMOJI.test(text))
      .map(([key]) => key);

    expect(offenders).toEqual([]);
  });

  it.each(LOCALES)('%s actually differs from English where it should', (code) => {
    if (code === REFERENCE) return;

    // A locale that is a verbatim copy of English has not been translated.
    // Some entries legitimately match (proper nouns, "Transport"), so this
    // only asserts that the bulk of the bundle is genuinely different.
    const reference = entries(REFERENCE);
    const table = entries(code);
    const identical = Object.keys(table).filter((key) => table[key] === reference[key]);

    expect(identical.length).toBeLessThan(Object.keys(table).length / 2);
  });
});
