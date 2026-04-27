"use client";

import { MoreHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import type { LibraryItemDomain } from "@/features/library/types";
import { deleteLibraryItemAction } from "@/features/manage-library-entry/server-actions";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemStatus } from "@/shared/types";

import { LIBRARY_STATUS_INLINE_VARIANT } from "../lib/feature-flags";
import { GameCoverImage } from "./game-cover-image";
import { LibraryRatingControl } from "./library-rating-control";
import { LibraryStatusDropdownPill } from "./library-status-dropdown-pill";
import { LibraryStatusSegmented } from "./library-status-segmented";

const LibraryModal = dynamic(
  () =>
    import("@/features/manage-library-entry/ui").then(
      (mod) => mod.LibraryModal
    ),
  { ssr: false }
);

type InvolvedCompany = {
  company: { name?: string | null };
  developer: boolean;
  publisher: boolean;
};

export interface GameDetailHeroProps {
  game: {
    id: number;
    name: string;
    cover?: { image_id?: string | null } | null;
    slug?: string;
    first_release_date?: number;
    involved_companies?: InvolvedCompany[];
    genres?: Array<{ name?: string | null }>;
    platforms?: Array<{ id?: number; name?: string | null }>;
  };
  gameId?: string;
  bannerUrl: string | null;
  userId?: string | null;
  userLibraryStatus?: {
    mostRecent: {
      id: number;
      status: LibraryItemStatus;
      rating: number | null;
    };
    updatedAt: Date;
    allItems: LibraryItemDomain[];
  };
  hasJournal?: boolean;
  hasPlaytime?: boolean;
  hasRelated?: boolean;
  journalEntryCount?: number;
}

function resolveStudio(
  involvedCompanies?: InvolvedCompany[],
  platforms?: Array<{ name?: string | null }>
): string | undefined {
  if (involvedCompanies && involvedCompanies.length > 0) {
    const developer = involvedCompanies.find((c) => c.developer);
    if (developer?.company.name) return developer.company.name;
    const publisher = involvedCompanies.find((c) => c.publisher);
    if (publisher?.company.name) return publisher.company.name;
  }
  const firstPlatform = platforms?.find((p) => p.name);
  return firstPlatform?.name ?? undefined;
}

function buildEyebrowParts(
  firstReleaseDate?: number,
  studio?: string,
  genres?: Array<{ name?: string | null }>
): string[] {
  const year = firstReleaseDate
    ? new Date(firstReleaseDate * 1000).getUTCFullYear().toString()
    : null;
  const genreLabel =
    genres
      ?.map((g) => g.name)
      .filter((n): n is string => Boolean(n))
      .slice(0, 2)
      .join(" · ") || null;
  return [year, studio, genreLabel].filter((p): p is string => Boolean(p));
}

type TabItem = {
  label: string;
  href: string;
  count?: number;
};

const ALL_TABS: TabItem[] = [
  { label: "Overview", href: "#overview" },
  { label: "Journal", href: "#journal" },
  { label: "Playtime", href: "#playtime" },
  { label: "Related", href: "#related" },
];

