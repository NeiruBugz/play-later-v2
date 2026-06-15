import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { CriticScoreRing, GameCover } from "@/entities/game";
import type { PlaythroughWithEntries } from "@/entities/playthrough";
import {
  ComposeJournalEntryDialog,
  LogSessionDrawer,
} from "@/features/compose-journal-entry";
import {
  AddEditPlaythroughDrawer,
  type PlaythroughFormValues,
} from "@/features/manage-playthrough";
import {
  buildCoverImageUrl,
  buildScreenshotUrl,
} from "@/shared/lib/igdb-image";
import { Card } from "@/shared/ui/card";

import { AboutPanel } from "../about-panel";
import { AddToTrackInvite } from "../add-to-track-invite";
import { JournalFeed } from "../journal-feed";
import { JournalPanel } from "../journal-panel";
import { LibraryStatusSwitcher } from "../library-status-switcher";
import { PlaythroughsPanel } from "../playthroughs-panel";
import { RelatedPanel } from "../related-panel";
import { ScreenshotsPanel } from "../screenshots-panel";
import { ThemesTagsPanel } from "../themes-tags-panel";
import type { GameDetailProps } from "./game-detail.type";

export function GameDetail({
  data,
  viewerUserId,
  relatedGamesSlot,
  timesToBeatSlot,
}: GameDetailProps) {
  const {
    game,
    igdbDetails,
    libraryEntry,
    journalTeaser,
    playthroughs = [],
    derivedStatus,
    statusIsManual = false,
    unattachedJournalEntries = [],
  } = data;
  const [composeOpen, setComposeOpen] = useState(false);

  type DrawerState =
    | { open: false }
    | { open: true; mode: "add" }
    | {
        open: true;
        mode: "edit";
        playthroughId: string;
        prefill: PlaythroughFormValues;
      };

  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false });

  type LogSessionState =
    | { open: false }
    | { open: true; preselectedPlaythroughId: string };

  const [logSessionState, setLogSessionState] = useState<LogSessionState>({
    open: false,
  });

  function mapPlaythroughToFormValues(
    pt: PlaythroughWithEntries
  ): PlaythroughFormValues {
    return {
      libraryItemId: pt.libraryItemId,
      kind: pt.kind ?? undefined,
      platform: pt.platform ?? null,
      status: pt.status as PlaythroughFormValues["status"],
      startedAt: pt.startedAt ?? null,
      finishedAt: pt.finishedAt ?? null,
      playtimeHours: pt.playtimeMinutes / 60,
      rating: pt.rating ?? null,
      completion: pt.completion ?? null,
      notes: pt.notes ?? null,
    };
  }
  const coverUrl = buildCoverImageUrl(game.coverImage, "t_cover_big_2x");

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
  const screenshotBgUrl = buildScreenshotUrl(
    igdbDetails.screenshots?.[0]?.image_id
  );

  const criticScore = igdbDetails.aggregated_rating ?? null;

  const eyebrowParts: string[] = [releaseYear, publisher, genres[0] ?? null]
    .filter((p): p is string => Boolean(p))
    .map((p) => p.toUpperCase());

  const hasAboutData = Boolean(
    summary || releaseYear || developer || publisher
  );
  const hasThemesTagsData =
    themes.length > 0 || genres.length > 0 || platforms.length > 0;

  const isInLibrary = libraryEntry !== null;
  const showPersonalPanels = viewerUserId !== null && isInLibrary;
  const showTrackInvite = !showPersonalPanels;

  const showScreenshotsPanel = (igdbDetails.screenshots?.length ?? 0) > 0;
  const showJournalPanel = showPersonalPanels;
  const showRelatedPanel =
    relatedGamesSlot !== null && relatedGamesSlot !== undefined;
  const showTimesToBeatPanel =
    showPersonalPanels &&
    timesToBeatSlot !== null &&
    timesToBeatSlot !== undefined;

  return (
    <main className="relative flex flex-col">
      <div
        aria-hidden="true"
        data-testid="game-detail-hero-backdrop"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden md:h-72"
      >
        {screenshotBgUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${screenshotBgUrl})`,
              filter: "saturate(0.85)",
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklch, var(--primary) 20%, transparent), transparent 60%)",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, transparent 0%, color-mix(in oklch, var(--background) 40%, transparent) 55%, var(--background) 88%, var(--background) 100%)",
              "linear-gradient(90deg, color-mix(in oklch, var(--background) 60%, transparent) 0%, transparent 40%)",
            ].join(", "),
          }}
        />
      </div>

      <div className="relative px-6 pb-16 md:px-12">
        <nav
          aria-label="Breadcrumb"
          className="text-caption text-muted-foreground relative z-10 flex items-center gap-1.5 pt-3.5"
        >
          <Link
            to="/library"
            className="hover:text-foreground transition-colors"
          >
            Library
          </Link>
          <span className="opacity-50">/</span>
          <Link
            to="/library"
            className="hover:text-foreground transition-colors"
          >
            Games
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground max-w-[280px] truncate font-medium">
            {game.title}
          </span>
        </nav>

        <section
          id="hero"
          className="grid grid-cols-1 items-end gap-7 pt-[140px] md:[grid-template-columns:200px_1fr]"
        >
          <div className="w-32 md:w-[200px]">
            <GameCover src={coverUrl} alt={`Cover for ${game.title}`} />
          </div>
          <div className="min-w-0 pb-1.5">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                {eyebrowParts.length > 0 ? (
                  <p
                    aria-label="Release metadata"
                    className="text-caption text-muted-foreground mb-2.5 flex flex-wrap items-center gap-2 tracking-widest uppercase"
                  >
                    {eyebrowParts.map((part, i) => (
                      <span key={i} className="flex items-center gap-2">
                        {i > 0 ? (
                          <span
                            aria-hidden="true"
                            className="bg-muted-foreground inline-block h-[3px] w-[3px] rounded-full"
                          />
                        ) : null}
                        {part}
                      </span>
                    ))}
                  </p>
                ) : null}

                <h1 className="text-h1 mb-4 tracking-tight break-words">
                  {game.title}
                </h1>
              </div>

              <CriticScoreRing value={criticScore} />
            </div>

            {viewerUserId !== null ? (
              <LibraryStatusSwitcher
                key={game.igdbId}
                igdbId={game.igdbId}
                gameTitle={game.title}
                entry={libraryEntry}
                playthroughCount={playthroughs.length}
                derivedStatus={derivedStatus ?? libraryEntry?.status ?? "SHELF"}
                statusIsManual={statusIsManual}
              />
            ) : null}
          </div>
        </section>

        {showScreenshotsPanel ? (
          <Card variant="flat" className="gap-md p-xl mt-8 flex flex-col">
            <ScreenshotsPanel
              screenshots={igdbDetails.screenshots}
              gameTitle={game.title}
            />
          </Card>
        ) : null}

        <div
          data-testid="game-detail-bento-grid"
          className="gap-lg mt-8 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] md:items-start"
        >
          {showPersonalPanels ? (
            <Card variant="flat" className="gap-md p-xl flex flex-col">
              <PlaythroughsPanel
                libraryItemId={String(libraryEntry?.id ?? "")}
                playthroughs={playthroughs}
                onAddPlaythrough={() =>
                  setDrawerState({ open: true, mode: "add" })
                }
                onEditPlaythrough={(pt) =>
                  setDrawerState({
                    open: true,
                    mode: "edit",
                    playthroughId: pt.id,
                    prefill: mapPlaythroughToFormValues(pt),
                  })
                }
                onLogSession={(pt) =>
                  setLogSessionState({
                    open: true,
                    preselectedPlaythroughId: pt.id,
                  })
                }
              />
            </Card>
          ) : null}

          {showTrackInvite ? (
            <Card variant="flat" className="flex flex-col">
              <AddToTrackInvite
                igdbId={game.igdbId}
                gameTitle={game.title}
                isSignedIn={viewerUserId !== null}
              />
            </Card>
          ) : null}

          {showTimesToBeatPanel ? (
            <Card variant="flat" className="gap-md p-xl flex flex-col">
              {timesToBeatSlot}
            </Card>
          ) : null}

          {hasAboutData ? (
            <Card
              variant="flat"
              data-testid="game-detail-about-card"
              className="gap-lg p-xl flex flex-col"
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
              variant="flat"
              data-testid="game-detail-themes-tags-card"
              className="gap-lg p-xl flex flex-col"
            >
              <ThemesTagsPanel
                themes={themes}
                genres={genres}
                platforms={platforms}
              />
            </Card>
          ) : null}

          {showJournalPanel ? (
            <Card variant="flat" className="gap-md p-xl flex flex-col">
              <JournalPanel
                entries={journalTeaser}
                onAddEntryClick={() => setComposeOpen(true)}
              />
            </Card>
          ) : null}

          {showRelatedPanel ? (
            <RelatedPanel>{relatedGamesSlot}</RelatedPanel>
          ) : null}
        </div>

        <JournalFeed
          playthroughs={playthroughs}
          legacyEntries={unattachedJournalEntries}
        />

        {viewerUserId ? (
          <ComposeJournalEntryDialog
            open={composeOpen}
            onOpenChange={setComposeOpen}
            defaultGameId={game.id}
          />
        ) : null}

        {showPersonalPanels &&
        libraryEntry &&
        logSessionState.open &&
        playthroughs.length > 0 ? (
          <LogSessionDrawer
            open={logSessionState.open}
            onOpenChange={(open) => {
              if (!open) setLogSessionState({ open: false });
            }}
            playthroughs={playthroughs}
            preselectedPlaythroughId={logSessionState.preselectedPlaythroughId}
            gameId={game.id}
          />
        ) : null}

        {showPersonalPanels && libraryEntry ? (
          <AddEditPlaythroughDrawer
            open={drawerState.open}
            mode={drawerState.open ? drawerState.mode : "add"}
            libraryItemId={libraryEntry.id}
            existingPlaythroughCount={playthroughs.length}
            playthroughId={
              drawerState.open && drawerState.mode === "edit"
                ? drawerState.playthroughId
                : undefined
            }
            playthrough={
              drawerState.open && drawerState.mode === "edit"
                ? drawerState.prefill
                : undefined
            }
            onOpenChange={(open) => {
              if (!open) setDrawerState({ open: false });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
