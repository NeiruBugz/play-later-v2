import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

export const CreateGameActionSchema = z.object({
  libraryItemStatus: z.nativeEnum(LibraryItemStatus).optional(),
  igdbId: z.number(),
  platform: z.string().optional(),
  acquisitionType: z.nativeEnum(AcquisitionType).optional(),
});

export type CreateGameActionInput = z.infer<typeof CreateGameActionSchema>;

export const validateCreateGameAction = (formData: FormData) => {
  return CreateGameActionSchema.safeParse({
    libraryItemStatus: formData.get("libraryItemStatus"),
    igdbId: Number(formData.get("igdbId")),
    acquisitionType: formData.get("acquisitionType"),
    platform: formData.get("platform"),
  });
};
