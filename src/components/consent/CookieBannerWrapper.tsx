import { cookies, headers } from 'next/headers';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { normalizeCountryCode } from '@/lib/consent/geo';

/** Server wrapper: geo hint from edge headers + middleware ``das_country`` cookie. */
export async function CookieBannerWrapper() {
  const h = await headers();
  const c = await cookies();
  const fromCookie = normalizeCountryCode(c.get('das_country')?.value);
  const fromHeader = normalizeCountryCode(
    h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry') ?? undefined
  );
  const serverCountry = fromCookie || fromHeader;

  return <CookieBanner serverCountry={serverCountry} />;
}
