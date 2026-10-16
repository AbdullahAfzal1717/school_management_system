"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createClassSchema = z.object({
  name: z.string().min(1),
  grade: z.coerce.number().int().min(1),
  capacity: z.coerce.number().int().min(1),
  academicYearId: z.string().min(1),
  supervisorId: z.string().optional(),
});

const updateClassSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  grade: z.coerce.number().int().min(1),
  capacity: z.coerce.number().int().min(1),
  academicYearId: z.string().min(1),
  supervisorId: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage classes." };
  }

  return null;
}

export async function getClassFormOptions() {
  const [academicYears, teachers] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
    prisma.teacherProfile.findMany({
      include: { user: true },
      orderBy: { employeeId: "asc" },
    }),
  ]);

  return {
    academicYears: academicYears.map((year) => ({
      id: year.id,
      name: year.name,
      isCurrent: year.isCurrent,
    })),
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
  };
}

export async function createClass(input: CreateClassInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = createClassSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid class information." };
  }

  const { name, grade, capacity, academicYearId, supervisorId } =
    parsedInput.data;

  try {
    await prisma.schoolClass.create({
      data: {
        name,
        grade,
        capacity,
        academicYearId,
        supervisorId: supervisorId || null,
      },
    });
  } catch (error) {
    console.error("Failed to create class", error);
    return {
      error: "A class with that name may already exist in the academic year.",
    };
  }

  revalidatePath("/list/classes");
  return { success: true };
}

export async function updateClass(input: UpdateClassInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateClassSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid class information." };
  }

  const { id, name, grade, capacity, academicYearId, supervisorId } =
    parsedInput.data;

  try {
    await prisma.schoolClass.update({
      where: { id },
      data: {
        name,
        grade,
        capacity,
        academicYearId,
        supervisorId: supervisorId || null,
      },
    });
  } catch (error) {
    console.error("Failed to update class", error);
    return {
      error:
        "The class could not be updated. Name may already exist in the academic year.",
    };
  }

  revalidatePath("/list/classes");
  return { success: true };
}

export async function deleteClass(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid class ID is required." };
  }

  try {
    await prisma.schoolClass.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete class", error);
    return { error: "The class could not be deleted." };
  }

  revalidatePath("/list/classes");
  return { success: true };
}
