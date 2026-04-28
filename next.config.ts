import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import { buildSerwistPrecacheEntries } from './build-serwist-precache-entries';

type RemotePattern = NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
>[number];

/**
 * Image CDNs we authorise for product photos. Update when onboarding new
 * affiliate networks. Globs use Next.js ``hostname`` patterns: a leading
 * ``**`` matches any sub-domain.
 *
 * NOTE: Unknown hosts will fail at ``next/image`` rewrite, not in product
 * code — that's the desired enforcement: a vendor can't sneak hot-linked
 * tracking pixels into our markup.
 */
const AFFILIATE_IMAGE_HOSTS: ReadonlyArray<{
  hostname: string;
  protocol?: 'https' | 'http';
}> = [
  // Amazon (PA-API thumbnails)
  { hostname: 'm.media-amazon.com' },
  { hostname: 'images-na.ssl-images-amazon.com' },
  { hostname: 'images-eu.ssl-images-amazon.com' },
  // Walmart Open API
  { hostname: 'i5.walmartimages.com' },
  { hostname: 'i5.walmartimages.ca' },
  // Target
  { hostname: 'target.scene7.com' },
  // Best Buy
  { hostname: 'pisces.bbystatic.com' },
  // eBay (Browse API)
  { hostname: 'i.ebayimg.com' },
  // Newegg
  { hostname: 'c1.neweggimages.com' },
  { hostname: 'images10.newegg.com' },
  // Macy's
  { hostname: 'slimages.macysassets.com' },
  // Generic asset CDNs we ingest from
  { hostname: 'cdn.dummyjson.com' },
  { hostname: 'images.unsplash.com' },
];

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

  for (const host of AFFILIATE_IMAGE_HOSTS) {
    patterns.push({
      protocol: host.protocol ?? 'https',
      hostname: host.hostname,
      pathname: '/**',
    });
  }

  patterns.push({
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  });

  return patterns;
}

/**
 * Strict baseline Content-Security-Policy. We do **not** allow ``unsafe-inline``
 * for scripts; Next.js inlines a hashed bootstrap and that's allowed via
 * its built-in nonce in production. ``unsafe-inline`` is whitelisted for
 * styles only because Tailwind/JIT injects critical CSS at runtime.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Next.js dev needs ``unsafe-eval`` for HMR; production can drop it.
  process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Supabase REST + Realtime + Resend egress + Web Push subscription endpoints.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://web.push.apple.com https://updates.push.services.mozilla.com https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://android.googleapis.com",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const serwistRevision =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim().slice(0, 40) ||
  process.env.npm_package_version ||
  'local';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  additionalPrecacheEntries: buildSerwistPrecacheEntries({
    projectRoot: process.cwd(),
    basePath: '/',
    offlineRevision: serwistRevision,
  }),
  maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  /**
   * Webpack 5 logs ``[PackFileCacheStrategy] Serializing big strings`` when the
   * filesystem cache packs large strings (Serwist precache manifest, Sentry, big
   * chunk graphs). It is a performance hint for webpack itself, not a broken build.
   * Raising infra log level keeps CI/local output readable without disabling caching.
   */
  webpack: (config) => {
    config.infrastructureLogging = {
      ...(config.infrastructureLogging ?? {}),
      level: 'error',
    };
    return config;
  },
  /**
   * Prevent artifact races between long-lived `next dev` and one-off
   * `next build`/other commands by isolating development output.
   */
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    remotePatterns: buildImageRemotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  /** Fewer moving parts in dev; avoids flaky route indicator + devtools coupling. */
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withSentryConfig(withSerwist(nextConfig), {
  silent: true,
});
