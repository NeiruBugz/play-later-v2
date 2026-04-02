import type {
  PaginatedFollowersResult,
  PaginatedFollowingResult,
} from "@/data-access-layer/repository";

import type { ServiceResult } from "../types";

export type FollowCounts = {
  followers: number;
  following: number;
};

export type FollowUserResult = ServiceResult<void>;
export type UnfollowUserResult = ServiceResult<void>;
export type IsFollowingResult = ServiceResult<boolean>;
export type GetFollowCountsResult = ServiceResult<FollowCounts>;
export type GetFollowersResult = ServiceResult<PaginatedFollowersResult>;
export type GetFollowingResult = ServiceResult<PaginatedFollowingResult>;
