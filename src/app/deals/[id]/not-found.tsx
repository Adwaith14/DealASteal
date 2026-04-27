export default function DealNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f5f5] px-4 py-12 text-center text-gray-900">
      <h1 className="text-2xl font-extrabold text-gray-900">Deal not found</h1>
      <p className="mt-2 max-w-md text-gray-600">
        This deal may have expired or been deactivated. Browse current offers on the home feed.
      </p>
      <a
        href="/"
        className="mt-8 inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Back to deals
      </a>
    </div>
  );
}
