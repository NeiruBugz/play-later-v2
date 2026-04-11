"use client";

import { useCallback, useSyncExternalStore } from "react";

type ViewMode = "list" | "grid";

const STORAGE_KEY = "game-search-view-preference";

let inMemoryView: ViewMode | null = null;

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return inMemoryView ?? "list";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "list" || stored === "grid") return stored;
  } catch {
    // localStorage blocked; fall through to in-memory
  }
  return inMemoryView ?? "list";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const storageHandler = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
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
    inMemoryView = newView;
    try {
      window.localStorage.setItem(STORAGE_KEY, newView);
    } catch {
      // localStorage unavailable; in-memory fallback persists for the session
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [view, setView];
};
