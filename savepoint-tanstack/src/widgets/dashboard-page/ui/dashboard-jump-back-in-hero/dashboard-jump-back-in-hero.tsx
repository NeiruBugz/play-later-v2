import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Play } from "lucide-react";

import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";

import type { DashboardJumpBackInHeroProps } from "./dashboard-jump-back-in-hero.type";

export function DashboardJumpBackInHero({
  username,
  mostInProgressGame,
}: DashboardJumpBackInHeroProps) {
  const navigate = useNavigate({ from: "/" });

  function handleLogSession() {
    if (!mostInProgressGame) return;
    void navigate({
      search: (prev) => ({
        ...prev,
        action: "log-session" as const,
        game: mostInProgressGame.slug,
      }),
    });
  }

  const coverUrl = mostInProgressGame
    ? buildCoverImageUrl(mostInProgressGame.coverImage, "t_cover_big")
    : null;

  return (
    <section
      aria-label="Jump back in"
      className="border-border/40 bg-card/60 mb-4 overflow-hidden rounded-xl border"
    >
      <header className="px-4 pt-4 pb-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Welcome back, {username}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
          Jump back in
        </h2>
      </header>

      {mostInProgressGame ? (
        <div className="flex items-center gap-4 px-4 pb-4">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover for ${mostInProgressGame.title}`}
              width={72}
              height={96}
              className="aspect-[3/4] h-24 w-18 shrink-0 overflow-hidden rounded-lg object-cover shadow-md"
            />
          ) : (
            <div
              aria-hidden="true"
              className="bg-muted h-24 w-18 shrink-0 rounded-lg"
            />
          )}

          <div className="min-w-0 flex-1">
            <Link
              to="/games/$slug"
              params={{ slug: mostInProgressGame.slug }}
              className="line-clamp-2 font-semibold hover:underline"
            >
              {mostInProgressGame.title}
            </Link>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Currently playing
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={handleLogSession}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Log session
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-3 px-4 pb-4 text-sm">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Nothing in progress. Pick something from your shelf to start.</p>
        </div>
      )}
    </section>
  );
}
