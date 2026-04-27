"use client";

import { BookOpen, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { JournalQuickEntrySheet } from "@/features/journal";
import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Button } from "@/shared/components/ui/button";

interface PlayingGame {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

interface QuickLogHeroClientProps {
  username: string;
  playingGames: PlayingGame[];
}

export function QuickLogHeroClient({
  username,
  playingGames,
}: QuickLogHeroClientProps) {
  const [preselectedGame, setPreselectedGame] = useState<PlayingGame | null>(
    null
  );
  const isOpen = preselectedGame !== null;

  const handleLogClick = (game: PlayingGame) => {
    setPreselectedGame(game);
  };

  const handleClose = () => {
    setPreselectedGame(null);
  };

  return (
    <>
      <section
        aria-label="Quick log session"
        className="border-border/40 bg-card/40 mb-2xl rounded-lg border p-6"
      >
        <header className="mb-lg gap-md flex flex-wrap items-baseline justify-between">
          <div>
            <h1 className="heading-lg tracking-tight">
              What did you play, {username}?
            </h1>
            <p className="text-muted-foreground body-sm mt-1">
              Log tonight&apos;s session — playtime is enough, thoughts are
              optional.
            </p>
          </div>
          {playingGames.length === 0 && (
            <Button asChild variant="secondary" size="sm">
              <Link href="/library?status=SHELF">Find a game to start</Link>
            </Button>
          )}
        </header>

        {playingGames.length > 0 && (
          <ul
            className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {playingGames.map((game) => (
              <li
                key={game.id}
                className="border-border/40 bg-background/40 gap-md flex items-center rounded-md border p-3"
              >
                <GameCoverImage
                  imageId={game.coverImage}
                  gameTitle={game.title}
                  size="cover_small"
                  className="aspect-[3/4] h-16 w-12 shrink-0 overflow-hidden rounded-sm"
                  sizes="48px"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/games/${game.slug}`}
                    className="body-sm line-clamp-2 font-medium hover:underline"
                  >
                    {game.title}
                  </Link>
                  <div className="gap-xs mt-1 flex">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleLogClick(game)}
                    >
                      <Plus className="mr-1 h-3 w-3" aria-hidden />
                      Log
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                    >
                      <Link href={`/journal/new?gameId=${game.id}`}>
                        <Pencil className="mr-1 h-3 w-3" aria-hidden />
                        Reflect
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {playingGames.length === 0 && (
          <div className="text-muted-foreground gap-md flex items-center text-sm">
            <BookOpen className="h-4 w-4" aria-hidden />
            <p>
              Nothing in progress. Start something from the shelf and it&apos;ll
              show up here.
            </p>
          </div>
        )}
      </section>

      <JournalQuickEntrySheet
        key={preselectedGame?.id ?? "none"}
        isOpen={isOpen}
        onClose={handleClose}
        preselectedGame={preselectedGame ?? undefined}
      />
    </>
  );
}
