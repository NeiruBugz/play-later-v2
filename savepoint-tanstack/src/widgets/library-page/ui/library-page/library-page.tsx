import { Link, useNavigate } from "@tanstack/react-router";
import { Download, Library, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { AddGameTrigger } from "@/features/add-game";
import {
  LibraryFilters,
  MobileFilterBar,
  type LibraryStatusCounts,
} from "@/features/filter-library";
import { LibraryCardMenu, LibraryModal } from "@/features/manage-library-entry";
import { EmptyLibraryHero } from "@/features/onboarding-first-time";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { LibraryPageProps } from "./library-page.type";

/**
 * Fallback per-status counts derived from the loaded items. Used ONLY when the
 * loader doesn't supply full-library `statusCounts` (older tests). This derives
 * counts from the *filtered* page, so it goes stale the moment a status is
 * selected — which is exactly why the real counts come from
 * `getLibraryStatusCounts` (an unfiltered GROUP BY) via the loader. The counts
 * shape mirrors `LibraryStatusCounts` so it passes straight to `LibraryFilters`.
 */
function computeStatusCounts(
  items: ReadonlyArray<LibraryItemWithGame>
): LibraryStatusCounts {
  const acc: LibraryStatusCounts = {
    WISHLIST: 0,
    SHELF: 0,
    UP_NEXT: 0,
    PLAYING: 0,
    PLAYED: 0,
  };
  for (const item of items) {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
  }
  return acc;
}

export function LibraryPage(props: LibraryPageProps) {
  const {
    items,
    total,
    status,
    platform,
    acquisition,
    startedOnly,
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
    platforms,
    statusCounts: statusCountsProp,
    onboarding,
  } = props;

  // One modal at the page level — see README "Host-owned modal state".
  const [selectedEntry, setSelectedEntry] =
    useState<LibraryItemWithGame | null>(null);

  const navigate = useNavigate();

  // Client-side title filter, no server roundtrip. The `/` keyboard hint
  // focuses the input when pressed outside any other input.
  const [titleQuery, setTitleQuery] = useState("");
  const filterInputRef = useRef<HTMLInputElement | null>(null);

  // F10 — distinguish "library is genuinely empty" (first-run) from "filters
  // exclude everything" (no-results). The latter gets a Clear-filters action
  // instead of an onboarding pitch.
  const serverFiltersActive = Boolean(
    status ||
    platform ||
    acquisition ||
    startedOnly ||
    minRating !== undefined ||
    unratedOnly === true
  );
  const clearFilters = () => {
    setTitleQuery("");
    navigate({ to: "/library", search: {} });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      event.preventDefault();
      filterInputRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredItems = useMemo(() => {
    const q = titleQuery.trim().toLowerCase();
    if (q.length === 0) return items;
    return items.filter((item) => item.game.title.toLowerCase().includes(q));
  }, [items, titleQuery]);

  // Loader counts cover the full library; the derived fallback only sees the
  // (filtered) page, so it is used only when the prop is absent.
  const derivedStatusCounts = useMemo(
    () => computeStatusCounts(items),
    [items]
  );
  const statusCounts = statusCountsProp ?? derivedStatusCounts;

  // Drop the `3 games` count chip from the header — canonical's `/library`
  // h1 reads just "Library". `total` remains in scope as an aria-live
  // status update consumed elsewhere if needed; current header omits it.
  void total;

  return (
    <main className="gap-xl container mx-auto flex flex-col px-4 py-6">
      <header className="gap-md flex items-baseline justify-between">
        <h1 className="heading-lg y2k-chrome-text">Library</h1>
        <Link
          to="/steam/games"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          aria-label="View imported Steam games"
        >
          <Download className="h-4 w-4" aria-hidden />
          Imported games
        </Link>
      </header>

      <div className="relative w-full">
        <Input
          ref={filterInputRef}
          type="search"
          value={titleQuery}
          onChange={(event) => setTitleQuery(event.target.value)}
          placeholder="Filter library…"
          aria-label="Filter library by title"
          className="pr-9"
        />
        <kbd
          aria-hidden="true"
          className="text-muted-foreground border-border bg-muted/50 pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs font-semibold"
        >
          /
        </kbd>
      </div>

      <MobileFilterBar
        status={status}
        platform={platform}
        acquisition={acquisition}
        startedOnly={startedOnly}
        minRating={minRating}
        unratedOnly={unratedOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
        platforms={platforms}
      />

      <div className="flex gap-6">
        <LibraryFilters
          status={status}
          platform={platform}
          acquisition={acquisition}
          startedOnly={startedOnly}
          minRating={minRating}
          unratedOnly={unratedOnly}
          sortBy={sortBy}
          sortOrder={sortOrder}
          counts={statusCounts}
          platforms={platforms}
        />

        <div className="min-w-0 flex-1">
          {filteredItems.length === 0 ? (
            items.length === 0 && !serverFiltersActive ? (
              // First-run: the library is genuinely empty. The onboarding hero
              // takes over when signals are present; otherwise the first-run
              // template offers the two ways to populate a library.
              onboarding ? (
                <EmptyLibraryHero {...onboarding} />
              ) : (
                <EmptyState
                  aria-label="Empty library"
                  icon={Library}
                  title="No games yet"
                  description="Start your library by adding a game, or import your shelf from Steam."
                  action={{ label: "Browse games", to: "/games/search" }}
                  secondaryAction={{
                    label: "Import from Steam",
                    to: "/steam/games",
                    variant: "outline",
                  }}
                />
              )
            ) : (
              // No-results: items exist but the active filters (server-side or
              // the title query) exclude everything. Always offer Clear filters.
              <EmptyState
                aria-label="No games match filters"
                icon={SearchX}
                title="Nothing matches these filters"
                description="No games in your library match the current filters."
                action={{ label: "Clear filters", onClick: clearFilters }}
              />
            )
          ) : (
            <ul
              aria-label="Library items"
              className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fill,minmax(160px,200px))] md:gap-[14px] lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))] lg:gap-4"
            >
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <LibraryItemCard
                    item={item}
                    menu={
                      <LibraryCardMenu
                        item={item}
                        onEdit={() => setSelectedEntry(item)}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* FAB replaces the header `Add game` button — matches canonical
          bottom-right floating affordance. */}
      <AddGameTrigger variant="fab" />

      {selectedEntry !== null ? (
        <LibraryModal
          entry={selectedEntry}
          open={true}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedEntry(null);
          }}
        />
      ) : null}
    </main>
  );
}
