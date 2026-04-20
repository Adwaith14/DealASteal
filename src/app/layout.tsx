import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
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
      <body className={`${inter.className} min-h-dvh`}>{children}</body>
    </html>
  );
}
