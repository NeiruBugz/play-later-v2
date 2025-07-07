import { BacklogItemStatus } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const BacklogStatus = z.enum([
  "TO_PLAY",
  "PLAYED",
  "PLAYING",
  "COMPLETED",
  "WISHLIST",
]);

const optionalDateSchema = z
  .string()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  })
  .pipe(z.string().date().pipe(z.coerce.date()).optional());

export const editBacklogItemSchema = zfd.formData({
  id: zfd.numeric(),
  status: zfd.text().transform((value) => {
    if (!BacklogStatus.safeParse(value).success) {
      throw new Error("Invalid status");
    }
    return value as BacklogItemStatus;
  }),
  platform: zfd.text(),
  startedAt: zfd
    .text()
    .transform((value) => {
      if (!optionalDateSchema.safeParse(value).success) {
        throw new Error("Invalid startedAt");
      }
      return new Date(value);
    })
    .optional(),
  completedAt: zfd
    .text()
    .transform((value) => {
      if (!optionalDateSchema.safeParse(value).success) {
        throw new Error("Invalid startedAt");
      }
      return new Date(value);
    })
    .optional(),
});

export const createBacklogItemSchema = zfd.formData({
  gameId: zfd.text(),
  platform: zfd.text(),
  status: zfd.text().transform((value) => {
    if (!BacklogStatus.safeParse(value).success) {
      throw new Error("Invalid status");
    }
    return value as BacklogItemStatus;
  }),
  startedAt: zfd
    .text()
    .transform((value) => {
      if (!optionalDateSchema.safeParse(value).success) {
        throw new Error("Invalid startedAt");
      }
      return new Date(value);
    })
    .optional(),
  completedAt: zfd
    .text()
    .transform((value) => {
      if (!optionalDateSchema.safeParse(value).success) {
        throw new Error("Invalid startedAt");
      }
      return new Date(value);
    })
    .optional(),
});
