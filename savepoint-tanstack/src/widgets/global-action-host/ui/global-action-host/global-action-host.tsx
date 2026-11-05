import { useNavigate, useSearch } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { closeGlobalAction } from "@/shared/lib/global-action";
import { ResponsiveModal } from "@/shared/ui";

const AddGameContent = lazy(() =>
  import("@/features/add-game/ui/add-game-content").then((module) => ({
    default: module.AddGameContent,
  }))
);

const LogFormHost = lazy(() =>
  import("../log-form-host").then((module) => ({
    default: module.LogFormHost,
  }))
);

export function GlobalActionHost() {
  const { action, game } = useSearch({ from: "__root__" });
  const navigate = useNavigate();

  function handleClose() {
    closeGlobalAction(navigate);
  }

  if (!action) return null;

  function renderContent() {
    if (action === "add-game") {
      return <AddGameContent />;
    }

    if (action === "log-session") {
      return (
        <LogFormHost
          key={game ?? "none"}
          gameSlug={game}
          onClose={handleClose}
        />
      );
    }

    return null;
  }

  const content = renderContent();
  if (!content) return null;

  const title = action === "log-session" ? "Log time" : "Add a game";
  const description =
    action === "log-session"
      ? "Log time played or a note for a game in your library."
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
      <Suspense fallback={null}>{content}</Suspense>
    </ResponsiveModal>
  );
}
