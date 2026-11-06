import { Link, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { openGlobalAction } from "@/shared/lib/global-action";
import { Button } from "@/shared/ui/button";
import { GameCover } from "@/shared/ui/game-cover";
import { SectionLabel } from "@/shared/ui/section-label";

import type { DashboardPlayingSectionProps } from "./dashboard-playing-section.type";

function PlayingRow({ item }: { item: LibraryItemWithGame }) {
  const navigate = useNavigate();
  const { game } = item;

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-md">
      <GameCover src={game.coverImage} name={game.title} size="xs" />
      <div className="min-w-0 flex-1">
        <Link
          to="/games/$slug"
          params={{ slug: game.slug }}
          className="-my-3.5 line-clamp-2 py-3.5 text-sm leading-tight font-medium hover:underline md:my-0 md:py-0"
        >
          {game.title}
        </Link>
        {item.platform ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.platform}
          </span>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openGlobalAction(navigate, "log-session", game.slug)}
      >
        <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Log
      </Button>
    </li>
  );
}

export function DashboardPlayingSection({
  items,
}: DashboardPlayingSectionProps) {
  return (
    <section aria-labelledby="home-playing-heading">
      <SectionLabel id="home-playing-heading" className="mb-2">
        Playing
      </SectionLabel>
      <ul className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
        {items.map((item) => (
          <PlayingRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
