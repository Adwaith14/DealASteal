/**
 * ISO 3166-1 alpha-2 codes treated as EEA + UK + CH for GDPR-style consent UX.
 * Not legal advice — tune with counsel before launch.
 */
const EEA_LIKE = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IS',
  'IE',
  'IT',
  'LV',
  'LI',
  'LT',
  'LU',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'CH',
  'GB',
  'UK',
]);

export function normalizeCountryCode(raw: string | null | undefined): string {
  if (raw == null) return '';
  return raw.trim().toUpperCase().slice(0, 2);
}

export function isEeaLikeCountry(countryCode: string | null | undefined): boolean {
  const c = normalizeCountryCode(countryCode);
  if (!c) return false;
  return EEA_LIKE.has(c);
}

export function isUnitedStates(countryCode: string | null | undefined): boolean {
  return normalizeCountryCode(countryCode) === 'US';
}
