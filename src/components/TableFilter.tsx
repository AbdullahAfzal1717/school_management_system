"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Option = { value: string; label: string };

const TableFilter = ({
  param,
  label,
  options,
}: {
  param: string;
  label: string;
  options: Option[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const current = searchParams.get(param) ?? "";

  if (options.length === 0) {
    return null;
  }

  const apply = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(param, value);
    } else {
      params.delete(param);
    }
    params.delete("page");
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="icon-btn w-8 h-8 bg-AbYellow"
        aria-label={`Filter by ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Image src="/filter.png" alt="" width={14} height={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white p-2 shadow-md">
          <p className="px-2 py-1 text-xs font-medium text-gray-400">{label}</p>
          <button
            type="button"
            className={`btn block w-full px-2 py-1.5 text-left text-sm ${
              current === "" ? "bg-AbSkyLight" : ""
            }`}
            onClick={() => apply("")}
          >
            All
          </button>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`btn block w-full px-2 py-1.5 text-left text-sm ${
                current === option.value ? "bg-AbSkyLight" : ""
              }`}
              onClick={() => apply(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TableFilter;
