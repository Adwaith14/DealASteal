import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">You are offline</h1>
      <p className="text-slate-600">
        DealASteal needs a network connection for fresh deals. You can still open pages you visited recently.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Try home
      </Link>
    </main>
  );
}
