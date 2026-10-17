import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalendar";
import FormModal from "@/components/FormModal";
import PerformanceChart from "@/components/PerformanceChart";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { buildCalendarEvents, dateKey } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SingleTeacherPage = async ({ params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TEACHER) {
    redirect("/");
  }

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      teachingAssignments: { include: { subject: true, schoolClass: true } },
    },
  });

  if (!teacher) notFound();

  const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const subjects = Array.from(new Set(teacher.teachingAssignments.map((item) => item.subject.name)));
  const classes = Array.from(new Set(teacher.teachingAssignments.map((item) => item.schoolClass.name)));
  const classIds = Array.from(new Set(teacher.teachingAssignments.map((item) => item.schoolClassId)));

  const [attendance, lessonCount, assignmentCount, results, lessons, exams, announcements] =
    await Promise.all([
      prisma.attendance.groupBy({
        by: ["status"],
        where: { classId: { in: classIds } },
        _count: true,
      }),
      prisma.lesson.count({ where: { teacherId: teacher.id } }),
      prisma.assignment.count({ where: { teacherId: teacher.id } }),
      prisma.examResult.aggregate({
        where: { exam: { teacherId: teacher.id } },
        _avg: { score: true },
        _count: true,
      }),
      prisma.lesson.findMany({
        where: { teacherId: teacher.id },
        include: { subject: true, class: true },
      }),
      prisma.exam.findMany({ where: { teacherId: teacher.id } }),
      prisma.announcement.findMany({
        where: { OR: [{ classId: null }, { classId: { in: classIds } }] },
        orderBy: { date: "desc" },
        take: 3,
      }),
    ]);

  const attendanceTotal = attendance.reduce((sum, row) => sum + row._count, 0);
  const attended = attendance
    .filter((row) => row.status !== "ABSENT")
    .reduce((sum, row) => sum + row._count, 0);
  const attendanceRate = attendanceTotal ? Math.round((attended / attendanceTotal) * 100) : 0;
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
                src={teacher.photoUrl ?? "/avatar.png"}
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
                    table="teacher"
                    data={{
                      id: teacher.id,
                      email: teacher.user.email,
                      firstName: teacher.user.firstName,
                      lastName: teacher.user.lastName,
                      employeeId: teacher.employeeId,
                      phone: teacher.phone ?? "",
                      address: teacher.address ?? "",
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">Employee ID: {teacher.employeeId}</p>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="break-all">{teacher.user.email}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone ?? "No phone"}</span>
                </div>
                <div className="flex items-center w-full md:w-1/3 gap-2 xl:w-full 2xl:w-1/3">
                  <Image src="/profile.png" alt="" width={14} height={14} />
                  <span>{teacher.address ?? "No address"}</span>
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
                <h1 className="text-xl font-semibold">{classes.length}</h1>
                <span className="text-sm text-gray-400">Classes</span>
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
                <h1 className="text-xl font-semibold">{assignmentCount}</h1>
                <span className="text-sm text-gray-400">Assignments</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex h-[70vh] min-h-[32rem] flex-col overflow-hidden rounded-md bg-white p-3 sm:p-4">
          <h1 className="shrink-0 text-lg font-semibold">Teacher&apos;s Schedule</h1>
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
            <Link href="/list/classes" className="p-3 rounded-md bg-AbSkyLight hover:brightness-95">Classes</Link>
            <Link href="/list/students" className="p-3 rounded-md bg-AbPurpleLight hover:brightness-95">Students</Link>
            <Link href="/list/lessons" className="p-3 rounded-md bg-AbYellowLight hover:brightness-95">Lessons</Link>
            <Link href="/list/exams" className="p-3 rounded-md bg-pink-50 hover:brightness-95">Exams</Link>
            <Link href="/list/assignments" className="p-3 rounded-md bg-AbSkyLight hover:brightness-95">Assignments</Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Subjects: {subjects.length ? subjects.join(", ") : "None assigned"}
          </p>
        </div>
        <PerformanceChart
          score={results._avg.score ?? 0}
          label={results._count ? "Average score in taught exams" : "No results yet"}
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

export default SingleTeacherPage;
