import type {
  PaginatedFollowersResult,
  PaginatedFollowingResult,
} from "@/data-access-layer/repository";

export type FollowCounts = {
  followers: number;
  following: number;
};

export type { PaginatedFollowersResult, PaginatedFollowingResult };
