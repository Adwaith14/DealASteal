import { describe, expect, it } from 'vitest';
import { callerIdentity, createInMemoryRateLimiter, createRateLimiterFromEnv } from './rate-limit';

describe('createInMemoryRateLimiter', () => {
  it('allows up to capacity requests per window', async () => {
    const limiter = createInMemoryRateLimiter({
      capacity: 3,
      windowMs: 60_000,
      now: () => 1_000_000,
    });
    expect((await limiter.consume('a')).ok).toBe(true);
    expect((await limiter.consume('a')).ok).toBe(true);
    expect((await limiter.consume('a')).ok).toBe(true);
    const denied = await limiter.consume('a');
    expect(denied.ok).toBe(false);
    expect(denied.remaining).toBe(0);
  });

  it('refills after window elapses', async () => {
    let t = 0;
    const limiter = createInMemoryRateLimiter({
      capacity: 1,
      windowMs: 1000,
      now: () => t,
    });
    expect((await limiter.consume('a')).ok).toBe(true);
    expect((await limiter.consume('a')).ok).toBe(false);
    t += 1001;
    expect((await limiter.consume('a')).ok).toBe(true);
  });

  it('tracks separate keys independently', async () => {
    const limiter = createInMemoryRateLimiter({ capacity: 1, windowMs: 1000 });
    expect((await limiter.consume('a')).ok).toBe(true);
    expect((await limiter.consume('b')).ok).toBe(true);
    expect((await limiter.consume('a')).ok).toBe(false);
  });
});

describe('createRateLimiterFromEnv', () => {
  it('falls back to in-memory when Upstash env is missing', () => {
    const limiter = createRateLimiterFromEnv({ id: 'test', capacity: 5, windowMs: 10_000 });
    expect(limiter).toBeDefined();
  });
});

describe('callerIdentity', () => {
  it('prefers authorization hash', () => {
    const h = new Headers();
    h.set('authorization', 'Bearer secret');
    expect(callerIdentity(h)).toMatch(/^auth:[0-9a-f]+$/);
  });
});
