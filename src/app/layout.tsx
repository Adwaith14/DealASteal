import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { getPublicSiteBaseUrl } from '@/lib/site-base-url';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteBaseUrl()),
  title: {
    default: 'DealASteal | Verified deals & discounts',
    template: '%s | DealASteal',
  },
  description:
    'Discover verified deals and discounts from top stores. Save on electronics, fashion, home & more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-dvh min-w-0 overflow-x-clip`}>{children}</body>
    </html>
  );
}
