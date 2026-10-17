import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-full w-[4.5rem] shrink-0 flex-col overflow-hidden border-r border-gray-100 bg-white p-2 sm:w-20 lg:w-60 lg:p-4">
        <Link
          href="/"
          className="flex shrink-0 items-center justify-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 lg:justify-start"
        >
          <Image src="/logo.png" alt="School logo" width={32} height={32} />
          <span className="hidden font-bold lg:block">School</span>
        </Link>
        <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-scroll overscroll-contain pr-1">
          <Menu />
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[#F7FBFA]">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
