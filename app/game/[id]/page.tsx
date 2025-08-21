import { Book, Image as ImageIcon, Star, Trophy } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  About,
  Achievements,
  Franchises,
  GameQuickActions,
  GameScreenshots,
  getGame,
  Reviews,
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
import igdbApi from "@/shared/lib/igdb";

function determineGameType(gameId: string) {
  const isNumeric = !isNaN(Number(gameId)) && Number.isInteger(Number(gameId));
  return isNumeric ? "EXTERNAL" : "INTERNAL";
}

export default async function GamePage(props: PageProps<"/game/[id]">) {
  const awaitedParams = await props.params;
  const gameType = determineGameType(awaitedParams.id);

  if (gameType === "EXTERNAL") {
    redirect(`/game/external/${awaitedParams.id}`);
  }

  const { data: game } = await getGame({ id: awaitedParams.id });

  if (!game) {
    return notFound();
  }
  const igdbData = await igdbApi.getGameById(game.igdbId);

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

  const description = game.description ?? igdbData.summary;

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
                  gameTitle={game.title}
                  coverImageId={game.coverImage}
                  igdbSrcSize={"hd"}
                  igdbImageSize={"c-big"}
                  className="h-auto w-full"
                />
              </div>

              <GameQuickActions
                gameId={game.id}
                gameTitle={game.title}
                backlogItems={game.backlogItems}
                gameType={gameType}
              />
            </div>

            {/* Main Content Column */}
            <div className="flex flex-col gap-6">
              <div>
                <Heading level={1} size="3xl">
                  {game.title}
                </Heading>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="size-4" />
                    <Body size="sm">4/5</Body>
                  </div>
                  <Suspense>
                    <TimesToBeat igdbId={game.igdbId} />
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
                    firstReleaseDate={game.releaseDate}
                  />
                </AdaptiveTabsContent>
                <AdaptiveTabsContent value="reviews">
                  <Reviews gameId={game.id} />
                </AdaptiveTabsContent>
                <AdaptiveTabsContent value="screenshots">
                  <Suspense fallback={"loading..."}>
                    <GameScreenshots
                      gameId={igdbData.id}
                      gameName={game.title}
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

            {/* Right Sidebar Column */}
            <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2 lg:w-[250px]">
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
              igdbId={game.igdbId}
              franchisesIdList={igdbData.franchises}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
