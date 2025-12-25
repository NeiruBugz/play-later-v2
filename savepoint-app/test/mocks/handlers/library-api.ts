import {
  libraryItemsFixture,
  uniquePlatformsFixture,
} from "@/test/fixtures/library";
import { http, HttpResponse } from "msw";

export const createLibraryHandlers = (items = libraryItemsFixture) => [
  http.get("/api/library", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const search = url.searchParams.get("search");
    const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

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

    return HttpResponse.json({ success: true, data: filtered });
  }),

  http.get("/api/library/unique-platforms", () => {
    return HttpResponse.json({
      success: true,
      data: { platforms: uniquePlatformsFixture },
    });
  }),
];

export const libraryApiHandlers = createLibraryHandlers();
