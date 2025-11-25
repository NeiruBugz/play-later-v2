import type { PlatformDomain } from "@/data-access-layer/domain/platform";

export type GetPlatformsHandlerInput = {
  igdbId: number;
};

export type GetPlatformsHandlerOutput = {
  supportedPlatforms: PlatformDomain[];
  otherPlatforms: PlatformDomain[];
};
