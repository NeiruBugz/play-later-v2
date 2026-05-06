import type { KeyboardEvent } from "react";

import { cn } from "@/shared/lib/utils";

import { getStatusLabel } from "../../model";
import type { LibraryItemCardProps } from "./library-item-card.type";
import { buildCoverImageUrl } from "./library-item-card.utility";
import { Link } from "@tanstack/react-router";

export function LibraryItemCard({ item, onClick }: LibraryItemCardProps) {
  const coverUrl = buildCoverImageUrl(item.game.coverImage, "t_cover_big");
  const statusLabel = getStatusLabel(item.status);

  const detailsLink = `/games/${item.game.slug}`;

  const isInteractive = typeof onClick === "function";

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      aria-label={item.game.title}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn(
        "gap-sm border-border bg-card p-md shadow-paper-sm flex flex-col rounded-lg border",
        isInteractive &&
          "focus-visible:ring-ring cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
      )}
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
      <div>
        <Link to="/games/$slug" params={{ slug: item.game.slug }}>
          See details
        </Link>
      </div>
    </article>
  );
}
