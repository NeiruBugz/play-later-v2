import { Library, Sparkles } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

import { OnboardingChecklist } from "../onboarding-checklist";
import type { EmptyLibraryHeroProps } from "./empty-library-hero.type";

/**
 * First-time-on-`/library` welcome surface. Renders the checklist
 * underneath a branded hero. The hero is responsible for its own
 * `onboardingComplete` short-circuit via the embedded checklist —
 * if the checklist returns null the hero still renders the welcome
 * copy. Library widget already provides an `AddGameTrigger` FAB for
 * the "add your first game" CTA, so no CTA buttons here.
 */
export function EmptyLibraryHero(props: EmptyLibraryHeroProps) {
  return (
    <Card
      variant="outlined"
      data-testid="empty-library-hero"
      className={cn(
        "p-3xl gap-xl flex w-full flex-col items-center text-center"
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-2xl",
          "from-primary/15 via-primary/5 bg-gradient-to-br to-transparent",
          "border-primary/20 border"
        )}
      >
        <Library className="text-primary/80 h-10 w-10" />
        <Sparkles className="text-primary absolute -top-2 -right-2 h-5 w-5" />
      </div>

      <div className="space-y-sm max-w-md">
        <h2 className="text-h2 font-semibold tracking-tight">
          Start Your Gaming Journey
        </h2>
        <p className="text-muted-foreground text-body">
          Track what you&apos;re playing, what you&apos;ve finished, and
          what&apos;s next. Add your first game with the + button below to get
          started.
        </p>
      </div>

      <div className="w-full max-w-md text-left">
        <OnboardingChecklist {...props} />
      </div>
    </Card>
  );
}
