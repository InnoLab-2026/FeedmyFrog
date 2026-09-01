import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  parseAcceptLanguage,
  pickLanguage,
} from './matchLanguage';

describe('normalizeLanguage', () => {
  it('accepts a bare supported code', () => {
    expect(normalizeLanguage('de')).toBe('de');
  });

  it('drops the region subtag', () => {
    expect(normalizeLanguage('de-AT')).toBe('de');
    expect(normalizeLanguage('es-419')).toBe('es');
  });

  it('is case-insensitive and tolerates underscores', () => {
    expect(normalizeLanguage('FR-CA')).toBe('fr');
    expect(normalizeLanguage('tr_TR')).toBe('tr');
  });

  it('rejects a language the app has no translations for', () => {
    expect(normalizeLanguage('it')).toBeNull();
    expect(normalizeLanguage('zh-Hans')).toBeNull();
  });

  it('rejects empty and missing input rather than guessing', () => {
    expect(normalizeLanguage('')).toBeNull();
    expect(normalizeLanguage(null)).toBeNull();
    expect(normalizeLanguage(undefined)).toBeNull();
  });

  it('does not match on a prefix of a supported code', () => {
    // "e" must not resolve to "en", or a junk cookie would pick a language.
    expect(normalizeLanguage('e')).toBeNull();
  });
});

describe('parseAcceptLanguage', () => {
  it('returns tags in the order sent when no q values are given', () => {
    expect(parseAcceptLanguage('de,en,fr')).toEqual(['de', 'en', 'fr']);
  });

  it('orders by descending quality', () => {
    expect(parseAcceptLanguage('en;q=0.5,de;q=0.9,fr;q=0.7')).toEqual(['de', 'fr', 'en']);
  });

  it('treats a missing q as 1.0, outranking explicit lower values', () => {
    expect(parseAcceptLanguage('en;q=0.8,de')).toEqual(['de', 'en']);
  });

  it('keeps the sent order for equal quality', () => {
    expect(parseAcceptLanguage('fr;q=0.8,de;q=0.8')).toEqual(['fr', 'de']);
  });

  it('drops entries the client explicitly refuses with q=0', () => {
    expect(parseAcceptLanguage('de;q=0,en;q=0.5')).toEqual(['en']);
  });

  it('drops an entry with an unparseable q instead of promoting it', () => {
    expect(parseAcceptLanguage('de;q=nonsense,en')).toEqual(['en']);
  });

  it('tolerates whitespace and stray commas', () => {
    expect(parseAcceptLanguage(' de-DE , en ;q=0.7 , ')).toEqual(['de-DE', 'en']);
  });

  it('returns nothing for a missing header', () => {
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage('')).toEqual([]);
  });

  it('passes the wildcard through for pickLanguage to reject', () => {
    expect(parseAcceptLanguage('*')).toEqual(['*']);
    expect(pickLanguage(parseAcceptLanguage('*'))).toBeNull();
  });
});

describe('pickLanguage', () => {
  it('takes the first supported candidate', () => {
    expect(pickLanguage(['it', 'zh', 'fr', 'de'])).toBe('fr');
  });

  it('lets an explicit choice win over the browser preference', () => {
    // The cookie is passed first, so a reader who picked Turkish keeps it
    // even though the browser asks for German.
    expect(pickLanguage(['tr', 'de-DE', 'de'])).toBe('tr');
  });

  it('falls through a null explicit choice to the browser preference', () => {
    expect(pickLanguage([null, 'es-MX'])).toBe('es');
  });

  it('returns null when nothing matches, so the caller applies its default', () => {
    expect(pickLanguage(['it', 'zh', null, undefined])).toBeNull();
    expect(pickLanguage([])).toBeNull();
  });

  it('resolves a realistic browser header to a supported language', () => {
    const header = 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7';
    expect(pickLanguage([null, ...parseAcceptLanguage(header)])).toBe('de');
  });

  it('skips unsupported languages the browser prefers more', () => {
    const header = 'it-IT,it;q=0.9,es;q=0.4';
    expect(pickLanguage([undefined, ...parseAcceptLanguage(header)])).toBe('es');
  });
});

describe('DEFAULT_LANGUAGE', () => {
  it('is a language the app actually ships', () => {
    expect(normalizeLanguage(DEFAULT_LANGUAGE)).toBe(DEFAULT_LANGUAGE);
  });
});
