import 'server-only';

/**
 * Minimal structured server logger.
 *
 * Goals:
 *   - One line of JSON per log event so log aggregators (Vercel, Datadog, …)
 *     can index without a custom parser.
 *   - Predictable shape: ``{ ts, level, scope, msg, ctx? }``.
 *   - Built-in PII redaction on a configurable allowlist of keys.
 *   - Test-friendly: when ``NODE_ENV === 'test'`` we silence everything below
 *     ``error`` so noisy intentional-failure tests don't pollute output.
 *
 * The export surface intentionally mirrors ``console`` (``info``, ``warn``,
 * ``error``) so it's a near-drop-in replacement at server callsites.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACTED_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'apiKey',
  'api_key',
  'secret',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'service_role_key',
  'email',
  'phone',
]);

const PLACEHOLDER = '[REDACTED]';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return PLACEHOLDER;
  if (Array.isArray(value)) return value.map((v) => redactValue(v, depth + 1));
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (REDACTED_KEYS.has(k.toLowerCase())) {
        out[k] = PLACEHOLDER;
        continue;
      }
      out[k] = redactValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

function activeLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  if (process.env.NODE_ENV === 'test') return 'error';
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
}

function emit(level: LogLevel, scope: string, msg: string, ctx?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel()]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    ...(ctx !== undefined ? { ctx: redactValue(ctx) } : {}),
  };

  const line = JSON.stringify(record);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export interface ScopedLogger {
  debug(msg: string, ctx?: unknown): void;
  info(msg: string, ctx?: unknown): void;
  warn(msg: string, ctx?: unknown): void;
  error(msg: string, ctx?: unknown): void;
  child(extraScope: string): ScopedLogger;
}

export function createLogger(scope: string): ScopedLogger {
  return {
    debug(msg, ctx) {
      emit('debug', scope, msg, ctx);
    },
    info(msg, ctx) {
      emit('info', scope, msg, ctx);
    },
    warn(msg, ctx) {
      emit('warn', scope, msg, ctx);
    },
    error(msg, ctx) {
      emit('error', scope, msg, ctx);
    },
    child(extraScope) {
      return createLogger(`${scope}:${extraScope}`);
    },
  };
}

/** App-level default logger; prefer ``logger.child('feature')`` over plain ``logger``. */
export const logger = createLogger('app');
