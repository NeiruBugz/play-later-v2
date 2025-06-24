import { AddToCollectionModal } from "@/features/add-game";
import { GameScreenshots } from "@/features/view-game-details";
import { Artwork } from "@/features/view-game-details/components/artwork";
import { GameStats } from "@/features/view-game-details/components/game-stats";
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
import { cn, getUniquePlatforms } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";
import { platformToColorBadge } from "@/shared/lib/platform-to-color";
import { GenericPageProps } from "@/shared/types";
import { Heart } from "lucide-react";
import { Suspense } from "react";

export default async function ExternalGamePage(props: GenericPageProps) {
  const id = (await props.params).id;
  const igdbData = await igdbApi.getGameById(Number(id));

  if (!igdbData) {
    return;
  }

  const uniquePlatforms = getUniquePlatforms(igdbData?.release_dates);

  return (
    <div className="min-h-screen">
      <Header />
      <Suspense fallback={"Loading..."}>
        <div className="relative flex min-h-[60vh] w-full justify-center overflow-hidden">
          <Artwork igdbId={igdbData.id} gameTitle={igdbData.name} />
          <div className="absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container flex flex-col items-end gap-6 md:flex-row">
              <IgdbImage
                gameTitle={igdbData.name}
                coverImageId={igdbData.cover.image_id}
                igdbSrcSize={"hd"}
                igdbImageSize={"c-big"}
                className="rounded-md shadow-md"
              />
              <div className="mb-4 flex-1">
                <h1
                  className={cn(
                    "mb-4 text-3xl font-bold text-white drop-shadow-md md:text-4xl lg:text-5xl",
                    {
                      "text-foreground": !igdbData.cover.image_id,
                    }
                  )}
                >
                  {igdbData.name}
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
        <main className="p-8">
          <div className="container flex flex-col gap-8 lg:flex-row">
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
                  <Button
                    variant="outline"
                    className={cn("flex items-center gap-2")}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Add to Wishlist</span>
                  </Button>
                  <AddToCollectionModal gameTitle={igdbData.name} />
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
                    {igdbData.summary}
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
                <TabsContent value="screenshots">
                  <Suspense>
                    <GameScreenshots
                      gameId={igdbData.id}
                      gameName={igdbData.name}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>
            <div className="w-full space-y-8 lg:w-80">
              <Suspense fallback={"Loading..."}>
                <GameStats />
              </Suspense>
            </div>
          </div>
        </main>
      </Suspense>
    </div>
  );
}
