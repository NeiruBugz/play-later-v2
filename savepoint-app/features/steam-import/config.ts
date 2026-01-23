import { env } from "@/env.mjs";

export type SteamImportConfig = {
  readonly isBackgroundSyncEnabled: boolean;
};

export const steamImportConfig: SteamImportConfig = {
  isBackgroundSyncEnabled: env.ENABLE_STEAM_BACKGROUND_SYNC === "true",
} as const;
