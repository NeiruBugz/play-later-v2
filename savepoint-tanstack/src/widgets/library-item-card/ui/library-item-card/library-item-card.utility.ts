import { CheckCircle, Play, RotateCcw, type LucideIcon } from "lucide-react";

import {
  getStatusEntry,
  NEXT_STEP,
  type LibraryItemWithGame,
  type StatusBadgeVariant,
} from "@/entities/library-item/model";

type LibraryItemStatus = LibraryItemWithGame["status"];

const COVER_ACCENT_GRADIENT: Record<StatusBadgeVariant, string> = {
  want: "bg-gradient-to-br from-[var(--status-want)] to-background",
  playing: "bg-gradient-to-br from-[var(--status-playing)] to-background",
  done: "bg-gradient-to-br from-[var(--status-done)] to-background",
};

export function getStatusCoverAccent(status: LibraryItemStatus): string {
  return COVER_ACCENT_GRADIENT[getStatusEntry(status).badgeVariant];
}

export type CardCtaEmphasis = "primary" | "outline" | "ghost";

export type CardCtaPayload = {
  label: string;
  icon: LucideIcon;
  emphasis: CardCtaEmphasis;
  target: LibraryItemStatus;
};

const CTA_PRESENTATION: Record<
  LibraryItemStatus,
  { icon: LucideIcon; emphasis: CardCtaEmphasis }
> = {
  WANT: { icon: Play, emphasis: "outline" },
  PLAYING: { icon: CheckCircle, emphasis: "primary" },
  DONE: { icon: RotateCcw, emphasis: "ghost" },
};

export function getPrimaryCtaPayload(
  status: LibraryItemStatus
): CardCtaPayload {
  const { label, target } = NEXT_STEP[status];
  return { label, target, ...CTA_PRESENTATION[status] };
}
