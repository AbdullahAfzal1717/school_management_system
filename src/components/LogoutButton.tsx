"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

const LogoutButton = () => {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="btn flex w-full justify-center items-center lg:justify-start gap-4 text-gray-500 py-2 hover:bg-AbSkyLight md:px-2"
    >
      <Image src="/logout.png" alt="Logout" width={20} height={20} />
      <span className="hidden lg:block">Logout</span>
    </button>
  );
};

export default LogoutButton;
