import type { PlatformDomain } from "@/shared/types/platform";

export type GetPlatformsHandlerInput = {
  igdbId: number;
};

export type GetPlatformsHandlerOutput = {
  supportedPlatforms: PlatformDomain[];
  otherPlatforms: PlatformDomain[];
};
