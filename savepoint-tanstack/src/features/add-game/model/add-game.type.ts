import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";

export type AddedLibraryState = {
  status: LibraryItemStatus;
  upNextPosition: number | null;
};

export type AddedItem = AddedLibraryState & {
  libraryItemId: number;
  gameTitle: string;
};

export type ApplyLibraryChange = (patch: Partial<AddedLibraryState>) => void;

export type AddFollowUps = {
  startPlaying: (
    item: AddedItem,
    applyChange: ApplyLibraryChange
  ) => Promise<boolean>;
  putInUpNext: (
    item: AddedItem,
    applyChange: ApplyLibraryChange
  ) => Promise<boolean>;
};

export type AddableGame = {
  igdbId: number;
  name: string;
  library: AddedLibraryState | null;
};

export type UseAddGameResult = {
  library: AddedLibraryState | null;
  isAdding: boolean;
  add: () => Promise<void>;
};
