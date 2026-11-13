import { useSyncExternalStore } from "react";

import { toLocalCalendarDay, toUtcCalendarDay } from "@/shared/lib/date";

function subscribeToReturningToTheTab(onReturn: () => void): () => void {
  document.addEventListener("visibilitychange", onReturn);
  return () => document.removeEventListener("visibilitychange", onReturn);
}

const readDeviceDay = () => toLocalCalendarDay(new Date());
const readUtcDay = () => toUtcCalendarDay(new Date());

export function useDeviceToday(): string {
  return useSyncExternalStore(
    subscribeToReturningToTheTab,
    readDeviceDay,
    readUtcDay
  );
}
