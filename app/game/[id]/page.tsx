import { GameStats, getGame, Reviews } from "@/src/page-slices/game";
import { Artwork } from "@/src/page-slices/game/ui/artwork";
import { SimilarGames } from "@/src/page-slices/game/ui/similar-games";
import igdbApi from "@/src/shared/api/igdb";
import { BacklogStatusMapper, cn, getUniquePlatforms } from "@/src/shared/lib";
import { platformToColorBadge } from "@/src/shared/lib/platform-to-color";
import { GenericPageProps } from "@/src/shared/types";
import { Badge } from "@/src/shared/ui/badge";
import { Button } from "@/src/shared/ui/button";
import { IgdbImage } from "@/src/shared/ui/igdb-image";
import { Skeleton } from "@/src/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { Header } from "@/src/widgets/header";
import { BookmarkIcon, Heart, ListPlus, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GamePage(props: GenericPageProps) {
  const gameResponse = await getGame((await props.params).id);

  if (!gameResponse?.game) {
    return notFound();
  }

  const [igdbData, screenshots] = await Promise.all([
    igdbApi.getGameById(gameResponse.game.igdbId),
    igdbApi.getGameScreenshots(gameResponse.game.igdbId),
  ]);

  const { game } = gameResponse;

  const uniquePlatforms = getUniquePlatforms(igdbData?.release_dates);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={"Loading..."}>
        <div className="relative flex min-h-[60vh] w-full justify-center overflow-hidden">
          <Artwork igdbId={game.igdbId} gameTitle={game.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container flex flex-col items-end gap-6 md:flex-row">
              <IgdbImage
                gameTitle={game.title}
                coverImageId={game.coverImage}
                igdbSrcSize={"hd"}
                igdbImageSize={"c-big"}
              />
              <div className="mb-4 flex-1">
                <h1 className="mb-4 text-3xl font-bold text-white drop-shadow-md md:text-4xl lg:text-5xl">
                  {game.title}
                </h1>
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
            </div>
          </div>
        </div>
        <main className="container py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1 space-y-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Released</div>
                  <Suspense fallback={<Skeleton className="h-8 w-full" />}>
                    <div className="font-medium">
                      {igdbData?.release_dates[0].human}
                    </div>
                  </Suspense>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>
                    {BacklogStatusMapper[game.backlogItems[0].status]}
                  </Badge>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>Add to Wishlist</span>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ListPlus className="h-4 w-4" />
                    <span>Add to Collection</span>
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Bookmark</span>
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>Write a Review</span>
                  </Button>
                </div>
              </div>

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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {screenshots && screenshots.screenshots
                      ? screenshots.screenshots?.map((i) => (
                          <IgdbImage
                            key={i.id}
                            className="w-full rounded-lg"
                            gameTitle={game.title}
                            coverImageId={i.image_id}
                            igdbSrcSize={"hd"}
                            igdbImageSize={"c-big"}
                          />
                        ))
                      : null}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column */}
            <div className="w-full space-y-8 lg:w-80">
              <Suspense fallback={"Loading..."}>
                <GameStats igdbId={game.igdbId} gameId={game.id} />
              </Suspense>
              <Suspense fallback={"Loading..."}>
                <SimilarGames igdbId={game.igdbId} />
              </Suspense>
            </div>
          </div>
        </main>
      </Suspense>
    </div>
  );
}
