import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";

export type GamePromptsProps = {
  libraryItemId: number;
  gameTitle: string;
  prompts: { why: boolean; stayed: boolean };
  status: LibraryItemStatus;
};
