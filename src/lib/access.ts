import { UserRole } from "@/generated/prisma/client";
import { dashboardForRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export function assertRoles(role: string | undefined, allowed: UserRole[]) {
  if (!role || !allowed.includes(role as UserRole)) {
    const destination =
      role && role in dashboardForRole
        ? dashboardForRole[role as UserRole]
        : "/sign-in";
    redirect(destination);
  }
}

export type ViewerScope = {
  unrestricted: boolean;
  classIds: string[];
  studentIds: string[];
  teacherId: string | null;
};

export async function getViewerScope(
  userId: string,
  role: string,
): Promise<ViewerScope> {
  if (role === UserRole.ADMIN) {
    return {
      unrestricted: true,
      classIds: [],
      studentIds: [],
      teacherId: null,
    };
  }

  if (role === UserRole.TEACHER) {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        teachingAssignments: { select: { schoolClassId: true } },
        supervisedClasses: { select: { id: true } },
      },
    });

    const classIds = Array.from(
      new Set([
        ...(teacher?.teachingAssignments.map((item) => item.schoolClassId) ??
          []),
        ...(teacher?.supervisedClasses.map((item) => item.id) ?? []),
      ]),
    );

    return {
      unrestricted: false,
      classIds,
      studentIds: [],
      teacherId: teacher?.id ?? null,
    };
  }

  if (role === UserRole.STUDENT) {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { enrollments: { select: { schoolClassId: true } } },
    });

    return {
      unrestricted: false,
      classIds: student?.enrollments.map((item) => item.schoolClassId) ?? [],
      studentIds: student ? [student.id] : [],
      teacherId: null,
    };
  }

  const parent = await prisma.parentProfile.findUnique({
    where: { userId },
    include: {
      children: {
        include: {
          student: {
            include: { enrollments: { select: { schoolClassId: true } } },
          },
        },
      },
    },
  });

  return {
    unrestricted: false,
    classIds: Array.from(
      new Set(
        parent?.children.flatMap((child) =>
          child.student.enrollments.map((item) => item.schoolClassId),
        ) ?? [],
      ),
    ),
    studentIds: parent?.children.map((child) => child.studentId) ?? [],
    teacherId: null,
  };
}

export function classFilter(
  scope: ViewerScope,
  classId: string,
  field = "classId",
) {
  if (scope.unrestricted) {
    return classId ? { [field]: classId } : {};
  }

  if (classId) {
    return scope.classIds.includes(classId)
      ? { [field]: classId }
      : { [field]: "__none__" };
  }

  if (scope.classIds.length === 0) {
    return { [field]: "__none__" };
  }

  return { [field]: { in: scope.classIds } };
}

export function schoolWideClassFilter(scope: ViewerScope, classId: string) {
  if (scope.unrestricted) {
    return classId ? { classId } : {};
  }

  if (classId) {
    return scope.classIds.includes(classId) ? { classId } : { classId: "__none__" };
  }

  if (scope.classIds.length === 0) {
    return { classId: null };
  }

  return {
    OR: [{ classId: null }, { classId: { in: scope.classIds } }],
  };
}
