import { useQuery } from "@tanstack/react-query";

import { currentUserQueryOptions } from "../api/current-user-query";

const DEFAULT_EVENING_MINUTES = 105;

export function useEveningMinutes(): number {
  const { data } = useQuery(currentUserQueryOptions);
  return data?.eveningMinutes ?? DEFAULT_EVENING_MINUTES;
}
