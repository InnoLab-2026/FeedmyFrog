import { describe, it, expect } from 'vitest';
import {
  isAllowedEmail,
  Email,
  ListingType,
  ListingInput,
  Uuid,
} from './validators';

const BASE = 'reutlingen-university.de';

describe('isAllowedEmail', () => {
  it('accepts an address on the exact base domain', () => {
    expect(isAllowedEmail('alice@reutlingen-university.de', BASE)).toBe(true);
  });

  it('accepts a proper subdomain of the base domain', () => {
    expect(isAllowedEmail('bob@mail.reutlingen-university.de', BASE)).toBe(true);
    expect(isAllowedEmail('c@a.b.reutlingen-university.de', BASE)).toBe(true);
  });

  it('is case-insensitive on both the address and the base domain', () => {
    expect(isAllowedEmail('Alice@Reutlingen-University.DE', BASE)).toBe(true);
    expect(isAllowedEmail('alice@reutlingen-university.de', 'REUTLINGEN-UNIVERSITY.DE')).toBe(true);
  });

  it('rejects a look-alike domain that merely contains the base (prefix attack)', () => {
    expect(isAllowedEmail('evil@evil-reutlingen-university.de', BASE)).toBe(false);
    expect(isAllowedEmail('evil@xreutlingen-university.de', BASE)).toBe(false);
  });

  it('rejects a domain that uses the base as a subdomain of an attacker domain (suffix attack)', () => {
    expect(isAllowedEmail('evil@reutlingen-university.de.attacker.com', BASE)).toBe(false);
  });

  it('rejects an unrelated domain', () => {
    expect(isAllowedEmail('someone@gmail.com', BASE)).toBe(false);
  });

  it('rejects a string with no @', () => {
    expect(isAllowedEmail('not-an-email', BASE)).toBe(false);
  });

  it('uses the last @ to determine the domain', () => {
    expect(isAllowedEmail('weird@name@reutlingen-university.de', BASE)).toBe(true);
    expect(isAllowedEmail('weird@name@gmail.com', BASE)).toBe(false);
  });
});

describe('Email schema', () => {
  it('trims and lowercases a valid institutional address', () => {
    const parsed = Email.parse('  Alice@Reutlingen-University.de  ');
    expect(parsed).toBe('alice@reutlingen-university.de');
  });

  it('accepts a subdomain address', () => {
    expect(Email.parse('bob@mail.reutlingen-university.de')).toBe(
      'bob@mail.reutlingen-university.de',
    );
  });

  it('rejects a syntactically invalid email', () => {
    expect(Email.safeParse('not-an-email').success).toBe(false);
  });

  it('rejects a valid email outside the allowed domain with the forbidden_domain code', () => {
    const res = Email.safeParse('someone@gmail.com');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe('forbidden_domain');
    }
  });
});

describe('ListingType', () => {
  it('accepts the two known types', () => {
    expect(ListingType.parse('need')).toBe('need');
    expect(ListingType.parse('offer')).toBe('offer');
  });

  it('rejects any other value', () => {
    expect(ListingType.safeParse('wanted').success).toBe(false);
  });
});

describe('ListingInput schema', () => {
  const valid = {
    type: 'offer',
    title: 'Bike for sale',
    description: 'A well-maintained city bike, barely used.',
    tags: ['bike', 'transport'],
    location: 'Reutlingen',
  };

  it('accepts a well-formed listing', () => {
    const res = ListingInput.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('trims string fields', () => {
    const res = ListingInput.parse({ ...valid, title: '  Bike for sale  ' });
    expect(res.title).toBe('Bike for sale');
  });

  it('defaults tags to an empty array when omitted', () => {
    const { tags, ...noTags } = valid;
    void tags;
    const res = ListingInput.parse(noTags);
    expect(res.tags).toEqual([]);
  });

  it('rejects a title shorter than 3 characters', () => {
    expect(ListingInput.safeParse({ ...valid, title: 'ab' }).success).toBe(false);
  });

  it('rejects a title longer than 120 characters', () => {
    expect(ListingInput.safeParse({ ...valid, title: 'x'.repeat(121) }).success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    expect(ListingInput.safeParse({ ...valid, description: 'too short' }).success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    expect(ListingInput.safeParse({ ...valid, description: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('rejects more than 8 tags', () => {
    const tags = Array.from({ length: 9 }, (_, i) => `tag${i}`);
    expect(ListingInput.safeParse({ ...valid, tags }).success).toBe(false);
  });

  it('rejects an empty location', () => {
    expect(ListingInput.safeParse({ ...valid, location: '' }).success).toBe(false);
  });

  it('rejects an unknown listing type', () => {
    expect(ListingInput.safeParse({ ...valid, type: 'wanted' }).success).toBe(false);
  });
});

describe('Uuid schema', () => {
  it('accepts a valid uuid', () => {
    expect(Uuid.safeParse('123e4567-e89b-12d3-a456-426614174000').success).toBe(true);
  });

  it('rejects a non-uuid string', () => {
    expect(Uuid.safeParse('not-a-uuid').success).toBe(false);
    expect(Uuid.safeParse('123').success).toBe(false);
  });
});
