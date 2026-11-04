import { Link, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { openGlobalAction } from "@/shared/lib/global-action";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";

import type { DashboardPlayingSectionProps } from "./dashboard-playing-section.type";

function PlayingRow({ item }: { item: LibraryItemWithGame }) {
  const navigate = useNavigate();
  const { game } = item;
  const coverUrl = buildCoverImageUrl(game.coverImage, "t_cover_small");
  const alt = `Cover for ${game.title}`;

  return (
    <li className="bg-card shadow-paper-md flex items-center gap-3 rounded-xl border p-3">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={alt}
          width={48}
          height={64}
          className="aspect-[3/4] w-12 shrink-0 rounded-[var(--radius-cover)] object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="bg-muted aspect-[3/4] w-12 shrink-0 rounded-[var(--radius-cover)]"
        />
      )}
      <div className="min-w-0 flex-1">
        <Link
          to="/games/$slug"
          params={{ slug: game.slug }}
          className="line-clamp-2 text-sm leading-tight font-medium hover:underline"
        >
          {game.title}
        </Link>
        {item.platform ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {item.platform}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
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
      <h2 id="home-playing-heading" className="heading-xs mb-2">
        Playing
      </h2>
      <ul className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
        {items.map((item) => (
          <PlayingRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
