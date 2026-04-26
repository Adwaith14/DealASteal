import 'server-only';
import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client === undefined) {
    const key = process.env.POSTHOG_API_KEY?.trim();
    if (!key || process.env.NODE_ENV === 'test') {
      client = null;
      return null;
    }
    const host = process.env.POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
    client = new PostHog(key, { host, flushAt: 20, flushInterval: 10_000 });
  }
  return client;
}

/** Server-side product analytics (Phase 21). No ``@vercel/analytics``. */
export function captureServerEvent(
  event: string,
  props: Record<string, unknown> & { distinctId?: string }
): void {
  const ph = getClient();
  if (!ph) return;
  const { distinctId, ...properties } = props;
  ph.capture({
    distinctId: typeof distinctId === 'string' && distinctId.length > 0 ? distinctId : 'server',
    event,
    properties,
  });
}
