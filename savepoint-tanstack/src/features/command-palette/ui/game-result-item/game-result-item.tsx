import { Link } from "@tanstack/react-router";

import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { CommandItem } from "@/shared/ui/command";

import type { GameResultItemProps } from "./game-result-item.type";

/**
 * Games-group row. Renders cover + name + release year wrapped in a
 * statically-typed TanStack `<Link>` so back-button history works and the
 * test contract can assert on the resolved `href`.
 *
 * Divergence from canonical: no `showAddHint` / quick-add. Search results
 * always navigate to the detail page; quick-add ports once `add-to-library`
 * server fn lands. See DIVERGENCES.md → Slice 17.
 */
export function GameResultItem({
  coverImageId,
  name,
  slug,
  releaseYear,
  onAfterSelect,
}: GameResultItemProps) {
  const coverUrl = buildCoverImageUrl(coverImageId, "t_cover_small");

  return (
    <CommandItem value={`game-${slug}`} className="p-0">
      <Link
        to="/games/$slug"
        params={{ slug }}
        onClick={onAfterSelect}
        className="gap-md py-sm px-md flex w-full items-center"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-12 w-9 flex-shrink-0 rounded object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-muted h-12 w-9 flex-shrink-0 rounded"
          />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{name}</p>
          {releaseYear !== null && (
            <p className="text-muted-foreground text-xs">{releaseYear}</p>
          )}
        </div>
      </Link>
    </CommandItem>
  );
}
