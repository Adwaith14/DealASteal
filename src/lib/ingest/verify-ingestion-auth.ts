import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export function isValidIngestionAuth(
  request: NextRequest,
  apiKey: string | undefined
): boolean {
  if (apiKey == null) {
    return false;
  }

  const expected = `Bearer ${apiKey}`;
  const provided = request.headers.get('authorization');

  if (provided == null) {
    return false;
  }

  if (provided.length !== expected.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(provided, 'utf8'),
      Buffer.from(expected, 'utf8')
    );
  } catch {
    return false;
  }
}
