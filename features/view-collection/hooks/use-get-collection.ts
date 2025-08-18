import { useQuery } from "@tanstack/react-query";

import type { FilterParams } from "@/features/view-collection/lib/validation";

const fetchCollection = async (params: FilterParams) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      queryParams.set(key, value.toString());
    }
  });

  const response = await fetch(`/api/collection?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch collection");
  }
  return response.json();
};

export function useGetCollection(params: FilterParams) {
  return useQuery({
    queryKey: ["collection", params],
    queryFn: () => fetchCollection(params),
  });
}
