import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ImportedGame } from "@/entities/imported-game/model/types";
// Import server fns from their individual module paths (not the feature
// barrel) so component tests can mock each module without dragging the
// rest of the feature's server chain into the jsdom env.
import { dismissImportedGameFn } from "@/features/steam-import/api/dismiss-imported-game";
import { importSteamLibraryFn } from "@/features/steam-import/api/import-steam-library";
import {
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncStartedToast,
} from "@/features/steam-import/ui/error-cards/import-status-feedback";
import { ImportGameModal } from "@/features/steam-import/ui/import-game-modal";
import { ImportedGameCard } from "@/features/steam-import/ui/imported-game-card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { ImportedGamesFilterBar } from "../imported-games-filter-bar";
import type { ImportedGamesPageProps } from "./imported-games-page.type";

/**
 * ImportedGamesPage widget (Slice 21 Phase D).
 *
 * Orchestrator for `/steam/games`. Composes:
 *   - Slice 18 `EmptyState` for the no-games-yet branch (two variants:
 *     Steam-connected vs. not-connected).
 *   - Slice 18 `Alert` for the top-of-page unmatched-rows warning.
 *   - Slice 18 `Checkbox` for bulk-select-all.
 *   - `<ImportedGameCard/>` (this slice) per row.
 *
 * Selection state is `Set<importedGameId>`. Bulk add iterates and fires
 * `addGameToLibraryFn` sequentially per MATCHED row. See decision 7 in the
 * Phase D scope: bulk-add ships as a sequential loop; the server fn for a
 * batched add-to-library is deferred.
 *
 * No TanStack Query — server fns are called directly per Slice 5/10/11/20
 * precedent. Errors throw `AppError` which is surfaced via sonner toasts.
 */
export function ImportedGamesPage({
  games,
  steamId,
  pagination,
  includeIgnored = false,
  filters = {},
}: ImportedGamesPageProps) {
  // "Filtered" = any URL search-param state is active. Used to differentiate
  // the no-matches empty state from the onboarding empty states (locked
  // decision 8: only render no-matches when items.length > 0 — here
  // items.length is the filtered result, so we infer it from `filters`).
  const hasActiveFilters =
    includeIgnored ||
    Boolean(filters.q && filters.q.trim().length > 0) ||
    (filters.playtimeStatus && filters.playtimeStatus !== "all") ||
    (filters.playtimeRange && filters.playtimeRange !== "all") ||
    (filters.platform && filters.platform !== "all") ||
    (filters.lastPlayed && filters.lastPlayed !== "all") ||
    (filters.sortBy && filters.sortBy !== "added_desc");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [modalTarget, setModalTarget] = useState<{
    game: ImportedGame;
    startOnSearch: boolean;
  } | null>(null);

  const sortedGames = useMemo(() => {
    // Order: MATCHED → PENDING/UNMATCHED → IGNORED (bottom).
    return [...games].sort((a, b) => {
      const order = (g: ImportedGame) => {
        if (g.igdbMatchStatus === "MATCHED") return 0;
        if (g.igdbMatchStatus === "IGNORED") return 2;
        return 1;
      };
      return order(a) - order(b);
    });
  }, [games]);

  const hasUnmatched = sortedGames.some(
    (g) => g.igdbMatchStatus === "PENDING" || g.igdbMatchStatus === "UNMATCHED"
  );

  const handleDismiss = async (importedGameId: string) => {
    setPending(true);
    try {
      await dismissImportedGameFn({ data: { importedGameId } });
      toast.success("Removed from list");
      router.invalidate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not dismiss game";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const handleSync = async () => {
    setPending(true);
    showSyncStartedToast();
    try {
      const { imported } = await importSteamLibraryFn();
      showSyncCompletedToast(imported);
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      showSyncFailedToast(message);
    } finally {
      setPending(false);
    }
  };

  // --- Empty states ---------------------------------------------------------
  if (sortedGames.length === 0) {
    // No-matches branch: filters are active but the server returned zero rows.
    // Keep the filter bar visible so the user can refine without re-navigating.
    if (hasActiveFilters) {
      return (
        <div className="space-y-4" data-testid="imported-games-page">
          <ImportedGamesFilterBar
            filters={filters}
            includeIgnored={includeIgnored}
          />
          <EmptyState
            icon={Gamepad2}
            title="No matches"
            description="No imported games match your current filters. Try clearing one."
          />
        </div>
      );
    }
    if (steamId === null) {
      return (
        <EmptyState
          icon={Gamepad2}
          title="Connect Steam to see your games"
          description="Link your Steam account to import your library."
          action={{
            label: "Connect Steam",
            to: "/settings/account",
            variant: "default",
          }}
        />
      );
    }
    return (
      <EmptyState
        icon={Gamepad2}
        title="No games imported yet"
        description="Sync your Steam library to see your games here."
        action={{
          label: pending ? "Syncing…" : "Sync from Steam",
          onClick: handleSync,
          disabled: pending,
          variant: "default",
        }}
      />
    );
  }

  // --- Populated ------------------------------------------------------------
  return (
    <div className="space-y-4" data-testid="imported-games-page">
      <ImportedGamesFilterBar
        filters={filters}
        includeIgnored={includeIgnored}
      />
      {hasUnmatched ? (
        <Alert variant="warning">
          <AlertTitle>Some games need a manual IGDB match</AlertTitle>
          <AlertDescription>
            Click &quot;Search IGDB&quot; on a row to find the right entry.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleSync}
          disabled={pending}
        >
          {pending ? "Syncing…" : "Sync from Steam"}
        </Button>
      </div>

      <ul
        className="space-y-2"
        role="list"
        aria-label="Imported games"
        data-include-ignored={includeIgnored ? "true" : "false"}
      >
        {sortedGames.map((game) => (
          <li key={game.id}>
            <ImportedGameCard
              game={game}
              onAddToLibrary={() =>
                setModalTarget({ game, startOnSearch: false })
              }
              onDismiss={
                game.igdbMatchStatus !== "IGNORED"
                  ? () => handleDismiss(game.id)
                  : undefined
              }
              isPending={pending}
            />
          </li>
        ))}
      </ul>

      {pagination && pagination.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between pt-2"
          aria-label="Imported games pagination"
        >
          <span className="text-muted-foreground text-sm">
            Page {pagination.page} of {pagination.totalPages} ·{" "}
            {pagination.total} total
          </span>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                to="/steam/games"
                search={(prev) => ({ ...prev, page: pagination.page - 1 })}
                className="inline-flex"
                aria-label="Go to previous page"
              >
                <Button type="button" variant="outline" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                  Previous
                </Button>
              </Link>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                Previous
              </Button>
            )}
            {pagination.page < pagination.totalPages ? (
              <Link
                to="/steam/games"
                search={(prev) => ({ ...prev, page: pagination.page + 1 })}
                className="inline-flex"
                aria-label="Go to next page"
              >
                <Button type="button" variant="outline" size="sm">
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </nav>
      ) : null}

      {modalTarget ? (
        <ImportGameModal
          isOpen
          game={modalTarget.game}
          startOnSearch={modalTarget.startOnSearch}
          onClose={() => setModalTarget(null)}
          onImported={() => router.invalidate()}
        />
      ) : null}
    </div>
  );
}
