import {
  libraryItemsFixture,
  uniquePlatformsFixture,
} from "@/test/fixtures/library";
import { http, HttpResponse } from "msw";

import { LibraryItemStatus } from "@/shared/types";

export const createLibraryHandlers = (items = libraryItemsFixture) => [
  http.get("/api/library", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") ?? "desc";
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "24", 10);

    let filtered = [...items];

    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (platform) {
      filtered = filtered.filter((item) => item.platform === platform);
    }
    if (search) {
      filtered = filtered.filter((item) =>
        item.game.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    const total = filtered.length;
    const paginatedItems = filtered.slice(offset, offset + limit);
    const hasMore = offset + paginatedItems.length < total;

    return HttpResponse.json({
      success: true,
      data: { items: paginatedItems, total, hasMore },
    });
  }),

  http.get("/api/library/unique-platforms", () => {
    return HttpResponse.json({
      success: true,
      data: { platforms: uniquePlatformsFixture },
    });
  }),

  http.get("/api/library/status-counts", ({ request }) => {
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");
    const search = url.searchParams.get("search");

    let filtered = [...items];
    if (platform) {
      filtered = filtered.filter((item) => item.platform === platform);
    }
    if (search) {
      filtered = filtered.filter((item) =>
        item.game.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const counts = Object.values(LibraryItemStatus).reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<LibraryItemStatus, number>
    );
    for (const item of filtered) {
      counts[item.status as LibraryItemStatus] =
        (counts[item.status as LibraryItemStatus] ?? 0) + 1;
    }

    return HttpResponse.json({ success: true, data: counts });
  }),
];

export const libraryApiHandlers = createLibraryHandlers();
