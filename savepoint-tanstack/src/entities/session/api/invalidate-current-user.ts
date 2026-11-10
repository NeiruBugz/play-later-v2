import type { QueryClient } from "@tanstack/react-query";

export const CURRENT_USER_QUERY_KEY = ["current-user"] as const;

export function invalidateCurrentUser(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
}
