import type { Platform } from "@prisma/client";

export type GetPlatformsHandlerInput = {
  igdbId: number;
};

export type GetPlatformsHandlerOutput = {
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
};
