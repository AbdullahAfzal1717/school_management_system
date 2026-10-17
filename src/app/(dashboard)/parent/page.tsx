import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { getCalendarEvents, getLatestAnnouncements } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ParentPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  const scope = await getViewerScope(session.user.id, session.user.role);
  const parent = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const children = parent
    ? await prisma.parentStudent.findMany({
        where: { parentId: parent.id },
        include: {
          student: {
            include: {
              user: true,
              enrollments: {
                where: { academicYear: { isCurrent: true } },
                include: { schoolClass: true },
              },
            },
          },
        },
      })
    : [];
  const names = children.map(
    (child) => `${child.student.user.firstName} ${child.student.user.lastName}`,
  );
  const [events, announcements] = await Promise.all([
    getCalendarEvents({ classIds: scope.classIds }),
    getLatestAnnouncements(scope),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-md bg-white p-3 sm:p-4">
          <h1 className="shrink-0 break-words text-xl font-semibold">
            Schedule{names.length ? ` (${names.join(", ")})` : ""}
          </h1>
          <div className="mt-3 min-h-0 flex-1 overflow-auto">
            <div className="h-full min-h-[28rem] min-w-[42rem]">
              <BigCalendar events={events} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <div className="bg-white rounded-md p-4">
          <h2 className="text-lg font-semibold">Children</h2>
          <div className="mt-3 flex flex-col gap-2">
            {children.length === 0 ? (
              <p className="text-sm text-gray-400">No children linked yet.</p>
            ) : (
              children.map((child) => (
                <p key={child.studentId} className="text-sm text-gray-600">
                  {child.student.user.firstName} {child.student.user.lastName}
                  {" · "}
                  {child.student.enrollments[0]?.schoolClass.name ?? "Not enrolled"}
                </p>
              ))
            )}
          </div>
        </div>
        <Announcements items={announcements} />
      </div>
    </div>
  );
};

export default ParentPage;
