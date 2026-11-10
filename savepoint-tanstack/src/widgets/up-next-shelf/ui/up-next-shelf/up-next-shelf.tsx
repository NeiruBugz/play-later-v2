import { Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";

import { QueueMarker, toStatusChipStatus } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { openCommandPalette } from "@/features/command-palette";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GameCover } from "@/shared/ui/game-cover";
import { SectionLabel } from "@/shared/ui/section-label";
import { StatusChip } from "@/shared/ui/status-chip";

import type { UpNextShelfProps } from "./up-next-shelf.type";

const EMPTY_MESSAGE = "Nothing queued yet — put up to 5 games in Up Next.";

const FIRST_ITEM_WIDTH = "w-[min(60vw,15rem)] md:w-64";
const REST_ITEM_WIDTH = "w-36 md:w-40";
const EMPTY_HEIGHT = "h-[calc(min(60vw,15rem)*1.5)] md:h-96";

function ShelfItem({
  item,
  isNext,
}: {
  item: LibraryItemWithGame;
  isNext: boolean;
}) {
  return (
    <li
      data-next={isNext ? "true" : undefined}
      className={cn(
        "shrink-0 snap-start",
        isNext ? FIRST_ITEM_WIDTH : REST_ITEM_WIDTH
      )}
    >
      <Link
        to="/games/$slug"
        params={{ slug: item.game.slug }}
        aria-current={isNext ? "true" : undefined}
        className="group block rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <GameCover
          src={item.game.coverImage}
          name={item.game.title}
          priority={isNext}
        >
          <div className="absolute top-1.5 left-1.5">
            <StatusChip
              status={toStatusChipStatus(item.status, item.doneOutcome)}
            />
          </div>
        </GameCover>
        {isNext ? (
          <span className="mt-2 block text-sm font-medium text-foreground">
            Play next
          </span>
        ) : null}
        <p
          className={cn(
            "truncate leading-tight font-medium group-hover:underline",
            isNext ? "mt-1 font-display text-lg" : "mt-2 text-base md:text-sm"
          )}
        >
          {item.game.title}
        </p>
        <QueueMarker
          status={item.status}
          upNextPosition={item.upNextPosition}
          className="mt-1"
        />
        {item.platform ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.platform}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function UpNextShelf({ items }: UpNextShelfProps) {
  const hasItems = items.length > 0;

  return (
    <section aria-labelledby="home-up-next-heading" className="min-w-0">
      <header className="mb-2 flex items-baseline justify-between">
        <SectionLabel id="home-up-next-heading">Up Next</SectionLabel>
        {hasItems ? (
          <Link
            to="/library"
            search={{ status: "UP_NEXT" }}
            className="group -my-3 inline-flex min-h-11 items-center text-xs font-medium text-muted-foreground hover:text-foreground md:my-0 md:min-h-0"
          >
            See all
            <ChevronRight
              className="ml-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : null}
      </header>

      {hasItems ? (
        <ul
          data-scroller
          aria-label="Up Next, in play order"
          className="-mx-4 flex min-w-0 snap-x snap-mandatory [scroll-padding-inline:1rem] items-start gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-1 [scrollbar-width:none] md:mx-0 md:[scroll-padding-inline:0] md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <ShelfItem key={item.id} item={item} isNext={index === 0} />
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border px-4 text-center",
            EMPTY_HEIGHT
          )}
        >
          <p className="text-base text-muted-foreground md:text-sm">
            {EMPTY_MESSAGE}
          </p>
          <Button variant="outline" onClick={openCommandPalette}>
            <Search aria-hidden="true" />
            Find a game to add
          </Button>
        </div>
      )}
    </section>
  );
}
