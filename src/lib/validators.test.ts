import { describe, expect, it, vi } from 'vitest';

// geo.ts is pure and reads no environment, so it can be imported statically
// even though ./validators has to wait for the env mock below.
import { PLACES } from './geo';

vi.mock('@/lib/env', () => ({
  env: { ALLOWED_EMAIL_DOMAIN: 'reutlingen-university.de' },
}));

const { isAllowedEmail, Email, ListingInput, Uuid } = await import('./validators');

describe('isAllowedEmail', () => {
  it('accepts an exact domain match', () => {
    expect(isAllowedEmail('anna@reutlingen-university.de', 'reutlingen-university.de')).toBe(true);
  });

  it('accepts a proper subdomain', () => {
    expect(isAllowedEmail('anna@mail.reutlingen-university.de', 'reutlingen-university.de')).toBe(true);
  });

  it('is case-insensitive on the domain', () => {
    expect(isAllowedEmail('anna@Reutlingen-University.DE', 'reutlingen-university.de')).toBe(true);
  });

  it('rejects a lookalike domain that merely contains the base as a substring', () => {
    expect(isAllowedEmail('anna@evil-reutlingen-university.de', 'reutlingen-university.de')).toBe(false);
  });

  it('rejects a suffix-attack domain appending the base after an attacker domain', () => {
    expect(isAllowedEmail('anna@reutlingen-university.de.attacker.com', 'reutlingen-university.de')).toBe(false);
  });

  it('rejects an unrelated domain', () => {
    expect(isAllowedEmail('anna@gmail.com', 'reutlingen-university.de')).toBe(false);
  });

  it('rejects a string with no @', () => {
    expect(isAllowedEmail('not-an-email', 'reutlingen-university.de')).toBe(false);
  });
});

describe('Email schema', () => {
  it('trims, lowercases, and accepts a valid university address', () => {
    const result = Email.safeParse('  Anna@Reutlingen-University.DE  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('anna@reutlingen-university.de');
  });

  it('rejects a malformed address', () => {
    const result = Email.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('rejects a well-formed address on the wrong domain with a forbidden_domain message', () => {
    const result = Email.safeParse('anna@gmail.com');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('forbidden_domain');
    }
  });
});

describe('ListingInput schema', () => {
  const base = {
    type: 'need' as const,
    title: 'Suche Nachhilfe',
    description: 'Eine ausreichend lange Beschreibung fuer den Eintrag.',
    tags: ['Bildung'],
    location: 'Reutlingen',
  };

  it('accepts a valid listing', () => {
    expect(ListingInput.safeParse(base).success).toBe(true);
  });

  it('defaults tags to an empty array when omitted', () => {
    const withoutTags: Record<string, unknown> = { ...base };
    delete withoutTags.tags;

    const result = ListingInput.safeParse(withoutTags);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });

  /*
   * Every failure below asserts the exact code, not just success:false —
   * these codes are a contract the client relies on to pick a translated
   * message (see src/lib/validators.ts's `error_<code>` convention), so a
   * silent rename here would break every language on the client silently.
   */
  it('rejects a title under 3 characters with title_too_short', () => {
    const result = ListingInput.safeParse({ ...base, title: 'ab' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.title).toEqual(['title_too_short']);
  });

  it('rejects a title over 120 characters with title_too_long', () => {
    const result = ListingInput.safeParse({ ...base, title: 'a'.repeat(121) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.title).toEqual(['title_too_long']);
  });

  it('rejects a description under 10 characters with description_too_short', () => {
    const result = ListingInput.safeParse({ ...base, description: 'too short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toEqual(['description_too_short']);
    }
  });

  it('rejects more than 8 tags with tags_too_many', () => {
    const tags = Array.from({ length: 9 }, (_, i) => `tag${i}`);
    const result = ListingInput.safeParse({ ...base, tags });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.tags).toEqual(['tags_too_many']);
  });

  it.each([
    ['an empty string', ''],
    ['free text around a known name', 'Campus Reutlingen'],
    ['a postcode and a name', '72762 Reutlingen'],
    ['a place we do not cover', 'Hamburg'],
    ['the wrong case', 'reutlingen'],
    ['a street address', 'Musterweg 12'],
    ['a coordinate pair', '48.49731, 9.20427'],
    ['a missing value', undefined],
  ])('rejects %s with location_invalid', (_label, location) => {
    const result = ListingInput.safeParse({ ...base, location });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.location).toEqual(['location_invalid']);
    }
  });

  it('accepts every name in the closed set, and only those', () => {
    for (const place of PLACES) {
      expect(ListingInput.safeParse({ ...base, location: place }).success).toBe(true);
    }
  });

  it('rejects an invalid type with type_invalid', () => {
    const result = ListingInput.safeParse({ ...base, type: 'both' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.type).toEqual(['type_invalid']);
  });
});

describe('Uuid schema', () => {
  it('accepts a valid UUID', () => {
    expect(Uuid.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
  });

  it('rejects a non-UUID string with the invalid_id code', () => {
    const result = Uuid.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('invalid_id');
  });
});
