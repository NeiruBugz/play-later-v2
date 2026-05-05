import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/shared/ui/button";

export function LandingHero() {
  return (
    <div className="space-y-10">
      {/* Top bar */}
      

      {/* Hero block */}
      <div className="space-y-6">
        <span className="border-border/40 bg-primary/5 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.18em] uppercase">
          <span
            aria-hidden="true"
            className="bg-primary h-1.5 w-1.5 rounded-full"
          />
          FOR PATIENT GAMERS
        </span>

        <h1 className="text-foreground text-5xl leading-[1.05] font-semibold tracking-tight md:text-6xl lg:text-7xl">
          A library, <span className="text-primary">not a backlog.</span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-base md:text-lg">
          Curate your collection across every platform. Journal what made each
          game matter. SavePoint is for patient gamers who treat games as
          worlds, not chores.
        </p>

        <div>
          <Button asChild size="lg" className="rounded-full px-6">
            <Link to="/login">
              <span>Start your library</span>
              <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ul className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <li className="inline-flex items-center gap-1.5">
            <Check
              aria-hidden="true"
              className="h-4 w-4 text-emerald-400"
              strokeWidth={2.5}
            />
            <span>Free to start</span>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">
            ·
          </li>
          <li>
            <span>Imports from Steam</span>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">
            ·
          </li>
          <li>
            <span>No credit card</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
