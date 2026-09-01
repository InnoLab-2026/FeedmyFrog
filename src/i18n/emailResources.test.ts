import { describe, expect, it } from 'vitest';

import { emailResources, interpolate } from './emailResources';
import { LANGUAGES } from './translations';

/*
 * The email copy used to live outside the translation system entirely, as
 * five per-language functions that concatenated string literals. Nothing held
 * them to the same shape, and the German subject still named a product
 * ("Dienstleistungs-Exchange") the app had been renamed away from.
 */

const LOCALES = LANGUAGES.map((l) => l.code);
const REFERENCE = 'en' as const;

function flatten(bundle: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();

  if (typeof bundle === 'string') {
    out.set(prefix, bundle);
    return out;
  }

  for (const [key, child] of Object.entries(bundle as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const [k, v] of flatten(child, path)) out.set(k, v);
  }

  return out;
}

const flattened = new Map(LOCALES.map((code) => [code, flatten(emailResources[code])]));
const reference = flattened.get(REFERENCE)!;

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]).sort();
}

describe('email resources', () => {
  it('covers every language the app offers', () => {
    expect(Object.keys(emailResources).sort()).toEqual([...LOCALES].sort());
  });

  it.each(LOCALES)('%s defines exactly the same keys as English', (code) => {
    expect([...flattened.get(code)!.keys()].sort()).toEqual([...reference.keys()].sort());
  });

  it.each(LOCALES)('%s has no empty strings', (code) => {
    const empty = [...flattened.get(code)!]
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key);

    expect(empty).toEqual([]);
  });

  it.each(LOCALES)('%s interpolates the same placeholders as English', (code) => {
    const mismatches = [...flattened.get(code)!]
      .filter(([key, text]) => placeholders(text).join(',') !== placeholders(reference.get(key)!).join(','))
      .map(([key]) => key);

    expect(mismatches).toEqual([]);
  });

  it.each(LOCALES)('%s uses only the placeholders the renderer supplies', (code) => {
    const supplied = new Set(['minutes']);
    const unknown = new Set<string>();

    for (const [, text] of flattened.get(code)!) {
      for (const name of placeholders(text)) if (!supplied.has(name)) unknown.add(name);
    }

    expect([...unknown]).toEqual([]);
  });

  it.each(LOCALES)('%s carries no emoji and no markup', (code) => {
    const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

    for (const [key, text] of flattened.get(code)!) {
      expect(EMOJI.test(text), `${key} carries emoji`).toBe(false);
      // Markup belongs to the renderer; a tag here would be escaped into
      // visible text in the HTML part and read as noise in the text part.
      expect(/<[a-z/]/i.test(text), `${key} carries markup`).toBe(false);
    }
  });

  it('keeps subjects short enough not to be truncated in an inbox list', () => {
    for (const code of LOCALES) {
      expect(emailResources[code].magicLink.subject.length).toBeLessThanOrEqual(60);
    }
  });

  it('no longer names the product the app was renamed away from', () => {
    for (const code of LOCALES) {
      const text = [...flattened.get(code)!.values()].join('\n');
      expect(text).not.toContain('Dienstleistungs-Exchange');
    }
  });
});

describe('interpolate', () => {
  it('fills a placeholder', () => {
    expect(interpolate('valid for {{minutes}} minutes', { minutes: 15 })).toBe(
      'valid for 15 minutes',
    );
  });

  it('fills every occurrence', () => {
    expect(interpolate('{{a}} and {{a}}', { a: 'x' })).toBe('x and x');
  });

  it('tolerates whitespace inside the braces', () => {
    expect(interpolate('{{ minutes }}', { minutes: 5 })).toBe('5');
  });

  it('leaves an unknown placeholder visible instead of blanking it', () => {
    // A silently blanked placeholder ships a sentence with a hole in it; a
    // visible one gets noticed.
    expect(interpolate('{{missing}} here', {})).toBe('{{missing}} here');
  });

  it('leaves text without placeholders untouched', () => {
    expect(interpolate('Hello,', { minutes: 15 })).toBe('Hello,');
  });

  it('does not treat the replacement value as a template', () => {
    expect(interpolate('{{a}}', { a: '{{b}}' })).toBe('{{b}}');
  });
});
