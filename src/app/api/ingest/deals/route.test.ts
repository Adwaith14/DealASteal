/** @vitest-environment node */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Deal } from '@/types/database.types';
import { POST } from './route';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

describe('POST /api/ingest/deals', () => {
  beforeEach(() => {
    vi.stubEnv('INGESTION_API_KEY', 'test-ingestion-key');
    mockFrom.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 when Authorization is invalid', async () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deal',
        original_price: 100,
        discount_price: 80,
        affiliate_url: 'https://example.com',
        is_loot_deal: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 400 when JSON is invalid', async () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: '{',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 500 JSON without detail when insert fails outside development', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: 'constraint violation' },
          })
        ),
      })),
    }));

    mockFrom.mockReturnValue({
      insert: insertMock,
    });

    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deal',
        original_price: 100,
        discount_price: 80,
        affiliate_url: 'https://example.com',
        is_loot_deal: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Database insert failed');
    expect(json.detail).toBeUndefined();
  });

  it('returns 500 JSON with insert error detail in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: 'row-level security policy' },
          })
        ),
      })),
    }));

    mockFrom.mockReturnValue({
      insert: insertMock,
    });

    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deal',
        original_price: 100,
        discount_price: 80,
        affiliate_url: 'https://example.com',
        is_loot_deal: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Database insert failed');
    expect(json.detail).toBe('row-level security policy');
  });

  it('returns 400 when validation fails', async () => {
    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Validation failed');
    expect(json.issues).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 201 with inserted deal data on success', async () => {
    const inserted: Deal = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Deal',
      description: null,
      original_price: 100,
      discount_price: 80,
      discount_percentage: 20,
      affiliate_url: 'https://example.com',
      image_url: null,
      is_loot_deal: false,
      is_active: true,
      expires_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      category_slug: null,
      ingest_external_id: null,
    };

    const insertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: inserted, error: null })
        ),
      })),
    }));

    mockFrom.mockReturnValue({
      insert: insertMock,
    });

    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deal',
        original_price: 100,
        discount_price: 80,
        affiliate_url: 'https://example.com',
        is_loot_deal: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(inserted);
    expect(mockFrom).toHaveBeenCalledWith('deals');

    expect(insertMock).toHaveBeenCalled();
    const [[insertedRow]] = insertMock.mock.calls as unknown[][];
    expect(insertedRow).toBeDefined();
    expect(insertedRow as Record<string, unknown>).not.toHaveProperty(
      'discount_percentage'
    );
    expect(insertedRow as Record<string, unknown>).not.toHaveProperty('id');
    expect(insertedRow as Record<string, unknown>).not.toHaveProperty(
      'created_at'
    );
  });

  it('returns 200 and uses upsert when ingest_external_id is set', async () => {
    const upserted: Deal = {
      id: '660e8400-e29b-41d4-a716-446655440002',
      merchant_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Deal',
      description: null,
      original_price: 100,
      discount_price: 80,
      discount_percentage: 20,
      affiliate_url: 'https://example.com',
      image_url: null,
      is_loot_deal: false,
      is_active: true,
      expires_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      category_slug: null,
      ingest_external_id: 'dummyjson:1',
    };

    const upsertMock = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: upserted, error: null })
        ),
      })),
    }));

    mockFrom.mockReturnValue({
      upsert: upsertMock,
    });

    const request = new NextRequest('http://localhost/api/ingest/deals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-ingestion-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Deal',
        original_price: 100,
        discount_price: 80,
        affiliate_url: 'https://example.com',
        is_loot_deal: false,
        ingest_external_id: 'dummyjson:1',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(upserted);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ ingest_external_id: 'dummyjson:1' }),
      { onConflict: 'ingest_external_id' }
    );
  });
});
