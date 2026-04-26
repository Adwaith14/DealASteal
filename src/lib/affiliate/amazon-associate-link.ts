const AMAZON_HOST =
  /^(?:www\.)?amazon\.(?:com|co\.uk|de|fr|es|it|nl|se|pl|com\.be|com\.tr|ca|com\.mx|com\.br|in|sg|com\.au|co\.jp|ae|sa|eg)$/i;

/**
 * Ensures Amazon ``tag=`` (Associate ID) is present on outbound URLs.
 * Skips when a tag already exists or hostname is not Amazon retail.
 */
export function withAmazonAssociateTag(
  rawUrl: string,
  associateTag: string | null | undefined
): string {
  const tag = associateTag?.trim();
  if (!tag) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!AMAZON_HOST.test(u.hostname)) return rawUrl;
    if (u.searchParams.get('tag')) return rawUrl;
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export function readAmazonAssociateTagFromEnv(): string | undefined {
  const a = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG?.trim();
  const b = process.env.AMAZON_ASSOCIATE_TAG?.trim();
  return a || b || undefined;
}
