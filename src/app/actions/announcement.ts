"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const announcementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  date: z.string().min(1),
  classId: z.string().optional(),
});

const updateAnnouncementSchema = announcementSchema.extend({
  id: z.string().min(1),
});

export type CreateAnnouncementInput = z.infer<typeof announcementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage announcements." };
  }

  return null;
}

export async function getAnnouncementFormOptions() {
  const classes = await prisma.schoolClass.findMany({
    include: { academicYear: true },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  return {
    classes: classes.map((schoolClass) => ({
      id: schoolClass.id,
      name: `${schoolClass.name} (${schoolClass.academicYear.name})`,
    })),
  };
}

function revalidateAnnouncements() {
  revalidatePath("/list/announcements");
  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const session = await getServerSession(authOptions);
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = announcementSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid announcement information." };
  }

  const { classId, content, date, title } = parsedInput.data;

  try {
    await prisma.announcement.create({
      data: {
        title,
        content,
        classId: classId || null,
        date: new Date(date),
        authorId: session?.user.id ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create announcement", error);
    return { error: "The announcement could not be created." };
  }

  revalidateAnnouncements();
  return { success: true };
}

export async function updateAnnouncement(input: UpdateAnnouncementInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateAnnouncementSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid announcement information." };
  }

  const { id, classId, content, date, title } = parsedInput.data;

  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        classId: classId || null,
        date: new Date(date),
      },
    });
  } catch (error) {
    console.error("Failed to update announcement", error);
    return { error: "The announcement could not be updated." };
  }

  revalidateAnnouncements();
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid announcement ID is required." };
  }

  try {
    await prisma.announcement.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete announcement", error);
    return { error: "The announcement could not be deleted." };
  }

  revalidateAnnouncements();
  return { success: true };
}
