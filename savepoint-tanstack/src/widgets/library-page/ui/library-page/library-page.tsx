import { useState } from "react";

import { LibraryItemCard } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { AddGameTrigger } from "@/features/add-game";
import { LibraryFilters, MobileFilterBar } from "@/features/filter-library";
import { LibraryModal } from "@/features/manage-library-entry";

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

      <LibraryFilters
        status={status}
        platform={platform}
        minRating={minRating}
        unratedOnly={unratedOnly}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {items.length === 0 ? (
        <section
          aria-label="Empty library"
          className="border-border bg-card p-xl shadow-paper-sm rounded-lg border border-dashed text-center"
        >
          <h2 className="text-h3 mb-sm">No games yet</h2>
          <p className="text-muted-foreground text-sm">
            Your library is empty. Import from Steam or add games manually to
            get started.
          </p>
        </section>
      ) : (
        <ul
          aria-label="Library items"
          className="gap-md grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
        >
          {items.map((item) => (
            <li key={item.id}>
              <LibraryItemCard
                item={item}
                onClick={() => setSelectedEntry(item)}
              />
            </li>
          ))}
        </ul>
      )}

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
