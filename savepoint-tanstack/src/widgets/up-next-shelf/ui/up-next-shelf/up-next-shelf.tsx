import { Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";

import { QueueMarker } from "@/entities/library-item";
import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { useEveningMinutes } from "@/entities/session/model";
import { openCommandPalette } from "@/features/command-palette";
import { formatEvenings } from "@/shared/lib/evenings";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GameCover } from "@/shared/ui/game-cover";
import { SectionLabel } from "@/shared/ui/section-label";

import type { UpNextShelfProps } from "./up-next-shelf.type";

const EMPTY_MESSAGE = "Nothing queued yet — put up to 5 games in Up Next.";

const FIRST_ITEM_WIDTH = "w-[min(68vw,17rem)] md:w-72";
const REST_ITEM_WIDTH = "w-36 md:w-40";
const EMPTY_HEIGHT = "h-[calc(min(68vw,17rem)*1.5)] md:h-108";

function ShelfItem({
  item,
  isNext,
}: {
  item: LibraryItemWithGame;
  isNext: boolean;
}) {
  const eveningMinutes = useEveningMinutes();
  const caption =
    (isNext
      ? formatEvenings(item.game.timeToCreditsSeconds, eveningMinutes)
      : null) ?? item.game.title;

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
        />
        <p
          className={cn(
            "truncate leading-tight font-medium group-hover:underline",
            isNext ? "mt-1 font-display text-lg" : "mt-2 text-base md:text-sm"
          )}
        >
          {caption}
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
