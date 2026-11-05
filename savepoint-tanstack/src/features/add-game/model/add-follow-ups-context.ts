import { createContext, useContext } from "react";

import type { AddFollowUps } from "./add-game.type";

const AddFollowUpsContext = createContext<AddFollowUps | null>(null);

export const AddFollowUpsProvider = AddFollowUpsContext.Provider;

export function useAddFollowUps(): AddFollowUps | null {
  return useContext(AddFollowUpsContext);
}
