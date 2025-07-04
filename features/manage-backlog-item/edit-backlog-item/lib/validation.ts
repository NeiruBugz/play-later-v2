import { z } from "zod";

const EditBacklogItemSchema = z.object({
  status: z.string(),
  id: z.number(),
  platform: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

// New schema for next-safe-action
export const EditBacklogItemInputSchema = z.object({
  id: z.number(),
  status: z.enum(["TO_PLAY", "PLAYED", "PLAYING", "COMPLETED", "WISHLIST"]),
  platform: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const validateEditBacklogItem = (formData: FormData) => {
  return EditBacklogItemSchema.safeParse({
    status: formData.get("status"),
    id: Number(formData.get("id")),
    platform: formData.get("platform"),
    startedAt: formData.get("startedAt")
      ? new Date(formData.get("startedAt") as string)
      : undefined,
    completedAt: formData.get("completedAt")
      ? new Date(formData.get("completedAt") as string)
      : undefined,
  });
};
