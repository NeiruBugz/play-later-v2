"use client";

import { Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Card } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

type RelatedGame = {
  id: number;
  name: string;
  slug: string;
  cover?: {
    image_id: string;
  };
};

type FranchiseWithGames = {
  franchiseId: number;
  franchiseName: string;
  games: RelatedGame[];
};

type RelatedGamesSectionProps = {
  franchises: FranchiseWithGames[];
};

export const RelatedGamesSection = ({
  franchises,
}: RelatedGamesSectionProps) => {
  // Hide section if no franchises
  if (franchises.length === 0) {
    return null;
  }

  // If only one franchise, no need for tabs
  if (franchises.length === 1) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Related Games</h2>
        <p className="text-muted-foreground text-sm">
          {franchises[0].franchiseName}
        </p>
        <ScrollArea className="h-[500px] w-full rounded-md">
          <GameGrid games={franchises[0].games} />
        </ScrollArea>
      </section>
    );
  }

  // Multiple franchises - use tabs
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Related Games</h2>

      <Tabs
        defaultValue={franchises[0].franchiseId.toString()}
        className="w-full"
      >
        <TabsList className="mb-4">
          {franchises.map((franchise) => (
            <TabsTrigger
              key={franchise.franchiseId}
              value={franchise.franchiseId.toString()}
            >
              {franchise.franchiseName} ({franchise.games.length})
            </TabsTrigger>
          ))}
        </TabsList>

        {franchises.map((franchise) => (
          <TabsContent
            key={franchise.franchiseId}
            value={franchise.franchiseId.toString()}
          >
            <ScrollArea className="h-[500px] w-full rounded-md">
              <GameGrid games={franchise.games} />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

// Separate component for the game grid
function GameGrid({ games }: { games: RelatedGame[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/games/${game.slug}`}
          className="group transition-transform hover:scale-105"
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
                <div className="flex h-full w-full items-center justify-center">
                  <Gamepad2 className="text-muted-foreground h-8 w-8" />
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
      ))}
    </div>
  );
}
