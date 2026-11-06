import { useNavigate } from "@tanstack/react-router";

import { StatusControl } from "@/entities/library-item";
import { Button } from "@/shared/ui/button";

import type { GameDetailActionBarProps } from "./game-detail-action-bar.type";

export function GameDetailActionBar({
  gameSlug,
  libraryStatus,
  viewerUserId,
}: GameDetailActionBarProps) {
  const navigate = useNavigate();

  if (!viewerUserId || !libraryStatus) return null;

  function openLogSession() {
    void navigate({
      to: ".",
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        action: "log-session" as const,
        game: gameSlug,
      }),
    });
  }

  return (
    <div
      data-testid="game-detail-action-bar"
      className="fixed inset-x-0 bottom-(--bottom-nav-height) z-40 flex items-center justify-between gap-3 border-t bg-background/95 py-3 pr-safe pl-safe backdrop-blur-sm [--safe-floor:1rem] supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <StatusControl
        status={libraryStatus.status}
        onChange={(to) => void libraryStatus.setStatus(to)}
        disabled={libraryStatus.isPending}
        className="py-2"
      />

      <Button className="h-11 flex-1" onClick={openLogSession}>
        Log time
      </Button>
    </div>
  );
}
