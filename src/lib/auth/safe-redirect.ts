/**
 * Sanitises the ``next`` query parameter used to redirect after auth flows.
 *
 * ``startsWith('/')`` alone is not enough: ``//evil.com/path`` and
 * ``/\evil.com`` parse as protocol-relative URLs and would let an attacker
 * bounce a logged-in user to an arbitrary domain. Browsers also resolve
 * backslashes as forward slashes in some contexts, hence the explicit ban.
 *
 * Returns the path-only fragment of ``raw`` when it points within the same
 * origin, otherwise ``fallback`` (default ``"/"``).
 */
export function safeRelativePath(
  raw: string | null | undefined,
  fallback = '/'
): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.startsWith('/\\')) return fallback;
  if (trimmed.includes('\\')) return fallback;

  // Reject explicit scheme-style strings the browser may interpret weirdly.
  if (/^\/+\w+:/i.test(trimmed)) return fallback;

  // Resolve against a placeholder origin to verify URL parsing
  // produces a same-origin pathname.
  try {
    const placeholder = 'https://internal.local';
    const url = new URL(trimmed, placeholder);
    if (url.origin !== placeholder) return fallback;
    if (!url.pathname.startsWith('/')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
