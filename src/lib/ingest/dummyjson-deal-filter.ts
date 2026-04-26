/**
 * Identifies catalog rows seeded from DummyJSON (`ingest_external_id` prefix).
 * Used by operator scripts when switching to a live affiliate feed.
 */
export function isDummyJsonIngestExternalId(value: string | null | undefined): boolean {
  const s = value?.trim() ?? '';
  return s.length > 0 && s.toLowerCase().startsWith('dummyjson:');
}
