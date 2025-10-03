import { z } from "zod";

const EditLibraryItemSchema = z.object({
  status: z.string(),
  id: z.number(),
  platform: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

// New schema for next-safe-action
export const EditLibraryItemInputSchema = z.object({
  id: z.number(),
  status: z.enum([
    "CURIOUS_ABOUT",
    "TOOK_A_BREAK",
    "CURRENTLY_EXPLORING",
    "EXPERIENCED",
    "WISHLIST",
    "REVISITING",
  ]),
  platform: z.string(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const validateEditLibraryItem = (formData: FormData) => {
  return EditLibraryItemSchema.safeParse({
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
