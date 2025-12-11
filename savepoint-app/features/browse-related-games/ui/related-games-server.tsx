import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";

import { GameCard } from "@/shared/components/game-card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import type { RelatedGamesServerProps } from "./related-games-server.types";

export async function RelatedGamesServer({
  collections,
}: RelatedGamesServerProps) {
  const igdbService = new IgdbService();

  const collectionsWithGamesPromises = collections.map((collection) =>
    igdbService.getCollectionGamesById({ collectionId: collection.id })
  );
  const collectionsWithGamesResults = await Promise.all(
    collectionsWithGamesPromises
  );
  if (!collectionsWithGamesResults.every((result) => result.success)) {
    return null;
  }

  const collectionsWithGames = collectionsWithGamesResults
    .filter((result) => result.success)
    .map((result) => result.data!);

  if (collectionsWithGames.length === 0) {
    return null;
  }

  const [firstCollection] = collectionsWithGames;

  return (
    <>
      <Tabs defaultValue={firstCollection.name}>
        <TabsList>
          {collectionsWithGames.map((collection) => (
            <TabsTrigger
              key={`${collection.id}--trigger`}
              value={collection.name}
            >
              {collection.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {collectionsWithGames.map((collection) => {
          return (
            <TabsContent
              key={`${collection.id}--content`}
              value={collection.name}
            >
              <ScrollArea
                className="h-[500px] w-full rounded-md"
                aria-label="Scrollable list of related games"
              >
                <div className="gap-xl pr-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {collection.games.map((game, index) => {
                    if (!game.slug || !game.name || !game.cover?.image_id) {
                      return null;
                    }
                    const staggerIndex = Math.min(index + 1, 12);
                    return (
                      <div
                        className="animate-stagger-in"
                        style={{ animationDelay: `${staggerIndex * 50}ms` }}
                        key={`${game.id}--game`}
                      >
                        <GameCard
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
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </>
  );
}
