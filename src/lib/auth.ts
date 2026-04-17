import 'server-only';
import { randomBytes, createHash } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function userIdFromEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}
