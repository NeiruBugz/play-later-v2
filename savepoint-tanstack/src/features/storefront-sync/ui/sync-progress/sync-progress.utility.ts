import type { SteamSyncStatus } from "../../model/types";

export const getSyncStageText = ({
  status,
  lookedUp,
  totalToLookUp,
}: Pick<SteamSyncStatus, "status" | "lookedUp" | "totalToLookUp">) => {
  if (status === "LOOKING_UP" && totalToLookUp > 0) {
    return `Looking up your games — ${lookedUp} of ${totalToLookUp}`;
  }
  return "Fetching your Steam library…";
};
