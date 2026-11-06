import type { StatusChipStatus } from "@/shared/ui/status-chip";

import type {
  DoneOutcome,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

const STATUS_CHIP_BY_STATUS: Record<LibraryItemStatus, StatusChipStatus> = {
  WANT: "want",
  PLAYING: "playing",
  DONE: "done",
};

export function toStatusChipStatus(
  status: LibraryItemStatus,
  outcome: DoneOutcome | null = null
): StatusChipStatus {
  if (status === "DONE" && outcome === "LET_GO") return "let-go";
  return STATUS_CHIP_BY_STATUS[status];
}
