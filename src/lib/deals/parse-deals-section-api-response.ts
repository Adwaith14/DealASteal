import type { SectionResult } from '@/services/api/deals-sections';

export type ParsedDealsSectionResponse =
  | { ok: true; data: SectionResult }
  | { ok: false; message: string };

function isSectionResultShape(
  body: unknown
): body is { deals: unknown[]; total: number; fetchError?: unknown } {
  if (typeof body !== 'object' || body === null) return false;
  const o = body as Record<string, unknown>;
  return Array.isArray(o.deals) && typeof o.total === 'number';
}

/**
 * Normalizes /api/deals/{latest,top,hot} JSON: rejects malformed bodies, surfaces ``fetchError``,
 * and maps non-OK HTTP to a message (routes often still return JSON on 200 with ``fetchError``).
 */
export async function parseDealsSectionApiResponse(
  res: Response
): Promise<ParsedDealsSectionResponse> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      message: !res.ok
        ? `Could not load deals (HTTP ${res.status}).`
        : 'Invalid response from server.',
    };
  }

  if (!isSectionResultShape(body)) {
    return {
      ok: false,
      message: !res.ok
        ? `Could not load deals (HTTP ${res.status}).`
        : 'Invalid response from server.',
    };
  }

  const data: SectionResult = {
    deals: body.deals as SectionResult['deals'],
    total: body.total,
    fetchError:
      typeof body.fetchError === 'string' && body.fetchError.trim().length > 0
        ? body.fetchError.trim()
        : undefined,
  };

  const msg =
    data.fetchError ?? (!res.ok ? `Could not load deals (HTTP ${res.status}).` : null);
  if (msg) {
    return { ok: false, message: msg };
  }

  return { ok: true, data };
}
