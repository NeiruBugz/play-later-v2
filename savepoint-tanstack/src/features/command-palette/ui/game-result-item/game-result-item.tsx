import { Link, useRouter } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";

import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";
import { CommandItem } from "@/shared/ui/command";
import { showUndoToast } from "@/shared/ui/undo-toast";

import { quickAddToLibraryFn } from "../../api/quick-add-to-library-fn";
import { removeLibraryItemFn } from "../../api/remove-library-item-fn";
import type { GameResultItemProps } from "./game-result-item.type";

/**
 * Games-group row. Renders cover + name + release year wrapped in a
 * statically-typed TanStack `<Link>` so back-button history works and the
 * test contract can assert on the resolved `href`.
 *
 * Also renders an "Add to Up Next" quick action (canonical's `showAddHint` +
 * `useQuickAddFromPalette`). Clicking it adds the game to the library at
 * `UP_NEXT` and surfaces an undo toast, instead of navigating.
 */
export function GameResultItem({
  igdbId,
  coverImageId,
  name,
  slug,
  releaseYear,
  onAfterSelect,
}: GameResultItemProps) {
  const coverUrl = buildCoverImageUrl(coverImageId, "t_cover_small");
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleQuickAdd = async (event: MouseEvent<HTMLButtonElement>) => {
    // Keep the row's <Link> from navigating when the quick-add is clicked.
    event.preventDefault();
    event.stopPropagation();

    setIsAdding(true);
    try {
      const { id } = await quickAddToLibraryFn({ data: { igdbId } });
      showUndoToast({
        message: `Added "${name}" to Up Next`,
        onUndo: () => {
          void (async () => {
            try {
              await removeLibraryItemFn({ data: { itemId: id } });
              toast.success("Removed", { duration: 1000 });
              await router.invalidate();
            } catch (cause) {
              const message =
                cause instanceof Error ? cause.message : "Failed to undo";
              toast.error(message);
            }
          })();
        },
      });
      await router.invalidate();
      onAfterSelect();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to add game";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <CommandItem value={`game-${slug}`} className="gap-md py-sm px-md flex">
      <Link
        to="/games/$slug"
        params={{ slug }}
        onClick={onAfterSelect}
        className="gap-md flex min-w-0 flex-1 items-center"
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

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-muted-foreground gap-xs h-7 shrink-0 px-2 text-xs"
        disabled={isAdding}
        onClick={handleQuickAdd}
        onMouseDown={(event) => event.preventDefault()}
        aria-label={`Add ${name} to Up Next`}
      >
        {isAdding ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-3 w-3" aria-hidden="true" />
        )}
        Add to Up Next
      </Button>
    </CommandItem>
  );
}
