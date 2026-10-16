"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeId: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateTeacherSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeId: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage teachers." };
  }

  return null;
}

export async function createTeacher(input: CreateTeacherInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = createTeacherSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid teacher information." };
  }

  const {
    email,
    password,
    firstName,
    lastName,
    employeeId,
    phone,
    address,
  } = parsedInput.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: UserRole.TEACHER,
        teacherProfile: {
          create: {
            employeeId,
            phone: phone || null,
            address: address || null,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to create teacher", error);
    return {
      error: "A user with that email or employee ID may already exist.",
    };
  }

  revalidatePath("/list/teachers");
  return { success: true };
}

export async function updateTeacher(input: UpdateTeacherInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateTeacherSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid teacher information." };
  }

  const {
    id,
    email,
    password,
    firstName,
    lastName,
    employeeId,
    phone,
    address,
  } = parsedInput.data;

  try {
    const userUpdate: {
      email: string;
      firstName: string;
      lastName: string;
      passwordHash?: string;
    } = {
      email,
      firstName,
      lastName,
    };

    if (password && password.trim().length > 0) {
      userUpdate.passwordHash = await bcrypt.hash(password, 12);
    }

    await prisma.teacherProfile.update({
      where: { id },
      data: {
        employeeId,
        phone: phone || null,
        address: address || null,
        user: {
          update: userUpdate,
        },
      },
    });
  } catch (error) {
    console.error("Failed to update teacher", error);
    return {
      error:
        "The teacher could not be updated. Email or employee ID may already exist.",
    };
  }

  revalidatePath("/list/teachers");
  revalidatePath(`/list/teachers/${id}`);
  return { success: true };
}

export async function deleteTeacher(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid teacher ID is required." };
  }

  try {
    const profile = await prisma.teacherProfile.findUnique({
      where: { id: parsedId.data },
      select: { userId: true },
    });

    if (!profile) {
      return { error: "Teacher not found." };
    }

    await prisma.user.delete({ where: { id: profile.userId } });
  } catch (error) {
    console.error("Failed to delete teacher", error);
    return { error: "The teacher could not be deleted." };
  }

  revalidatePath("/list/teachers");
  revalidatePath(`/list/teachers/${parsedId.data}`);
  return { success: true };
}
