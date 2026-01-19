import type { SteamProfile } from "@/features/steam-import/types";

export type ConnectSteamHandlerInput = {
  steamId: string;
  userId: string;
};

export type ConnectSteamHandlerOutput = {
  profile: SteamProfile;
};
