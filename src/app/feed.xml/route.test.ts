/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /feed.xml', () => {
  it('returns RSS with blog items', async () => {
    const res = await GET(new Request('http://localhost:3000/feed.xml'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/rss|xml/i);
    const text = await res.text();
    expect(text).toContain('<rss version="2.0">');
    expect(text).toContain('<item>');
    expect(text).toContain('spot-real-discounts');
  });
});
