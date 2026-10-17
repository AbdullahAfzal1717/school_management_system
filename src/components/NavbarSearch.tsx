"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const NavbarSearch = ({ role }: { role: string }) => {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    const destination =
      role === "ADMIN" || role === "TEACHER"
        ? "/list/students"
        : "/list/announcements";
    router.push(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center text-xs ring-[1.5px] ring-gray-300 rounded-full px-2 gap-2"
    >
      <Image src="/search.png" alt="" width={18} height={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search..."
        aria-label="Search the school"
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default NavbarSearch;
