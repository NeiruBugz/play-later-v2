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
import { useInfiniteScroll } from "./use-infinite-scroll";

type RelatedGame = {
  id: number;
  name: string;
  slug: string;
  cover?: { image_id: string };
};

type FranchiseWithGames = {
  franchiseId: number;
  franchiseName: string;
  games: RelatedGame[];
  hasMore: boolean;
  totalCount: number;
};

type Props = {
  igdbId: number;
  franchises: FranchiseWithGames[];
};

export function RelatedGamesClient({
  igdbId,
  franchises: initialFranchises,
}: Props) {
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
                    // Filter out any games that already exist to prevent duplicates
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

  // Single franchise (no tabs)
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

  // Multiple franchises (tabs)
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

// Separate component for game grid with infinite scroll
function GameGrid({
  franchiseId,
  games,
  hasMore,
  onLoadMore,
  isPending,
}: {
  franchiseId: number;
  games: RelatedGame[];
  hasMore: boolean;
  onLoadMore: () => void;
  isPending: boolean;
}) {
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

      {/* Intersection Observer trigger element */}
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

// Game card component with accessibility improvements
function GameCard({ game }: { game: RelatedGame }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
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
              <Gamepad2 className="text-muted-foreground h-8 w-8" aria-hidden="true" />
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
