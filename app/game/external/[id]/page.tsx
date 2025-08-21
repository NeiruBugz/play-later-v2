import { BacklogItemStatus } from "@prisma/client";
import { Book, Heart, Image as ImageIcon, Star, Trophy } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { AddToCollectionModal, createGameAction } from "@/features/add-game";
import {
  About,
  Achievements,
  Franchises,
  GameScreenshots,
  GameStats,
  getBacklogItemsByIgdbId,
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
import { EditorialHeader } from "@/shared/components/header";
import { IgdbImage } from "@/shared/components/igdb-image";
import { Body, Heading } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";

const RATING_DIVISOR = 10;

export default async function ExternalGamePage(
  props: PageProps<"/game/external/[id]">
) {
  const id = Number((await props.params).id);
  const [igdbData, { data: backlogItems }] = await Promise.all([
    igdbApi.getGameById(id),
    getBacklogItemsByIgdbId({ igdbId: id }),
  ]);

  const isWishlistDisabled = backlogItems
    ? backlogItems.some((item) => item.status === BacklogItemStatus.WISHLIST)
    : false;

  if (!igdbData) {
    return notFound();
  }

  let steamAppId: number | null = null;
  try {
    steamAppId = findSteamAppId(igdbData.external_games);
  } catch (error) {
    console.warn("Failed to find Steam app ID:", error);
    steamAppId = null;
  }

  const description = igdbData.summary || "No description available.";

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <EditorialHeader authorized={true} />
        <div className="container relative z-10 py-8 pt-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left Column: Cover and Quick Actions */}
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-lg">
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
                      backlogStatus: BacklogItemStatus.WISHLIST,
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
                        "fill-primary text-primary": isWishlistDisabled,
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

            {/* Main Content Column */}
            <div className="flex flex-col gap-6">
              <div>
                <Heading level={1} size="3xl">
                  {igdbData.name}
                </Heading>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="size-4" />
                    <Body size="sm">
                      {igdbData.aggregated_rating
                        ? `${(igdbData.aggregated_rating / RATING_DIVISOR).toFixed(1)}/10`
                        : "No rating"}
                    </Body>
                  </div>
                  <Suspense>
                    <TimesToBeat igdbId={igdbData.id} />
                  </Suspense>
                </div>
              </div>

              {description && (
                <Body variant="muted" className="leading-relaxed">
                  {description}
                </Body>
              )}

              <AdaptiveTabs defaultValue="about" className="w-full">
                <AdaptiveTabsList className="w-fit">
                  <AdaptiveTabsTrigger value="about" icon={<Book />}>
                    About
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="reviews" icon={<Star />}>
                    Reviews
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="screenshots" icon={<ImageIcon />}>
                    Screenshots
                  </AdaptiveTabsTrigger>
                  <AdaptiveTabsTrigger value="achievements" icon={<Trophy />}>
                    Achievements
                  </AdaptiveTabsTrigger>
                </AdaptiveTabsList>
                <AdaptiveTabsContent value="about" className="space-y-4">
                  <About
                    releaseDates={igdbData.release_dates}
                    genres={igdbData.genres}
                    igdbId={igdbData.id}
                    involvedCompanies={igdbData.involved_companies}
                    aggregatedRating={igdbData.aggregated_rating}
                    themes={igdbData.themes}
                  />
                </AdaptiveTabsContent>
                <AdaptiveTabsContent value="reviews">
                  <div className="py-8 text-center">
                    <Body variant="muted">
                      Reviews are not available for external games yet.
                    </Body>
                    <Body size="sm" variant="muted" className="mt-2">
                      Add this game to your collection to leave a review!
                    </Body>
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
                <AdaptiveTabsContent value="achievements">
                  <Achievements steamAppId={steamAppId} />
                </AdaptiveTabsContent>
              </AdaptiveTabs>
            </div>

            {/* Right Sidebar Column */}
            <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2 lg:w-[250px]">
              <Suspense fallback={"Loading..."}>
                <GameStats
                  rating={
                    igdbData.aggregated_rating
                      ? `${(igdbData.aggregated_rating / RATING_DIVISOR).toFixed(1)}/10`
                      : undefined
                  }
                />
              </Suspense>
              <div>
                <Heading level={3} size="lg" className="mb-3">
                  Similar Games
                </Heading>
                <SimilarGames similarGames={igdbData.similar_games} />
              </div>
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
