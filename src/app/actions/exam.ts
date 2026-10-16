"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const examSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});

const updateExamSchema = examSchema.extend({
  id: z.string().min(1),
});

export type CreateExamInput = z.infer<typeof examSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage exams." };
  }

  return null;
}

export async function getExamFormOptions() {
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

export async function createExam(input: CreateExamInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = examSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid exam information." };
  }

  try {
    await prisma.exam.create({
      data: { ...parsedInput.data, date: new Date(parsedInput.data.date) },
    });
  } catch (error) {
    console.error("Failed to create exam", error);
    return { error: "The exam could not be created." };
  }

  revalidatePath("/list/exams");
  return { success: true };
}

export async function updateExam(input: UpdateExamInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateExamSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid exam information." };
  }

  const { id, ...data } = parsedInput.data;

  try {
    await prisma.exam.update({
      where: { id },
      data: { ...data, date: new Date(data.date) },
    });
  } catch (error) {
    console.error("Failed to update exam", error);
    return { error: "The exam could not be updated." };
  }

  revalidatePath("/list/exams");
  return { success: true };
}

export async function deleteExam(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid exam ID is required." };
  }

  try {
    await prisma.exam.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete exam", error);
    return { error: "The exam could not be deleted." };
  }

  revalidatePath("/list/exams");
  return { success: true };
}
