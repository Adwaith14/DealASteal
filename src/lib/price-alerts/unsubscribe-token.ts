import { createHmac, timingSafeEqual } from 'node:crypto';

const SEP = '.';

function readSecret(): string {
  const s = process.env.PRICE_ALERT_UNSUBSCRIBE_SECRET?.trim();
  return s ?? '';
}

/**
 * HMAC over alert id (no expiry). One-click disable without a session.
 */
export function signPriceAlertUnsubscribeToken(alertId: string, secret: string = readSecret()): string {
  if (!secret) {
    throw new Error('PRICE_ALERT_UNSUBSCRIBE_SECRET is not set');
  }
  const mac = createHmac('sha256', secret).update(alertId, 'utf8').digest('base64url');
  return `${Buffer.from(alertId, 'utf8').toString('base64url')}${SEP}${mac}`;
}

/**
 * @returns alert id, or `null` if invalid
 */
export function verifyPriceAlertUnsubscribeToken(
  token: string,
  secret: string = readSecret()
): string | null {
  if (!token || !secret) {
    return null;
  }
  const i = token.indexOf(SEP);
  if (i < 0) {
    return null;
  }
  const idPart = token.slice(0, i);
  const sigPart = token.slice(i + 1);
  let alertId: string;
  try {
    alertId = Buffer.from(idPart, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alertId)) {
    return null;
  }
  const expected = createHmac('sha256', secret).update(alertId, 'utf8').digest('base64url');
  const a = Buffer.from(sigPart, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  return alertId;
}
