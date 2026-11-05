import { Link } from "@tanstack/react-router";

import { InLibraryIndicator } from "@/entities/library-item";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { CommandItem } from "@/shared/ui/command";

import type { GameResultItemProps } from "./game-result-item.type";

export function GameResultItem({
  igdbId,
  coverImageId,
  name,
  slug,
  releaseYear,
  library,
  renderAddAction,
  onAfterSelect,
}: GameResultItemProps) {
  const coverUrl = buildCoverImageUrl(coverImageId, "t_cover_small");

  return (
    <CommandItem value={`game-${slug}`} className="flex gap-2 px-2 py-1.5">
      <Link
        to="/games/$slug"
        params={{ slug }}
        onClick={onAfterSelect}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-12 w-9 flex-shrink-0 rounded-sm object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-muted h-12 w-9 flex-shrink-0 rounded-sm"
          />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{name}</p>
          {releaseYear !== null && (
            <p className="text-muted-foreground text-xs">{releaseYear}</p>
          )}
        </div>
      </Link>

      <div className="shrink-0" onMouseDown={(event) => event.preventDefault()}>
        {library ? (
          <InLibraryIndicator
            status={library.status}
            upNextPosition={library.upNextPosition}
          />
        ) : (
          renderAddAction?.({ igdbId, name })
        )}
      </div>
    </CommandItem>
  );
}
