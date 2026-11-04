import { queryOptions } from "@tanstack/react-query";

import { getTimesToBeatForGameFn } from "../api";

export const timesToBeatQueryOptions = (igdbId: number) =>
  queryOptions({
    queryKey: ["times-to-beat", igdbId],
    queryFn: () => getTimesToBeatForGameFn({ data: { igdbId } }),
  });
