import 'server-only';
import { logger } from '@/lib/observability/logger';

export type PostgrestErrorLike = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const log = logger.child('postgrest');

export function logPostgrestError(scope: string, error: PostgrestErrorLike): void {
  log.error(scope, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
