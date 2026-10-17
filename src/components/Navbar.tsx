import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewerScope, schoolWideClassFilter } from "@/lib/access";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import NavbarSearch from "./NavbarSearch";

const Navbar = async () => {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "";
  const role = session?.user?.role || "";
  const userId = session?.user?.id;

  let unreadMessages = 0;
  let recentAnnouncements = 0;

  if (userId && role) {
    const scope = await getViewerScope(userId, role);
    const since = new Date();
    since.setDate(since.getDate() - 7);

    [unreadMessages, recentAnnouncements] = await Promise.all([
      prisma.message.count({
        where: { receiverId: userId, read: false },
      }),
      prisma.announcement.count({
        where: {
          date: { gte: since },
          ...schoolWideClassFilter(scope, ""),
        },
      }),
    ]);
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
      <NavbarSearch role={role} />
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-6">
        <Link
          href="/list/messages"
          aria-label="Messages"
          className="icon-btn relative h-8 w-8 bg-white"
        >
          <Image src="/message.png" alt="" width={20} height={20} />
          {unreadMessages > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] leading-none text-white">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>
        <Link
          href="/list/announcements"
          aria-label="Announcements"
          className="icon-btn relative h-8 w-8 bg-white"
        >
          <Image src="/announcement.png" alt="" width={20} height={20} />
          {recentAnnouncements > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] leading-none text-white">
              {recentAnnouncements > 9 ? "9+" : recentAnnouncements}
            </span>
          )}
        </Link>
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="max-w-[7rem] truncate text-xs font-medium leading-3 md:max-w-[12rem]">
            {name}
          </span>
          <span className="text-[10px] text-gray-500 text-right capitalize">
            {role.toLowerCase()}
          </span>
        </div>
        <Link href="/profile" aria-label="Open profile" className="icon-btn">
          <Image
            src="/avatar.png"
            alt=""
            width={36}
            height={36}
            className="rounded-full"
          />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
