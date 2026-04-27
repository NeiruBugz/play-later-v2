"use client";

import { useQuery } from "@tanstack/react-query";

import type { UniquePlatformResult } from "@/shared/types/platform";

type UniquePlatformsApiResponse =
  | {
      success: true;
      data: {
        platforms: UniquePlatformResult[];
      };
    }
  | {
      success: false;
      error: string;
    };

const queryFn = async (): Promise<UniquePlatformResult[]> => {
  const response = await fetch("/api/library/unique-platforms");
  if (!response.ok) {
    throw new Error(`Failed to fetch unique platforms: ${response.statusText}`);
  }
  const result = (await response.json()) as UniquePlatformsApiResponse;
  if (!result.success) {
    throw new Error(result.error || "Failed to load unique platforms");
  }
  return result.data.platforms;
};

export function useUniquePlatforms() {
  return useQuery<UniquePlatformResult[]>({
    queryKey: ["unique-platforms"],
    queryFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
