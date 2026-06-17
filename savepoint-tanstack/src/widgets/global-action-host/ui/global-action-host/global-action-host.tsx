import { useNavigate, useSearch } from "@tanstack/react-router";

import { AddGameContent } from "@/features/add-game";
import { LogSessionContent } from "@/features/compose-journal-entry";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

export function GlobalActionHost() {
  const { action, game } = useSearch({ from: "__root__" });
  const navigate = useNavigate({ from: "/" });
  const isDesktop = useIsDesktop();

  function handleClose() {
    // Remove action + game from the URL; preserve all other search params
    // child routes may carry. Object.fromEntries omits the keys entirely
    // (rather than setting them to undefined) so router validators don't see
    // stale enum values on the next render.
    void navigate({
      search: (prev) => {
        const entries = Object.entries(prev as Record<string, unknown>).filter(
          ([k]) => k !== "action" && k !== "game"
        );
        return Object.fromEntries(entries) as typeof prev;
      },
    });
  }

  if (!action) return null;

  function renderContent() {
    if (action === "add-game") {
      return <AddGameContent onAdded={handleClose} />;
    }

    if (action === "log-session") {
      // game may be undefined when opened from the bottom-nav Log button.
      // Slice 3: add a game-picker here when game is absent (bottom-nav Log flow).
      return <LogSessionContent game={game} onClose={handleClose} />;
    }

    return null;
  }

  const content = renderContent();
  if (!content) return null;

  if (isDesktop) {
    return (
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent data-testid="global-action-dialog">
          <DialogHeader>
            <DialogTitle>
              {action === "log-session" ? "Log session" : "Add a game"}
            </DialogTitle>
            <DialogDescription>
              {action === "log-session"
                ? "Record a play session."
                : "Search and add a game to your library."}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" data-testid="global-action-sheet">
        <SheetHeader>
          <SheetTitle>
            {action === "log-session" ? "Log session" : "Add a game"}
          </SheetTitle>
          <SheetDescription>
            {action === "log-session"
              ? "Record a play session."
              : "Search and add a game to your library."}
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
