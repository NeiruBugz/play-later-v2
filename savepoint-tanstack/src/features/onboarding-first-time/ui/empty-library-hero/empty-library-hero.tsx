import { Library, Sparkles } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { OnboardingChecklist } from "../onboarding-checklist";
import type {
  EmptyLibraryHeroActionProps,
  EmptyLibraryHeroProps,
} from "./empty-library-hero.type";

/**
 * First-time-on-`/library` welcome surface, rendering the checklist beneath a
 * branded hero. When the embedded checklist returns null the hero still renders
 * the welcome copy. The "Add a game" CTA is owned by the caller (`onAddGame`).
 */
export function EmptyLibraryHero({
  onAddGame,
  ...checklistProps
}: EmptyLibraryHeroProps & EmptyLibraryHeroActionProps) {
  return (
    <Card
      variant="outlined"
      data-testid="empty-library-hero"
      className={cn("flex w-full flex-col items-center gap-4 p-8 text-center")}
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-2xl",
          "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent",
          "border border-primary/20"
        )}
      >
        <Library className="h-10 w-10 text-primary/80" />
        <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-primary" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">
          Start your library
        </h2>
        <p className="text-base text-muted-foreground">
          Track what you&apos;re playing, what you&apos;ve finished, and
          what&apos;s next.
        </p>
        <Button onClick={onAddGame}>Add a game</Button>
      </div>

      <div className="w-full max-w-md text-left">
        <OnboardingChecklist {...checklistProps} />
      </div>
    </Card>
  );
}
