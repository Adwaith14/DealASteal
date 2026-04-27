'use client';

import { useEffect, useState } from 'react';
import { formatDealCountdownColons } from '@/utils/deal-time';

type FlashSaleCountdownProps = {
  expiresAt: string | null;
};

export function FlashSaleCountdown({ expiresAt }: FlashSaleCountdownProps) {
  const [label, setLabel] = useState<string | null>(() =>
    formatDealCountdownColons(expiresAt)
  );

  useEffect(() => {
    const tick = () => setLabel(formatDealCountdownColons(expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (label == null) {
    return <span className="text-xs font-semibold text-gray-500">—</span>;
  }

  return (
    <span className="font-mono text-xs font-bold tabular-nums text-red-600" suppressHydrationWarning>
      {label}
    </span>
  );
}
