import { useNavigate, useSearch } from "@tanstack/react-router";

import { AddGameContent } from "@/features/add-game";
import {
  LogSessionForGame,
  LogSessionGamePicker,
} from "@/features/compose-journal-entry";
import {
  closeGlobalAction,
  setGlobalActionGame,
} from "@/shared/lib/global-action";
import { ResponsiveModal } from "@/shared/ui";

export function GlobalActionHost() {
  const { action, game } = useSearch({ from: "__root__" });
  const navigate = useNavigate();

  function handleClose() {
    closeGlobalAction(navigate);
  }

  function handlePickerSelect(slug: string) {
    setGlobalActionGame(navigate, slug);
  }

  if (!action) return null;

  function renderContent() {
    if (action === "add-game") {
      return <AddGameContent onAdded={handleClose} />;
    }

    if (action === "log-session") {
      if (game) {
        return <LogSessionForGame game={game} onClose={handleClose} />;
      }
      return <LogSessionGamePicker onSelect={handlePickerSelect} />;
    }

    return null;
  }

  const content = renderContent();
  if (!content) return null;

  const title = action === "log-session" ? "Log session" : "Add a game";
  const description =
    action === "log-session"
      ? "Record a play session."
      : "Search and add a game to your library.";

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && handleClose()}
      title={title}
      description={description}
      dialogTestId="global-action-dialog"
      sheetTestId="global-action-sheet"
    >
      {content}
    </ResponsiveModal>
  );
}
