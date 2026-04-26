'use client';

import { SerwistProvider } from '@serwist/next/react';
import type { ReactNode } from 'react';

export function AppSerwistProvider({ children }: { children: ReactNode }) {
  const disable = process.env.NODE_ENV === 'development';
  return (
    <SerwistProvider swUrl="/sw.js" disable={disable}>
      {children}
    </SerwistProvider>
  );
}
