/**
 * Single client-safe source of truth for the 3-status library model
 * (Want, Playing, Done). Anything keyed by status value lives here; feature
 * decoration (e.g. filter-button styles) lives in the feature.
 *
 * Client-safe: type-only Prisma imports, no `.server` imports.
 */

import { Bookmark, CheckCircle, Gamepad2, type LucideIcon } from "lucide-react";
import { z } from "zod";

import type {
  DoneOutcome,
  LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type StatusBadgeVariant = "want" | "playing" | "done";

export type StatusEntry = {
  value: LibraryItemStatus;
  label: string;
  badgeVariant: StatusBadgeVariant;
  icon: LucideIcon;
};

export const STATUS_ENTRIES: ReadonlyArray<StatusEntry> = [
  { value: "WANT", label: "Want", badgeVariant: "want", icon: Bookmark },
  {
    value: "PLAYING",
    label: "Playing",
    badgeVariant: "playing",
    icon: Gamepad2,
  },
  { value: "DONE", label: "Done", badgeVariant: "done", icon: CheckCircle },
];

export const LIBRARY_STATUS_VALUES = [
  "WANT",
  "PLAYING",
  "DONE",
] as const satisfies ReadonlyArray<LibraryItemStatus>;

export const libraryItemStatusSchema = z.enum(LIBRARY_STATUS_VALUES);

const STATUS_ENTRY_MAP = new Map<LibraryItemStatus, StatusEntry>(
  STATUS_ENTRIES.map((entry) => [entry.value, entry])
);

export function getStatusEntry(status: LibraryItemStatus): StatusEntry {
  const entry = STATUS_ENTRY_MAP.get(status);
  if (!entry) throw new Error(`Unknown library status: ${status}`);
  return entry;
}

export function getStatusLabel(status: LibraryItemStatus): string {
  return getStatusEntry(status).label;
}

export const NEXT_STEP: Record<
  LibraryItemStatus,
  { label: string; target: LibraryItemStatus }
> = {
  WANT: { label: "Start playing", target: "PLAYING" },
  PLAYING: { label: "Mark done", target: "DONE" },
  DONE: { label: "Play again", target: "PLAYING" },
};

export const UP_NEXT_MAX = 5;

export function getQueueMarker({
  status,
  upNextPosition,
}: {
  status: LibraryItemStatus;
  upNextPosition: number | null;
}): string | null {
  if (upNextPosition === null) return null;
  if (status === "WANT") return `Up Next #${upNextPosition}`;
  if (status === "DONE") return "Replay";
  return null;
}

const DONE_OUTCOME_LABELS: Record<DoneOutcome, string> = {
  FINISHED: "Done · Finished",
  LET_GO: "Done · Let go",
};

export function getDoneLabel(outcome: DoneOutcome | null): string {
  return outcome === null ? "Done" : DONE_OUTCOME_LABELS[outcome];
}
