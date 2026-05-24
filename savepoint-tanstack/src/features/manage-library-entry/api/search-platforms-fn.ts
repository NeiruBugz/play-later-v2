import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  SEARCH_PLATFORMS_INPUT,
  searchPlatformsWorker,
} from "./search-platforms-fn.worker";

export const searchPlatformsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SEARCH_PLATFORMS_INPUT.parse(data))
  .handler(async ({ data }): Promise<string[]> => {
    const userId = await requireUserId();
    return searchPlatformsWorker(userId, data);
  });
