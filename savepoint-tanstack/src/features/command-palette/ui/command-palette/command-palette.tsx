import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useRef } from "react";

import { useIsDesktop } from "@/shared/lib/use-media-query";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/shared/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/shared/ui/sheet";

import { useCommandPalette } from "../../hooks/use-command-palette";
import { useDebouncedGameSearch } from "../../hooks/use-debounced-game-search";
import { GameResultItem } from "../game-result-item";
import { PaletteNavigationGroup } from "../palette-navigation-group";
import { PaletteQuickActionsGroup } from "../palette-quick-actions-group";
import type { CommandPaletteProps } from "./command-palette.type";

// Divergence vs. canonical: no recent-games empty state (see
// DIVERGENCES.md → Slice 17).
export function CommandPalette({
  open: openProp,
  onOpenChange,
}: CommandPaletteProps = {}) {
  const isControlled = openProp !== undefined;
  const internal = useCommandPalette();
  const isOpen = isControlled ? openProp : internal.isOpen;
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useIsDesktop();

  const { query, setQuery, results, isLoading, error, shouldSearch } =
    useDebouncedGameSearch({ isOpen });

  const handleOpenChange = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      internal.setOpen(next);
      if (!next) setQuery("");
    }
  };

  const closeAndReset = () => {
    handleOpenChange(false);
  };

  const showNoResults =
    shouldSearch && !isLoading && !error && results.length === 0;
  const showEmptyHint = !shouldSearch;

  const body = (
    <Command shouldFilter={false} label="Search games">
      <CommandInput
        ref={inputRef}
        // The Slice-17 test contract asserts
        // `getByRole("combobox", { name: /search/i })`. cmdk's Input
        // always emits `aria-labelledby` pointing at the Command's
        // hidden <label>, so the accessible name comes from the
        // `label` prop on the Command root above.
        placeholder="Search games, jump to a page, or run a quick action..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {isLoading && shouldSearch && (
          <div className="flex items-center justify-center py-8">
            <Loader2
              aria-hidden="true"
              className="text-muted-foreground h-6 w-6 animate-spin"
            />
          </div>
        )}

        {error && shouldSearch && !isLoading && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Failed to search games. Please try again.
          </div>
        )}

        {shouldSearch && !isLoading && results.length > 0 && (
          <CommandGroup heading="Games">
            {results.map((game) => (
              <GameResultItem
                key={game.id}
                igdbId={game.id}
                coverImageId={game.cover?.image_id ?? null}
                name={game.name}
                slug={game.slug}
                releaseYear={
                  game.first_release_date
                    ? new Date(game.first_release_date * 1000).getFullYear()
                    : null
                }
                onAfterSelect={closeAndReset}
              />
            ))}
          </CommandGroup>
        )}

        <PaletteNavigationGroup query={query} onAfterSelect={closeAndReset} />

        <PaletteQuickActionsGroup
          query={query}
          onFocusSearch={() => inputRef.current?.focus()}
          onNewJournalEntry={() => {
            // Canonical routes to `/journal/new`, which tanstack
            // doesn't have — see DIVERGENCES.md → Slice 17.
            navigate({ to: "/journal" });
            closeAndReset();
          }}
        />

        {showNoResults && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No games found for &ldquo;{query}&rdquo;
          </div>
        )}

        {showEmptyHint && !isLoading && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Start typing to search for games...
          </div>
        )}
      </CommandList>
    </Command>
  );

  if (!isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="gap-0 p-0"
          data-testid="command-palette-mobile-sheet"
        >
          <SheetTitle className="sr-only">Command palette</SheetTitle>
          <SheetDescription className="sr-only">
            Search games, jump to a page, or run a quick action.
          </SheetDescription>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search games, jump to a page, or run a quick action.
        </DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}
