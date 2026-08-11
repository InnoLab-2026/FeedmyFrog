import { describe, expect, it, vi } from 'vitest';

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

  it('rejects a title under 3 characters', () => {
    expect(ListingInput.safeParse({ ...base, title: 'ab' }).success).toBe(false);
  });

  it('rejects a title over 120 characters', () => {
    expect(ListingInput.safeParse({ ...base, title: 'a'.repeat(121) }).success).toBe(false);
  });

  it('rejects a description under 10 characters', () => {
    expect(ListingInput.safeParse({ ...base, description: 'too short' }).success).toBe(false);
  });

  it('rejects more than 8 tags', () => {
    const tags = Array.from({ length: 9 }, (_, i) => `tag${i}`);
    expect(ListingInput.safeParse({ ...base, tags }).success).toBe(false);
  });

  it('rejects an empty location', () => {
    expect(ListingInput.safeParse({ ...base, location: '' }).success).toBe(false);
  });

  it('rejects an invalid type', () => {
    expect(ListingInput.safeParse({ ...base, type: 'both' }).success).toBe(false);
  });
});

describe('Uuid schema', () => {
  it('accepts a valid UUID', () => {
    expect(Uuid.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(Uuid.safeParse('not-a-uuid').success).toBe(false);
  });
});
