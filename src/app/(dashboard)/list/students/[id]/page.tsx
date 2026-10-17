import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import PerformanceChart from "@/components/PerformanceChart";
import { UserRole } from "@/generated/prisma/client";
import { getViewerScope } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { buildCalendarEvents } from "@/lib/calendar";
import { dateKey } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SingleStudentPage = async ({ params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");

  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      enrollments: {
        include: { schoolClass: true, academicYear: true },
        orderBy: { enrolledAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) notFound();

  const scope = await getViewerScope(session.user.id, session.user.role);
  const allowed =
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.TEACHER ||
    (session.user.role === UserRole.STUDENT && scope.studentIds.includes(student.id)) ||
    (session.user.role === UserRole.PARENT && scope.studentIds.includes(student.id));

  if (!allowed) redirect("/");

  const enrollment = student.enrollments[0];
  const classId = enrollment?.schoolClassId;
  const fullName = `${student.user.firstName} ${student.user.lastName}`;

  const [attendance, lessonCount, results, lessons, exams, announcements] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId: student.id },
      _count: true,
    }),
    classId ? prisma.lesson.count({ where: { classId } }) : Promise.resolve(0),
    prisma.examResult.aggregate({
      where: { studentId: student.id },
      _avg: { score: true },
      _count: true,
    }),
    classId
      ? prisma.lesson.findMany({ where: { classId }, include: { subject: true, class: true } })
      : Promise.resolve([]),
    classId ? prisma.exam.findMany({ where: { classId } }) : Promise.resolve([]),
    prisma.announcement.findMany({
      where: classId ? { OR: [{ classId: null }, { classId }] } : { classId: null },
      orderBy: { date: "desc" },
      take: 3,
    }),
  ]);

  const attendanceTotal = attendance.reduce((sum, row) => sum + row._count, 0);
  const attended = attendance
    .filter((row) => row.status !== "ABSENT")
    .reduce((sum, row) => sum + row._count, 0);
  const attendanceRate = attendanceTotal
    ? Math.round((attended / attendanceTotal) * 100)
    : 0;
  const calendarEvents = buildCalendarEvents(
    lessons.map((lesson) => ({
      name: lesson.subject.name,
      day: lesson.day,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      subjectName: lesson.subject.name,
      className: lesson.class.name,
    })),
    exams.map((exam) => ({
      title: exam.title,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
    })),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex flex-1 flex-col gap-4 rounded-md bg-AbSky px-4 py-6 sm:flex-row">
            <div className="shrink-0">
              <Image
                src={student.photoUrl ?? "/avatar.png"}
                alt={fullName}
                width={144}
                height={144}
                className="h-20 w-20 rounded-full object-cover sm:h-36 sm:w-36"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="break-words text-xl font-semibold">{fullName}</h1>
                {session.user.role === UserRole.ADMIN && (
                  <FormModal
                    type="edit"
                    table="student"
                    data={{
                      id: student.id,
                      email: student.user.email,
                      firstName: student.user.firstName,
                      lastName: student.user.lastName,
                      studentNumber: student.studentNumber,
                      phone: student.phone ?? "",
                      address: student.address ?? "",
                      schoolClassId: enrollment?.schoolClassId ?? "",
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">Student number: {student.studentNumber}</p>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="break-all">{student.user.email}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone ?? "No phone"}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/profile.png" alt="" width={14} height={14} />
                  <span>{student.address ?? "No address"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image src="/singleAttendance.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{attendanceRate}%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image src="/singleBranch.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{enrollment?.schoolClass.grade ?? "-"}</h1>
                <span className="text-sm text-gray-400">Grade</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image src="/singleLesson.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{lessonCount}</h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex w-full gap-4 md:w-[48%] xl:w-[44%] 2xl:w-[48%]">
              <Image src="/singleClass.png" alt="" width={24} height={24} className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-semibold">{enrollment?.schoolClass.name ?? "Not enrolled"}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-md bg-white p-3 sm:p-4">
          <h1 className="shrink-0 text-lg font-semibold">Student&apos;s Schedule</h1>
          <div className="mt-3 min-h-0 flex-1 overflow-auto">
            <div className="h-full min-h-[28rem] min-w-[42rem]">
              <BigCalendar events={calendarEvents} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            {(session.user.role === UserRole.ADMIN || session.user.role === UserRole.TEACHER) && (
              <>
                <Link href={classId ? `/list/lessons?classId=${classId}` : "/list/lessons"} className="p-3 rounded-md bg-AbSkyLight hover:brightness-95">
                  Student&apos;s Lessons
                </Link>
                <Link href="/list/teachers" className="p-3 rounded-md bg-AbPurpleLight hover:brightness-95">
                  Student&apos;s Teachers
                </Link>
              </>
            )}
            <Link href={classId ? `/list/exams?classId=${classId}` : "/list/exams"} className="p-3 rounded-md bg-AbYellowLight hover:brightness-95">
              Student&apos;s Exams
            </Link>
            <Link href={`/list/results?studentId=${student.id}`} className="p-3 rounded-md bg-pink-50 hover:brightness-95">
              Student&apos;s Results
            </Link>
            <Link href={classId ? `/list/assignments?classId=${classId}` : "/list/assignments"} className="p-3 rounded-md bg-AbSkyLight hover:brightness-95">
              Student&apos;s Assignments
            </Link>
            <Link href="/list/attendance" className="p-3 rounded-md bg-AbPurpleLight hover:brightness-95">
              Student&apos;s Attendance
            </Link>
          </div>
        </div>
        <PerformanceChart
          score={results._avg.score ?? 0}
          label={results._count ? "Average exam score" : "No results yet"}
        />
        <Announcements
          items={announcements.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            date: dateKey(item.date),
          }))}
        />
      </div>
    </div>
  );
};

export default SingleStudentPage;
