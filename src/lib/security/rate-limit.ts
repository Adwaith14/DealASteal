import 'server-only';

/**
 * In-memory token bucket per identifier (e.g. caller IP or API key).
 *
 * Trade-offs:
 *   - Per-instance only — a multi-instance deployment (Vercel Edge fan-out,
 *     multiple Node containers) will leak through. For production, replace
 *     the in-memory ``Map`` with a Redis/Upstash-backed store. The exposed
 *     ``RateLimiter`` interface is identical so the swap is mechanical.
 *   - Sweep is lazy on read; entries with ``expiresAt`` in the past are
 *     dropped on the next call from that key. A periodic timer is avoided
 *     so the module is safe in serverless cold-start environments.
 */
export interface RateLimitVerdict {
  /** ``true`` when the caller is under quota. */
  ok: boolean;
  /** Tokens left in the current window. */
  remaining: number;
  /** UNIX-millis timestamp at which the bucket fully refills. */
  resetAt: number;
}

export interface RateLimiter {
  consume(key: string, cost?: number): RateLimitVerdict;
}

interface BucketState {
  tokens: number;
  expiresAt: number;
}

export interface RateLimiterOptions {
  /** Maximum tokens (e.g. requests) per window. */
  capacity: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Optional injectable clock for tests. Default: ``Date.now``. */
  now?: () => number;
}

export function createInMemoryRateLimiter({
  capacity,
  windowMs,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  if (capacity <= 0) throw new Error('capacity must be > 0');
  if (windowMs <= 0) throw new Error('windowMs must be > 0');
  const buckets = new Map<string, BucketState>();

  return {
    consume(key: string, cost = 1): RateLimitVerdict {
      const t = now();
      const existing = buckets.get(key);
      if (existing == null || existing.expiresAt <= t) {
        const fresh: BucketState = { tokens: capacity - cost, expiresAt: t + windowMs };
        buckets.set(key, fresh);
        return { ok: fresh.tokens >= 0, remaining: Math.max(0, fresh.tokens), resetAt: fresh.expiresAt };
      }
      if (existing.tokens < cost) {
        return { ok: false, remaining: 0, resetAt: existing.expiresAt };
      }
      existing.tokens -= cost;
      return { ok: true, remaining: existing.tokens, resetAt: existing.expiresAt };
    },
  };
}

/** Best-effort caller identification: prefer the API key (for ingest) then real IP. */
export function callerIdentity(headers: Headers, fallback = 'anon'): string {
  const auth = headers.get('authorization');
  if (auth) {
    return `auth:${hashIdentity(auth)}`;
  }
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const real = headers.get('x-real-ip');
  if (real) return `ip:${real.trim()}`;
  return fallback;
}

/** FNV-1a 32-bit; not cryptographic, just collision-resistant enough for log keying. */
function hashIdentity(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
