import { formatRelativeDate } from "@/shared/lib/date";

import type { LibraryEntryMetadataProps } from "./library-entry-metadata.types";

export const LibraryEntryMetadata = ({ item }: LibraryEntryMetadataProps) => {
  return (
    <div
      className="bg-muted/50 space-y-sm p-lg rounded-lg border text-xs"
      data-testid="library-entry-metadata-card"
    >
      <div className="gap-xl flex justify-between">
        <span className="text-muted-foreground">Created:</span>
        <span className="font-medium">
          {formatRelativeDate(item.createdAt)}
        </span>
      </div>
      {item.createdAt.getTime() !== item.updatedAt.getTime() && (
        <div className="gap-xl flex justify-between">
          <span className="text-muted-foreground">Last updated:</span>
          <span className="font-medium">
            {formatRelativeDate(item.updatedAt)}
          </span>
        </div>
      )}
      {item.platform && (
        <div className="gap-xl flex justify-between">
          <span className="text-muted-foreground">Platform:</span>
          <span className="font-medium">{item.platform}</span>
        </div>
      )}
    </div>
  );
};
