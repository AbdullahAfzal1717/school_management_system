"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createSubjectSchema = z.object({
  name: z.string().min(1),
});

const updateSubjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage subjects." };
  }

  return null;
}

export async function createSubject(input: CreateSubjectInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = createSubjectSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a valid subject name." };
  }

  try {
    await prisma.subject.create({ data: { name: parsedInput.data.name } });
  } catch (error) {
    console.error("Failed to create subject", error);
    return { error: "A subject with that name may already exist." };
  }

  revalidatePath("/list/subjects");
  return { success: true };
}

export async function updateSubject(input: UpdateSubjectInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateSubjectSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a valid subject name." };
  }

  const { id, name } = parsedInput.data;

  try {
    await prisma.subject.update({ where: { id }, data: { name } });
  } catch (error) {
    console.error("Failed to update subject", error);
    return { error: "The subject could not be updated. Name may already exist." };
  }

  revalidatePath("/list/subjects");
  return { success: true };
}

export async function deleteSubject(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid subject ID is required." };
  }

  try {
    await prisma.subject.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete subject", error);
    return { error: "The subject could not be deleted." };
  }

  revalidatePath("/list/subjects");
  return { success: true };
}
