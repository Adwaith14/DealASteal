export type PostgrestErrorLike = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

export function logPostgrestError(scope: string, error: PostgrestErrorLike): void {
  console.error(`[DealASteal] ${scope}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
