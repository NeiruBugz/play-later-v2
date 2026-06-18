import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { isTouched, LibraryStatusBadge } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { EmptyState } from "@/shared/ui/empty-state";

import type { DashboardGameRailProps } from "./dashboard-game-rail.type";

/**
 * A single fixed-width vertical cover tile: art on top, status badge overlaid,
 * one-line title + platform beneath. This is the shape a horizontal shelf
 * wants — NOT the rich horizontal `LibraryItemCard` (which collapses when
 * forced into a narrow rail slot).
 */
function RailCoverTile({ item }: { item: LibraryItemWithGame }) {
  const coverUrl = buildCoverImageUrl(item.game.coverImage, "t_720p");
  const alt = `Cover for ${item.game.title}`;

  return (
    <Link
      to="/games/$slug"
      params={{ slug: item.game.slug }}
      className="group w-32 shrink-0 snap-start md:w-auto"
    >
      <div className="relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={alt}
            loading="lazy"
            className="shadow-paper-md aspect-[3/4] w-full rounded-[var(--radius-cover)] object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={alt}
            className="bg-muted shadow-paper-md aspect-[3/4] w-full rounded-[var(--radius-cover)]"
          />
        )}
        <div className="absolute top-1.5 left-1.5">
          <LibraryStatusBadge
            status={item.status}
            hasBeenPlayed={isTouched(item)}
            className="uppercase"
          />
        </div>
      </div>
      <p className="mt-2 truncate text-sm leading-tight font-medium group-hover:underline">
        {item.game.title}
      </p>
      {item.platform ? (
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {item.platform}
        </p>
      ) : null}
    </Link>
  );
}

/**
 * Labeled shelf of cover tiles: a horizontal scroll-snap carousel on mobile
 * (each tile a fixed-width cover that snaps to the left edge), unwrapping to a
 * cover grid on desktop (md+). Satisfies AC DASH-2 (rails swipe) and AC
 * DASH-4 (desktop spreads out). Pure CSS — no JS breakpoint branching.
 */
export function DashboardGameRail({
  title,
  items,
  viewAll,
  viewAllLabel = "View all",
  emptyMessage = "No games to show",
}: DashboardGameRailProps) {
  const hasItems = items.length > 0;
  // Every rail head gets a "see all" link when there are items — the link
  // is always useful regardless of whether more items exist beyond the slice.
  const showViewAll = hasItems;

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="heading-xs">{title}</h3>
        {showViewAll ? (
          <Link
            to="/library"
            search={viewAll}
            className="text-muted-foreground hover:text-foreground group inline-flex items-center text-xs font-medium"
          >
            {viewAllLabel}
            <ChevronRight
              className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </header>

      {hasItems ? (
        <div
          className={[
            // Mobile: horizontal scroll-snap carousel; bleed a touch so a
            // partial next cover hints "there's more".
            "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1",
            "snap-x snap-mandatory scroll-smooth",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Desktop: unwrap into a cover grid.
            "md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-6",
          ].join(" ")}
        >
          {items.map((item) => (
            <RailCoverTile key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={emptyMessage}
          spacing="compact"
          action={{
            label: "Browse games",
            to: "/library",
            search: viewAll as Record<string, unknown>,
            variant: "outline",
            size: "sm",
          }}
        />
      )}
    </section>
  );
}
