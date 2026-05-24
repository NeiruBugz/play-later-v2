import {
  Archive,
  ListPlus,
  Play,
  Plus,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import {
  getStatusEntry,
  type LibraryItemWithGame,
  type StatusBadgeVariant,
} from "@/entities/library-item/model";

type LibraryItemStatus = LibraryItemWithGame["status"];

const COVER_ACCENT_GRADIENT: Record<StatusBadgeVariant, string> = {
  playing: "bg-gradient-to-br from-[var(--status-playing)] to-background",
  played: "bg-gradient-to-br from-[var(--status-played)] to-background",
  shelf: "bg-gradient-to-br from-[var(--status-shelf)] to-background",
  upNext: "bg-gradient-to-br from-[var(--status-upNext)] to-background",
  wishlist: "bg-gradient-to-br from-[var(--status-wishlist)] to-background",
};

export function getStatusCoverAccent(status: LibraryItemStatus): string {
  return COVER_ACCENT_GRADIENT[getStatusEntry(status).badgeVariant];
}

export type CardCtaAction =
  | { kind: "logSession" }
  | {
      kind: "updateStatus";
      status: LibraryItemStatus;
      hasBeenPlayed?: boolean;
      startedAtNullableSet?: boolean;
    };

export type CardCtaEmphasis = "primary" | "outline" | "ghost";

export type CardCtaPayload = {
  label: string;
  icon: LucideIcon;
  emphasis: CardCtaEmphasis;
  action: CardCtaAction;
};

export function getPrimaryCtaPayload(
  status: LibraryItemStatus
): CardCtaPayload {
  switch (status) {
    case "PLAYING":
      return {
        label: "Log Session",
        icon: Plus,
        emphasis: "primary",
        action: { kind: "logSession" },
      };
    case "UP_NEXT":
      return {
        label: "Start Playing",
        icon: Play,
        emphasis: "outline",
        action: {
          kind: "updateStatus",
          status: "PLAYING",
          startedAtNullableSet: true,
        },
      };
    case "SHELF":
      return {
        label: "Queue It",
        icon: ListPlus,
        emphasis: "outline",
        action: { kind: "updateStatus", status: "UP_NEXT" },
      };
    case "PLAYED":
      return {
        label: "Replay",
        icon: RotateCcw,
        emphasis: "ghost",
        action: {
          kind: "updateStatus",
          status: "UP_NEXT",
          hasBeenPlayed: true,
        },
      };
    case "WISHLIST":
      return {
        label: "Add to Shelf",
        icon: Archive,
        emphasis: "ghost",
        action: { kind: "updateStatus", status: "SHELF" },
      };
    default: {
      // Exhaustiveness assertion — raw throw is allowed for defensive
      // invariant checks per `errors.md`.
      const _exhaustive: never = status;
      throw new Error(`Unknown library status: ${String(_exhaustive)}`);
    }
  }
}
