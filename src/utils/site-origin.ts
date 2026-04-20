import { headers } from 'next/headers';

/** Canonical site origin for share links and absolute URLs (App Router / ``headers()``). */
function isLikelyLocalDevHost(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    lower.startsWith('localhost') ||
    lower.startsWith('127.') ||
    lower.startsWith('[::1]')
  );
}

export async function getSiteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (isLikelyLocalDevHost(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
