"use client";

import { useCallback, useSyncExternalStore } from "react";

type ViewMode = "list" | "grid";

const STORAGE_KEY = "game-search-view-preference";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "list";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "list" || stored === "grid" ? stored : "list";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storageHandler);
  };
}

const getSnapshot = () => readStoredView();
const getServerSnapshot = (): ViewMode => "list";

export const useViewPreference = (): [ViewMode, (view: ViewMode) => void] => {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setView = useCallback((newView: ViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, newView);
    listeners.forEach((listener) => listener());
  }, []);

  return [view, setView];
};
