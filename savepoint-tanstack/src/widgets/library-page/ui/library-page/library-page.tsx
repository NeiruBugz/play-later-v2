import { useEffect, useMemo, useRef, useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { AddGameTrigger } from "@/features/add-game";
import {
  LibraryFilters,
  MobileFilterBar,
  type LibraryStatusCounts,
} from "@/features/filter-library";
import { LibraryCardMenu, LibraryModal } from "@/features/manage-library-entry";
import { Input } from "@/shared/ui/input";
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { LibraryPageProps } from "./library-page.type";

/**
 * Compute per-status counts from the loaded items (the search-param
 * contract does not yet supply a `getStatusCounts` server fn — see
 * audit `context/audits/2026-05-18/visual-parity.md` § Library). The
 * counts shape mirrors `LibraryStatusCounts` so it can be passed
 * straight through to `LibraryFilters`.
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
    minRating,
    unratedOnly,
    sortBy,
    sortOrder,
  } = props;

  // Host owns modal state (canonical pattern). One modal mounted at the
  // page level; each card receives an onClick that selects its entry.
  // Avoids N modals in the DOM and keeps the entity card display-only.
  const [selectedEntry, setSelectedEntry] =
    useState<LibraryItemWithGame | null>(null);

  // Client-side title filter — keystroke-driven, no server roundtrip.
  // The `/` keyboard hint focuses the input when pressed outside any
  // other input.
  const [titleQuery, setTitleQuery] = useState("");
  const filterInputRef = useRef<HTMLInputElement | null>(null);

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

  const statusCounts = useMemo(() => computeStatusCounts(items), [items]);

  // Drop the `3 games` count chip from the header — canonical's `/library`
  // h1 reads just "Library". `total` remains in scope as an aria-live
  // status update consumed elsewhere if needed; current header omits it.
  void total;

  return (
    <main className="gap-xl container mx-auto flex flex-col px-4 py-6">
      <header className="gap-md flex items-baseline justify-between">
        <h1 className="heading-lg y2k-chrome-text">Library</h1>
      </header>

      {/* Filter-by-title input with `/` keyboard hint. Client-side only. */}
      <div className="relative w-full md:max-w-xl">
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
        minRating={minRating}
        unratedOnly={unratedOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Mirrors canonical's left-rail layout: filter sidebar (xl+ only) */}
      {/* renders to the left of the grid; below xl the sidebar is hidden */}
      {/* and the mobile filter bar above is the only filter affordance.   */}
      <div className="flex gap-6">
        <LibraryFilters
          status={status}
          platform={platform}
          minRating={minRating}
          unratedOnly={unratedOnly}
          sortBy={sortBy}
          sortOrder={sortOrder}
          counts={statusCounts}
        />

        <div className="min-w-0 flex-1">
          {filteredItems.length === 0 ? (
            <section
              aria-label="Empty library"
              className="border-border bg-card p-xl shadow-paper-sm rounded-lg border border-dashed text-center"
            >
              <h2 className="text-h3 mb-sm">No games yet</h2>
              <p className="text-muted-foreground text-sm">
                {items.length === 0
                  ? "Your library is empty. Import from Steam or add games manually to get started."
                  : "No games match this filter."}
              </p>
            </section>
          ) : (
            <ul
              aria-label="Library items"
              className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,200px))] md:gap-[14px] lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))] lg:gap-4"
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
