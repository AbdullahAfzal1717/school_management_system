"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export async function updateProfile(input: ProfileInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsedInput = profileSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a valid name." };
  }

  const { firstName, lastName, phone, address } = parsedInput.data;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { firstName, lastName },
    });

    const profileData = {
      phone: phone || null,
      address: address || null,
    };

    if (session.user.role === UserRole.TEACHER) {
      await prisma.teacherProfile.update({
        where: { userId: session.user.id },
        data: profileData,
      });
    } else if (session.user.role === UserRole.STUDENT) {
      await prisma.studentProfile.update({
        where: { userId: session.user.id },
        data: profileData,
      });
    } else if (session.user.role === UserRole.PARENT) {
      await prisma.parentProfile.update({
        where: { userId: session.user.id },
        data: profileData,
      });
    }
  } catch (error) {
    console.error("Failed to update profile", error);
    return { error: "Your profile could not be updated." };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(input: PasswordInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsedInput = passwordSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "New password must be at least 8 characters." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) {
    return { error: "Account not found." };
  }

  const matches = await bcrypt.compare(
    parsedInput.data.currentPassword,
    user.passwordHash,
  );

  if (!matches) {
    return { error: "Current password is incorrect." };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsedInput.data.newPassword, 12) },
    });
  } catch (error) {
    console.error("Failed to change password", error);
    return { error: "The password could not be changed." };
  }

  return { success: true };
}

export async function signUp(input: SignUpInput) {
  const parsedInput = signUpSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a valid name, email, and password." };
  }

  const { firstName, lastName, email, password, phone } = parsedInput.data;

  try {
    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        firstName,
        lastName,
        role: UserRole.PARENT,
        parentProfile: {
          create: { phone: phone || null },
        },
      },
    });
  } catch (error) {
    console.error("Failed to sign up", error);
    return { error: "An account with that email already exists." };
  }

  return { success: true };
}
