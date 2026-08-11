import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateToken, hashToken, userIdFromEmail } from './auth';

describe('generateToken', () => {
  it('returns a raw token whose sha256 hash matches the returned hash', () => {
    const { raw, hash } = generateToken();
    expect(hash).toBe(createHash('sha256').update(raw).digest('hex'));
  });

  it('produces a URL-safe raw token', () => {
    const { raw } = generateToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces a 64-character hex hash', () => {
    const { hash } = generateToken();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a different token on every call', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe('hashToken', () => {
  it('is deterministic', () => {
    expect(hashToken('same-input')).toBe(hashToken('same-input'));
  });

  it('matches node:crypto sha256 directly', () => {
    expect(hashToken('some-raw-value')).toBe(
      createHash('sha256').update('some-raw-value').digest('hex'),
    );
  });

  it('matches generateToken\'s own hash for the raw value it produced', () => {
    const { raw, hash } = generateToken();
    expect(hashToken(raw)).toBe(hash);
  });
});

describe('userIdFromEmail', () => {
  it('is deterministic for the same email', () => {
    expect(userIdFromEmail('anna@reutlingen-university.de')).toBe(
      userIdFromEmail('anna@reutlingen-university.de'),
    );
  });

  it('is case-insensitive', () => {
    expect(userIdFromEmail('Anna@Reutlingen-University.de')).toBe(
      userIdFromEmail('anna@reutlingen-university.de'),
    );
  });

  it('produces the format required by the session Payload schema (64 lowercase hex chars)', () => {
    expect(userIdFromEmail('anna@reutlingen-university.de')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different ids for different emails', () => {
    expect(userIdFromEmail('anna@reutlingen-university.de')).not.toBe(
      userIdFromEmail('ben@reutlingen-university.de'),
    );
  });
});
