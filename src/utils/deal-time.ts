/**
 * Human-readable “listed” time for deal cards (reference-style “12h ago”).
 * Uses wall-clock ``nowMs`` — in SSR, render inside an element with ``suppressHydrationWarning`` if ``nowMs`` is not fixed.
 */
export function formatDealListedAgo(iso: string, nowMs: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const sec = Math.floor((nowMs - then) / 1000);
  if (sec < 45) {
    return 'Just now';
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 48) {
    return `${hr}h ago`;
  }
  const d = Math.floor(hr / 24);
  if (d < 14) {
    return `${d}d ago`;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

/**
 * Short countdown for cards with ``expires_at`` in the near future.
 * Same SSR note as ``formatDealListedAgo`` — pair with ``suppressHydrationWarning`` when rendered from the server.
 */
export function formatDealEndsIn(iso: string | null, nowMs: number = Date.now()): string | null {
  if (iso == null || iso.trim() === '') {
    return null;
  }
  const end = new Date(iso).getTime();
  if (Number.isNaN(end) || end <= nowMs) {
    return null;
  }
  const ms = end - nowMs;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 168) {
    return null;
  }
  return `Ends in ${h}h ${m}m`;
}

/**
 * Countdown ``HH : MM : SS`` from total time remaining (hours not capped at 24).
 * Returns null when ``iso`` is missing, invalid, or already past.
 */
export function formatDealCountdownColons(
  iso: string | null,
  nowMs: number = Date.now()
): string | null {
  if (iso == null || iso.trim() === '') {
    return null;
  }
  const end = new Date(iso).getTime();
  if (Number.isNaN(end) || end <= nowMs) {
    return null;
  }
  const totalSec = Math.floor((end - nowMs) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}
