import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Root ``not-found`` replaces the entire document (it does **not** use ``layout.tsx``).
 * Keep this module dependency-light so Webpack’s internal ``_not-found`` chunk stays stable
 * (avoids ``__webpack_modules__[moduleId] is not a function`` from default/generated stubs).
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-dvh bg-[#f5f5f5] antialiased text-gray-900`}>
        <nav className="border-b border-gray-200 bg-white py-4 shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
            <span className="text-lg font-extrabold tracking-tight text-gray-900">
              <span className="text-[#d32f2f]">Deal</span>ASteal
            </span>
          </div>
        </nav>
        <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Page not found</h1>
          <p className="mt-3 max-w-md text-pretty text-gray-600">
            The page you requested does not exist or has been moved.
          </p>
          <a
            href="/"
            className="mt-10 inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Back to deals
          </a>
        </div>
      </body>
    </html>
  );
}
