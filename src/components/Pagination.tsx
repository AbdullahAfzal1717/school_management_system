"use client";

import { PAGE_SIZE } from "@/lib/list";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const current = Math.min(page, pageCount);

  const go = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const start = Math.max(1, Math.min(current - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  const pages = [];
  for (let number = start; number <= end; number += 1) {
    pages.push(number);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 text-gray-500 sm:p-4">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => go(current - 1)}
        className="btn bg-slate-200 px-3 py-2 text-xs font-semibold sm:px-4"
      >
        Prev
      </button>
      <div className="flex flex-wrap items-center justify-center gap-1 text-sm sm:gap-2">
        {pages.map((number) => (
          <button
            type="button"
            key={number}
            onClick={() => go(number)}
            aria-label={`Page ${number}`}
            aria-current={number === current ? "page" : undefined}
            className={`btn px-2 ${number === current ? "bg-AbSky" : ""}`}
          >
            {number}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={current >= pageCount}
        onClick={() => go(current + 1)}
        className="btn py-2 px-4 bg-slate-200 text-xs font-semibold"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
