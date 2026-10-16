"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const createParentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

const updateParentSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage parents." };
  }

  return null;
}

export async function getParentFormOptions() {
  const students = await prisma.studentProfile.findMany({
    orderBy: { studentNumber: "asc" },
    select: {
      id: true,
      studentNumber: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    students: students.map((student) => ({
      id: student.id,
      studentNumber: student.studentNumber,
      name: `${student.user.firstName} ${student.user.lastName}`,
    })),
  };
}

export async function createParent(input: CreateParentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = createParentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid parent information." };
  }

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    address,
    studentIds,
  } = parsedInput.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: UserRole.PARENT,
          parentProfile: {
            create: {
              phone: phone || null,
              address: address || null,
            },
          },
        },
        include: { parentProfile: true },
      });

      if (studentIds && studentIds.length > 0) {
        await tx.parentStudent.createMany({
          data: studentIds.map((studentId) => ({
            parentId: user.parentProfile!.id,
            studentId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch (error) {
    console.error("Failed to create parent", error);
    return {
      error: "A user with that email may already exist.",
    };
  }

  revalidatePath("/list/parents");
  return { success: true };
}

export async function updateParent(input: UpdateParentInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateParentSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid parent information." };
  }

  const {
    id,
    email,
    password,
    firstName,
    lastName,
    phone,
    address,
    studentIds,
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

    await prisma.$transaction(async (tx) => {
      await tx.parentProfile.update({
        where: { id },
        data: {
          phone: phone || null,
          address: address || null,
          user: {
            update: userUpdate,
          },
        },
      });

      await tx.parentStudent.deleteMany({ where: { parentId: id } });

      if (studentIds && studentIds.length > 0) {
        await tx.parentStudent.createMany({
          data: studentIds.map((studentId) => ({
            parentId: id,
            studentId,
          })),
          skipDuplicates: true,
        });
      }
    });
  } catch (error) {
    console.error("Failed to update parent", error);
    return {
      error: "The parent could not be updated. Email may already exist.",
    };
  }

  revalidatePath("/list/parents");
  return { success: true };
}

export async function deleteParent(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid parent ID is required." };
  }

  try {
    const profile = await prisma.parentProfile.findUnique({
      where: { id: parsedId.data },
      select: { userId: true },
    });

    if (!profile) {
      return { error: "Parent not found." };
    }

    await prisma.user.delete({ where: { id: profile.userId } });
  } catch (error) {
    console.error("Failed to delete parent", error);
    return { error: "The parent could not be deleted." };
  }

  revalidatePath("/list/parents");
  return { success: true };
}
