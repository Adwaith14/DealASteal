import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AffiliateRestPageSchema, type AffiliateRestPage } from './types';

export function parseAffiliateRestFixtureJson(json: unknown): AffiliateRestPage {
  return AffiliateRestPageSchema.parse(json);
}

export function loadAffiliateRestFixtureFile(
  pathFromCwd: string,
  cwd: string = process.cwd()
): AffiliateRestPage {
  const absolute = resolve(cwd, pathFromCwd);
  if (!existsSync(absolute)) {
    throw new Error(
      `Fixture file not found: "${pathFromCwd}" (resolved: ${absolute}). Try fixtures/affiliate-rest-sample.json or fixtures/your-offers.json`
    );
  }
  const raw = readFileSync(absolute, 'utf8');
  const json: unknown = JSON.parse(raw);
  return parseAffiliateRestFixtureJson(json);
}

/** Fixture mode is one page; cap how many offers we normalize in this run. */
export function sliceAffiliateRestPage(page: AffiliateRestPage, limit: number): AffiliateRestPage {
  return {
    ...page,
    offers: page.offers.slice(0, Math.max(0, limit)),
    next_cursor: undefined,
  };
}
