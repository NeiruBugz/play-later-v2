import { useQuery } from "@tanstack/react-query";

import type { PlatformDomain } from "@/shared/types";

type PlatformsApiResponse =
  | {
      success: true;
      data: {
        supportedPlatforms: PlatformDomain[];
        otherPlatforms: PlatformDomain[];
      };
    }
  | {
      success: false;
      error: string;
    };
const queryFn = async (igdbId: number) => {
  const response = await fetch(`/api/games/${igdbId}/platforms`);
  if (!response.ok) {
    throw new Error(`Failed to fetch platforms: ${response.statusText}`);
  }
  const result = (await response.json()) as PlatformsApiResponse;
  if (!result.success) {
    throw new Error(result.error || "Failed to load platforms");
  }
  return result.data;
};
export function useGetPlatforms(igdbId: number) {
  return useQuery<{
    supportedPlatforms: PlatformDomain[];
    otherPlatforms: PlatformDomain[];
  }>({
    queryKey: ["game-platforms", igdbId],
    queryFn: () => queryFn(igdbId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
