/**
 * Read-heavy load against ``/api/deals/hot`` (Phase 22 baseline).
 *
 * Usage:
 *   LOAD_TEST_BASE_URL=https://your-preview.vercel.app npm run load:deals
 *
 * Defaults: 20 connections, 10s, localhost:3000.
 */
import autocannon from 'autocannon';

const base = (process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const duration = Number(process.env.LOAD_TEST_DURATION_SECONDS ?? 10);
const connections = Number(process.env.LOAD_TEST_CONNECTIONS ?? 20);

const res = await autocannon({
  url: `${base}/api/deals/hot`,
  connections,
  duration,
});

const out = {
  url: `${base}/api/deals/hot`,
  durationSeconds: duration,
  connections,
  requestsPerSec: res.throughput.mean,
  latencyMeanMs: res.latency.mean,
  errors: res.errors,
  statusCodes: res.statusCodeStats,
};

// eslint-disable-next-line no-console -- CLI script
console.log(JSON.stringify(out, null, 2));
