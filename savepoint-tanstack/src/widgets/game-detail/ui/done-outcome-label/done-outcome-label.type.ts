import type { DoneOutcome } from "../../../../../shared/lib/prisma/client.ts";

export type DoneOutcomeLabelProps = {
  libraryItemId: number;
  doneOutcome: DoneOutcome | null;
};
