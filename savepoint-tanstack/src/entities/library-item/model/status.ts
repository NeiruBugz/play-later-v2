/**
 * Status metadata for the library shelf taxonomy. The entity layer is the
 * rightful owner of the LibraryItemStatus shape, its display labels, and the
 * badge-variant tokens. Features (e.g. `filter-library`) compose on top.
 *
 * FSD: entities cannot import from features. Anything keyed by status value
 * lives here; feature-specific decoration (e.g. filter-button active/inactive
 * styles) lives in the feature.
 */

import {
  Archive,
  Bookmark,
  CheckCircle,
  Gamepad2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export type StatusBadgeVariant =
  | "wishlist"
  | "shelf"
  | "upNext"
  | "playing"
  | "played";

export type StatusEntry = {
  value: LibraryItemStatus;
  label: string;
  badgeVariant: StatusBadgeVariant;
  icon: LucideIcon;
};

export const STATUS_ENTRIES: ReadonlyArray<StatusEntry> = [
  { value: "UP_NEXT", label: "Up Next", badgeVariant: "upNext", icon: Star },
  {
    value: "PLAYING",
    label: "Playing",
    badgeVariant: "playing",
    icon: Gamepad2,
  },
  { value: "SHELF", label: "Shelf", badgeVariant: "shelf", icon: Archive },
  {
    value: "PLAYED",
    label: "Played",
    badgeVariant: "played",
    icon: CheckCircle,
  },
  {
    value: "WISHLIST",
    label: "Wishlist",
    badgeVariant: "wishlist",
    icon: Bookmark,
  },
];

/**
 * Canonical, ordered value list for the library status taxonomy — the single
 * source the `z.enum` schema and every UI option array derive from. The order
 * is the user-facing select order; it deliberately differs from
 * `STATUS_ENTRIES` (badge order). The `satisfies` clause keys it to
 * `LibraryItemStatus`, and `assertCoversStatusEntries` below guarantees it can
 * never drift from the set of values declared in `STATUS_ENTRIES`.
 */
export const LIBRARY_STATUS_VALUES = [
  "WISHLIST",
  "SHELF",
  "UP_NEXT",
  "PLAYING",
  "PLAYED",
] as const satisfies ReadonlyArray<LibraryItemStatus>;

export const libraryItemStatusSchema = z.enum(LIBRARY_STATUS_VALUES);

type StatusEntryValue = (typeof STATUS_ENTRIES)[number]["value"];
type LibraryStatusValue = (typeof LIBRARY_STATUS_VALUES)[number];

// Compile-time guard: the canonical value list and STATUS_ENTRIES must cover
// exactly the same set of statuses. If either side gains/loses a value without
// the other matching, one of these assignments stops type-checking.
const _entriesCoverValues: StatusEntryValue = "" as LibraryStatusValue;
const _valuesCoverEntries: LibraryStatusValue = "" as StatusEntryValue;
void _entriesCoverValues;
void _valuesCoverEntries;

const STATUS_ENTRY_MAP = new Map<LibraryItemStatus, StatusEntry>(
  STATUS_ENTRIES.map((e) => [e.value, e])
);

export const LIBRARY_STATUS_LABELS: Record<LibraryItemStatus, string> = {
  WISHLIST: "Wishlist",
  SHELF: "Shelf",
  UP_NEXT: "Up Next",
  PLAYING: "Playing",
  PLAYED: "Played",
};

export function getStatusLabel(status: LibraryItemStatus): string {
  return LIBRARY_STATUS_LABELS[status];
}

export function getStatusEntry(status: LibraryItemStatus): StatusEntry {
  const entry = STATUS_ENTRY_MAP.get(status);
  if (!entry) throw new Error(`Unknown library status: ${status}`);
  return entry;
}

/**
 * `UP_NEXT` doubles as both "queued for the first time" and "queued for a
 * replay" — the Boolean drives the user-facing copy. Other statuses ignore
 * the flag.
 */
export function getUpNextLabel(hasBeenPlayed: boolean): string {
  return hasBeenPlayed ? "Replay" : "Up Next";
}
