import { EditBacklogItemDialog } from "@/features/manage-backlog-item/edit-backlog-item";
import {
  Artwork,
  GameScreenshots,
  GameStats,
  getGame,
  Reviews,
  SimilarGames,
} from "@/features/view-game-details";
import { Button } from "@/shared/components";
import { Badge } from "@/shared/components/badge";
import { Header } from "@/shared/components/header";
import { IgdbImage } from "@/shared/components/igdb-image";
import { Skeleton } from "@/shared/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import { BacklogStatusMapper, cn, getUniquePlatforms } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";
import { platformToColorBadge } from "@/shared/lib/platform-to-color";
import { GenericPageProps } from "@/shared/types";
import { Heart, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GamePage(props: GenericPageProps) {
  const gameResponse = await getGame((await props.params).id);

  if (!gameResponse?.game) {
    return notFound();
  }

  const igdbData = await igdbApi.getGameById(gameResponse.game.igdbId);

  const { game } = gameResponse;

  const uniquePlatforms = getUniquePlatforms(igdbData?.release_dates);

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <Suspense fallback={"Loading..."}>
        <div className="relative flex min-h-[60vh] w-full justify-center overflow-hidden">
          <Artwork igdbId={game.igdbId} gameTitle={game.title} />
          <div className="via-gray-90/30 absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container relative flex flex-col items-end gap-6 md:flex-row">
              <div className="align-center relative flex flex-col">
                <IgdbImage
                  gameTitle={game.title}
                  coverImageId={game.coverImage}
                  igdbSrcSize={"hd"}
                  igdbImageSize={"c-big"}
                  className=""
                />
                <div className="-bottom-[4px] z-50 flex max-w-[264px] flex-wrap items-center justify-center gap-3 rounded-md border-2 bg-gray-700/70 p-2">
                  <Badge className="size-9 w-fit hover:bg-primary">
                    {BacklogStatusMapper[game.backlogItems[0].status]}
                  </Badge>
                  <Button
                    variant="outline"
                    className={cn("flex items-center gap-2", {
                      hidden: game.backlogItems.length,
                    })}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Add to Wishlist</span>
                  </Button>
                  <EditBacklogItemDialog
                    gameId={game.id}
                    igdbId={game.igdbId}
                    gameTitle={game.title}
                  />
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-amber-700 to-yellow-500 text-white hover:from-yellow-700 hover:to-yellow-700">
                    <Star className="h-4 w-4" />
                    <span>Write a Review</span>
                  </Button>
                </div>
              </div>
              <div className="mb-4 flex-1">
                <h1 className="mb-4 text-3xl font-bold text-white drop-shadow-md md:text-4xl lg:text-5xl">
                  {game.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <main className="p-8">
          <div className="container flex flex-col gap-8 lg:flex-row">
            <div className="flex-1 space-y-8">
              <Tabs defaultValue="about">
                <TabsList className="justify-start">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="space-y-4">
                  <p className="leading-relaxed text-muted-foreground">
                    {game.description}
                  </p>
                  <div className="grid gap-4">
                    <div className="font-medium">Available on</div>
                    <div className="flex flex-wrap gap-2">
                      {uniquePlatforms.map((platform) => (
                        <Badge
                          className={cn(
                            "border border-primary bg-transparent text-sm text-primary shadow-none hover:bg-transparent hover:shadow-none",
                            platformToColorBadge(platform.platform.name)
                          )}
                          key={platform.id}
                        >
                          {platform.platform.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews">
                  <Reviews gameId={game.id} gameTitle={game.title} />
                </TabsContent>
                <TabsContent value="screenshots">
                  <Suspense>
                    <GameScreenshots
                      gameId={game.igdbId}
                      gameName={game.title}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-full space-y-8 lg:w-80">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Genres</div>
                <div className="flex flex-wrap items-center gap-4">
                  {igdbData?.genres.map((genre) => {
                    return (
                      <Badge
                        key={genre.id}
                        variant="secondary"
                        className="text-sm md:text-base"
                      >
                        {genre.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Released</div>
                <Suspense fallback={<Skeleton className="h-8 w-full" />}>
                  <div className="font-medium">
                    {igdbData?.release_dates[0].human}
                  </div>
                </Suspense>
              </div>
              <Suspense fallback={"Loading..."}>
                <GameStats rating={igdbData?.aggregated_rating.toFixed(1)} />
              </Suspense>
              <Suspense fallback={"Loading..."}>
                <SimilarGames similarGames={igdbData?.similar_games} />
              </Suspense>
            </div>
          </div>
        </main>
      </Suspense>
    </div>
  );
}
