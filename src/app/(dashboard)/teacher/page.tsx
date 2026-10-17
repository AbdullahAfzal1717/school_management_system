import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { getCalendarEvents, getLatestAnnouncements } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TeacherPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const scope = await getViewerScope(session.user.id, session.user.role);
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      teachingAssignments: { include: { schoolClass: true } },
    },
  });
  const classNames = Array.from(
    new Set(teacher?.teachingAssignments.map((item) => item.schoolClass.name) ?? []),
  );
  const [events, announcements] = await Promise.all([
    getCalendarEvents(
      scope.teacherId ? { teacherId: scope.teacherId } : { classIds: [] },
    ),
    getLatestAnnouncements(scope),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-md bg-white p-3 sm:p-4">
          <h1 className="shrink-0 break-words text-xl font-semibold">
            Schedule{classNames.length ? ` (${classNames.join(", ")})` : ""}
          </h1>
          <div className="mt-3 min-h-0 flex-1 overflow-auto">
            <div className="h-full min-h-[28rem] min-w-[42rem]">
              <BigCalendar events={events} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <Announcements items={announcements} />
      </div>
    </div>
  );
};

export default TeacherPage;
