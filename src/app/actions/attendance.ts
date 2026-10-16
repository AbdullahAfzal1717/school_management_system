"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { AttendanceStatus, UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const attendanceSchema = z.object({
  date: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
  studentId: z.string().min(1),
  classId: z.string().min(1),
});

const updateAttendanceSchema = attendanceSchema.extend({
  id: z.string().min(1),
});

export type CreateAttendanceInput = z.infer<typeof attendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage attendance." };
  }

  return null;
}

export async function getAttendanceFormOptions() {
  const [students, classes] = await Promise.all([
    prisma.studentProfile.findMany({
      include: { user: true },
      orderBy: { studentNumber: "asc" },
    }),
    prisma.schoolClass.findMany({
      include: { academicYear: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    students: students.map((student) => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
    })),
    classes: classes.map((schoolClass) => ({
      id: schoolClass.id,
      name: `${schoolClass.name} (${schoolClass.academicYear.name})`,
    })),
  };
}

export async function createAttendance(input: CreateAttendanceInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = attendanceSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid attendance information." };
  }

  try {
    await prisma.attendance.create({
      data: {
        ...parsedInput.data,
        date: new Date(parsedInput.data.date),
      },
    });
  } catch (error) {
    console.error("Failed to create attendance", error);
    return { error: "Attendance for this student and date already exists." };
  }

  revalidatePath("/list/attendance");
  return { success: true };
}

export async function updateAttendance(input: UpdateAttendanceInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateAttendanceSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid attendance information." };
  }

  const { id, ...data } = parsedInput.data;

  try {
    await prisma.attendance.update({
      where: { id },
      data: { ...data, date: new Date(data.date) },
    });
  } catch (error) {
    console.error("Failed to update attendance", error);
    return { error: "The attendance record could not be updated." };
  }

  revalidatePath("/list/attendance");
  return { success: true };
}

export async function deleteAttendance(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid attendance ID is required." };
  }

  try {
    await prisma.attendance.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete attendance", error);
    return { error: "The attendance record could not be deleted." };
  }

  revalidatePath("/list/attendance");
  return { success: true };
}
