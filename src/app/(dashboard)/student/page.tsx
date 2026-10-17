import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import EventCalender from "@/components/EventCalender";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import {
  getCalendarEvents,
  getLatestAnnouncements,
  getUpcomingEvents,
} from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const StudentPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const scope = await getViewerScope(session.user.id, session.user.role);
  const enrollment = scope.studentIds[0]
    ? await prisma.enrollment.findFirst({
        where: {
          studentId: scope.studentIds[0],
          academicYear: { isCurrent: true },
        },
        include: { schoolClass: true },
      })
    : null;
  const classIds = enrollment ? [enrollment.schoolClassId] : scope.classIds;
  const [events, announcements, calendarEvents] = await Promise.all([
    getUpcomingEvents(scope),
    getLatestAnnouncements(scope),
    getCalendarEvents({ classIds }),
  ]);

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-md bg-white p-3 sm:p-4">
          <h1 className="shrink-0 break-words text-xl font-semibold">
            Schedule{enrollment ? ` (${enrollment.schoolClass.name})` : ""}
          </h1>
          <div className="mt-3 min-h-0 flex-1 overflow-auto">
            <div className="h-full min-h-[28rem] min-w-[42rem]">
              <BigCalendar events={calendarEvents} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalender events={events} />
        <Announcements items={announcements} />
      </div>
    </div>
  );
};

export default StudentPage;
