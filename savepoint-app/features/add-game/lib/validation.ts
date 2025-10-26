import {
  ACQUISITION_TYPES,
  LIBRARY_ITEM_STATUS,
  type AcquisitionType,
  type LibraryItemStatus,
} from "@/data-access-layer/domain/enums";
import { z } from "zod";

import { platformOptions, type SupportedPlatform } from "./constants";

const supportedPlatformValues = platformOptions.map(
  (option) => option.value
) as SupportedPlatform[];

const platformSchema: z.ZodType<SupportedPlatform> =
  supportedPlatformValues.length > 0
    ? (z.enum(
        supportedPlatformValues as [SupportedPlatform, ...SupportedPlatform[]],
        {
          required_error: "Platform is required",
          invalid_type_error: "Platform is required",
        }
      ) as z.ZodType<SupportedPlatform>)
    : (z
        .string({
          required_error: "Platform is required",
          invalid_type_error: "Platform is required",
        })
        .min(
          1,
          "Platform is required"
        ) as unknown as z.ZodType<SupportedPlatform>);

const libraryItemStatusValues = LIBRARY_ITEM_STATUS as unknown as [
  LibraryItemStatus,
  ...LibraryItemStatus[],
];
const acquisitionTypeValues = ACQUISITION_TYPES as unknown as [
  AcquisitionType,
  ...AcquisitionType[],
];

const optionalDate = z
  .preprocess((value) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      return undefined;
    }
    return value;
  }, z.coerce.date().optional())
  .transform<Date | undefined>((value) =>
    value instanceof Date ? value : undefined
  );

export const AddGameToLibrarySchema = z
  .object({
    igdbId: z.number().int().positive("Game ID must be a positive integer"),
    status: z.enum(libraryItemStatusValues, {
      required_error: "Status is required",
      invalid_type_error: "Status is required",
    }),
    platform: platformSchema,
    acquisitionType: z.enum(acquisitionTypeValues, {
      required_error: "Acquisition type is required",
      invalid_type_error: "Acquisition type is required",
    }),
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
