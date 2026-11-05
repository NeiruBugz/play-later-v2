import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

export function LandingHero() {
  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-primary/5 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
          FOR PATIENT GAMERS
        </span>

        <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          A library, <span className="text-primary">not a backlog.</span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Curate your library across every platform. Journal what made each game
          matter. SavePoint is for patient gamers who treat games as worlds, not
          chores.
        </p>

        <div>
          <Link
            to="/login"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}
          >
            <span>Start your library</span>
            <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
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
