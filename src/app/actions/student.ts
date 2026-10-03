"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentNumber: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateStudentSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentNumber: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage students." };
  }

  return null;
}

export async function createStudent(input: CreateStudentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = createStudentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid student information." };
  }

  const {
    email,
    password,
    firstName,
    lastName,
    studentNumber,
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
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            studentNumber,
            phone: phone || null,
            address: address || null,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to create student", error);
    return {
      error: "A user with that email or student number may already exist.",
    };
  }

  revalidatePath("/list/students");
  return { success: true };
}

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export async function updateStudent(input: UpdateStudentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateStudentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid student information." };
  }

  const {
    id,
    email,
    password,
    firstName,
    lastName,
    studentNumber,
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

    await prisma.studentProfile.update({
      where: { id },
      data: {
        studentNumber,
        phone: phone || null,
        address: address || null,
        user: {
          update: userUpdate,
        },
      },
    });
  } catch (error) {
    console.error("Failed to update student", error);
    return {
      error:
        "The student could not be updated. Email or student number may already exist.",
    };
  }

  revalidatePath("/list/students");
  revalidatePath(`/list/students/${id}`);
  return { success: true };
}

export async function deleteStudent(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid student ID is required." };
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: parsedId.data },
      select: { userId: true },
    });

    if (!profile) {
      return { error: "Student not found." };
    }

    await prisma.user.delete({ where: { id: profile.userId } });
  } catch (error) {
    console.error("Failed to delete student", error);
    return { error: "The student could not be deleted." };
  }

  revalidatePath("/list/students");
  revalidatePath(`/list/students/${parsedId.data}`);
  return { success: true };
}
