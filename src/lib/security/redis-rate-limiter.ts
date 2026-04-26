import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/observability/logger';
import type { RateLimiter, RateLimitVerdict } from '@/lib/security/rate-limit';

const log = logger.child('security:redis-rate-limit');

/** Upstash ``Duration`` template type (``${number} s`` / ``${number} m`` / …). */
function durationFromMs(windowMs: number): `${number} s` | `${number} m` | `${number} h` {
  const s = Math.max(1, Math.ceil(windowMs / 1000));
  if (s % 3600 === 0) return `${s / 3600} h` as `${number} h`;
  if (s % 60 === 0) return `${s / 60} m` as `${number} m`;
  return `${s} s` as `${number} s`;
}

/**
 * Distributed token bucket via Upstash Redis + {@link Ratelimit}.
 * On Redis errors we **fail open** (allow traffic) so a cache outage does not take the API down.
 */
export function createUpstashRateLimiter(options: {
  url: string;
  token: string;
  capacity: number;
  windowMs: number;
  prefix: string;
}): RateLimiter {
  const redis = new Redis({ url: options.url, token: options.token });
  const ratelimit = new Ratelimit({
    redis,
    prefix: options.prefix,
    limiter: Ratelimit.slidingWindow(options.capacity, durationFromMs(options.windowMs)),
    timeout: 2000,
  });

  return {
    async consume(key: string, cost = 1): Promise<RateLimitVerdict> {
      const safeCost = Math.max(1, Math.floor(cost));
      try {
        let last: Awaited<ReturnType<typeof ratelimit.limit>> | null = null;
        for (let i = 0; i < safeCost; i += 1) {
          last = await ratelimit.limit(key);
          if (!last.success) {
            await last.pending.catch(() => undefined);
            return {
              ok: false,
              remaining: 0,
              resetAt: last.reset,
            };
          }
        }
        if (last) {
          await last.pending.catch(() => undefined);
          return {
            ok: true,
            remaining: last.remaining,
            resetAt: last.reset,
          };
        }
        return {
          ok: true,
          remaining: options.capacity,
          resetAt: Date.now() + options.windowMs,
        };
      } catch (cause) {
        log.warn('redis rate limit failed; fail-open', {
          message: cause instanceof Error ? cause.message : 'unknown',
        });
        return {
          ok: true,
          remaining: options.capacity,
          resetAt: Date.now() + options.windowMs,
        };
      }
    },
  };
}
