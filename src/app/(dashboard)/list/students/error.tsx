"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="m-4 rounded-md bg-white p-6">
      <h2 className="text-lg font-semibold">Students could not be loaded</h2>
      <p className="mt-2 text-sm text-gray-500">
        Check that the PostgreSQL container is running, then try again.
      </p>
      <button
        className="mt-4 rounded-md bg-AbSky px-4 py-2 text-sm font-medium"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
