import type { ImportFailureCode, ImportJobStatus } from "@/entities/import-job";

export type SteamSyncStatus = {
  jobId: string;
  status: ImportJobStatus;
  totalToLookUp: number;
  lookedUp: number;
  newGames: number;
  refreshedGames: number;
  addedToLibrary: number;
  needsMatch: number;
  addAllToLibrary: boolean;
  failureCode: ImportFailureCode | null;
  finishedAt: Date | null;
  noticeSeen: boolean;
};

export type StartSteamSyncResult = {
  jobId: string;
  status: ImportJobStatus;
  alreadyRunning: boolean;
};
