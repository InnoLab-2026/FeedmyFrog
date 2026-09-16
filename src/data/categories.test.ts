import { describe, expect, it } from 'vitest';

import {
  STANDARD_CATEGORY_TAGS,
  categoryLabel,
  getCategoryTranslationKey,
  isStandardCategory,
  rankCategories,
} from './categories';
import { iconFor } from './icons';

/*
 * Tags are user input, and every plain object inherits from Object.prototype.
 * A lookup with `in` or `obj[key]` therefore answers for names nobody put in
 * the table -- and hands back a function or an object, which is exactly what
 * React refuses to render as a child.
 */
const PROTOTYPE_NAMES = [
  '__proto__',
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
];

const identity = (key: string) => key;

describe('prototype members are not categories', () => {
  it.each(PROTOTYPE_NAMES)('isStandardCategory(%j) is false', (name) => {
    expect(isStandardCategory(name)).toBe(false);
  });

  it.each(PROTOTYPE_NAMES)('getCategoryTranslationKey(%j) returns the tag itself', (name) => {
    expect(getCategoryTranslationKey(name)).toBe(name);
  });

  it.each(PROTOTYPE_NAMES)('categoryLabel(%j) is a plain string', (name) => {
    expect(typeof categoryLabel(name, identity)).toBe('string');
  });

  it.each(PROTOTYPE_NAMES)('iconFor(%j) is null, never a function or object', (name) => {
    expect(iconFor(name)).toBeNull();
  });
});

describe('the built-in categories still work', () => {
  it.each(STANDARD_CATEGORY_TAGS)('%s is a standard category with an icon', (tag) => {
    expect(isStandardCategory(tag)).toBe(true);
    expect(getCategoryTranslationKey(tag)).toMatch(/^category_/);
    expect(iconFor(tag)).not.toBeNull();
  });
});

describe('a user tag cannot borrow a UI string', () => {
  it('renders a free-form tag verbatim instead of looking it up', () => {
    // `t` here stands in for i18next, which would resolve these to real UI
    // copy ("Log out", "Disclaimer") if a raw tag were passed as a key.
    const t = (key: string) => (key === 'logout' ? 'Log out' : `T(${key})`);

    expect(categoryLabel('logout', t)).toBe('logout');
    expect(categoryLabel('disclaimer_btn', t)).toBe('disclaimer_btn');
  });

  it('still translates a genuine built-in category', () => {
    const t = (key: string) => `T(${key})`;
    expect(categoryLabel('Familie', t)).toBe('T(category_family)');
  });
});

describe('rankCategories', () => {
  it('orders by count, most listings first', () => {
    const order = rankCategories({
      Bildung: 9,
      Familie: 2,
      Verkauf: 5,
    });

    expect(order.slice(0, 3)).toEqual(['Bildung', 'Verkauf', 'Familie']);
  });

  it('returns the whole built-in set, not just the counted ones', () => {
    const order = rankCategories({ Bildung: 9 });

    expect([...order].sort()).toEqual([...STANDARD_CATEGORY_TAGS].sort());
    expect(order).toHaveLength(STANDARD_CATEGORY_TAGS.length);
  });

  it('sinks an unused category to the end rather than dropping it', () => {
    const counts = Object.fromEntries(
      STANDARD_CATEGORY_TAGS.map((tag) => [tag, tag === 'Kinder' ? 0 : 3]),
    );

    expect(rankCategories(counts).at(-1)).toBe('Kinder');
  });

  it('breaks ties on declaration order, so equal counts do not reshuffle', () => {
    // Every count equal is the empty-database case, and the case where the
    // sort's own ordering would otherwise decide.
    const counts = Object.fromEntries(
      STANDARD_CATEGORY_TAGS.map((tag) => [tag, 4]),
    );

    expect(rankCategories(counts)).toEqual([...STANDARD_CATEGORY_TAGS]);
    expect(rankCategories({})).toEqual([...STANDARD_CATEGORY_TAGS]);
  });

  it('is deterministic: the same counts give the same order', () => {
    const counts = { Verkauf: 2, Transport: 2, Bildung: 2, Familie: 7 };

    expect(rankCategories(counts)).toEqual(rankCategories(counts));
  });

  it('ignores a hashtag, however popular: it cannot earn a tab', () => {
    const order = rankCategories({ 'tandem-partner': 9999, Bildung: 1 });

    expect(order).not.toContain('tandem-partner');
    expect(order[0]).toBe('Bildung');
    expect(order).toHaveLength(STANDARD_CATEGORY_TAGS.length);
  });

  it('ignores prototype members reached through the counts object', () => {
    // `counts` is parsed from a database row; a bare lookup would read
    // Object.prototype for these and sort on a function.
    const order = rankCategories({
      constructor: 500,
      __proto__: 500,
      toString: 500,
      Bildung: 1,
    } as unknown as Record<string, number>);

    expect(order).toEqual([
      'Bildung',
      ...STANDARD_CATEGORY_TAGS.filter((t) => t !== 'Bildung'),
    ]);
  });

  it('treats a missing or non-numeric count as zero', () => {
    const order = rankCategories({
      Familie: Number.NaN,
      Kinder: undefined,
      Bildung: 1,
    } as unknown as Record<string, number>);

    expect(order[0]).toBe('Bildung');
    expect(order).toHaveLength(STANDARD_CATEGORY_TAGS.length);
  });
});
