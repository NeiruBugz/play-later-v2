import "server-only";

import { getServerUserId } from "@/auth";
import { IgdbService } from "@/data-access-layer/services";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createLogger } from "@/shared/lib/app/logger";

const logger = createLogger({ service: "SearchAPIRoute" });

const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(3, "Query must be at least 3 characters")
    .max(100, "Query too long"),
});

export async function GET(request: Request) {
  const userId = await getServerUserId();

  if (!userId) {
    logger.warn("Unauthorized search attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ games: [] });
  }

  const validation = SearchQuerySchema.safeParse({ query });

  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || "Invalid query";
    logger.warn({ query, userId }, "Invalid search query");
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  logger.info({ query, userId }, "Game search requested");

  const igdbService = new IgdbService();
  const result = await igdbService.searchGamesByName({
    name: validation.data.query,
  });

  if (!result.success) {
    logger.error({ error: result.error, query, userId }, "Game search failed");
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  logger.info(
    { query, userId, resultCount: result.data.games.length },
    "Game search completed"
  );

  return NextResponse.json({ games: result.data.games });
}
