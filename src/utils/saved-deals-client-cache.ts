/**
 * Dedupe parallel reads of ``/api/me/saved-deals`` across many ``SaveDealButton`` instances.
 */
let resolvedIds: string[] | null = null;
let inflight: Promise<string[]> | null = null;

export function invalidateSavedDealIdsCache(): void {
  resolvedIds = null;
  inflight = null;
}

export async function loadSavedDealIdsCached(): Promise<string[]> {
  if (resolvedIds) {
    return resolvedIds;
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch('/api/me/saved-deals', { credentials: 'same-origin' });
        if (!res.ok) {
          resolvedIds = [];
          return [];
        }
        const body = (await res.json()) as { dealIds?: string[] };
        const ids = Array.isArray(body.dealIds) ? body.dealIds : [];
        resolvedIds = ids;
        return ids;
      } catch {
        resolvedIds = [];
        return [];
      }
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
