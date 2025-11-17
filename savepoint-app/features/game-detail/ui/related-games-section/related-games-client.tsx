"use client";

import { Gamepad2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Card } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import { loadMoreFranchiseGames } from "../../server-actions/load-more-franchise-games";
import type {
  GameCardProps,
  GameGridProps,
  RelatedGamesClientProps,
} from "./related-games-client.types";
import { useInfiniteScroll } from "./use-infinite-scroll";

export function RelatedGamesClient({
  igdbId,
  franchises: initialFranchises,
}: RelatedGamesClientProps) {
  const [franchises, setFranchises] = useState(initialFranchises);
  const [isPending, startTransition] = useTransition();
  const loadMore = async (franchiseId: number) => {
    const franchise = franchises.find((f) => f.franchiseId === franchiseId);
    if (!franchise || !franchise.hasMore) return;
    startTransition(async () => {
      const result = await loadMoreFranchiseGames({
        franchiseId,
        currentGameId: igdbId,
        offset: franchise.games.length,
        limit: 20,
      });
      if (result.success) {
        setFranchises((prev) =>
          prev.map((f) =>
            f.franchiseId === franchiseId
              ? {
                  ...f,
                  games: [
                    ...f.games,

                    ...result.data.games.filter(
                      (newGame) =>
                        !f.games.some(
                          (existingGame) => existingGame.id === newGame.id
                        )
                    ),
                  ],
                  hasMore: result.data.hasMore,
                }
              : f
          )
        );
      }
    });
  };

  if (franchises.length === 1) {
    return (
      <section className="space-y-4" aria-labelledby="related-games-heading">
        <h2 id="related-games-heading" className="text-2xl font-bold">
          Related Games
        </h2>
        <p className="text-muted-foreground text-sm">
          {franchises[0].franchiseName}
        </p>
        <ScrollArea
          className="h-[500px] w-full rounded-md"
          aria-label="Scrollable list of related games"
        >
          <GameGrid
            franchiseId={franchises[0].franchiseId}
            games={franchises[0].games}
            hasMore={franchises[0].hasMore}
            onLoadMore={() => loadMore(franchises[0].franchiseId)}
            isPending={isPending}
          />
        </ScrollArea>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="related-games-heading">
      <h2 id="related-games-heading" className="text-2xl font-bold">
        Related Games
      </h2>
      <Tabs
        defaultValue={franchises[0].franchiseId.toString()}
        className="w-full"
      >
        <TabsList className="mb-4" aria-label="Game franchises">
          {franchises.map((franchise) => (
            <TabsTrigger
              key={franchise.franchiseId}
              value={franchise.franchiseId.toString()}
              aria-label={`${franchise.franchiseName}, ${franchise.totalCount} games`}
            >
              {franchise.franchiseName} ({franchise.totalCount})
            </TabsTrigger>
          ))}
        </TabsList>
        {franchises.map((franchise) => (
          <TabsContent
            key={franchise.franchiseId}
            value={franchise.franchiseId.toString()}
          >
            <ScrollArea
              className="h-[500px] w-full rounded-md"
              aria-label={`Scrollable list of ${franchise.franchiseName} games`}
            >
              <GameGrid
                franchiseId={franchise.franchiseId}
                games={franchise.games}
                hasMore={franchise.hasMore}
                onLoadMore={() => loadMore(franchise.franchiseId)}
                isPending={isPending}
              />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function GameGrid({
  franchiseId,
  games,
  hasMore,
  onLoadMore,
  isPending,
}: GameGridProps) {
  const { ref } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    enabled: !isPending,
  });
  return (
    <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <GameCard key={`${franchiseId}-${game.id}`} game={game} />
      ))}
      {}
      {hasMore && (
        <div ref={ref} className="col-span-full flex justify-center py-4">
          {isPending && (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading more games...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameCard({ game }: GameCardProps) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group focus-visible:ring-primary block rounded-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`View details for ${game.name}`}
    >
      <Card className="overflow-hidden">
        <div className="bg-muted relative aspect-[3/4] w-full">
          {game.cover?.image_id ? (
            <Image
              src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
              alt={`${game.name} cover`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              aria-label="No cover image available"
            >
              <Gamepad2
                className="text-muted-foreground h-8 w-8"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="group-hover:text-primary line-clamp-2 text-sm font-medium">
            {game.name}
          </p>
        </div>
      </Card>
    </Link>
  );
}
