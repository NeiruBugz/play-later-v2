import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "@/entities/session/api/get-session.server";

import {
  SEARCH_LIBRARY_AWARE_INPUT,
  searchLibraryAwareGamesWorker,
  type LibraryAwareSearchResult,
} from "./search-library-aware-games.worker";

/**
 * Library-aware IGDB search. Anonymous-allowed: search needs no auth, so we
 * resolve `userId` with `getServerUserId` (returns undefined when signed out)
 * rather than `requireUserId`. The worker owns the annotation join.
 */
export const searchLibraryAwareGamesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SEARCH_LIBRARY_AWARE_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryAwareSearchResult> => {
    const userId = await getServerUserId(getRequest());
    return searchLibraryAwareGamesWorker(userId, data);
  });
