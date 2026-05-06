import { LibraryItemCard } from "@/entities/library-item";
import { LibraryFilters } from "@/features/filter-library";

import type { LibraryPageProps } from "./library-page.type";

export function LibraryPage(props: LibraryPageProps) {
  const { items, total, status, platform, minRating, sortBy, sortOrder } =
    props;

  return (
    <main className="gap-xl container mx-auto flex flex-col px-4 py-6">
      <header className="gap-md flex items-baseline justify-between">
        <h1 className="text-h1">Library</h1>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {total} {total === 1 ? "game" : "games"}
        </p>
      </header>

      <LibraryFilters
        status={status}
        platform={platform}
        minRating={minRating}
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
          className="gap-md grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {items.map((item) => (
            <li key={item.id}>
              <LibraryItemCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
