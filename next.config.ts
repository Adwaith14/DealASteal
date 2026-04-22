import type { NextConfig } from 'next';

type RemotePattern = NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
>[number];

function buildImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      const protocol = url.protocol === 'http:' ? 'http' : 'https';
      patterns.push({
        protocol,
        hostname: url.hostname,
        pathname: '/**',
      });
    } catch {
      // Invalid URL at build time: skip; misconfiguration is surfaced elsewhere.
    }
  }

  // DummyJSON demo ingest (`scripts/dummyjson-ingest.ts`) uses this CDN for thumbnails.
  patterns.push({
    protocol: 'https',
    hostname: 'cdn.dummyjson.com',
    pathname: '/**',
  });

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildImageRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  /** Fewer moving parts in dev; avoids flaky route indicator + devtools coupling. */
  devIndicators: false,
  /**
   * Segment explorer injects RSC dev-only modules that can desync during rapid HMR,
   * producing "SegmentViewNode … not in React Client Manifest" and broken chunk ids.
   * @see https://github.com/vercel/next.js/pull/81737
   */
  experimental: {
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
