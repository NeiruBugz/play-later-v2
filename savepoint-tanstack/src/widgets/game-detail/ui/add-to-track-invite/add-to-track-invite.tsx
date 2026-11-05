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
        className="bg-primary/10 flex size-10 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <BookOpen className="text-primary h-5 w-5" />
      </span>
      <div className="flex flex-col">
        <SectionLabel id="track-invite-heading">Add {gameTitle}</SectionLabel>
        <p className="text-muted-foreground text-sm">
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
