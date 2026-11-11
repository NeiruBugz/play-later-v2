import { createContext, useContext } from "react";

import type { DoneOutcome } from "../../../../shared/lib/prisma/client.ts";

export type DoneRequest = {
  id: number;
  gameTitle: string;
  rating: number | null;
  initialOutcome?: DoneOutcome;
  undo: () => Promise<void>;
};

export type DoneHandler = (request: DoneRequest) => void;

const DoneHandlerContext = createContext<DoneHandler | null>(null);

export const DoneHandlerProvider = DoneHandlerContext.Provider;

export function useDoneHandler(): DoneHandler | null {
  return useContext(DoneHandlerContext);
}
