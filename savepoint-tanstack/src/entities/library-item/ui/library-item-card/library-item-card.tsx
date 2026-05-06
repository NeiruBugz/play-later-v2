import { getStatusLabel } from "../../model";
import type { LibraryItemCardProps } from "./library-item-card.type";
import { buildCoverImageUrl } from "./library-item-card.utility";

export function LibraryItemCard({ item }: LibraryItemCardProps) {
  const coverUrl = buildCoverImageUrl(item.game.coverImage, "t_cover_big");
  const statusLabel = getStatusLabel(item.status);

  return (
    <article
      aria-label={item.game.title}
      className="gap-sm border-border bg-card p-md shadow-paper-sm flex flex-col rounded-lg border"
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={item.game.title}
          loading="lazy"
          className="aspect-[3/4] w-full rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="bg-muted aspect-[3/4] w-full rounded-md"
        />
      )}
      <div className="gap-2xs flex flex-col">
        <h3 className="line-clamp-2 text-sm leading-tight font-medium">
          {item.game.title}
        </h3>
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          {statusLabel}
        </span>
      </div>
    </article>
  );
}
