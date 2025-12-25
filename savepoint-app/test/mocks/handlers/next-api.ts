import { searchResponseFixture } from "@/test/fixtures/search";
import { http, HttpResponse } from "msw";

export const nextApiHandlers = [
  http.get("/api/igdb-search", async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    if (query.includes("sdasdass") || query.length === 0) {
      return HttpResponse.json({ response: [] });
    }
    return HttpResponse.json(searchResponseFixture);
  }),
];
