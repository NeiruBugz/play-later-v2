import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getLibraryPageDataFn } from "@/features/library-list";
import { LibraryPage } from "@/widgets/library-page";

const searchSchema = z.object({
  status: z
    .enum(["WANT", "PLAYING", "DONE", "UP_NEXT"])
    .optional()
    .catch(undefined),
  platform: z.string().min(1).optional().catch(undefined),
  notOwnedOnly: z.boolean().optional().catch(undefined),
  // User-facing unit is stars (0.5–5, half-star precision). The URL reads
  // `?minRating=3.5`, not the raw 1–10 storage int. Conversion to storage
  // happens at the loader/entity seam. See shared/lib/rating.ts.
  minRating: z
    .number()
    .min(0.5)
    .max(5)
    .multipleOf(0.5)
    .optional()
    .catch(undefined),
  unratedOnly: z.boolean().optional().catch(undefined),
  sortBy: z
    .enum(["updatedAt", "createdAt", "title"])
    .optional()
    .catch(undefined),
  sortOrder: z.enum(["asc", "desc"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authed/library")({
  validateSearch: (input) => searchSchema.parse(input),
  loaderDeps: ({ search }) => ({
    status: search.status,
    platform: search.platform,
    notOwnedOnly: search.notOwnedOnly,
    minRating: search.minRating,
    unratedOnly: search.unratedOnly,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
  }),
  loader: ({ deps }) => getLibraryPageDataFn({ data: deps }),
  component: LibraryRoute,
});

function LibraryRoute() {
  const { items, total, platforms, statusCounts, onboarding } =
    Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <LibraryPage
      items={items}
      total={total}
      platforms={platforms}
      statusCounts={statusCounts}
      status={search.status}
      platform={search.platform}
      notOwnedOnly={search.notOwnedOnly}
      minRating={search.minRating}
      unratedOnly={search.unratedOnly}
      sortBy={search.sortBy ?? "updatedAt"}
      sortOrder={search.sortOrder ?? "desc"}
      onboarding={{
        libraryItemCount: total,
        journalEntryCount: onboarding.journalEntryCount,
        userImage: onboarding.image,
        userSteamId: onboarding.steamId64,
      }}
    />
  );
}
