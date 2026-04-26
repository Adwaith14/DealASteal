import { describe, expect, it } from 'vitest';
import {
  defaultAcceptAll,
  defaultDeniedNonEssential,
  parseConsentCookie,
  serializeConsentCookie,
} from './cookie-store';

describe('parseConsentCookie / serializeConsentCookie', () => {
  it('round-trips a valid decision', () => {
    const d = defaultDeniedNonEssential();
    const raw = serializeConsentCookie(d);
    expect(parseConsentCookie(raw)).toEqual(d);
  });

  it('returns null for garbage', () => {
    expect(parseConsentCookie('%%%')).toBeNull();
    expect(parseConsentCookie(null)).toBeNull();
  });

  it('accept all enables optional flags', () => {
    const d = defaultAcceptAll();
    expect(d.analytics).toBe(true);
    expect(d.marketing).toBe(true);
  });
});
