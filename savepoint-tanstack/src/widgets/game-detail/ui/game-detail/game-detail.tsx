import { useEveningMinutes } from "@/entities/session/model";
import { useSetOwnership, useSetStatus } from "@/features/manage-library-entry";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

import { AboutPanel } from "../about-panel";
import { GameHeader } from "../game-header";
import { GameHeaderActions } from "../game-header-actions";
import { GameLibraryControls } from "../game-library-controls";
import { GameMoreMenu } from "../game-more-menu";
import { ScreenshotsPanel } from "../screenshots-panel";
import { YourPlayCard } from "../your-play-card";
import type { GameDetailProps } from "./game-detail.type";

export function GameDetail({
  data,
  viewerUserId,
  gameSlug,
  relatedGamesSlot,
}: GameDetailProps) {
  const {
    game,
    igdbDetails,
    libraryEntry,
    doneOutcome,
    prompts,
    notes,
    history = [],
    playtimeTotalMinutes,
    playtimeSessionCount,
    timeToCreditsSeconds,
    timeToCompleteSeconds,
  } = data;
  const eveningMinutes = useEveningMinutes();

  const summary = igdbDetails.summary ?? null;
  const themes = igdbDetails.themes?.map((t) => t.name) ?? [];
  const genres = igdbDetails.genres?.map((g) => g.name) ?? [];
  const developer =
    igdbDetails.involved_companies?.find((c) => c.developer)?.company.name ??
    null;

  const hasAboutData = Boolean(
    summary ||
    game.releaseDate ||
    game.releaseDatePrecision === "TBA" ||
    developer ||
    timeToCreditsSeconds !== null ||
    timeToCompleteSeconds !== null ||
    themes.length > 0 ||
    genres.length > 0
  );

  const isInLibrary = libraryEntry !== null;
  const showScreenshotsPanel = (igdbDetails.screenshots?.length ?? 0) > 0;
  const showRelatedSlot =
    relatedGamesSlot !== null && relatedGamesSlot !== undefined;

  const libraryStatus = useSetStatus({
    id: libraryEntry?.id ?? 0,
    gameTitle: game.title,
    status: libraryEntry?.status ?? "WANT",
    upNextPosition: libraryEntry?.upNextPosition ?? null,
    rating: libraryEntry?.rating ?? null,
  });
  const sharedLibraryStatus = isInLibrary ? libraryStatus : null;
  const libraryOwnership = useSetOwnership({
    id: libraryEntry?.id ?? 0,
    gameTitle: game.title,
    isOwned: libraryEntry?.isOwned ?? true,
  });
  const sharedLibraryOwnership = isInLibrary ? libraryOwnership : null;

  const yourPlayEntry =
    viewerUserId !== null && libraryEntry !== null
      ? { ...libraryEntry, status: libraryStatus.status }
      : null;

  const libraryControlsProps =
    viewerUserId !== null
      ? {
          igdbId: game.igdbId,
          gameTitle: game.title,
          entry: libraryEntry,
          libraryStatus: sharedLibraryStatus,
          libraryOwnership: sharedLibraryOwnership,
        }
      : null;

  return (
    <div className="relative flex flex-col">
      <GameHeader
        data={data}
        eveningMinutes={eveningMinutes}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GameHeaderActions
              igdbId={game.igdbId}
              gameTitle={game.title}
              gameSlug={gameSlug ?? game.slug}
              entry={libraryEntry}
              libraryStatus={sharedLibraryStatus}
              doneOutcome={doneOutcome ?? null}
              viewerUserId={viewerUserId}
            />
            <GameMoreMenu
              igdbId={game.igdbId}
              gameTitle={game.title}
              entry={libraryEntry}
              libraryStatus={sharedLibraryStatus}
              libraryOwnership={sharedLibraryOwnership}
            />
          </div>
        }
      />

      <div className="relative flex min-w-0 flex-col gap-8 px-6 pb-16 md:px-12">
        {libraryControlsProps !== null ? (
          <div className="mt-4">
            <GameLibraryControls key={game.igdbId} {...libraryControlsProps} />
          </div>
        ) : null}

        {yourPlayEntry !== null || hasAboutData ? (
          <div
            data-testid="game-detail-body-grid"
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            {yourPlayEntry !== null ? (
              <YourPlayCard
                entry={yourPlayEntry}
                gameTitle={game.title}
                gameSlug={gameSlug ?? game.slug}
                prompts={prompts}
                notes={notes}
                history={history}
                playtimeTotalMinutes={playtimeTotalMinutes}
                playtimeSessionCount={playtimeSessionCount}
              />
            ) : null}

            {hasAboutData ? (
              <Card
                id="about"
                variant="flat"
                data-testid="game-detail-about-card"
                className={cn(
                  "flex h-full flex-col gap-3 p-4",
                  yourPlayEntry === null && "md:col-span-2"
                )}
              >
                <AboutPanel
                  summary={summary}
                  developer={developer}
                  releaseDate={game.releaseDate}
                  releaseDatePrecision={game.releaseDatePrecision}
                  timeToCreditsSeconds={timeToCreditsSeconds}
                  timeToCompleteSeconds={timeToCompleteSeconds}
                  themes={themes}
                  genres={genres}
                />
              </Card>
            ) : null}
          </div>
        ) : null}

        {showScreenshotsPanel ? (
          <ScreenshotsPanel
            screenshots={igdbDetails.screenshots}
            gameTitle={game.title}
          />
        ) : null}

        {showRelatedSlot ? (
          <div id="related" className="min-w-0 empty:hidden">
            {relatedGamesSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
