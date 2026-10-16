"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  classId: z.string().optional(),
});

const updateEventSchema = eventSchema.extend({
  id: z.string().min(1),
});

export type CreateEventInput = z.infer<typeof eventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== UserRole.ADMIN) {
    return { error: "Only administrators can manage events." };
  }

  return null;
}

export async function getEventFormOptions() {
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

export async function createEvent(input: CreateEventInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = eventSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid event information." };
  }

  const { classId, description, ...rest } = parsedInput.data;

  try {
    await prisma.event.create({
      data: {
        ...rest,
        description: description || null,
        classId: classId || null,
        date: new Date(rest.date),
      },
    });
  } catch (error) {
    console.error("Failed to create event", error);
    return { error: "The event could not be created." };
  }

  revalidatePath("/list/events");
  return { success: true };
}

export async function updateEvent(input: UpdateEventInput) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedInput = updateEventSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide valid event information." };
  }

  const { id, classId, description, ...rest } = parsedInput.data;

  try {
    await prisma.event.update({
      where: { id },
      data: {
        ...rest,
        description: description || null,
        classId: classId || null,
        date: new Date(rest.date),
      },
    });
  } catch (error) {
    console.error("Failed to update event", error);
    return { error: "The event could not be updated." };
  }

  revalidatePath("/list/events");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const authorizationError = await requireAdmin();

  if (authorizationError) {
    return authorizationError;
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid event ID is required." };
  }

  try {
    await prisma.event.delete({ where: { id: parsedId.data } });
  } catch (error) {
    console.error("Failed to delete event", error);
    return { error: "The event could not be deleted." };
  }

  revalidatePath("/list/events");
  return { success: true };
}
