import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

export const CreateGameActionSchema = z.object({
  backlogStatus: z.nativeEnum(BacklogItemStatus).optional(),
  igdbId: z.number(),
  platform: z.string().optional(),
  acquisitionType: z.nativeEnum(AcquisitionType).optional(),
});

export type CreateGameActionInput = z.infer<typeof CreateGameActionSchema>;

export const validateCreateGameAction = (formData: FormData) => {
  return CreateGameActionSchema.safeParse({
    backlogStatus: formData.get("backlogStatus"),
    igdbId: Number(formData.get("igdbId")),
    acquisitionType: formData.get("acquisitionType"),
    platform: formData.get("platform"),
  });
};
