import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { generateToken, hashToken, userIdFromEmail } from './auth';

describe('generateToken', () => {
  it('returns a base64url raw token and its sha-256 hash', () => {
    const { raw, hash } = generateToken();
    // base64url alphabet only (no +, /, or = padding).
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 random bytes base64url-encode to 43 characters.
    expect(raw).toHaveLength(43);
    expect(hash).toBe(createHash('sha256').update(raw).digest('hex'));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces a distinct token on every call', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateToken().raw);
    expect(seen.size).toBe(1000);
  });

  it('hash is consistent with hashToken for the same raw value', () => {
    const { raw, hash } = generateToken();
    expect(hashToken(raw)).toBe(hash);
  });
});

describe('hashToken', () => {
  it('is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('matches a known sha-256 digest', () => {
    // echo -n "abc" | sha256sum
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is case- and whitespace-sensitive', () => {
    expect(hashToken('abc')).not.toBe(hashToken('ABC'));
    expect(hashToken('abc')).not.toBe(hashToken('abc '));
  });
});

describe('userIdFromEmail', () => {
  it('is a 64-char lowercase hex sha-256 digest', () => {
    expect(userIdFromEmail('user@reutlingen-university.de')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is case-insensitive on the input email', () => {
    expect(userIdFromEmail('User@Example.com')).toBe(userIdFromEmail('user@example.com'));
  });

  it('maps different emails to different ids', () => {
    expect(userIdFromEmail('a@example.com')).not.toBe(userIdFromEmail('b@example.com'));
  });

  it('matches the sha-256 of the lowercased email', () => {
    const email = 'Someone@Example.COM';
    expect(userIdFromEmail(email)).toBe(
      createHash('sha256').update(email.toLowerCase()).digest('hex'),
    );
  });
});
