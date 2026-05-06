import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getLibraryPageDataFn } from "@/features/library-list";
import { LibraryPage } from "@/widgets/library-page";

const searchSchema = z.object({
  status: z
    .enum(["PLAYING", "PLAYED", "UP_NEXT", "SHELF", "WISHLIST"])
    .optional(),
  platform: z.string().min(1).optional(),
  minRating: z.number().int().min(1).max(10).optional(),
  sortBy: z.enum(["updatedAt", "createdAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const Route = createFileRoute("/_authed/library")({
  validateSearch: (input) => searchSchema.parse(input),
  loaderDeps: ({ search }) => ({
    status: search.status,
    platform: search.platform,
    minRating: search.minRating,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
  }),
  loader: ({ deps }) => getLibraryPageDataFn({ data: deps }),
  component: LibraryRoute,
});

function LibraryRoute() {
  const { items, total } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <LibraryPage
      items={items}
      total={total}
      status={search.status}
      platform={search.platform}
      minRating={search.minRating}
      sortBy={search.sortBy ?? "updatedAt"}
      sortOrder={search.sortOrder ?? "desc"}
    />
  );
}
