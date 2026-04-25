import type { LibraryItemStatus } from "@/shared/types";

export type CtaAction =
  | { kind: "logSession" }
  | {
      kind: "updateStatus";
      status: LibraryItemStatus;
      hasBeenPlayed?: boolean;
      startedAtNullableSet?: boolean;
    };

export type CtaPayload = {
  label: string;
  action: CtaAction;
};

export function getPrimaryCtaPayload(
  status: LibraryItemStatus,
  hasBeenPlayed: boolean
): CtaPayload {
  void hasBeenPlayed;
  switch (status) {
    case "PLAYING":
      return {
        label: "Log Session",
        action: { kind: "logSession" },
      };
    case "UP_NEXT":
      return {
        label: "Start Playing",
        action: {
          kind: "updateStatus",
          status: "PLAYING",
          startedAtNullableSet: true,
        },
      };
    case "SHELF":
      return {
        label: "Queue It",
        action: { kind: "updateStatus", status: "UP_NEXT" },
      };
    case "PLAYED":
      return {
        label: "Replay",
        action: {
          kind: "updateStatus",
          status: "UP_NEXT",
          hasBeenPlayed: true,
        },
      };
    case "WISHLIST":
      return {
        label: "Add to Shelf",
        action: { kind: "updateStatus", status: "SHELF" },
      };
  }
}
