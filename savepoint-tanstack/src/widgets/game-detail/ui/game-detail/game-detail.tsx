import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { GameCover } from "@/entities/game";
import { JournalTeaser } from "@/entities/journal-entry";
import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { cn } from "@/shared/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { LibraryStatusSwitcher } from "../library-status-switcher";
import type { GameDetailProps } from "./game-detail.type";

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

  const eyebrowParts: string[] = [
    releaseYear,
    developer,
    genres.length > 0 ? genres.slice(0, 2).join(", ") : null,
  ]
    .filter((p): p is string => Boolean(p))
    .map((p) => p.toUpperCase());

  const journalCount = journalTeaser.length;
  const showJournalTab = viewerUserId !== null;
  const showPlaytimeTab =
    timesToBeatSlot !== null && timesToBeatSlot !== undefined;

  return (
    <main className="relative flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden md:h-72"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklch, var(--primary) 20%, transparent), transparent 60%)",
          }}
        />
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

      <div className="relative container mx-auto px-4 py-6 md:px-12">
        <nav
          aria-label="Breadcrumb"
          className="text-caption text-muted-foreground mb-md flex items-center gap-1.5"
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
          className="gap-xl mb-xl grid grid-cols-1 items-end md:[grid-template-columns:minmax(140px,200px)_1fr]"
        >
          <div className="w-32 md:w-full">
            <GameCover src={coverUrl} alt={`Cover for ${game.title}`} />
          </div>
          <div className="gap-md flex min-w-0 flex-col pb-1.5">
            {eyebrowParts.length > 0 ? (
              <p
                aria-label="Release metadata"
                className="text-caption text-muted-foreground flex flex-wrap items-center gap-2 tracking-widest uppercase"
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

            <h1 className="text-h1 tracking-tight break-words">{game.title}</h1>

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

        <Tabs defaultValue="overview" className="gap-lg flex flex-col">
          <TabsList
            aria-label="Game detail sections"
            className="overflow-x-auto"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {showJournalTab ? (
              <TabsTrigger value="journal" className="gap-1.5">
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
            {showPlaytimeTab ? (
              <TabsTrigger value="playtime">Playtime</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview" className="gap-xl flex flex-col">
            <OverviewBody
              summary={summary}
              releaseYear={releaseYear}
              genres={genres}
              platforms={platforms}
              relatedGamesSlot={relatedGamesSlot}
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

          {showPlaytimeTab ? (
            <TabsContent value="playtime" className="gap-md flex flex-col">
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
  relatedGamesSlot,
}: {
  summary: string | null;
  releaseYear: string | null;
  genres: string[];
  platforms: string[];
  relatedGamesSlot: GameDetailProps["relatedGamesSlot"];
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

      <div className="gap-lg grid grid-cols-1 md:grid-cols-[max-content_1fr]">
        <TerminalLabel>{`// GAME.DETAIL`}</TerminalLabel>
        <dl className="text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-24">Release year</dt>
            <dd className="text-foreground">{releaseYear ?? "—"}</dd>
          </div>
        </dl>

        <TerminalLabel>{`// GENRES`}</TerminalLabel>
        <p
          aria-label="Genres"
          className="text-muted-foreground text-sm"
        >
          {genres.length > 0 ? genres.join(" · ") : "—"}
        </p>

        <TerminalLabel>{`// PLATFORMS`}</TerminalLabel>
        <p
          aria-label="Platforms"
          className="text-muted-foreground text-sm"
        >
          {platforms.length > 0 ? platforms.join(" · ") : "—"}
        </p>
      </div>

      {relatedGamesSlot ? (
        <section id="related" className="gap-md flex flex-col">
          {relatedGamesSlot}
        </section>
      ) : null}
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