export function GameDetailHero({
  game,
  gameId,
  bannerUrl,
  userId,
  userLibraryStatus,
  hasJournal = false,
  hasPlaytime = false,
  hasRelated = false,
  journalEntryCount,
}: GameDetailHeroProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const currentStatus = userLibraryStatus?.mostRecent.status;
  const libraryItemId = userLibraryStatus?.mostRecent.id;
  const currentRating = userLibraryStatus?.mostRecent.rating ?? null;

  const studio = resolveStudio(game.involved_companies, game.platforms);
  const eyebrowParts = buildEyebrowParts(
    game.first_release_date,
    studio,
    game.genres
  );

  const visibleTabs = ALL_TABS.filter((tab) => {
    if (tab.label === "Journal") return hasJournal;
    if (tab.label === "Playtime") return hasPlaytime;
    if (tab.label === "Related") return hasRelated;
    return true;
  }).map((tab) =>
    tab.label === "Journal" && journalEntryCount !== undefined
      ? { ...tab, count: journalEntryCount }
      : tab
  );

  const handleDeleteItem = async (itemId: number) => {
    const result = await deleteLibraryItemAction({ libraryItemId: itemId });
    if (result.success) {
      toast.success("Library entry deleted");
    } else {
      toast.error(result.error ?? "Failed to delete library entry");
    }
  };

  return (
    <div className="relative">
      {/* Banner — absolutely positioned behind content */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden md:h-72"
        aria-hidden="true"
      >
        {bannerUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${bannerUrl})`,
              filter: "saturate(0.85)",
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, transparent), transparent 60%)",
            }}
          />
        )}
        {/* Two-layer gradient overlay */}
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

      {/* Breadcrumb — sits on top of banner */}
      <nav
        className="text-caption text-muted-foreground relative z-10 flex items-center gap-1.5 px-6 pt-3.5 md:px-12"
        aria-label="Breadcrumb"
      >
        <Link
          href="/library"
          className="hover:text-foreground transition-colors"
        >
          Library
        </Link>
        <span className="opacity-50">/</span>
        <Link
          href="/library"
          className="hover:text-foreground transition-colors"
        >
          Games
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-foreground max-w-[200px] truncate font-medium">
          {game.name}
        </span>
      </nav>

      {/* Hero content grid */}
      <div
        className="relative grid gap-7 px-6 md:px-12"
        style={{
          gridTemplateColumns: "200px 1fr",
          alignItems: "end",
          paddingTop: "140px",
        }}
      >
        {/* Cover */}
        <div
          className="w-[200px]"
          style={{
            viewTransitionName: `game-cover-${game.id}`,
            boxShadow:
              "0 18px 40px oklch(0 0 0 / 0.25), 0 4px 12px oklch(0 0 0 / 0.15)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <GameCoverImage
            imageId={game.cover?.image_id}
            gameTitle={game.name}
            libraryStatus={currentStatus}
          />
        </div>

        {/* Text + controls */}
        <div className="min-w-0 pb-1.5">
          {eyebrowParts.length > 0 && (
            <p
              className="text-caption text-muted-foreground mb-2.5 flex flex-wrap items-center gap-2 tracking-widest uppercase"
              aria-label="Release year and studio"
            >
              {eyebrowParts.map((part, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <span
                      className="bg-muted-foreground inline-block h-[3px] w-[3px] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  {part}
                </span>
              ))}
            </p>
          )}

          <h1 className="text-display jewel-display jewel:tracking-[0.02em] mb-4 tracking-tight">
            {game.name}
          </h1>

          {userId && (
            <div
              className="flex flex-wrap items-center gap-2.5"
              data-testid="status-cluster"
            >
              {LIBRARY_STATUS_INLINE_VARIANT === "segmented" ? (
                <LibraryStatusSegmented
                  currentStatus={currentStatus}
                  igdbId={game.id}
                />
              ) : (
                <LibraryStatusDropdownPill
                  currentStatus={currentStatus}
                  igdbId={game.id}
                />
              )}

              {libraryItemId !== undefined && (
                <LibraryRatingControl
                  libraryItemId={libraryItemId}
                  initialRating={currentRating}
                  size="md"
                />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="More options"
                    className="h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsManageModalOpen(true)}>
                    Edit library entry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Tabs strip */}
      <nav
        className="border-border mt-8 border-b px-6 md:px-12"
        aria-label="Game detail sections"
      >
        <div className="flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab, index) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "text-body inline-flex shrink-0 items-center gap-1.5 px-3.5 pt-3 pb-3 font-medium transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                index === 0
                  ? "border-primary text-foreground border-b-2 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={index === 0 ? { marginBottom: "-1px" } : undefined}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-caption text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {isManageModalOpen && userId && (
        <LibraryModal
          gameId={gameId}
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          igdbId={game.id}
          gameTitle={game.name}
          mode={userLibraryStatus ? "edit" : "add"}
          existingItems={userLibraryStatus?.allItems}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </div>
  );
}
