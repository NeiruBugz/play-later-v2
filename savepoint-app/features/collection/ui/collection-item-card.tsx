"use client";

import type { CollectionItem } from "@/data-access-layer/services/collection/types";
import { Calendar, Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { buildIgdbImageUrl } from "@/shared/lib/igdb/igdb-image-utils";
import {
  cn,
  LibraryStatusColorMapper,
  LibraryStatusMapper,
} from "@/shared/lib/ui";

interface CollectionItemCardProps {
  item: CollectionItem;
}

export function CollectionItemCard({ item }: CollectionItemCardProps) {
  const { game, libraryItems } = item;
  const primaryLibraryItem = libraryItems[0];
  const [isHovered, setIsHovered] = useState(false);

  const coverUrl = game.coverImage
    ? buildIgdbImageUrl(game.coverImage, "c-big")
    : null;

  const releaseDate = game.releaseDate
    ? new Date(game.releaseDate).getFullYear()
    : null;

  return (
    <Link
      href={`/library/games/${game.id}`}
      className="block transition-transform hover:scale-[1.02]"
    >
      <div className="group border-border bg-card flex flex-col overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
        <div
          className="bg-muted relative w-full overflow-hidden pt-[133%]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Cover art for ${game.title}`}
              fill
              className={cn(
                "object-cover transition-transform duration-300",
                isHovered ? "scale-105" : "scale-100"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 className="text-muted-foreground h-12 w-12" />
            </div>
          )}

          {primaryLibraryItem && (
            <div className="absolute top-2 right-2 left-2">
              <Badge
                variant="outline"
                className={cn(
                  "border font-medium",
                  LibraryStatusColorMapper[primaryLibraryItem.status]
                )}
                aria-label={`Status: ${LibraryStatusMapper[primaryLibraryItem.status]}`}
              >
                {LibraryStatusMapper[primaryLibraryItem.status]}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-3">
          <h3 className="text-foreground line-clamp-2 text-sm leading-tight font-semibold">
            {game.title}
          </h3>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{releaseDate}</span>
              </span>
            )}
          </div>

          {primaryLibraryItem?.platform && (
            <div className="text-muted-foreground truncate text-xs">
              {primaryLibraryItem.platform}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
