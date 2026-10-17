export default function Loading() {
  return (
    <div className="m-2 mt-0 flex-1 rounded-md bg-white p-3 sm:m-4 sm:p-4">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-10 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-64 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
