import { Plus, X } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

import { calculateSmartStatus } from "../../lib/calculate-smart-status";
import type { ImportedGameCardProps } from "./imported-game-card.type";
import { formatPlaytime, getSteamIconUrl } from "./imported-game-card.utility";

/**
 * Per-row imported-game card (Slice 21 Phase D).
 *
 * Three render variants keyed off `game.igdbMatchStatus`:
 *   - `MATCHED`             → cover + name + "Add to library" + dismiss.
 *   - `PENDING` / `UNMATCHED` → placeholder + name + "Search IGDB" + dismiss.
 *   - `IGNORED`             → muted + "Restore" (handled by widget via
 *                              `onAddToLibrary` repurposed for restore — Phase
 *                              D ships the IGNORED branch only when the
 *                              `?include=ignored` toggle is on; the card
 *                              itself is unaware of the toggle).
 *
 * The card composes Slice 18's `Checkbox` for bulk-select and exposes a
 * suggested-status `Badge` derived from `calculateSmartStatus`.
 */
export function ImportedGameCard({
  game,
  onAddToLibrary,
  onDismiss,
  isPending = false,
}: ImportedGameCardProps) {
  const steamIconUrl = getSteamIconUrl(
    game.img_icon_url,
    game.storefrontGameId
  );
  const smartStatus = calculateSmartStatus({
    playtime: game.playtime,
    lastPlayedAt: game.lastPlayedAt,
  });
  const isIgnored = game.igdbMatchStatus === "IGNORED";

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        {steamIconUrl ? (
          <img
            src={steamIconUrl}
            alt={`Cover for ${game.name}`}
            className="h-10 w-10 shrink-0 rounded object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div
            className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded"
            aria-hidden="true"
          >
            <span className="text-muted-foreground text-xs font-medium">
              {game.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{game.name}</h3>
            <Badge
              variant="outline"
              aria-label={`Suggested status: ${smartStatus}`}
            >
              {smartStatus}
            </Badge>
          </div>
          <div className="text-muted-foreground flex gap-3 text-sm">
            <span>{formatPlaytime(game.playtime)}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {!isIgnored && onAddToLibrary ? (
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={onAddToLibrary}
              disabled={isPending}
              aria-label={`Add ${game.name} to library`}
              title="Add to library"
            >
              <Plus />
            </Button>
          ) : null}

          {isIgnored && onAddToLibrary ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddToLibrary}
              disabled={isPending}
              aria-label={`Restore ${game.name}`}
            >
              Restore
            </Button>
          ) : null}

          {!isIgnored && onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              disabled={isPending}
              aria-label={`Dismiss ${game.name}`}
              title="Dismiss game"
            >
              <X />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
