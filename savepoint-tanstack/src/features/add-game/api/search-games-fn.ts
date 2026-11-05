import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import {
  SEARCH_LIBRARY_AWARE_INPUT,
  searchLibraryAwareGamesWorker,
  type LibraryAwareSearchResult,
} from "@/entities/library-item/api/search-library-aware-games.worker";
import { getServerUserId } from "@/entities/session/api/get-session.server";
import { enforceSearchRateLimit } from "@/shared/api/search-rate-limit.server";

/** Add-dialog search: library-aware (results carry `library`: { status, upNextPosition, rating } | null). */
export const searchGamesFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SEARCH_LIBRARY_AWARE_INPUT.parse(data))
  .handler(async ({ data }): Promise<LibraryAwareSearchResult> => {
    const userId = await getServerUserId(getRequest());
    await enforceSearchRateLimit(userId);
    return searchLibraryAwareGamesWorker(userId, data);
  });
