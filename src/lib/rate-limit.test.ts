import { beforeEach, describe, expect, it, vi } from 'vitest';

// What the check-and-consume statement reports back: how many hits were
// already inside the window, and whether this call's row was actually added.
// The INSERT is guarded by the statement's own WHERE, so `inserted` is the
// database's answer rather than a decision taken in TypeScript.
let mockRow = { used: 0, inserted: 1 };
const execute = vi.fn(async () => ({ rows: [mockRow] }));
const deleteWhere = vi.fn().mockResolvedValue(undefined);

// Only the db client is mocked — src/db/schema.ts has no DB connection or
// server-only import, so the real table metadata (and the real lt condition
// builder from drizzle-orm) can be exercised as-is.
vi.mock('@/db/client', () => ({
  db: {
    execute,
    delete: () => ({ where: deleteWhere }),
  },
}));

const { checkAndConsume, cleanupRateLimits } = await import('./rate-limit');

describe('checkAndConsume', () => {
  beforeEach(() => {
    mockRow = { used: 0, inserted: 1 };
    execute.mockClear();
  });

  it('allows the request and records it when under the limit', async () => {
    mockRow = { used: 2, inserted: 1 };
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result).toEqual({ ok: true, remaining: 2 });
  });

  it('blocks the request once the statement declined to insert', async () => {
    mockRow = { used: 5, inserted: 0 };
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterSeconds).toBe(60);
  });

  it('blocks the request when already over the limit', async () => {
    mockRow = { used: 9, inserted: 0 };
    const result = await checkAndConsume('send-link:ip:1.2.3.4', 5, 60_000);
    expect(result.ok).toBe(false);
  });

  it('reports retryAfterSeconds derived from the window size', async () => {
    mockRow = { used: 10, inserted: 0 };
    const result = await checkAndConsume('key', 10, 3_600_000);
    expect(result).toEqual({ ok: false, retryAfterSeconds: 3600 });
  });

  it('never reports a negative remaining count', async () => {
    mockRow = { used: 4, inserted: 1 };
    const result = await checkAndConsume('key', 5, 60_000);
    expect(result).toEqual({ ok: true, remaining: 0 });
  });

  it('spends a single round trip, counting and consuming together', async () => {
    await checkAndConsume('key', 5, 60_000);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('treats a missing row as not consumed rather than as an allowance', async () => {
    execute.mockResolvedValueOnce({ rows: [] } as never);
    const result = await checkAndConsume('key', 5, 60_000);
    expect(result.ok).toBe(false);
  });
});

describe('cleanupRateLimits', () => {
  it('issues exactly one delete for rows past the retention window', async () => {
    deleteWhere.mockClear();
    await cleanupRateLimits();
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });
});
