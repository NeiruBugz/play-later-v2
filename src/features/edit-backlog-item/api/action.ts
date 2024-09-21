"use server";

import { createBacklogItem } from "@/src/entities/backlog-item";
import { updateBacklogItem } from "@/src/entities/backlog-item/model/update-backlog-item";
import { z } from "zod";


const EditBacklogItemSchema = z.object({
  status: z.string(),
  id: z.number(),
  platform: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export async function editBacklogItemAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = EditBacklogItemSchema.safeParse({
    status: payload.get("status"),
    id: Number(payload.get("id")),
    platform: payload.get("platform"),
    startedAt: payload.get("startedAt")
      ? new Date(payload.get("startedAt") as string)
      : undefined,
    completedAt: payload.get("completedAt")
      ? new Date(payload.get("completedAt") as string)
      : undefined,
  });

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    await updateBacklogItem(parsedPayload.data);
    return {
      message: "Success",
      data: parsedPayload.data,
    };
  } catch (error) {
    return {
      message: "Failed to update backlog item",
    };
  }
}

const CreateBacklogItemSchema = z.object({
  userId: z.string(),
  gameId: z.string(),
  platform: z.string(),
  status: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export async function createBacklogItemAction(
  prevState: { message: string },
  payload: FormData
) {
  const parsedPayload = CreateBacklogItemSchema.safeParse({
    userId: payload.get("userId"),
    gameId: payload.get("gameId"),
    platform: payload.get("platform"),
    status: payload.get("status"),
    startedAt: payload.get("startedAt")
      ? new Date(payload.get("startedAt") as string)
      : undefined,
    completedAt: payload.get("completedAt")
      ? new Date(payload.get("completedAt") as string)
      : undefined,
  });

  if (!parsedPayload.success) {
    return {
      message: "Invalid payload",
    };
  }

  try {
    await createBacklogItem({
      backlogItem: {
        backlogStatus: parsedPayload.data.status,
        platform: parsedPayload.data.platform,
        startedAt: parsedPayload.data.startedAt,
        completedAt: parsedPayload.data.completedAt,
        acquisitionType: "DIGITAL",
      },
      userId: parsedPayload.data.userId,
      gameId: parsedPayload.data.gameId,
    })
    return {
      message: "Success",
      data: parsedPayload.data,
    };
  } catch (error) {
    return {
      message: "Failed to create backlog item",
    };
  }
};