import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Play } from "lucide-react";

import { LibraryStatusBadge } from "@/entities/library-item";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";

import type { DashboardJumpBackInHeroProps } from "./dashboard-jump-back-in-hero.type";

export function DashboardJumpBackInHero({
  mostInProgressGame,
}: DashboardJumpBackInHeroProps) {
  const navigate = useNavigate();

  function handleLogSession() {
    if (!mostInProgressGame) return;
    void navigate({
      to: ".",
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

  const game = mostInProgressGame;

  const metaParts = game
    ? [
        game.sessions != null ? `Session ${game.sessions}` : null,
        game.hoursPlayed != null ? `${game.hoursPlayed}h` : null,
        game.platform ?? null,
      ].filter(Boolean)
    : [];
  const hasMetaLine = metaParts.length > 0;
  const hasProgressBar = game?.progress != null;
  const progressPercent =
    game?.progress != null ? Math.round(game.progress * 100) : 0;

  return (
    <section
      aria-label="Jump back in"
      className="bg-card shadow-paper-md mb-5 overflow-hidden rounded-xl border"
    >
      <header className="px-4 pt-4 pb-3">
        <p className="terminal-label">{"// JUMP BACK IN"}</p>
      </header>

      {game ? (
        <div className="flex items-stretch gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover for ${game.title}`}
              width={84}
              height={112}
              className="shadow-paper-md aspect-[3/4] w-21 shrink-0 self-start rounded-[var(--radius-cover)] object-cover md:w-33"
            />
          ) : (
            <div
              aria-hidden="true"
              className="bg-muted aspect-[3/4] w-21 shrink-0 self-start rounded-[var(--radius-cover)] md:w-33"
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <LibraryStatusBadge
              status="PLAYING"
              hasBeenPlayed
              className="mb-1.5 self-start uppercase"
            />
            <Link
              to="/games/$slug"
              params={{ slug: game.slug }}
              className="heading-xs md:heading-md line-clamp-2 hover:underline"
            >
              {game.title}
            </Link>

            {hasMetaLine ? (
              <p
                data-testid="hero-meta-line"
                className="text-muted-foreground mt-1 text-xs"
              >
                {metaParts.join(" · ")}
              </p>
            ) : null}

            {hasProgressBar ? (
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${game.title} progress`}
                className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Button type="button" size="sm" onClick={handleLogSession}>
                <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Log session
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/games/$slug" params={{ slug: game.slug }}>
                  Open
                  <ArrowRight
                    className="ml-1.5 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>
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
