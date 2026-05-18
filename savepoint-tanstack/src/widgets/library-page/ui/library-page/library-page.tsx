import { useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { AddGameTrigger } from "@/features/add-game";
import { LibraryFilters, MobileFilterBar } from "@/features/filter-library";
import { LibraryCardMenu, LibraryModal } from "@/features/manage-library-entry";
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { LibraryPageProps } from "./library-page.type";

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

  return (
    <main className="gap-xl container mx-auto flex flex-col px-4 py-6">
      <header className="gap-md flex items-baseline justify-between">
        <div className="gap-md flex items-baseline">
          <h1 className="heading-lg y2k-chrome-text">Library</h1>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {total} {total === 1 ? "game" : "games"}
          </p>
        </div>
        <AddGameTrigger />
      </header>

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
        />

        <div className="min-w-0 flex-1">
          {items.length === 0 ? (
            <section
              aria-label="Empty library"
              className="border-border bg-card p-xl shadow-paper-sm rounded-lg border border-dashed text-center"
            >
              <h2 className="text-h3 mb-sm">No games yet</h2>
              <p className="text-muted-foreground text-sm">
                Your library is empty. Import from Steam or add games manually
                to get started.
              </p>
            </section>
          ) : (
            <ul
              aria-label="Library items"
              className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,200px))] md:gap-[14px] lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))] lg:gap-4"
            >
              {items.map((item) => (
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
