import type { LibraryItem } from "@prisma/client";

import { formatRelativeDate } from "@/shared/lib/date";

type LibraryEntryMetadataProps = {
  item: LibraryItem;
};

export const LibraryEntryMetadata = ({ item }: LibraryEntryMetadataProps) => {
  return (
    <div className="bg-muted/50 space-y-1.5 rounded-lg border p-3 text-xs">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Created:</span>
        <span className="font-medium">
          {formatRelativeDate(item.createdAt)}
        </span>
      </div>
      {item.createdAt.getTime() !== item.updatedAt.getTime() && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Last updated:</span>
          <span className="font-medium">
            {formatRelativeDate(item.updatedAt)}
          </span>
        </div>
      )}
      {item.platform && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Platform:</span>
          <span className="font-medium">{item.platform}</span>
        </div>
      )}
    </div>
  );
};
