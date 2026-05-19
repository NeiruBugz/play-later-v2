import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { searchGamesFn } from "@/features/search-games";
import type { SearchResponseItem } from "@/shared/api/igdb";
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

import { useCommandPalette } from "../../hooks/use-command-palette";
import { GameResultItem } from "../game-result-item";
import { PaletteNavigationGroup } from "../palette-navigation-group";
import { PaletteQuickActionsGroup } from "../palette-quick-actions-group";
import type { CommandPaletteProps } from "./command-palette.type";

const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 300;

/**
 * Global ⌘K / Ctrl+K palette. Mounted once at the app root. Owns its own
 * open/closed state and key binding via `useCommandPalette`; external
 * triggers (sidebar / topbar search buttons) call `openCommandPalette()`
 * which dispatches a custom event the hook listens for.
 *
 * Composition mirrors canonical's `DesktopCommandPalette`:
 *   - shadcn `Command` primitives (with `shouldFilter={false}` because we
 *     filter server-side via `searchGamesFn`)
 *   - `GameResultItem` rows in a Games group
 *   - `PaletteNavigationGroup` (5 jump targets, filtered by query)
 *   - `PaletteQuickActionsGroup` (Add game / New journal entry)
 *
 * Behavior parity with `savepoint-app/features/command-palette`:
 *   - 300ms imperative debounce on the search query (test-deterministic)
 *   - Calls `searchGamesFn({ data: { name } })` once per debounced query
 *   - Result rows are TanStack `<Link to="/games/$slug" params={{ slug }} />`
 *
 * Divergences (logged in DIVERGENCES.md → Slice 17):
 *   - No quick-add flow yet (no `manage-library-entry` port); search rows
 *     navigate to the detail page in all cases.
 *   - No recent-games empty state yet (needs `library-item` distinctByGame).
 *   - No mobile-sheet variant (Slice 18A owns the visual-parity sweep).
 *   - "New journal entry" navigates to `/journal`, not `/journal/new`
 *     (route not registered).
 */
export function CommandPalette({
  open: openProp,
  onOpenChange,
}: CommandPaletteProps = {}) {
  const isControlled = openProp !== undefined;
  const internal = useCommandPalette();
  const isOpen = isControlled ? openProp : internal.isOpen;
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Reset state when the palette closes so the next open starts fresh.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [isOpen]);

  /**
   * Schedule the search imperatively in the value-change handler rather
   * than going through `useDebouncedValue` → state → useEffect. The timer
   * callback calls `searchGamesFn` directly so the fetch fires the moment
   * the timer elapses, with no intervening React render cycle. This makes
   * the debounce assertable from a synchronous `vi.advanceTimersByTime(...)`
   * call (test contract: see command-palette.test.tsx scenario 2).
   */
  const scheduleSearch = (nextQuery: string) => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (nextQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const seq = ++requestSeqRef.current;
      setIsLoading(true);
      setError(null);
      searchGamesFn({ data: { name: nextQuery } })
        .then((result) => {
          if (seq !== requestSeqRef.current) return;
          setResults(result?.games ?? []);
        })
        .catch((cause: unknown) => {
          if (seq !== requestSeqRef.current) return;
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setResults([]);
        })
        .finally(() => {
          if (seq !== requestSeqRef.current) return;
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);
  };

  const handleQueryChange = (next: string) => {
    setQuery(next);
    scheduleSearch(next);
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const shouldSearch = query.length >= MIN_QUERY_LENGTH;
  const showNoResults =
    shouldSearch && !isLoading && !error && results.length === 0;
  const showEmptyHint = !shouldSearch;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search games, jump to a page, or run a quick action.
        </DialogDescription>
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
            onValueChange={handleQueryChange}
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

            <PaletteNavigationGroup
              query={query}
              onAfterSelect={closeAndReset}
            />

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
      </DialogContent>
    </Dialog>
  );
}
