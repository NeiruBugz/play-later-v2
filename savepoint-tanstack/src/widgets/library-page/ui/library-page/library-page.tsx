import { Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Library,
  ListOrdered,
  PackagePlus,
  SearchX,
} from "lucide-react";
import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  LibraryStatusBadge,
  NextStepButton,
  NotOwnedTag,
  QueueMarker,
  StatusControl,
} from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import {
  LibraryFilters,
  MobileFilterBar,
  StatusLens,
  ViewModeToggle,
  type LibraryStatusCounts,
  type ViewMode,
} from "@/features/filter-library";
import {
  LibraryCardMenu,
  LibraryModal,
  useSetOwnership,
  useSetStatus,
} from "@/features/manage-library-entry";
import { EmptyLibraryHero } from "@/features/onboarding-first-time";
import { UpNextQueueList } from "@/features/up-next";
import { useUpNextMembership } from "@/features/up-next/model/use-up-next-membership";
import { UpNextMenuActions } from "@/features/up-next/ui/up-next-menu-actions";
import { openGlobalAction } from "@/shared/lib/global-action";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { GameCover } from "@/shared/ui/game-cover";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { RatingInput } from "@/shared/ui/rating-input";
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { LibraryPageProps } from "./library-page.type";

/**
 * Grid-view tile: a vertical cover (status badge + per-card menu overlaid),
 * one-line title, platform, rating, then the status control and next-step
 * button. The rich `LibraryItemCard` row is reserved for the list view.
 */
const LibraryGridTile = memo(function LibraryGridTile({
  item,
  onEdit,
}: {
  item: LibraryItemWithGame;
  onEdit: (item: LibraryItemWithGame) => void;
}) {
  const { status, setStatus, isPending } = useSetStatus({
    id: item.id,
    gameTitle: item.game.title,
    status: item.status,
    upNextPosition: item.upNextPosition,
    rating: item.rating,
  });
  const ownership = useSetOwnership({
    id: item.id,
    gameTitle: item.game.title,
    isOwned: item.isOwned,
  });
  const membership = useUpNextMembership({
    id: item.id,
    gameTitle: item.game.title,
    upNextPosition: item.upNextPosition,
  });

  return (
    <div className="relative" data-testid="library-grid-tile">
      <Link
        to="/games/$slug"
        params={{ slug: item.game.slug }}
        aria-label={`View ${item.game.title}`}
        className="group block"
      >
        <GameCover src={item.game.coverImage} name={item.game.title}>
          <div className="absolute top-2 left-2">
            <LibraryStatusBadge status={status} />
          </div>
        </GameCover>
        <h3 className="mt-2 line-clamp-2 text-base leading-tight font-medium group-hover:underline md:line-clamp-1 md:text-sm">
          {item.game.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
          <QueueMarker
            status={status}
            upNextPosition={membership.upNextPosition}
          />
          <NotOwnedTag status={status} isOwned={ownership.isOwned} />
        </div>
        {item.platform ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.platform}
          </span>
        ) : null}
      </Link>
      <div
        className="mt-1 flex h-4 items-center"
        onClickCapture={(event) => event.stopPropagation()}
      >
        {item.rating === null ? null : (
          <RatingInput value={item.rating} size="sm" readOnly />
        )}
      </div>
      <div className="mt-2 flex flex-col items-start gap-2">
        <StatusControl
          status={status}
          onChange={(to) => void setStatus(to)}
          disabled={isPending}
          className="text-xs"
        />
        <NextStepButton
          status={status}
          onStep={(to) => void setStatus(to)}
          disabled={isPending}
          className="w-full text-xs font-semibold"
        />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <LibraryCardMenu
          item={item}
          onEdit={() => onEdit(item)}
          ownership={ownership}
          extraItems={
            <UpNextMenuActions status={status} membership={membership} />
          }
        />
      </div>
    </div>
  );
});

