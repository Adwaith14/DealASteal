/**
 * Deduplicates non-empty section error strings (same DB issue often surfaces on every query).
 */
export function collectUniqueSectionFetchErrors(
  ...messages: (string | undefined | null)[]
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of messages) {
    const t = typeof raw === 'string' ? raw.trim() : '';
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
