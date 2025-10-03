import { LibraryItemStatus } from "@prisma/client";
import { Heart, Star } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AddToCollectionModal, createGameAction } from "@/features/add-game";
import {
  About,
  Achievements,
  Franchises,
  GameScreenshots,
  GameStats,
  getLibraryItemsByIgdbId,
  Metadata,
  SimilarGames,
  TimesToBeat,
} from "@/features/view-game-details";
import { findSteamAppId } from "@/features/view-game-details/lib/find-steam-app-id";
import {
  AdaptiveTabs,
  AdaptiveTabsContent,
  AdaptiveTabsList,
  AdaptiveTabsTrigger,
} from "@/shared/components/adaptive-tabs";
import { Header } from "@/shared/components/header";
import { IgdbImage } from "@/shared/components/igdb-image";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";

const RATING_DIVISOR = 10;

export default async function ExternalGamePage(
  props: PageProps<"/game/external/[id]">
) {
  const id = Number((await props.params).id);
  const [igdbData, { data: libraryItems }] = await Promise.all([
    igdbApi.getGameById(id),
    getLibraryItemsByIgdbId({ igdbId: id }),
  ]);

  const isWishlistDisabled = libraryItems
    ? libraryItems.some((item) => item.status === LibraryItemStatus.WISHLIST)
    : false;

  if (!igdbData) {
    return notFound();
  }

  const steamAppId = findSteamAppId(igdbData.external_games);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <Header authorized={true} />
        <div className="container relative z-10 px-4 pt-[80px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr_250px]">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-lg border shadow-lg">
                <IgdbImage
                  gameTitle={igdbData.name}
                  coverImageId={igdbData.cover.image_id}
                  igdbSrcSize={"hd"}
                  igdbImageSize={"c-big"}
                  className="h-auto w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";
                    const result = await createGameAction({
                      igdbId: igdbData.id,
                      libraryItemStatus: LibraryItemStatus.WISHLIST,
                    });

                    if (result.data) {
                      redirect(`/game/${result.data.gameId}`);
                    }
                  }}
                >
                  <Button
                    variant="outline"
                    className="flex w-full items-center gap-2"
                    disabled={isWishlistDisabled}
                  >
                    <Heart
                      className={cn("h-4 w-4", {
                        "fill-foreground": isWishlistDisabled,
                      })}
                    />
                    <span>Add to Wishlist</span>
                  </Button>
                </form>
                <AddToCollectionModal
                  gameTitle={igdbData.name}
                  igdbId={igdbData.id}
                />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-4xl font-bold">{igdbData.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-5 fill-primary text-primary" />
                    <span className="font-medium">
                      {igdbData.aggregated_rating
                        ? `${(igdbData.aggregated_rating / RATING_DIVISOR).toFixed(1)}/10`
                        : "No rating"}
                    </span>
                  </div>
                  <Suspense>
                    <TimesToBeat igdbId={igdbData.id} />
                  </Suspense>
                </div>
              </div>

              <AdaptiveTabs defaultValue="about" className="w-full">
                <AdaptiveTabsList className="w-fit">
                  <AdaptiveTabsTrigger value="about" icon="📖">
                    About
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="reviews" icon="⭐">
                    Reviews
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="screenshots" icon="🖼️">
                    Screenshots
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="achievements" icon="🏆">
                    Achievements
                  </AdaptiveTabsTrigger>
                </AdaptiveTabsList>
                <AdaptiveTabsContent value="about" className="space-y-4">
                  <About
                    description={
                      igdbData.summary || "No description available."
                    }
                    releaseDates={igdbData.release_dates}
                    genres={igdbData.genres}
                    igdbId={igdbData.id}
                  />
                </AdaptiveTabsContent>
                <AdaptiveTabsContent value="reviews">
                  <div className="py-8 text-center text-muted-foreground">
                    <p>Reviews are not available for external games yet.</p>
                    <p className="mt-2 text-sm">
                      Add this game to your collection to leave a review!
                    </p>
                  </div>
                </AdaptiveTabsContent>
                <AdaptiveTabsContent value="screenshots">
                  <Suspense fallback={"loading..."}>
                    <GameScreenshots
                      gameId={igdbData.id}
                      gameName={igdbData.name}
                    />
                  </Suspense>
                </AdaptiveTabsContent>
                {steamAppId !== null && (
                  <AdaptiveTabsContent value="achievements">
                    <Achievements steamAppId={steamAppId} />
                  </AdaptiveTabsContent>
                )}
              </AdaptiveTabs>
            </div>
            <div className="flex flex-col gap-6">
              <Metadata
                firstReleaseDate={null}
                releaseDates={igdbData.release_dates}
                involvedCompanies={igdbData.involved_companies}
                aggregatedRating={igdbData.aggregated_rating}
                themes={igdbData.themes}
              />

              <div>
                <h3 className="mb-3 font-medium">Similar Games</h3>
                <SimilarGames similarGames={igdbData.similar_games} />
              </div>

              <Suspense fallback={"Loading..."}>
                <GameStats
                  rating={
                    igdbData.aggregated_rating
                      ? `${(igdbData.aggregated_rating / RATING_DIVISOR).toFixed(1)}/10`
                      : undefined
                  }
                />
              </Suspense>
            </div>
          </div>
          <Suspense fallback={"Loading franchises list..."}>
            <Franchises
              igdbId={igdbData.id}
              franchisesIdList={igdbData.franchises}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
