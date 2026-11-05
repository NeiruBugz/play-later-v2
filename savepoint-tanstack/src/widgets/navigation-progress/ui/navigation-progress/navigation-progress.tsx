import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { NavigationProgressProps } from "./navigation-progress.type";

const DEFAULT_SHOW_AFTER_MS = 150;

export function NavigationProgress({
  showAfterMs = DEFAULT_SHOW_AFTER_MS,
}: NavigationProgressProps) {
  const isPending = useRouterState({
    select: (state) => state.status === "pending",
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setVisible(false);
      return;
    }
    const handle = setTimeout(() => setVisible(true), showAfterMs);
    return () => clearTimeout(handle);
  }, [isPending, showAfterMs]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
    >
      <div className="bg-primary navigation-progress-bar h-full w-1/3" />
    </div>
  );
}
