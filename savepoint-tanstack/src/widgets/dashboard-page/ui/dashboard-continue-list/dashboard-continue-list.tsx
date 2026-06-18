import { Link } from "@tanstack/react-router";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Card } from "@/shared/ui/card";

import type { DashboardContinueListProps } from "./dashboard-continue-list.type";

function ContinueRow({ item }: { item: LibraryItemWithGame }) {
  const coverUrl = buildCoverImageUrl(item.game.coverImage, "t_cover_small");

  return (
    <Link
      to="/games/$slug"
      params={{ slug: item.game.slug }}
      className="group hover:bg-muted/50 flex items-center gap-3 rounded-md p-2.5 transition-colors"
    >
      <div className="w-10 shrink-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover for ${item.game.title}`}
            loading="lazy"
            className="aspect-[3/4] w-full rounded object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Cover for ${item.game.title}`}
            className="bg-muted aspect-[3/4] w-full rounded"
          />
        )}
      </div>
      <p className="body-sm min-w-0 flex-1 truncate font-medium group-hover:underline">
        {item.game.title}
      </p>
    </Link>
  );
}

export function DashboardContinueList({ items }: DashboardContinueListProps) {
  if (items.length === 0) return null;

  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="terminal-label mb-1">{"// CONTINUE"}</p>
      <div className="flex flex-col">
        {items.map((item) => (
          <ContinueRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}
