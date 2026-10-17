"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Option = { value: string; label: string };

const TableSort = ({ options }: { options: Option[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const current = searchParams.get("sort") ?? options[0]?.value ?? "";

  const apply = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="icon-btn w-8 h-8 bg-AbYellow"
        aria-label="Sort records"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Image src="/sort.png" alt="" width={14} height={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-gray-200 bg-white p-2 shadow-md">
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

export default TableSort;
