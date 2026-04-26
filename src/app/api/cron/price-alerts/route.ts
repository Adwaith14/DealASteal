import { NextResponse, type NextRequest } from 'next/server';
import { runPriceAlertCron } from '@/lib/price-alerts/run-cron';
import { logger } from '@/lib/observability/logger';

export const runtime = 'nodejs';

const log = logger.child('api/cron/price-alerts');

function readEnv(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export async function GET(request: NextRequest) {
  const expected = readEnv('CRON_SECRET');
  if (!expected) {
    return NextResponse.json({ error: 'CRON not configured' }, { status: 503 });
  }
  const auth = request.headers.get('authorization')?.trim() ?? '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runPriceAlertCron();
    log.info('cron run', {
      checked: result.checked,
      notified: result.notified,
      pushSent: result.pushSent,
      pushErrors: result.pushErrors,
      errors: result.errors,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    log.error('cron failed', { err: msg });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
