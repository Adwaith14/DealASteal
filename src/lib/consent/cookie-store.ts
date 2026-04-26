export const CONSENT_COOKIE_NAME = 'dealasteal_consent_v1';

export const CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~13 months

export type ConsentDecision = {
  /** ISO timestamp when the user chose. */
  decidedAt: string;
  /** Strictly necessary (session, security) — always true once decided. */
  necessary: true;
  /** Optional analytics (product telemetry you add later). */
  analytics: boolean;
  /** Optional marketing / remarketing cookies. */
  marketing: boolean;
  /** Schema version for future migrations. */
  version: 1;
};

export function defaultDeniedNonEssential(): ConsentDecision {
  return {
    decidedAt: new Date().toISOString(),
    necessary: true,
    analytics: false,
    marketing: false,
    version: 1,
  };
}

export function defaultAcceptAll(): ConsentDecision {
  return {
    decidedAt: new Date().toISOString(),
    necessary: true,
    analytics: true,
    marketing: true,
    version: 1,
  };
}

function isConsentDecision(value: unknown): value is ConsentDecision {
  if (value == null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    o.version === 1 &&
    o.necessary === true &&
    typeof o.decidedAt === 'string' &&
    typeof o.analytics === 'boolean' &&
    typeof o.marketing === 'boolean'
  );
}

/** Parse JSON stored in the consent cookie (or null if missing/invalid). */
export function parseConsentCookie(raw: string | null | undefined): ConsentDecision | null {
  if (raw == null || raw.trim() === '') return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    const parsed = JSON.parse(decoded) as unknown;
    return isConsentDecision(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeConsentCookie(decision: ConsentDecision): string {
  return encodeURIComponent(JSON.stringify(decision));
}

/** Cookie ``Set-Cookie`` value fragment (name=value only — set via Response API). */
export function buildConsentCookieValue(decision: ConsentDecision): string {
  return `${CONSENT_COOKIE_NAME}=${serializeConsentCookie(decision)}`;
}
