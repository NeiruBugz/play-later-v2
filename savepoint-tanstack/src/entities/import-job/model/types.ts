import type {
  ImportFailureCode,
  ImportJob,
  ImportJobStatus,
  Storefront,
} from "../../../../shared/lib/prisma/client.ts";

export type { ImportJob, ImportJobStatus, ImportFailureCode, Storefront };

export const ACTIVE_IMPORT_JOB_STATUSES = [
  "QUEUED",
  "GATHERING",
  "LOOKING_UP",
] as const satisfies readonly ImportJobStatus[];

export type CreateImportJobInput = {
  storefront: Storefront;
  addAllToLibrary: boolean;
  storefrontAccountId: string;
};

export type GatherPlan = {
  totalToLookUp: number;
  lookedUp: number;
  refreshedGames: number;
  totalChunks: number;
};

export type ChunkDoneCounters = { lookupCount: number; added: number };

export type ChunkDoneResult = {
  applied: boolean;
  done: number;
  total: number;
};
