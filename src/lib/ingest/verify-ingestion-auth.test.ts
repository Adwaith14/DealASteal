/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { isValidIngestionAuth } from './verify-ingestion-auth';

describe('isValidIngestionAuth', () => {
  it('returns true for an exact Bearer match', () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      headers: { authorization: 'Bearer secret-key' },
    });

    expect(isValidIngestionAuth(request, 'secret-key')).toBe(true);
  });

  it('returns false when the API key is missing', () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      headers: { authorization: 'Bearer secret-key' },
    });

    expect(isValidIngestionAuth(request, undefined)).toBe(false);
  });

  it('returns false when the Authorization header is missing', () => {
    const request = new NextRequest('http://localhost/api/ingest/deals');

    expect(isValidIngestionAuth(request, 'secret-key')).toBe(false);
  });

  it('returns false when the Bearer token does not match', () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      headers: { authorization: 'Bearer wrong' },
    });

    expect(isValidIngestionAuth(request, 'secret-key')).toBe(false);
  });
});
