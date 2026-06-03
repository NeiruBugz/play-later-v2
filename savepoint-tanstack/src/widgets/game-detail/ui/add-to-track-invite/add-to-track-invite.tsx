import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { AddFromGameDetailButton } from "@/features/add-game";
import { Button } from "@/shared/ui/button";

import type { AddToTrackInviteProps } from "./add-to-track-invite.type";

export function AddToTrackInvite({
  igdbId,
  gameTitle,
  isSignedIn,
}: AddToTrackInviteProps) {
  return (
    <section
      data-testid="add-to-track-invite"
      aria-labelledby="track-invite-heading"
      className="gap-md p-xl flex flex-col items-start"
    >
      <span
        className="bg-primary/10 flex size-10 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <BookOpen className="text-primary h-5 w-5" />
      </span>
      <div className="gap-2xs flex flex-col">
        <h2 id="track-invite-heading" className="text-h3">
          Start tracking {gameTitle}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isSignedIn
            ? "Add this to your library to log sessions, rate it, and keep a journal."
            : "Sign in and add this to your library to log sessions, rate it, and keep a journal."}
        </p>
      </div>
      {isSignedIn ? (
        <AddFromGameDetailButton igdbId={igdbId} gameTitle={gameTitle} />
      ) : (
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      )}
    </section>
  );
}
