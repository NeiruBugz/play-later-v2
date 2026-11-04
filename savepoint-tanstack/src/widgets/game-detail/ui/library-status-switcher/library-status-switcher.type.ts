import type { LibraryItem } from "../../../../../shared/lib/prisma/client.ts";

export type LibraryStatusSwitcherProps = {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItem | null;
};
