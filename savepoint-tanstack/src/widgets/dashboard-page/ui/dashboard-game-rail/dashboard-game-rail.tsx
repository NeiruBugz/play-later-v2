import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
// Widget-to-widget import: dashboard-page extends library-item-card's display
// shape (the rail IS a row of those cards). Documented in DIVERGENCES.md
// alongside the library-page → library-item-card carve-out.
import { LibraryItemCard } from "@/widgets/library-item-card";

import type { DashboardGameRailProps } from "./dashboard-game-rail.type";

/**
 * Horizontal scroll-snap carousel on mobile; multi-column cover grid on
 * desktop (md+). Satisfies AC DASH-2 (rails swipe) and AC DASH-4
 * (desktop spreads out).
 */
export function DashboardGameRail({
  title,
  items,
  totalCount,
  viewAll,
  viewAllLabel = "View All",
  emptyMessage = "No games to show",
}: DashboardGameRailProps) {
  const hasItems = items.length > 0;
  const showViewAll =
    hasItems && (totalCount === undefined || totalCount > items.length);

  return (
    <section className="bg-card text-card-foreground overflow-hidden rounded-xl border">
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
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
        /*
         * Mobile: horizontal scroll-snap carousel — items are fixed-width
         * covers that snap to the left edge. The outer wrapper clips overflow
         * and hides the scrollbar.
         * Desktop (md+): switch to a standard cover grid via CSS.
         *
         * No JS breakpoint branching — pure CSS so it works before hydration.
         */
        <div
          className={[
            // Mobile: horizontal carousel
            "flex gap-3 overflow-x-auto px-4 pt-1 pb-3",
            "snap-x snap-mandatory scroll-smooth",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Desktop: unwrap to a grid (auto-fill covers)
            "md:grid md:flex-none md:grid-cols-4 md:overflow-visible lg:grid-cols-6",
          ].join(" ")}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-28 shrink-0 snap-start md:w-auto md:shrink"
            >
              <LibraryItemCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-3">
          <EmptyState
            title={emptyMessage}
            spacing="compact"
            action={{
              label: "Browse Games",
              to: "/library",
              search: viewAll as Record<string, unknown>,
              variant: "outline",
              size: "sm",
            }}
          />
        </div>
      )}
    </section>
  );
}
