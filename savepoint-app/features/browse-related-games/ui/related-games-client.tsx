"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { useInfiniteScroll } from "@/features/browse-related-games/hooks/use-infinite-scroll";
import { loadMoreFranchiseGames } from "@/features/browse-related-games/server-actions";
import { GameCard as UnifiedGameCard } from "@/shared/components/game-card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import type {
  GameCardProps,
  GameGridProps,
  RelatedGamesClientProps,
} from "./related-games-client.types";

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
      <section className="space-y-xl" aria-labelledby="related-games-heading">
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
    <section className="space-y-xl" aria-labelledby="related-games-heading">
      <h2 id="related-games-heading" className="text-2xl font-bold">
        Related Games
      </h2>
      <Tabs
        defaultValue={franchises[0].franchiseId.toString()}
        className="w-full"
      >
        <TabsList className="mb-xl" aria-label="Game franchises">
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
    <div className="gap-xl pr-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game, index) => (
        <GameCard key={`${franchiseId}-${game.id}`} game={game} index={index} />
      ))}
      {hasMore && (
        <div ref={ref} className="py-xl col-span-full flex justify-center">
          {isPending && (
            <div className="text-muted-foreground gap-md flex items-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading more games...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameCard({ game, index = 0 }: GameCardProps & { index?: number }) {
  const staggerIndex = Math.min(index + 1, 12);

  return (
    <div
      className="animate-stagger-in"
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      <UnifiedGameCard
        game={{
          id: game.id,
          name: game.name,
          slug: game.slug,
          coverImageId: game.cover?.image_id,
        }}
        layout="vertical-compact"
        density="minimal"
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        className="duration-normal ease-out-expo hover:shadow-paper-md transition-all hover:scale-105"
      />
    </div>
  );
}
