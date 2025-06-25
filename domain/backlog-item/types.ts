import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { z } from "zod";

// Define a schema for BacklogItemStatus enum
const BacklogItemStatusSchema = z.enum([
  BacklogItemStatus.TO_PLAY,
  BacklogItemStatus.PLAYED,
  BacklogItemStatus.PLAYING,
  BacklogItemStatus.COMPLETED,
  BacklogItemStatus.WISHLIST,
]);

// Define a schema for AcquisitionType enum
const AcquisitionTypeSchema = z.enum([
  AcquisitionType.DIGITAL,
  AcquisitionType.PHYSICAL,
  AcquisitionType.SUBSCRIPTION,
]);

// Schema for creating a backlog item
export const BacklogItemSchema = z.object({
  backlogStatus: z.string().transform((val) => {
    try {
      return BacklogItemStatusSchema.parse(val as BacklogItemStatus);
    } catch (e) {
      return BacklogItemStatus.TO_PLAY;
    }
  }),
  acquisitionType: z
    .string()
    .transform((val) => {
      try {
        return AcquisitionTypeSchema.parse(val as AcquisitionType);
      } catch (e) {
        return AcquisitionType.DIGITAL;
      }
    })
    .optional(),
  platform: z.string().optional(),
  startedAt: z.date().or(z.string().nullable()).optional(),
  completedAt: z.date().or(z.string().nullable()).optional(),
});

export const CreateBacklogItemSchema = z.object({
  backlogItem: BacklogItemSchema,
  userId: z.string().min(1),
  gameId: z.string().min(1),
});

export const UpdateBacklogItemSchema = z.object({
  id: z.number(),
  platform: z.string().optional(),
  status: z.string().transform((val) => {
    try {
      return BacklogItemStatusSchema.parse(val as BacklogItemStatus);
    } catch (e) {
      return BacklogItemStatus.TO_PLAY;
    }
  }),
  startedAt: z.date().or(z.string().nullable()).optional(),
  completedAt: z.date().or(z.string().nullable()).optional(),
});

export const UpdateBacklogItemStatusSchema = z.object({
  id: z.number(),
  status: z.string().transform((val) => {
    try {
      return BacklogItemStatusSchema.parse(val as BacklogItemStatus);
    } catch (e) {
      return BacklogItemStatus.TO_PLAY;
    }
  }),
});

export type CreateBacklogItemInput = z.infer<typeof CreateBacklogItemSchema>;
export type UpdateBacklogItemInput = z.infer<typeof UpdateBacklogItemSchema>;
export type UpdateBacklogItemStatusInput = z.infer<
  typeof UpdateBacklogItemStatusSchema
>;
