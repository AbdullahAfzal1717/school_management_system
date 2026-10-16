"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const resultSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  score: z.coerce.number().int().min(0).max(100),
});

const updateResultSchema = resultSchema.extend({
  id: z.string().min(1),
});

export type CreateResultInput = z.infer<typeof resultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage results." };
  }

  return null;
}

export async function getResultFormOptions() {
  const [exams, students] = await Promise.all([
    prisma.exam.findMany({
      include: { subject: true, class: true },
      orderBy: { date: "asc" },
    }),
    prisma.studentProfile.findMany({
      include: { user: true },
      orderBy: { studentNumber: "asc" },
    }),
  ]);

  return {
    exams: exams.map((exam) => ({
      id: exam.id,
      name: `${exam.subject.name} - ${exam.class.name} (${exam.date
        .toISOString()
        .slice(0, 10)})`,
    })),
    students: students.map((student) => ({
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
    })),
  };
}

export async function createResult(input: CreateResultInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = resultSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid result information." };
  }

  try {
    await prisma.examResult.create({ data: parsedInput.data });
  } catch (error) {
    console.error("Failed to create result", error);
    return {
      error: "A result for this student and exam already exists.",
    };
  }

  revalidatePath("/list/results");
  return { success: true };
}

export async function updateResult(input: UpdateResultInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateResultSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid result information." };
  }

  const { id, ...data } = parsedInput.data;

  try {
    await prisma.examResult.update({ where: { id }, data });
  } catch (error) {
    console.error("Failed to update result", error);
    return { error: "The result could not be updated." };
  }

  revalidatePath("/list/results");
  return { success: true };
}

export async function deleteResult(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid result ID is required." };
  }

  try {
    await prisma.examResult.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete result", error);
    return { error: "The result could not be deleted." };
  }

  revalidatePath("/list/results");
  return { success: true };
}
