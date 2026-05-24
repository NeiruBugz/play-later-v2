import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getLibraryStatusCounts,
  type LibraryStatusCountMap,
} from "@/entities/library-item/api/get-library-status-counts.server";
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
import { ratingStarsToStorage } from "@/shared/lib/rating";

const libraryStatusSchema = z.enum([
  "PLAYING",
  "PLAYED",
  "UP_NEXT",
  "SHELF",
  "WISHLIST",
]);

const acquisitionSchema = z.enum(["DIGITAL", "SUBSCRIPTION", "PHYSICAL"]);
const sortBySchema = z.enum(["title", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const inputSchema = z.object({
  status: libraryStatusSchema.optional(),
  platform: z.string().min(1).optional(),
  acquisition: acquisitionSchema.optional(),
  startedOnly: z.boolean().optional(),
  // Stars (0.5–5), the user-facing unit. Converted to the 1–10 storage int
  // before hitting Prisma (see handler).
  minRating: z.number().min(0.5).max(5).multipleOf(0.5).optional(),
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
  /**
   * Per-status counts across the **entire** library, unscoped by the active
   * filters — so the status rail always tells the truth ("47 PLAYED games
   * exist") even while the grid is filtered to a single status.
   */
  statusCounts: LibraryStatusCountMap;
};

export const getLibraryPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GetLibraryPageDataResult> => {
    const filters = inputSchema.parse(data);
    const userId = await requireUserId();
    // The grid query speaks the storage unit; translate the star filter here so
    // the entity stays in DB units and the UI/URL stay in stars.
    const libraryFilters = {
      ...filters,
      minRating:
        filters.minRating === undefined
          ? undefined
          : ratingStarsToStorage(filters.minRating),
    };
    const [library, onboarding, platforms, statusCounts] = await Promise.all([
      getLibrary(userId, libraryFilters),
      getOnboardingSignals(userId),
      getUniqueLibraryPlatforms(userId),
      getLibraryStatusCounts(userId),
    ]);
    return { ...library, onboarding, platforms, statusCounts };
  });
