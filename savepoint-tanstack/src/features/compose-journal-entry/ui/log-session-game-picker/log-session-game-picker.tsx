import { useEffect, useState } from "react";

import type { GetLibraryResult } from "@/entities/library-item/api/get-library.server";
import { getLoggableGamesFn } from "@/features/compose-journal-entry/api/get-loggable-games";

import type { LogSessionGamePickerProps } from "./log-session-game-picker.type";

type Status = "loading" | "ready" | "error";

/**
 * Renders a selectable list of the user's library games so the user can pick
 * which game they want to log a session for.
 */
export function LogSessionGamePicker({ onSelect }: LogSessionGamePickerProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<GetLibraryResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getLoggableGamesFn();
        if (cancelled) return;
        setResult(data);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || !result) {
    return (
      <div
        data-testid="log-session-game-picker-loading"
        className="text-muted-foreground flex items-center justify-center py-8 text-sm"
      >
        Loading…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-destructive py-4 text-sm">
        Could not load your library. Please try again.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {result.items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
            onClick={() => onSelect(item.game.slug)}
          >
            {item.game.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
