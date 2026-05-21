import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { GameCover, PlatformBadges } from "@/entities/game";
import { JournalTeaser } from "@/entities/journal-entry";
import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { LibraryStatusSwitcher } from "../library-status-switcher";
import type { GameDetailProps } from "./game-detail.type";

const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";

function buildScreenshotUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  return `${IGDB_IMAGE_BASE}/t_1080p/${imageId}.jpg`;
}

export function GameDetail({
  data,
  viewerUserId,
  relatedGamesSlot,
  timesToBeatSlot,
}: GameDetailProps) {
  const { game, igdbDetails, libraryEntry, journalTeaser } = data;
  const [composeOpen, setComposeOpen] = useState(false);
  const coverUrl = buildCoverImageUrl(game.coverImage, "t_cover_big_2x");

  const releaseYear = game.releaseDate
    ? game.releaseDate.getUTCFullYear().toString()
    : null;

  const summary = igdbDetails.summary ?? null;
  const genres = igdbDetails.genres?.map((g) => g.name) ?? [];
  const platforms = igdbDetails.platforms?.map((p) => p.name) ?? [];
  const developer =
    igdbDetails.involved_companies?.find((c) => c.developer)?.company.name ??
    null;
  const screenshotBgUrl = buildScreenshotUrl(
    igdbDetails.screenshots?.[0]?.image_id
  );

  const eyebrowParts: string[] = [
    releaseYear,
    developer,
    genres.length > 0 ? genres.slice(0, 2).join(", ") : null,
  ]
    .filter((p): p is string => Boolean(p))
    .map((p) => p.toUpperCase());

  const journalCount = journalTeaser.length;
  const showJournalTab = viewerUserId !== null;
  const showRelatedTab =
    relatedGamesSlot !== null && relatedGamesSlot !== undefined;
  const showTimesToBeatTab =
    timesToBeatSlot !== null && timesToBeatSlot !== undefined;

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

            {viewerUserId !== null ? (
              <LibraryStatusSwitcher
                key={game.igdbId}
                igdbId={game.igdbId}
                gameTitle={game.title}
                entry={libraryEntry}
              />
            ) : null}
          </div>
        </section>

        <Tabs defaultValue="overview" className="gap-lg mt-8 flex flex-col">
          <TabsList
            aria-label="Game detail sections"
            className="gap-1 overflow-x-auto"
          >
            <TabsTrigger value="overview" className="px-3.5 pt-3 pb-3">
              Overview
            </TabsTrigger>
            {showJournalTab ? (
              <TabsTrigger value="journal" className="gap-1.5 px-3.5 pt-3 pb-3">
                <span>Journal</span>
                <span
                  className={cn(
                    "text-caption rounded-full px-1.5 py-0.5 leading-none",
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {journalCount}
                </span>
              </TabsTrigger>
            ) : null}
            {showRelatedTab ? (
              <TabsTrigger value="related" className="px-3.5 pt-3 pb-3">
                Related
              </TabsTrigger>
            ) : null}
            {showTimesToBeatTab ? (
              <TabsTrigger value="times-to-beat" className="px-3.5 pt-3 pb-3">
                Times to beat
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview" className="gap-xl flex flex-col">
            <OverviewBody
              summary={summary}
              releaseYear={releaseYear}
              genres={genres}
              platforms={platforms}
            />
          </TabsContent>

          {showJournalTab ? (
            <TabsContent value="journal" className="gap-md flex flex-col">
              <h2 id="journal-teaser-heading" className="text-h3">
                Journal
              </h2>
              <JournalTeaser
                entries={journalTeaser}
                onAddEntryClick={() => setComposeOpen(true)}
              />
            </TabsContent>
          ) : null}

          {showRelatedTab ? (
            <TabsContent value="related" className="gap-md flex flex-col">
              {relatedGamesSlot}
            </TabsContent>
          ) : null}

          {showTimesToBeatTab ? (
            <TabsContent value="times-to-beat" className="gap-md flex flex-col">
              {timesToBeatSlot}
            </TabsContent>
          ) : null}
        </Tabs>

        {viewerUserId ? (
          <ComposeJournalEntryDialog
            open={composeOpen}
            onOpenChange={setComposeOpen}
            defaultGameId={game.id}
          />
        ) : null}
      </div>
    </main>
  );
}

function OverviewBody({
  summary,
  releaseYear,
  genres,
  platforms,
}: {
  summary: string | null;
  releaseYear: string | null;
  genres: string[];
  platforms: string[];
}) {
  return (
    <>
      {summary ? (
        <p
          aria-label="Game summary"
          className="text-body text-foreground/85 max-w-[720px] leading-relaxed"
        >
          {summary}
        </p>
      ) : null}

      <div className="gap-lg grid grid-cols-1 md:grid-cols-[max-content_1fr] md:items-baseline">
        <TerminalLabel>{`// GAME.DETAIL`}</TerminalLabel>
        <dl className="text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-24">Release year</dt>
            <dd className="text-foreground">{releaseYear ?? "—"}</dd>
          </div>
        </dl>

        <TerminalLabel>{`// GENRES`}</TerminalLabel>
        {genres.length > 0 ? (
          <ul aria-label="Genres" className="flex flex-wrap gap-1.5 text-sm">
            {genres.map((g) => (
              <li key={g}>
                <Badge variant="secondary">{g}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p aria-label="Genres" className="text-muted-foreground text-sm">
            —
          </p>
        )}

        <TerminalLabel>{`// PLATFORMS`}</TerminalLabel>
        {platforms.length > 0 ? (
          <div aria-label="Platforms">
            <PlatformBadges platforms={platforms} />
          </div>
        ) : (
          <p aria-label="Platforms" className="text-muted-foreground text-sm">
            —
          </p>
        )}
      </div>
    </>
  );
}

function TerminalLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
      {children}
    </span>
  );
}
