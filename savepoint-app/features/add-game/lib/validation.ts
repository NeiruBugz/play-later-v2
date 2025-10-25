import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

export const AddGameToLibrarySchema = z.object({
  igdbId: z.number().int().positive("Game ID must be a positive integer"),
  status: z.nativeEnum(LibraryItemStatus),
  platform: z.string().min(1, "Platform is required"),
  acquisitionType: z.nativeEnum(AcquisitionType),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type AddGameToLibraryInput = z.infer<typeof AddGameToLibrarySchema>;
