import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockCount = 0;
const insertValues = vi.fn().mockResolvedValue(undefined);
const deleteWhere = vi.fn().mockResolvedValue(undefined);

// Only the db client is mocked — src/db/schema.ts has no DB connection or
// server-only import, so the real table metadata (and the real eq/gte/lt
// condition builders from drizzle-orm) can be exercised as-is.
vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async () => [{ count: mockCount }],
      }),
    }),
    insert: () => ({ values: insertValues }),
    delete: () => ({ where: deleteWhere }),
  },
}));

const { checkAndConsume, cleanupRateLimits } = await import('./rate-limit');

describe('checkAndConsume', () => {
  beforeEach(() => {
    mockCount = 0;
    insertValues.mockClear();
  });

  it('allows the request and records it when under the limit', async () => {
    mockCount = 2;
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result).toEqual({ ok: true, remaining: 2 });
    expect(insertValues).toHaveBeenCalledWith({ key: 'send-link:ip:1.2.3.4' });
  });

  it('blocks the request and does not record it once at the limit', async () => {
    mockCount = 5;
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterSeconds).toBe(60);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('blocks the request when already over the limit', async () => {
    mockCount = 9;
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result.ok).toBe(false);
  });

  it('reports retryAfterSeconds derived from the window size', async () => {
    mockCount = 10;
    const result = await checkAndConsume('key', 10, 3_600_000);
    expect(result).toEqual({ ok: false, retryAfterSeconds: 3600 });
  });

  it('never reports a negative remaining count', async () => {
    mockCount = 4;
    const result = await checkAndConsume('key', 5, 60_000);
    expect(result).toEqual({ ok: true, remaining: 0 });
  });
});

describe('cleanupRateLimits', () => {
  it('issues exactly one delete for rows past the retention window', async () => {
    deleteWhere.mockClear();
    await cleanupRateLimits();
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });
});
