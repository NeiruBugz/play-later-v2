import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { AddGameAction } from "@/features/add-game";
import { buttonVariants } from "@/shared/ui/button";
import { SectionLabel } from "@/shared/ui/section-label";

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
      className="flex flex-col items-start gap-2 p-4"
    >
      <span
        className="flex size-10 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <BookOpen className="h-5 w-5 text-muted-foreground" />
      </span>
      <div className="flex flex-col">
        <SectionLabel id="track-invite-heading">Add {gameTitle}</SectionLabel>
        <p className="text-sm text-muted-foreground">
          {isSignedIn
            ? "Add this to your library to log time, rate it, and keep notes."
            : "Sign in and add this to your library to log time, rate it, and keep notes."}
        </p>
      </div>
      {isSignedIn ? (
        <AddGameAction
          game={{ igdbId, name: gameTitle, library: null }}
          variant="labelled"
        />
      ) : (
        <Link to="/login" className={buttonVariants()}>
          Sign in
        </Link>
      )}
    </section>
  );
}
