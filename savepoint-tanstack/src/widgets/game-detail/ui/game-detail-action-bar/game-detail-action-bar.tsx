import { useNavigate } from "@tanstack/react-router";

import { getStatusEntry, getStatusLabel } from "@/entities/library-item";
import { Button } from "@/shared/ui/button";

import type { GameDetailActionBarProps } from "./game-detail-action-bar.type";

export function GameDetailActionBar({
  gameSlug,
  gameStatus,
  viewerUserId,
}: GameDetailActionBarProps) {
  const navigate = useNavigate({ from: "/" });

  if (!viewerUserId) return null;

  function openLogSession() {
    void navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        action: "log-session" as const,
        game: gameSlug,
      }),
    });
  }

  const statusEntry = gameStatus ? getStatusEntry(gameStatus) : null;
  const StatusIcon = statusEntry?.icon ?? null;
  const statusLabel = gameStatus ? getStatusLabel(gameStatus) : null;

  return (
    <div
      data-testid="game-detail-action-bar"
      className="pb-safe-nav bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t px-4 pt-3 backdrop-blur-sm md:hidden"
    >
      {gameStatus && statusEntry ? (
        <button
          type="button"
          aria-label={`Change library status: ${statusLabel}`}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
          style={{
            borderColor: `color-mix(in oklch, var(--status-${statusEntry.badgeVariant}) 40%, var(--border))`,
            backgroundColor: `color-mix(in oklch, var(--status-${statusEntry.badgeVariant}) 15%, transparent)`,
          }}
        >
          {StatusIcon ? (
            <StatusIcon
              className="h-4 w-4"
              style={{ color: `var(--status-${statusEntry.badgeVariant})` }}
              aria-hidden="true"
            />
          ) : null}
          <span>{statusLabel}</span>
        </button>
      ) : (
        <span />
      )}

      <Button size="sm" onClick={openLogSession}>
        Log session
      </Button>
    </div>
  );
}
