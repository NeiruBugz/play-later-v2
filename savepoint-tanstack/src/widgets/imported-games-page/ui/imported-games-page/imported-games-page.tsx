import { useRouter } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { ImportedGame } from "@/entities/imported-game/model/types";
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
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
import { IgdbManualSearch } from "@/features/steam-import/ui/igdb-manual-search";
import { ImportedGameCard } from "@/features/steam-import/ui/imported-game-card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
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
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [searchTarget, setSearchTarget] = useState<ImportedGame | null>(null);

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

  const matchedIds = useMemo(
    () =>
      sortedGames
        .filter((g) => g.igdbMatchStatus === "MATCHED")
        .map((g) => g.id),
    [sortedGames]
  );
  const hasUnmatched = sortedGames.some(
    (g) => g.igdbMatchStatus === "PENDING" || g.igdbMatchStatus === "UNMATCHED"
  );

  const allMatchedSelected =
    matchedIds.length > 0 && matchedIds.every((id) => selection.has(id));

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAllToggle = (checked: boolean) => {
    setSelection(checked ? new Set(matchedIds) : new Set());
  };

  const handleAddOne = async (game: ImportedGame) => {
    if (!game.storefrontGameId) return;
    setPending(true);
    try {
      // Note: a MATCHED ImportedGame in canonical carries the igdbId on a
      // joined Game row. The tanstack schema mirror does not (yet) join
      // through, so we use the storefrontGameId as a placeholder until the
      // entity-layer fetch is extended. Documented in DIVERGENCES.md.
      const igdbId = Number(game.storefrontGameId);
      if (!Number.isFinite(igdbId) || igdbId <= 0) {
        throw new Error("Game is not yet linked to IGDB");
      }
      await addGameToLibraryFn({ data: { igdbId } });
      toast.success("Added to library");
      router.invalidate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add game";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const handleBulkAdd = async () => {
    const targets = sortedGames.filter(
      (g) => selection.has(g.id) && g.igdbMatchStatus === "MATCHED"
    );
    if (targets.length === 0) return;
    setPending(true);
    let succeeded = 0;
    try {
      for (const g of targets) {
        try {
          const igdbId = Number(g.storefrontGameId ?? 0);
          if (Number.isFinite(igdbId) && igdbId > 0) {
            await addGameToLibraryFn({ data: { igdbId } });
            succeeded += 1;
          }
        } catch {
          // Continue on per-row failure to deliver partial success messaging.
        }
      }
      if (succeeded === targets.length) {
        toast.success(`Added ${succeeded} games to library`);
      } else {
        toast.error(
          `Bulk add partially failed: ${succeeded}/${targets.length} succeeded`
        );
      }
      setSelection(new Set());
      router.invalidate();
    } finally {
      setPending(false);
    }
  };

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allMatchedSelected}
            onCheckedChange={(c) => handleSelectAllToggle(c === true)}
            disabled={matchedIds.length === 0 || pending}
            aria-label="Select all matched games"
          />
          <span className="text-muted-foreground text-sm">
            {selection.size} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleBulkAdd}
            disabled={pending || selection.size === 0}
          >
            Add selected to library
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSync}
            disabled={pending}
          >
            {pending ? "Syncing…" : "Sync from Steam"}
          </Button>
        </div>
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
              selected={selection.has(game.id)}
              onSelectionChange={handleSelectionChange}
              onAddToLibrary={
                game.igdbMatchStatus === "MATCHED"
                  ? () => handleAddOne(game)
                  : undefined
              }
              onManualSearch={
                game.igdbMatchStatus === "PENDING" ||
                game.igdbMatchStatus === "UNMATCHED"
                  ? () => setSearchTarget(game)
                  : undefined
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

      {searchTarget ? (
        <IgdbManualSearch
          isOpen
          importedGameId={searchTarget.id}
          initialQuery={searchTarget.name}
          onClose={() => setSearchTarget(null)}
        />
      ) : null}
    </div>
  );
}
