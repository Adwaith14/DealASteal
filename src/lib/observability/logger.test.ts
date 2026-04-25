import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
  const originalLevel = process.env.LOG_LEVEL;
  let logSpy: MockInstance;
  let warnSpy: MockInstance;
  let errorSpy: MockInstance;

  beforeEach(() => {
    process.env.LOG_LEVEL = 'debug';
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalLevel;
    vi.restoreAllMocks();
  });

  it('emits a single JSON line with scope and message', () => {
    const log = createLogger('test');
    log.info('hello');
    const call = logSpy.mock.calls[0]?.[0];
    expect(typeof call).toBe('string');
    const parsed = JSON.parse(call as string) as Record<string, unknown>;
    expect(parsed.scope).toBe('test');
    expect(parsed.msg).toBe('hello');
    expect(parsed.level).toBe('info');
    expect(typeof parsed.ts).toBe('string');
  });

  it('redacts sensitive keys (email, password, authorization, …)', () => {
    const log = createLogger('test');
    log.warn('with-pii', {
      email: 'jane@example.com',
      password: 'hunter2',
      authorization: 'Bearer xyz',
      nested: { token: 'tok', ok: 1 },
    });
    const call = warnSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(call) as Record<string, unknown>;
    const ctx = parsed.ctx as Record<string, unknown>;
    expect(ctx.email).toBe('[REDACTED]');
    expect(ctx.password).toBe('[REDACTED]');
    expect(ctx.authorization).toBe('[REDACTED]');
    expect((ctx.nested as Record<string, unknown>).token).toBe('[REDACTED]');
    expect((ctx.nested as Record<string, unknown>).ok).toBe(1);
  });

  it('respects LOG_LEVEL filter', () => {
    process.env.LOG_LEVEL = 'warn';
    const log = createLogger('test');
    log.debug('hidden');
    log.info('hidden');
    log.warn('shown');
    expect(logSpy.mock.calls.length).toBe(0);
    expect(warnSpy.mock.calls.length).toBe(1);
  });

  it('child() concatenates scopes', () => {
    const root = createLogger('root');
    const child = root.child('feature');
    child.error('fail');
    const call = errorSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(call) as Record<string, unknown>;
    expect(parsed.scope).toBe('root:feature');
  });
});
