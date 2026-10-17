"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TableSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (value === currentQuery) {
      return;
    }

    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 300);

    return () => clearTimeout(handle);
  }, [value, currentQuery, pathname, router, searchParams]);

  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-full px-2 text-xs ring-[1.5px] ring-gray-300 sm:w-auto">
      <Image src="/search.png" alt="" width={18} height={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search..."
        aria-label="Search records"
        className="w-full min-w-0 bg-transparent p-2 outline-none sm:w-[200px]"
      />
    </div>
  );
};

export default TableSearch;
