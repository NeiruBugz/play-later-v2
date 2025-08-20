import { Star } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  About,
  Achievements,
  Franchises,
  GameQuickActions,
  GameScreenshots,
  getGame,
  Metadata,
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
} from "@/shared/components";
import { Header } from "@/shared/components/header";
import { IgdbImage } from "@/shared/components/igdb-image";
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

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <Header authorized={true} />
        <div className="container relative z-10 px-4 pt-[80px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr_250px]">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-lg border shadow-lg">
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
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-4xl font-bold">{game.title}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-5 fill-primary text-primary" />
                    <span className="font-medium">4/5</span>
                  </div>
                  <Suspense>
                    <TimesToBeat igdbId={game.igdbId} />
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
                  {steamAppId !== null ? (
                    <AdaptiveTabsTrigger value="achievements" icon="🏆">
                      Achievements
                    </AdaptiveTabsTrigger>
                  ) : null}
                </AdaptiveTabsList>
                <AdaptiveTabsContent value="about" className="space-y-4">
                  <About
                    description={game.description ?? igdbData.summary}
                    releaseDates={igdbData.release_dates}
                    genres={igdbData.genres}
                    igdbId={game.igdbId}
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
            <div className="flex flex-col gap-6">
              <Metadata
                firstReleaseDate={game.releaseDate}
                releaseDates={igdbData.release_dates}
                involvedCompanies={igdbData.involved_companies}
                aggregatedRating={igdbData.aggregated_rating}
                themes={igdbData.themes}
              />

              <div>
                <h3 className="mb-3 font-medium">Similar Games</h3>
                <SimilarGames similarGames={igdbData.similar_games} />
              </div>

              {/* {game.userStats && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-medium">Community Stats</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Playing</span>
                        <span className="font-medium">
                          {game.userStats.playing}
                        </span>
                      </div>
                      <Progress
                        value={
                          (game.userStats.playing / game.userStats.total) * 100
                        }
                        className="mt-1 h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium">
                          {game.userStats.completed}
                        </span>
                      </div>
                      <Progress
                        value={
                          (game.userStats.completed / game.userStats.total) *
                          100
                        }
                        className="mt-1 h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Backlogged
                        </span>
                        <span className="font-medium">
                          {game.userStats.backlogged}
                        </span>
                      </div>
                      <Progress
                        value={
                          (game.userStats.backlogged / game.userStats.total) *
                          100
                        }
                        className="mt-1 h-2"
                      />
                    </div>
                  </div>
                </div>
              )} */}
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
