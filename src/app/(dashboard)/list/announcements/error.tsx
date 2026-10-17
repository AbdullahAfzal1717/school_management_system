"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="m-2 rounded-md bg-white p-4 sm:m-4 sm:p-6">
      <h2 className="text-lg font-semibold">Announcements could not be loaded</h2>
      <p className="mt-2 text-sm text-gray-500">
        Check the database connection, then try again.
      </p>
      <button type="button" className="btn mt-4 bg-AbSky px-4 py-2 text-sm font-medium" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
