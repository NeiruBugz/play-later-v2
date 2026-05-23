import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getLibrary,
  type GetLibraryResult,
} from "@/entities/library-item/api/get-library.server";
import { getUniqueLibraryPlatforms } from "@/entities/library-item/api/get-unique-platforms.server";
import {
  getOnboardingSignals,
  type OnboardingSignals,
} from "@/entities/profile/api/get-onboarding-signals.server";
import { requireUserId } from "@/entities/session/api/require-user-id";

const libraryStatusSchema = z.enum([
  "PLAYING",
  "PLAYED",
  "UP_NEXT",
  "SHELF",
  "WISHLIST",
]);

const sortBySchema = z.enum(["title", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const inputSchema = z.object({
  status: libraryStatusSchema.optional(),
  platform: z.string().min(1).optional(),
  minRating: z.number().int().min(1).max(10).optional(),
  sortBy: sortBySchema.optional(),
  sortOrder: sortOrderSchema.optional(),
});

export type GetLibraryPageDataInput = z.infer<typeof inputSchema>;

export type GetLibraryPageDataResult = GetLibraryResult & {
  onboarding: OnboardingSignals;
  /**
   * Distinct platform names across the user's entire library — derived from
   * their own games (unscoped by the active filters), so the platform filter
   * lists only platforms they actually own. Matches canonical's
   * `getUniquePlatforms`.
   */
  platforms: string[];
};

export const getLibraryPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GetLibraryPageDataResult> => {
    const filters = inputSchema.parse(data);
    const userId = await requireUserId();
    const [library, onboarding, platforms] = await Promise.all([
      getLibrary(userId, filters),
      getOnboardingSignals(userId),
      getUniqueLibraryPlatforms(userId),
    ]);
    return { ...library, onboarding, platforms };
  });
