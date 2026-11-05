import { queryOptions } from "@tanstack/react-query";

import { getRelatedGamesForGameFn, getTimesToBeatForGameFn } from "../api";

export const timesToBeatQueryOptions = (igdbId: number) =>
  queryOptions({
    queryKey: ["times-to-beat", igdbId],
    queryFn: () => getTimesToBeatForGameFn({ data: { igdbId } }),
  });

export const relatedGamesQueryOptions = (igdbId: number) =>
  queryOptions({
    queryKey: ["related-games", igdbId],
    queryFn: () => getRelatedGamesForGameFn({ data: { igdbId } }),
  });
