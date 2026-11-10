import { queryOptions } from "@tanstack/react-query";

import { getCurrentUserFn } from "./get-current-user";
import { CURRENT_USER_QUERY_KEY } from "./invalidate-current-user";

const CURRENT_USER_STALE_TIME_MS = 5 * 60_000;

export const currentUserQueryOptions = queryOptions({
  queryKey: CURRENT_USER_QUERY_KEY,
  queryFn: () => getCurrentUserFn(),
  staleTime: CURRENT_USER_STALE_TIME_MS,
});
