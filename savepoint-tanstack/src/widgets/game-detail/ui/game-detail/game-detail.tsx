import { useNavigate } from "@tanstack/react-router";

import { useEveningMinutes } from "@/entities/session/model";
import { useSetOwnership, useSetStatus } from "@/features/manage-library-entry";
import { openGlobalAction } from "@/shared/lib/global-action";
import { Card } from "@/shared/ui/card";

import { AboutPanel } from "../about-panel";
import { GameDetailDetailRail } from "../game-detail-detail-rail";
import { GameDetailJumpSpine } from "../game-detail-jump-spine";
import { GameHeader } from "../game-header";
import { GameHeaderActions } from "../game-header-actions";
import { GameLibraryControls } from "../game-library-controls";
import { GameMoreMenu } from "../game-more-menu";
import { GameNotesList } from "../game-notes-list";
import { GameRating } from "../game-rating";
import { PlayHistory } from "../play-history";
import { RelatedPanel } from "../related-panel";
import { ScreenshotsPanel } from "../screenshots-panel";
import { ThemesTagsPanel } from "../themes-tags-panel";
import type { GameDetailProps } from "./game-detail.type";

export function GameDetail({
  data,
  viewerUserId,
  gameSlug,
  relatedGamesSlot,
  timesToBeatSlot,
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
  } = data;
  const navigate = useNavigate();
  const eveningMinutes = useEveningMinutes();

  function openLogSession() {
    openGlobalAction(navigate, "log-session", gameSlug);
  }

  const releaseYear = game.releaseDate
    ? game.releaseDate.getUTCFullYear().toString()
    : null;

  const summary = igdbDetails.summary ?? null;
  const themes = igdbDetails.themes?.map((t) => t.name) ?? [];
  const genres = igdbDetails.genres?.map((g) => g.name) ?? [];
  const platforms = igdbDetails.platforms?.map((p) => p.name) ?? [];
  const developer =
    igdbDetails.involved_companies?.find((c) => c.developer)?.company.name ??
    null;
  const publisher =
    igdbDetails.involved_companies?.find((c) => c.publisher)?.company.name ??
    null;

  const criticScore = igdbDetails.aggregated_rating ?? null;

  const hasAboutData = Boolean(
    summary || releaseYear || developer || publisher
  );
  const hasThemesTagsData =
    themes.length > 0 || genres.length > 0 || platforms.length > 0;

  const isInLibrary = libraryEntry !== null;
  const showPersonalPanels = viewerUserId !== null && isInLibrary;

  const showScreenshotsPanel = (igdbDetails.screenshots?.length ?? 0) > 0;
  const showJournalPanel = showPersonalPanels;
  const showRelatedPanel =
    relatedGamesSlot !== null && relatedGamesSlot !== undefined;
  const showTimesToBeatPanel =
    showPersonalPanels &&
    timesToBeatSlot !== null &&
    timesToBeatSlot !== undefined;

  const jumpSections = [
    hasAboutData && { id: "about", label: "About" },
    hasThemesTagsData && { id: "themes", label: "Themes" },
    showJournalPanel && { id: "journal", label: "Notes" },
    showScreenshotsPanel && { id: "screenshots", label: "Screenshots" },
    showRelatedPanel && { id: "related", label: "Related" },
  ].filter((s): s is { id: string; label: string } => Boolean(s));

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

  const libraryControlsProps =
    viewerUserId !== null
      ? {
          igdbId: game.igdbId,
          gameTitle: game.title,
          entry: libraryEntry,
          libraryStatus: sharedLibraryStatus,
          libraryOwnership: sharedLibraryOwnership,
          prompts,
        }
      : null;

  const panelContent = (
    <>
      {showScreenshotsPanel ? (
        <Card
          id="screenshots"
          variant="flat"
          className="mt-8 flex flex-col gap-2 p-4"
        >
          <ScreenshotsPanel
            screenshots={igdbDetails.screenshots}
            gameTitle={game.title}
          />
        </Card>
      ) : null}

      <div
        data-testid="game-detail-bento-grid"
        className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-[1.35fr_1fr] md:items-start"
      >
        {showPersonalPanels && libraryEntry ? (
          <Card id="rating" variant="flat" className="flex flex-col gap-2 p-4">
            <GameRating
              libraryItemId={libraryEntry.id}
              rating={libraryEntry.rating}
            />
            <PlayHistory plays={history} />
          </Card>
        ) : null}

        {showTimesToBeatPanel ? timesToBeatSlot : null}

        {hasAboutData ? (
          <Card
            id="about"
            variant="flat"
            data-testid="game-detail-about-card"
            className="flex flex-col gap-3 p-4"
          >
            <AboutPanel
              summary={summary}
              releaseYear={releaseYear}
              developer={developer}
              publisher={publisher}
            />
          </Card>
        ) : null}

        {hasThemesTagsData ? (
          <Card
            id="themes"
            variant="flat"
            data-testid="game-detail-themes-tags-card"
            className="flex flex-col gap-3 p-4"
          >
            <ThemesTagsPanel
              themes={themes}
              genres={genres}
              platforms={platforms}
            />
          </Card>
        ) : null}

        {showJournalPanel ? (
          <Card id="journal" variant="flat" className="flex flex-col gap-2 p-4">
            <GameNotesList notes={notes} onNewNote={openLogSession} />
          </Card>
        ) : null}

        {showRelatedPanel ? (
          <div id="related">
            <RelatedPanel>{relatedGamesSlot}</RelatedPanel>
          </div>
        ) : null}
      </div>
    </>
  );

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

      <div className="relative px-6 pb-16 md:px-12">
        {libraryControlsProps !== null ? (
          <div className="mt-4">
            <GameLibraryControls key={game.igdbId} {...libraryControlsProps} />
          </div>
        ) : null}

        {/* Jump spine: mobile — visible below md; desktop version is inside the content column */}
        {jumpSections.length > 0 ? (
          <div className="mt-4 md:hidden">
            <GameDetailJumpSpine sections={jumpSections} />
          </div>
        ) : null}

        {/* Two-column layout on desktop; single column on mobile.
            The detail rail column uses hidden/md:block so it stays in the DOM
            on both viewports — avoids a post-hydration remount of the keyed
            status switcher that useIsDesktop would cause. */}
        <div className="md:mt-8 md:grid md:grid-cols-[1fr_320px] md:items-start md:gap-7">
          {/* Content column */}
          <div className="min-w-0">
            {/* Jump spine for desktop — hidden on mobile (the separate spine above handles that) */}
            {jumpSections.length > 0 ? (
              <div className="hidden md:block">
                <GameDetailJumpSpine sections={jumpSections} />
              </div>
            ) : null}
            {panelContent}
          </div>

          {/* Sticky detail rail — desktop only, CSS-hidden on mobile */}
          <div className="hidden md:block">
            <GameDetailDetailRail
              showPlaytime={libraryControlsProps !== null}
              criticScore={criticScore}
              playtimeTotalMinutes={playtimeTotalMinutes}
              playtimeSessionCount={playtimeSessionCount}
              lastSessionDate={null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
