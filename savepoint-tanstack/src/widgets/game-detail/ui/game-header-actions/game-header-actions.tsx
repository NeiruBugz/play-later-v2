import { Link, useNavigate } from "@tanstack/react-router";

import { StatusControl } from "@/entities/library-item";
import { AddGameAction } from "@/features/add-game";
import { openGlobalAction } from "@/shared/lib/global-action";
import { Button, buttonVariants } from "@/shared/ui/button";

import { DoneOutcomeLabel } from "../done-outcome-label";
import { DoneWithIt } from "../done-with-it";
import type { GameHeaderActionsProps } from "./game-header-actions.type";

export function GameHeaderActions({
  igdbId,
  gameTitle,
  gameSlug,
  entry,
  libraryStatus,
  doneOutcome,
  viewerUserId,
}: GameHeaderActionsProps) {
  const navigate = useNavigate();

  if (viewerUserId === null) {
    return (
      <Link to="/login" className={buttonVariants({ className: "h-11" })}>
        Sign in to add this game
      </Link>
    );
  }

  if (entry === null || libraryStatus === null) {
    return (
      <AddGameAction
        game={{ igdbId, name: gameTitle, library: null }}
        variant="labelled"
      />
    );
  }

  const { status, setStatus, isPending } = libraryStatus;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusControl
        status={status}
        outcome={doneOutcome}
        showDoneOutcome
        onChange={(to) => void setStatus(to)}
        disabled={isPending}
      />
      {status === "WANT" ? (
        <Button
          type="button"
          className="h-11"
          disabled={isPending}
          onClick={() => void setStatus("PLAYING")}
        >
          Start playing
        </Button>
      ) : null}
      {status === "PLAYING" ? (
        <>
          <Button
            type="button"
            className="h-11"
            onClick={() => openGlobalAction(navigate, "log-session", gameSlug)}
          >
            Log time
          </Button>
          <DoneWithIt libraryStatus={libraryStatus} />
        </>
      ) : null}
      {status === "DONE" ? (
        <>
          <DoneOutcomeLabel
            libraryItemId={entry.id}
            doneOutcome={doneOutcome}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={isPending}
            onClick={() => void setStatus("PLAYING")}
          >
            Play again
          </Button>
        </>
      ) : null}
    </div>
  );
}
