import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
// Widget-to-widget import: dashboard-page extends library-item-card's display
// shape (the section IS a grid of those cards). Documented in DIVERGENCES.md
// alongside the library-page → library-item-card carve-out.
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { DashboardGameSectionProps } from "./dashboard-game-section.type";

const HERO_GRID = "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4";
const DEFAULT_GRID =
  "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7";

export function DashboardGameSection({
  title,
  items,
  viewAll,
  viewAllLabel = "View All",
  emptyMessage = "No games to show",
  totalCount,
  variant = "default",
}: DashboardGameSectionProps) {
  const hasItems = items.length > 0;
  const showViewAll =
    hasItems && (totalCount === undefined || totalCount > items.length);
  const gridClass = variant === "hero" ? HERO_GRID : DEFAULT_GRID;

  return (
    <section className="bg-card text-card-foreground gap-lg p-lg flex flex-col overflow-hidden rounded-lg border">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight uppercase">
          {title}
        </h2>
        {showViewAll ? (
          <Button variant="ghost" size="sm" asChild className="h-auto p-0">
            <Link
              to="/library"
              search={viewAll}
              className="text-muted-foreground hover:text-foreground group text-xs"
            >
              {viewAllLabel}
              <ChevronRight
                className="ml-1 inline-block h-3 w-3 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
        ) : null}
      </header>

      {hasItems ? (
        <div className={cn(gridClass)}>
          {items.map((item) => (
            <LibraryItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} viewAll={viewAll} />
      )}
    </section>
  );
}

function EmptyState({
  message,
  viewAll,
}: {
  message: string;
  viewAll: DashboardGameSectionProps["viewAll"];
}) {
  return (
    <div className="border-border bg-muted/30 rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground mb-4 text-sm">{message}</p>
      <Button variant="outline" size="sm" asChild>
        <Link to="/library" search={viewAll}>
          Browse Games
        </Link>
      </Button>
    </div>
  );
}
