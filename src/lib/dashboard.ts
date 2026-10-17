import { AttendanceStatus } from "@/generated/prisma/client";
import { buildCalendarEvents, dateKey } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { ViewerScope } from "@/lib/access";

export async function getCurrentYearName() {
  const year = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { name: true },
  });
  return year?.name ?? "Current year";
}

export async function getRoleCounts() {
  const [students, teachers, parents, staff] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.parentProfile.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return { students, teachers, parents, staff };
}

export async function getGradeCounts() {
  const classes = await prisma.schoolClass.findMany({
    where: { academicYear: { isCurrent: true } },
    select: {
      grade: true,
      _count: { select: { enrollments: true } },
    },
  });
  const totals = new Map<number, number>();

  for (const schoolClass of classes) {
    totals.set(
      schoolClass.grade,
      (totals.get(schoolClass.grade) ?? 0) + schoolClass._count.enrollments,
    );
  }

  return Array.from(totals.entries())
    .map(([grade, count]) => ({ grade, count }))
    .sort((left, right) => left.grade - right.grade);
}

export async function getAttendanceSeries(classIds?: string[]) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);

  const records = await prisma.attendance.findMany({
    where: {
      date: { gte: start },
      ...(classIds ? { classId: { in: classIds } } : {}),
    },
    select: { date: true, status: true },
  });

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    const sameDay = records.filter(
      (record) => record.date.toISOString().slice(0, 10) === key,
    );

    return {
      name: day.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      Present: sameDay.filter((record) => record.status === AttendanceStatus.PRESENT)
        .length,
      Absent: sameDay.filter((record) => record.status === AttendanceStatus.ABSENT)
        .length,
      Late: sameDay.filter((record) => record.status === AttendanceStatus.LATE).length,
    };
  });
}

export async function getSubjectAverages(where?: {
  classIds?: string[];
  studentIds?: string[];
}) {
  const results = await prisma.examResult.findMany({
    where: {
      ...(where?.studentIds ? { studentId: { in: where.studentIds } } : {}),
      ...(where?.classIds ? { exam: { classId: { in: where.classIds } } } : {}),
    },
    select: {
      score: true,
      exam: { select: { subject: { select: { name: true } } } },
    },
  });
  const buckets = new Map<string, { total: number; count: number }>();

  for (const result of results) {
    const name = result.exam.subject.name;
    const bucket = buckets.get(name) ?? { total: 0, count: 0 };
    bucket.total += result.score;
    bucket.count += 1;
    buckets.set(name, bucket);
  }

  return Array.from(buckets.entries())
    .map(([name, bucket]) => ({
      name,
      average: Math.round(bucket.total / bucket.count),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCalendarEvents(scope?: {
  classIds?: string[];
  teacherId?: string;
}) {
  const lessons = await prisma.lesson.findMany({
    where: {
      ...(scope?.teacherId ? { teacherId: scope.teacherId } : {}),
      ...(scope?.classIds
        ? {
            classId: {
              in: scope.classIds.length > 0 ? scope.classIds : ["__none__"],
            },
          }
        : {}),
    },
    include: { subject: true, class: true },
  });
  const exams = await prisma.exam.findMany({
    where: {
      ...(scope?.teacherId ? { teacherId: scope.teacherId } : {}),
      ...(scope?.classIds
        ? {
            classId: {
              in: scope.classIds.length > 0 ? scope.classIds : ["__none__"],
            },
          }
        : {}),
    },
  });

  return buildCalendarEvents(
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
}

export async function getUpcomingEvents(scope: ViewerScope) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 14);
  start.setUTCHours(0, 0, 0, 0);

  const events = await prisma.event.findMany({
    where: {
      date: { gte: start },
      ...(scope.unrestricted
        ? {}
        : scope.classIds.length > 0
          ? { OR: [{ classId: null }, { classId: { in: scope.classIds } }] }
          : { classId: null }),
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    date: dateKey(event.date),
    startTime: event.startTime,
    endTime: event.endTime,
    description: event.description ?? "",
  }));
}

export async function getLatestAnnouncements(scope: ViewerScope) {
  const announcements = await prisma.announcement.findMany({
    where: scope.unrestricted
      ? {}
      : scope.classIds.length > 0
        ? { OR: [{ classId: null }, { classId: { in: scope.classIds } }] }
        : { classId: null },
    orderBy: { date: "desc" },
    take: 3,
  });

  return announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    date: dateKey(announcement.date),
  }));
}

export async function averageScore(studentIds?: string[]) {
  const aggregate = await prisma.examResult.aggregate({
    where: studentIds ? { studentId: { in: studentIds } } : undefined,
    _avg: { score: true },
    _count: true,
  });

  return {
    score: aggregate._avg.score ?? 0,
    count: aggregate._count,
  };
}
