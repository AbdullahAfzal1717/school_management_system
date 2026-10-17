"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { UserRole } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const messageSchema = z.object({
  receiverId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const updateMessageSchema = messageSchema.extend({
  id: z.string().min(1),
});

export type CreateMessageInput = z.infer<typeof messageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { session: null, error: "You must be signed in." as const };
  }

  return { session, error: null };
}

export async function getMessageFormOptions() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { users: [] as { id: string; name: string; role: UserRole }[] };
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      ...(session.user.role === UserRole.ADMIN
        ? {}
        : { role: { in: [UserRole.ADMIN, UserRole.TEACHER] } }),
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });

  return {
    users: users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName} (${user.role})`,
      role: user.role,
    })),
  };
}

async function assertReceiverAllowed(senderRole: UserRole, receiverId: string) {
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

  if (!receiver) {
    return "Choose a valid recipient.";
  }

  if (
    senderRole !== UserRole.ADMIN &&
    receiver.role !== UserRole.ADMIN &&
    receiver.role !== UserRole.TEACHER
  ) {
    return "You can only message teachers and administrators.";
  }

  return null;
}

export async function createMessage(input: CreateMessageInput) {
  const { session, error } = await requireUser();

  if (error || !session) {
    return { error: error ?? "You must be signed in." };
  }

  const parsedInput = messageSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a recipient, subject, and message." };
  }

  if (parsedInput.data.receiverId === session.user.id) {
    return { error: "You cannot send a message to yourself." };
  }

  const receiverError = await assertReceiverAllowed(
    session.user.role,
    parsedInput.data.receiverId,
  );

  if (receiverError) {
    return { error: receiverError };
  }

  try {
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: parsedInput.data.receiverId,
        subject: parsedInput.data.subject,
        body: parsedInput.data.body,
      },
    });
  } catch (createError) {
    console.error("Failed to create message", createError);
    return { error: "The message could not be sent." };
  }

  revalidatePath("/list/messages");
  return { success: true };
}

export async function updateMessage(input: UpdateMessageInput) {
  const { session, error } = await requireUser();

  if (error || !session) {
    return { error: error ?? "You must be signed in." };
  }

  const parsedInput = updateMessageSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: "Please provide a recipient, subject, and message." };
  }

  const existing = await prisma.message.findUnique({
    where: { id: parsedInput.data.id },
  });

  if (!existing) {
    return { error: "Message not found." };
  }

  if (
    existing.senderId !== session.user.id &&
    session.user.role !== UserRole.ADMIN
  ) {
    return { error: "Only the sender can edit this message." };
  }

  const receiverError = await assertReceiverAllowed(
    session.user.role,
    parsedInput.data.receiverId,
  );

  if (receiverError) {
    return { error: receiverError };
  }

  try {
    await prisma.message.update({
      where: { id: parsedInput.data.id },
      data: {
        receiverId: parsedInput.data.receiverId,
        subject: parsedInput.data.subject,
        body: parsedInput.data.body,
      },
    });
  } catch (updateError) {
    console.error("Failed to update message", updateError);
    return { error: "The message could not be updated." };
  }

  revalidatePath("/list/messages");
  return { success: true };
}

export async function deleteMessage(id: string) {
  const { session, error } = await requireUser();

  if (error || !session) {
    return { error: error ?? "You must be signed in." };
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid message ID is required." };
  }

  const existing = await prisma.message.findUnique({
    where: { id: parsedId.data },
  });

  if (!existing) {
    return { error: "Message not found." };
  }

  const canDelete =
    session.user.role === UserRole.ADMIN ||
    existing.senderId === session.user.id ||
    existing.receiverId === session.user.id;

  if (!canDelete) {
    return { error: "You cannot delete this message." };
  }

  try {
    await prisma.message.delete({ where: { id: parsedId.data } });
  } catch (deleteError) {
    console.error("Failed to delete message", deleteError);
    return { error: "The message could not be deleted." };
  }

  revalidatePath("/list/messages");
  return { success: true };
}

export async function markMessageRead(id: string) {
  const { session, error } = await requireUser();

  if (error || !session) {
    return { error: error ?? "You must be signed in." };
  }

  const parsedId = z.string().min(1).safeParse(id);

  if (!parsedId.success) {
    return { error: "A valid message ID is required." };
  }

  const existing = await prisma.message.findUnique({
    where: { id: parsedId.data },
  });

  if (!existing || existing.receiverId !== session.user.id) {
    return { error: "Only the recipient can mark this message as read." };
  }

  try {
    await prisma.message.update({
      where: { id: parsedId.data },
      data: { read: true },
    });
  } catch (readError) {
    console.error("Failed to mark message read", readError);
    return { error: "The message could not be updated." };
  }

  revalidatePath("/list/messages");
  return { success: true };
}
