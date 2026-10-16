"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole, Weekday } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const lessonSchema = z.object({
  name: z.string().min(1),
  day: z.nativeEnum(Weekday),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});

const updateLessonSchema = lessonSchema.extend({
  id: z.string().min(1),
});

export type CreateLessonInput = z.infer<typeof lessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage lessons." };
  }

  return null;
}

export async function getLessonFormOptions() {
  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.schoolClass.findMany({
      include: { academicYear: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.teacherProfile.findMany({
      include: { user: true },
      orderBy: { employeeId: "asc" },
    }),
  ]);

  return {
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
    })),
    classes: classes.map((schoolClass) => ({
      id: schoolClass.id,
      name: `${schoolClass.name} (${schoolClass.academicYear.name})`,
    })),
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
  };
}

export async function createLesson(input: CreateLessonInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = lessonSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid lesson information." };
  }

  try {
    await prisma.lesson.create({ data: parsedInput.data });
  } catch (error) {
    console.error("Failed to create lesson", error);
    return { error: "The lesson could not be created." };
  }

  revalidatePath("/list/lessons");
  return { success: true };
}

export async function updateLesson(input: UpdateLessonInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateLessonSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid lesson information." };
  }

  const { id, ...data } = parsedInput.data;

  try {
    await prisma.lesson.update({ where: { id }, data });
  } catch (error) {
    console.error("Failed to update lesson", error);
    return { error: "The lesson could not be updated." };
  }

  revalidatePath("/list/lessons");
  return { success: true };
}

export async function deleteLesson(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid lesson ID is required." };
  }

  try {
    await prisma.lesson.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete lesson", error);
    return { error: "The lesson could not be deleted." };
  }

  revalidatePath("/list/lessons");
  return { success: true };
}
