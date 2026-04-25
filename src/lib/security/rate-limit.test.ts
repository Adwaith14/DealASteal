import { describe, expect, it } from 'vitest';
import { callerIdentity, createInMemoryRateLimiter } from './rate-limit';

describe('createInMemoryRateLimiter', () => {
  it('refuses requests once capacity is exhausted within the window', () => {
    let now = 1_000_000;
    const limiter = createInMemoryRateLimiter({
      capacity: 3,
      windowMs: 60_000,
      now: () => now,
    });

    expect(limiter.consume('a').ok).toBe(true);
    expect(limiter.consume('a').ok).toBe(true);
    expect(limiter.consume('a').ok).toBe(true);
    const denied = limiter.consume('a');
    expect(denied.ok).toBe(false);
    expect(denied.remaining).toBe(0);
  });

  it('refills the bucket once the window expires', () => {
    let now = 0;
    const limiter = createInMemoryRateLimiter({
      capacity: 1,
      windowMs: 1000,
      now: () => now,
    });

    expect(limiter.consume('a').ok).toBe(true);
    expect(limiter.consume('a').ok).toBe(false);
    now = 1500;
    expect(limiter.consume('a').ok).toBe(true);
  });

  it('keeps separate buckets per identifier', () => {
    const limiter = createInMemoryRateLimiter({ capacity: 1, windowMs: 1000 });
    expect(limiter.consume('a').ok).toBe(true);
    expect(limiter.consume('b').ok).toBe(true);
    expect(limiter.consume('a').ok).toBe(false);
  });
});

describe('callerIdentity', () => {
  it('hashes the authorization header when present', () => {
    const h1 = new Headers({ authorization: 'Bearer xyz' });
    const h2 = new Headers({ authorization: 'Bearer abc' });
    const a = callerIdentity(h1);
    const b = callerIdentity(h2);
    expect(a).not.toBe(b);
    expect(a.startsWith('auth:')).toBe(true);
  });

  it('falls back to the first x-forwarded-for entry', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(callerIdentity(h)).toBe('ip:1.2.3.4');
  });

  it('returns the explicit fallback when no signal exists', () => {
    expect(callerIdentity(new Headers(), 'unknown')).toBe('unknown');
  });
});
