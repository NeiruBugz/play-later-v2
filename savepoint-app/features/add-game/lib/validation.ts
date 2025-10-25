import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { platformOptions, type SupportedPlatform } from "./constants";

const supportedPlatformValues = platformOptions.map(
  (option) => option.value
) as [SupportedPlatform, ...SupportedPlatform[]];

const platformSchema = z
  .string({
    required_error: "Platform is required",
    invalid_type_error: "Platform is required",
  })
  .min(1, "Platform is required")
  .pipe(
    z.enum(supportedPlatformValues, {
      invalid_type_error: "Platform is required",
    })
  );

const optionalDate = z
  .union([
    z.coerce.date(),
    z.string().trim().length(0),
    z.undefined(),
    z.null(),
  ])
  .transform<Date | undefined>((value) => {
    if (value instanceof Date) {
      return value;
    }

    return undefined;
  });

export const AddGameToLibrarySchema = z
  .object({
    igdbId: z.number().int().positive("Game ID must be a positive integer"),
    status: z.nativeEnum(LibraryItemStatus),
    platform: platformSchema,
    acquisitionType: z.nativeEnum(AcquisitionType),
    startedAt: optionalDate,
    completedAt: optionalDate,
  })
  .superRefine((data, ctx) => {
    const { startedAt, completedAt } = data;

    if (startedAt && completedAt && completedAt < startedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Completion date cannot be before start date",
        path: ["completedAt"],
      });
    }
  });

export type AddGameToLibraryInput = z.infer<typeof AddGameToLibrarySchema>;
export type AddGameToLibraryFormValues = z.input<typeof AddGameToLibrarySchema>;
