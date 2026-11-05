import { createContext, useContext } from "react";

import type { LogFollowUps } from "./log-follow-ups.type";

const LogFollowUpsContext = createContext<LogFollowUps | null>(null);

export const LogFollowUpsProvider = LogFollowUpsContext.Provider;

export function useLogFollowUps(): LogFollowUps | null {
  return useContext(LogFollowUpsContext);
}
