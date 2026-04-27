/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadAffiliateRestFixtureFile,
  parseAffiliateRestFixtureJson,
  sliceAffiliateRestPage,
} from './load-fixture';

describe('loadAffiliateRestFixtureFile', () => {
  it('throws a helpful message when the file is missing', () => {
    expect(() => loadAffiliateRestFixtureFile('fixtures/does-not-exist-xyz.json')).toThrow(
      /Fixture file not found/
    );
  });

  it('parses JSON that matches AffiliateRestPageSchema', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dealasteal-aff-'));
    const file = join(dir, 'offers.json');
    writeFileSync(
      file,
      JSON.stringify({
        offers: [
          {
            external_id: 'x-1',
            title: 'Item',
            sale_price: 5,
            affiliate_url: 'https://example.com/o1',
          },
        ],
      }),
      'utf8'
    );

    const page = loadAffiliateRestFixtureFile(file, dir);
    expect(page.offers).toHaveLength(1);
    expect(page.offers[0]?.title).toBe('Item');
  });
});

describe('parseAffiliateRestFixtureJson', () => {
  it('rejects invalid shapes', () => {
    expect(() => parseAffiliateRestFixtureJson({})).toThrow();
  });
});

describe('sliceAffiliateRestPage', () => {
  it('caps offers and clears cursor', () => {
    const page = sliceAffiliateRestPage(
      {
        offers: [
          {
            external_id: 'a',
            title: 'A',
            sale_price: 1,
            affiliate_url: 'https://example.com/a',
          },
          {
            external_id: 'b',
            title: 'B',
            sale_price: 2,
            affiliate_url: 'https://example.com/b',
          },
        ],
        next_cursor: 'more',
      },
      1
    );
    expect(page.offers).toHaveLength(1);
    expect(page.next_cursor).toBeUndefined();
  });
});
