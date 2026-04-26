'use client';

import { useState } from 'react';

type CouponCopyGoButtonProps = {
  couponId: string;
  dealId: string;
  code: string;
};

export function CouponCopyGoButton({ couponId, dealId, code }: CouponCopyGoButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }
        } catch {}

        // best-effort telemetry
        void fetch('/api/coupon-use', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ couponId, dealId }),
        }).catch(() => undefined);

        window.open(`/api/click/${dealId}`, '_blank', 'noopener,noreferrer');
      }}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
    >
      {copied ? 'Copied, opening…' : 'Copy & go'}
    </button>
  );
}
