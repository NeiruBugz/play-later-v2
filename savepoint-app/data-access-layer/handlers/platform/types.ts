import type { Platform } from "@prisma/client";

/**
 * Input for get platforms handler
 */
export type GetPlatformsHandlerInput = {
  igdbId: number;
};

/**
 * Output for get platforms handler
 */
export type GetPlatformsHandlerOutput = {
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
};
