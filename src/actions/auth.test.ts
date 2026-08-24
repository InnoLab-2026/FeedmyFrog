import { describe, expect, it, vi } from 'vitest';

const destroySessionMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/session', () => ({ destroySession: destroySessionMock }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

const { logout } = await import('./auth');

describe('logout', () => {
  it('destroys the session before redirecting to /login', async () => {
    const calls: string[] = [];
    destroySessionMock.mockImplementationOnce(async () => {
      calls.push('destroy');
    });
    redirectMock.mockImplementationOnce((path: string) => {
      calls.push(`redirect:${path}`);
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(calls).toEqual(['destroy', 'redirect:/login']);
  });
});