const LibraryListRow = memo(function LibraryListRow({
  item,
  onEdit,
}: {
  item: LibraryItemWithGame;
  onEdit: (item: LibraryItemWithGame) => void;
}) {
  return (
    <LibraryItemCard
      item={item}
      layout="row"
      menu={(upNext, ownership) => (
        <LibraryCardMenu
          item={item}
          onEdit={() => onEdit(item)}
          ownership={ownership}
          extraItems={upNext}
        />
      )}
    />
  );
});

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
    WANT: 0,
    PLAYING: 0,
    DONE: 0,
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
    minRating,
    unratedOnly,
    notOwnedOnly,
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
  const addGame = () => openGlobalAction(navigate, "add-game");

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
    minRating !== undefined ||
    unratedOnly === true ||
    notOwnedOnly === true
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

  const deferredTitleQuery = useDeferredValue(titleQuery);
  const filteredItems = useMemo(() => {
    const q = deferredTitleQuery.trim().toLowerCase();
    if (q.length === 0) return items;
    return items.filter((item) => item.game.title.toLowerCase().includes(q));
  }, [items, deferredTitleQuery]);

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

  // Local view-mode toggle: "grid" (default, 2-up cover tiles) or "list"
  // (rich rows). State lives here so the toggle is instant with no URL round-trip.
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Flat discriminant for the grid region, replacing a triple-nested ternary.
  // "onboarding"/"empty" are the first-run branch (library genuinely empty,
  // no active server filters); "no-results" is the filtered-out branch (items
  // exist but the active filters or title query exclude everything).
  const isFirstRunEmpty = items.length === 0 && !serverFiltersActive;
  const isUpNextView = status === "UP_NEXT";
  const renderState:
    | "up-next"
    | "up-next-empty"
    | "list"
    | "onboarding"
    | "empty"
    | "no-results" = isUpNextView
    ? items.length > 0
      ? "up-next"
      : "up-next-empty"
    : filteredItems.length > 0
      ? "list"
      : isFirstRunEmpty
        ? onboarding
          ? "onboarding"
          : "empty"
        : "no-results";

  return (
    <div className="container mx-auto flex flex-col gap-4 px-4 py-6">
      <PageHeader
        title="Library"
        actions={
          <>
            <Link
              to="/steam/games"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline md:min-h-0"
              aria-label="Import from Steam"
            >
              <Download className="h-4 w-4" aria-hidden />
              Import from Steam
            </Link>
            <Button onClick={addGame}>
              <PackagePlus aria-hidden="true" />
              Add game
            </Button>
          </>
        }
      />

      <div className="relative w-full">
        <Input
          ref={filterInputRef}
          type="search"
          value={titleQuery}
          onChange={(event) => setTitleQuery(event.target.value)}
          placeholder="Filter library…"
          aria-label="Filter library by title"
          className="pr-8"
        />
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-sm border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-semibold text-muted-foreground"
        >
          /
        </kbd>
      </div>

      {/* Sticky status lens (LIB-2/LIB-3) — always visible above the grid so
          one tap re-filters without opening any overlay. Secondary filters
          (platform, sort, rating) remain in the MobileFilterBar sheet / sidebar. */}
      <StatusLens
        status={status}
        counts={statusCounts}
        platform={platform}
        minRating={minRating}
        unratedOnly={unratedOnly}
        notOwnedOnly={notOwnedOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1 md:hidden">
          <MobileFilterBar
            status={status}
            platform={platform}
            minRating={minRating}
            unratedOnly={unratedOnly}
            notOwnedOnly={notOwnedOnly}
            sortBy={sortBy}
            sortOrder={sortOrder}
            platforms={platforms}
          />
        </div>
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="md:ml-auto"
        />
      </div>

      <div className="flex gap-6">
        <LibraryFilters
          status={status}
          platform={platform}
          minRating={minRating}
          unratedOnly={unratedOnly}
          notOwnedOnly={notOwnedOnly}
          sortBy={sortBy}
          sortOrder={sortOrder}
          platforms={platforms}
        />

        <div className="min-w-0 flex-1">
          {renderState === "up-next" ? (
            <UpNextQueueList
              items={items}
              renderItem={(item) => (
                <LibraryItemCard
                  item={item}
                  layout="row"
                  menu={(upNext, ownership) => (
                    <LibraryCardMenu
                      item={item}
                      onEdit={() => setSelectedEntry(item)}
                      ownership={ownership}
                      extraItems={upNext}
                    />
                  )}
                />
              )}
            />
          ) : renderState === "up-next-empty" ? (
            <EmptyState
              aria-label="Empty Up Next"
              icon={ListOrdered}
              title="Nothing queued yet — put up to 5 games in Up Next."
            />
          ) : renderState === "onboarding" && onboarding ? (
            <EmptyLibraryHero {...onboarding} onAddGame={addGame} />
          ) : renderState === "empty" ? (
            <EmptyState
              aria-label="Empty library"
              icon={Library}
              title="No games yet"
              description="Start your library by adding a game, or import your games from Steam."
              action={{
                label: "Add a game",
                onClick: addGame,
                variant: "outline",
              }}
              secondaryAction={{
                label: "Import from Steam",
                to: "/steam/games",
                variant: "outline",
              }}
            />
          ) : renderState === "no-results" ? (
            <EmptyState
              aria-label="No games match filters"
              icon={SearchX}
              title="Nothing matches these filters"
              description="No games in your library match the current filters."
              action={{
                label: "Clear filters",
                onClick: clearFilters,
                variant: "outline",
              }}
            />
          ) : (
            <ul
              aria-label="Library items"
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5"
                  : "flex flex-col gap-2"
              }
            >
              {filteredItems.map((item) => (
                <li key={item.id}>
                  {viewMode === "grid" ? (
                    <LibraryGridTile item={item} onEdit={setSelectedEntry} />
                  ) : (
                    <LibraryListRow item={item} onEdit={setSelectedEntry} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedEntry !== null ? (
        <LibraryModal
          entry={selectedEntry}
          open={true}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedEntry(null);
          }}
        />
      ) : null}
    </div>
  );
}
