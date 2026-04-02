import type { PaginatedFeed } from "@/features/social/types";

import type { ServiceResult } from "../types";

export type GetFeedForUserResult = ServiceResult<PaginatedFeed>;
export type GetPopularFeedResult = ServiceResult<PaginatedFeed>;
