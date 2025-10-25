"use client";

import type { CollectionItem } from "@/data-access-layer/services/collection/types";

import { CollectionItemCard } from "./collection-item-card";

interface CollectionGridProps {
  items: CollectionItem[];
}

export function CollectionGrid({ items }: CollectionGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-[400px] items-center justify-center text-center">
        <div className="space-y-2">
          <p className="text-lg font-medium">No games found</p>
          <p className="text-sm">
            Try adjusting your filters or add games to your library
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="xs:grid-cols-2 grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <CollectionItemCard key={item.game.id} item={item} />
      ))}
    </div>
  );
}
