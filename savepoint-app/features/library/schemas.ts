import { z } from "zod";

import { LibraryItemStatus } from "@/shared/types";

export const UpdateLibraryStatusSchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus),
});

export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;
