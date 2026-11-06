import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { MIN_GAME_SEARCH_QUERY_LENGTH } from "@/shared/lib/game-search";
import { openGlobalAction } from "@/shared/lib/global-action";
import { keepOpenOnToastPress } from "@/shared/lib/keep-open-on-toast-press";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
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

export function CommandPalette({
  open: openProp,
  onOpenChange,
  renderAddAction,
  wrapBody,
}: CommandPaletteProps = {}) {
  const isControlled = openProp !== undefined;
  const internal = useCommandPalette();
  const isOpen = isControlled ? openProp : internal.isOpen;
  const navigate = useNavigate();
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

  const commandBody = (
    <Command shouldFilter={false} label="Search games">
      <CommandInput
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
              className="h-6 w-6 animate-spin text-muted-foreground"
            />
          </div>
        )}

        {error && shouldSearch && !isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
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
                library={game.library}
                renderAddAction={renderAddAction}
                onAfterSelect={closeAndReset}
              />
            ))}
          </CommandGroup>
        )}

        {shouldSearch &&
          !isLoading &&
          results.length > 0 &&
          query.trim().length >= MIN_GAME_SEARCH_QUERY_LENGTH && (
            <CommandGroup>
              <CommandItem
                value="see-all-results"
                className="p-0"
                onSelect={() => {
                  void navigate({
                    to: "/games/search",
                    search: { q: query.trim() },
                  });
                  closeAndReset();
                }}
              >
                <Link
                  to="/games/search"
                  search={{ q: query.trim() }}
                  className="flex min-h-11 w-full items-center px-3 py-2 md:min-h-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeAndReset();
                  }}
                >
                  See all results
                </Link>
              </CommandItem>
            </CommandGroup>
          )}

        <PaletteNavigationGroup query={query} onAfterSelect={closeAndReset} />

        <PaletteQuickActionsGroup
          query={query}
          onNewNote={() => {
            openGlobalAction(navigate, "log-session");
            closeAndReset();
          }}
        />

        {showNoResults && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No games found for &ldquo;{query}&rdquo;
          </div>
        )}

        {showEmptyHint && !isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Start typing to search for games...
          </div>
        )}
      </CommandList>
    </Command>
  );

  const body = wrapBody ? wrapBody(commandBody) : commandBody;

  if (!isDesktop) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={keepOpenOnToastPress(handleOpenChange)}
      >
        <SheetContent
          side="bottom"
          className="gap-0 p-0 [&_[data-slot=command-input-wrapper]]:pr-14"
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
    <Dialog open={isOpen} onOpenChange={keepOpenOnToastPress(handleOpenChange)}>
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
