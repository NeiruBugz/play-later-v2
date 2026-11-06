import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { PRODUCT_NAME_PLAIN } from "@/shared/config/site";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";

export function LandingHero() {
  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <Badge
          variant="subtle"
          className="h-auto gap-2 px-3 py-1 tracking-[0.14em] uppercase"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-foreground"
          />
          FOR PATIENT GAMERS
        </Badge>

        <h1 className="font-display text-5xl leading-[1.05] font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          A library,{" "}
          <span className="text-muted-foreground">not a backlog.</span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Curate your library across every platform. Journal what made each game
          matter. {PRODUCT_NAME_PLAIN} is for patient gamers who treat games as
          worlds, not chores.
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

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-muted-foreground md:text-sm">
          <li className="inline-flex items-center gap-1.5">
            <Check
              aria-hidden="true"
              className="h-4 w-4 text-foreground"
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
