import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { searchGames, type SearchGamesResult } from "@/shared/api/igdb";

// FSD: per-feature thin wrapper. Sibling feature `search-games` has its own
// equivalent — duplication is the price of feature isolation. The shared
// `searchGames` transport in `@/shared/api/igdb` is the actual reuse point.
const SEARCH_GAMES_INPUT = z.object({
  name: z.string().min(1, "Search query is required").max(200),
  offset: z.number().int().nonnegative().optional(),
});

// Anonymous-allowed: search has no auth requirement.
export const searchGamesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SEARCH_GAMES_INPUT.parse(data))
  .handler(async ({ data }): Promise<SearchGamesResult> => {
    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const parsed = SEARCH_GAMES_INPUT.parse(data);
    return searchGames({ name: parsed.name, offset: parsed.offset });
  });
