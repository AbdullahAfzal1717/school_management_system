export default function Loading() {
  return (
    <div className="rounded-md p-4 flex-1 m-4 mt-0 bg-white">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 h-10 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-64 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
