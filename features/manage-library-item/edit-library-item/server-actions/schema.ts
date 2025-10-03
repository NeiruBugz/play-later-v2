import { type LibraryItemStatus } from "@prisma/client";
import { z } from "zod";
import { zfd } from "zod-form-data";

const LibraryStatus = z.enum([
  "CURIOUS_ABOUT",
  "TOOK_A_BREAK",
  "CURRENTLY_EXPLORING",
  "EXPERIENCED",
  "WISHLIST",
  "REVISITING",
]);

const optionalDateSchema = z
  .string()
  .transform((value) => {
    if (!value) return undefined;
    return value;
  })
  .pipe(z.string().date().pipe(z.coerce.date()).optional());

export const editLibraryItemSchema = zfd.formData({
  id: zfd.numeric(),
  status: zfd.text().transform((value) => {
    if (!LibraryStatus.safeParse(value).success) {
      throw new Error("Invalid status");
    }
    return value as LibraryItemStatus;
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

export const createLibraryItemSchema = zfd.formData({
  gameId: zfd.text(),
  platform: zfd.text(),
  status: zfd.text().transform((value) => {
    if (!LibraryStatus.safeParse(value).success) {
      throw new Error("Invalid status");
    }
    return value as LibraryItemStatus;
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
