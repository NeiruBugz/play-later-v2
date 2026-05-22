/**
 * Canonical `searchGamesFn` — the single `createServerFn` wrapper for IGDB
 * game search shared across all feature slices that need it (command-palette,
 * steam-import, add-game, search-games).
 *
 * FSD: lives at the entity layer because it is pure game-domain read with no
 * auth requirement, no DB write, and no user-intent specifics. All features
 * that need it import downward from `@/entities/game`.
 *
 * No `.server.ts` suffix: `createServerFn` files MUST be client-importable
 * (the bundler stubs the handler body in the client build). See foot-gun #1
 * in FOOT-GUNS.md.
 *
 * Auth: anonymous-allowed — IGDB search has no auth requirement (mirrors the
 * canonical app's public search route).
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { searchGames, type SearchGamesResult } from "@/shared/api/igdb";

export const SEARCH_GAMES_INPUT = z.object({
  name: z.string().min(1, "Search query is required").max(200),
  offset: z.number().int().nonnegative().optional(),
});

export const searchGamesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SEARCH_GAMES_INPUT.parse(data))
  .handler(async ({ data }): Promise<SearchGamesResult> => {
    // Re-parse server-side: inputValidator runs only on cross-network calls;
    // programmatic callers (other server fns, tests) bypass it.
    const parsed = SEARCH_GAMES_INPUT.parse(data);
    return searchGames({ name: parsed.name, offset: parsed.offset });
  });
