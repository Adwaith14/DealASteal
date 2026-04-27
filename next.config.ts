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

  patterns.push({
    protocol: 'https',
    hostname: 'images.unsplash.com',
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
};

export default nextConfig;
