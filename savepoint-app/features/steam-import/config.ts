export type SteamImportConfig = {
  readonly isBackgroundSyncEnabled: boolean;
};

export const steamImportConfig: SteamImportConfig = {
  isBackgroundSyncEnabled: false,
} as const;
