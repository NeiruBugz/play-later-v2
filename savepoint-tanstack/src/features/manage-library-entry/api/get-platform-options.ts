import { createServerFn } from "@tanstack/react-start";

import { requireUserId } from "@/entities/session/api/require-user-id";

import {
  GET_PLATFORM_OPTIONS_INPUT,
  type PlatformOptions,
} from "./get-platform-options.constants";
import { getPlatformOptionsWorker } from "./get-platform-options.worker";

export const getPlatformOptionsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GET_PLATFORM_OPTIONS_INPUT.parse(data))
  .handler(async ({ data }): Promise<PlatformOptions> => {
    const userId = await requireUserId();
    return getPlatformOptionsWorker(userId, data);
  });
