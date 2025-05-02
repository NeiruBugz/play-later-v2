import { z } from "zod";

const CreateBacklogItemSchema = z.object({
  userId: z.string(),
  gameId: z.string(),
  platform: z.string(),
  status: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const validateCreateBacklogItem = (formData: FormData) => {
  return CreateBacklogItemSchema.safeParse({
    userId: formData.get("userId"),
    gameId: formData.get("gameId"),
    platform: formData.get("platform"),
    status: formData.get("status"),
    startedAt: formData.get("startedAt")
      ? new Date(formData.get("startedAt") as string)
      : undefined,
    completedAt: formData.get("completedAt")
      ? new Date(formData.get("completedAt") as string)
      : undefined,
  });
};
