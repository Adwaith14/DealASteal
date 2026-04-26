import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

type PrecacheEntry = { url: string; revision: string };

function listPublicFilesRecursive(publicDir: string, relativeDir = ''): string[] {
  const absDir = path.join(publicDir, relativeDir);
  if (!fs.existsSync(absDir)) {
    return [];
  }
  const out: string[] = [];
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = path.posix.join(relativeDir.replace(/\\/g, '/'), ent.name);
    if (ent.isDirectory()) {
      out.push(...listPublicFilesRecursive(publicDir, rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

function shouldIgnorePublicAsset(relativePosix: string): boolean {
  const base = path.posix.basename(relativePosix);
  if (base === 'sw.js' || base === 'sw.js.map') return true;
  if (base.startsWith('swe-worker-')) return true;
  return false;
}

/**
 * Serwist uses either `additionalPrecacheEntries` **or** a public-dir glob — not both.
 * We mirror the glob here and append the offline shell route.
 */
export function buildSerwistPrecacheEntries(params: {
  projectRoot: string;
  basePath: string;
  offlineRevision: string;
}): PrecacheEntry[] {
  const { projectRoot, basePath, offlineRevision } = params;
  const publicDir = path.join(projectRoot, 'public');
  const files = listPublicFilesRecursive(publicDir).filter((f) => !shouldIgnorePublicAsset(f));
  const entries: PrecacheEntry[] = files.map((f) => {
    const abs = path.join(publicDir, ...f.split('/'));
    const revision = crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex');
    const url = path.posix.join(basePath, f).replace(/\/+/g, '/') || `/${f}`;
    return { url, revision };
  });
  entries.push({
    url: path.posix.join(basePath, '~offline').replace(/\/+/g, '/') || '/~offline',
    revision: offlineRevision,
  });
  return entries;
}
