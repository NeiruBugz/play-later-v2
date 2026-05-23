import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusSwitcherProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
};

export type StatusPill = {
  value: LibraryItemStatus;
  label: string;
};
