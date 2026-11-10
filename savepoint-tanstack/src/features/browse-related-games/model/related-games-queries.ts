import { queryOptions } from "@tanstack/react-query";

import { getRelatedCollectionsFn } from "../api";

export const relatedGamesQueryOptions = (igdbId: number) =>
  queryOptions({
    queryKey: ["related-games", igdbId],
    queryFn: () => getRelatedCollectionsFn({ data: { igdbId } }),
  });
