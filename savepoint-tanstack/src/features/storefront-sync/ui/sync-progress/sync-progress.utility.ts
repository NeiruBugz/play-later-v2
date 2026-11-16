import type { SteamSyncStatus } from "../../model/types";

type SyncStageInput = Pick<
  SteamSyncStatus,
  "status" | "lookedUp" | "totalToLookUp"
>;

const LOOKING_UP_TEXT = "Looking up your games";

export const getSyncStageText = ({ status }: SyncStageInput) =>
  status === "LOOKING_UP" ? LOOKING_UP_TEXT : "Fetching your Steam library…";

export const getSyncCountText = ({
  status,
  lookedUp,
  totalToLookUp,
}: SyncStageInput) =>
  status === "LOOKING_UP" && totalToLookUp > 0
    ? `${lookedUp.toLocaleString("en-US")} of ${totalToLookUp.toLocaleString("en-US")}`
    : null;
