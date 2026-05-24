import { z } from "zod";

import { searchIgdbPlatforms } from "@/shared/api/igdb";
import { UnauthorizedError } from "@/shared/lib/errors";

export const SEARCH_PLATFORMS_INPUT = z.object({ query: z.string() });

const MIN_QUERY_LENGTH = 2;

/**
 * Searches IGDB's platform catalog for the combobox's remote-search affordance.
 * Returns canonical platform names (relevance-ordered). Queries shorter than
 * two trimmed characters short-circuit to `[]` so a single keystroke never
 * spams IGDB.
 */
export async function searchPlatformsWorker(
  userId: string | undefined,
  data: unknown
): Promise<string[]> {
  if (!userId) throw new UnauthorizedError("Sign in required");

  const { query } = SEARCH_PLATFORMS_INPUT.parse(data);

  if (query.trim().length < MIN_QUERY_LENGTH) return [];

  return searchIgdbPlatforms(query);
}
