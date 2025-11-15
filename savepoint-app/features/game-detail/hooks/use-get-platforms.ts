import { Platform } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

type PlatformsApiResponse =
  | {
      success: true;
      data: {
        supportedPlatforms: Platform[];
        otherPlatforms: Platform[];
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
    supportedPlatforms: Platform[];
    otherPlatforms: Platform[];
  }>({
    queryKey: ["game-platforms", igdbId],
    queryFn: () => queryFn(igdbId),
    staleTime: 5 * 60 * 1000, // 5 minutes - platforms don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time
  });
}
