import { describe, expect, it } from 'vitest';

import {
  STANDARD_CATEGORY_TAGS,
  categoryLabel,
  getCategoryTranslationKey,
  isStandardCategory,
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
