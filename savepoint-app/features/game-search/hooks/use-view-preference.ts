"use client";

import { useEffect, useState } from "react";

type ViewMode = "list" | "grid";

const STORAGE_KEY = "game-search-view-preference";

export const useViewPreference = (): [ViewMode, (view: ViewMode) => void] => {
  const [view, setViewState] = useState<ViewMode>("list");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "list" || stored === "grid") {
      setViewState(stored);
    }
    setIsHydrated(true);
  }, []);

  const setView = (newView: ViewMode) => {
    setViewState(newView);
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, newView);
    }
  };

  return [view, setView];
};
