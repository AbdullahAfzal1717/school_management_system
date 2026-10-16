"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const assignmentSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().min(1),
  dueDate: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  teacherId: z.string().min(1),
});

const updateAssignmentSchema = assignmentSchema.extend({
  id: z.string().min(1),
});

export type CreateAssignmentInput = z.infer<typeof assignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage assignments." };
  }

  return null;
}

export async function getAssignmentFormOptions() {
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

export async function createAssignment(input: CreateAssignmentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = assignmentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid assignment information." };
  }

  try {
    await prisma.assignment.create({
      data: {
        ...parsedInput.data,
        startDate: new Date(parsedInput.data.startDate),
        dueDate: new Date(parsedInput.data.dueDate),
      },
    });
  } catch (error) {
    console.error("Failed to create assignment", error);
    return { error: "The assignment could not be created." };
  }

  revalidatePath("/list/assignments");
  return { success: true };
}

export async function updateAssignment(input: UpdateAssignmentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateAssignmentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid assignment information." };
  }

  const { id, ...data } = parsedInput.data;

  try {
    await prisma.assignment.update({
      where: { id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
      },
    });
  } catch (error) {
    console.error("Failed to update assignment", error);
    return { error: "The assignment could not be updated." };
  }

  revalidatePath("/list/assignments");
  return { success: true };
}

export async function deleteAssignment(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid assignment ID is required." };
  }

  try {
    await prisma.assignment.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete assignment", error);
    return { error: "The assignment could not be deleted." };
  }

  revalidatePath("/list/assignments");
  return { success: true };
}
