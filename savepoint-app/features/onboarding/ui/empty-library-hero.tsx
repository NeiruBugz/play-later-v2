"use client";

import { Gamepad2, Library, Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { useCommandPaletteContext } from "@/features/command-palette";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/ui/utils";

const STEAM_IMPORT_HREF = "/steam/games";
const GAMES_SEARCH_HREF = "/games/search";

interface EmptyLibraryHeroProps {
  variant?: "library" | "dashboard";
}

export function EmptyLibraryHero({
  variant = "library",
}: EmptyLibraryHeroProps) {
  const isLibrary = variant === "library";
  const { open } = useCommandPaletteContext();

  return (
    <Card
      variant={isLibrary ? "outlined" : "flat"}
      data-testid="empty-library-hero"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center text-center",
        isLibrary
          ? "p-3xl gap-xl mx-auto w-full max-w-2xl"
          : "p-xl gap-lg w-full"
      )}
    >
      <IllustrationStack compact={!isLibrary} />

      <div className={cn("space-y-sm", isLibrary ? "max-w-md" : "max-w-sm")}>
        <h2
          className={cn(
            "font-semibold tracking-tight",
            isLibrary ? "text-h2" : "text-h3"
          )}
        >
          Start Your Gaming Journey
        </h2>
        <p
          className={cn(
            "text-muted-foreground",
            isLibrary ? "text-body" : "text-caption"
          )}
        >
          Track what you&apos;re playing, what you&apos;ve finished, and
          what&apos;s next. Import your Steam library or search the IGDB
          catalogue to add your first game.
        </p>
      </div>

      <div
        className={cn(
          "gap-sm flex w-full items-center justify-center",
          isLibrary ? "flex-col sm:flex-row" : "flex-col"
        )}
      >
        <Button
          asChild
          size={isLibrary ? "lg" : "default"}
          className="w-full sm:w-auto"
        >
          <Link href={STEAM_IMPORT_HREF}>
            <Gamepad2 className="mr-xs h-4 w-4" />
            Import from Steam
          </Link>
        </Button>
        {isLibrary ? (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href={GAMES_SEARCH_HREF}>
              <Search className="mr-xs h-4 w-4" />
              Search for Games
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="w-full sm:w-auto"
            onClick={open}
          >
            <Search className="mr-xs h-4 w-4" />
            Search for Games
          </Button>
        )}
      </div>
    </Card>
  );
}

function IllustrationStack({ compact }: { compact: boolean }) {
  const containerSize = compact ? "h-16 w-16" : "h-24 w-24";
  const iconSize = compact ? "h-7 w-7" : "h-10 w-10";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center rounded-2xl",
        "from-primary/15 via-primary/5 bg-gradient-to-br to-transparent",
        "border-primary/20 border",
        containerSize
      )}
    >
      <Library className={cn("text-primary/80", iconSize)} />
      <Sparkles
        className={cn(
          "text-primary absolute",
          compact ? "-top-1 -right-1 h-3.5 w-3.5" : "-top-2 -right-2 h-5 w-5"
        )}
      />
    </div>
  );
}
