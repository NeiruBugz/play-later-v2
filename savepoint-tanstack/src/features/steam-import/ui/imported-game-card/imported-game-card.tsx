import { Plus, X } from "lucide-react";

import { calculateSmartStatus } from "@/entities/imported-game";
import { getStatusLabel } from "@/entities/library-item";
import { formatHours } from "@/shared/lib/date";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import type { ImportedGameCardProps } from "./imported-game-card.type";
import {
  formatLastPlayed,
  formatReleaseYear,
  getSteamIconUrl,
  matchState,
} from "./imported-game-card.utility";

/**
 * Per-row imported-game card.
 *
 * Catalogue lookup state comes from `matchState` (spec 030):
 *   - found       → catalogue cover, catalogue title and release year.
 *   - needs-match → Steam icon, Steam name and a "Needs a match" badge.
 *   - not-yet     → Steam icon and Steam name, no label.
 *
 * `IGNORED` rows swap the Add button for "Restore" and never carry the
 * "Needs a match" badge.
 */
export function ImportedGameCard({
  game,
  onAddToLibrary,
  onDismiss,
  isPending = false,
}: ImportedGameCardProps) {
  const isIgnored = game.igdbMatchStatus === "IGNORED";
  const lookup = matchState(game);
  const catalogueGame = lookup === "found" ? game.game : null;
  const title = catalogueGame?.title ?? game.name;
  const coverUrl = buildCoverImageUrl(
    catalogueGame?.coverImage,
    "t_cover_small"
  );
  const imageUrl =
    coverUrl ?? getSteamIconUrl(game.img_icon_url, game.storefrontGameId);
  const releaseYear = formatReleaseYear(catalogueGame?.releaseDate);
  const needsMatch = lookup === "needs-match" && !isIgnored;
  const smartStatus = calculateSmartStatus({
    playtime: game.playtime,
    lastPlayedAt: game.lastPlayedAt,
  });
  const lastPlayedLabel = formatLastPlayed(game.lastPlayedAt);

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Cover for ${title}`}
            className="h-10 w-10 shrink-0 rounded-sm object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted"
            aria-hidden="true"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{title}</h3>
            <Badge
              variant="outline"
              aria-label={`Suggested status: ${getStatusLabel(smartStatus)}`}
            >
              {getStatusLabel(smartStatus)}
            </Badge>
            {needsMatch ? (
              <Badge variant="secondary">Needs a match</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {releaseYear ? (
              <>
                <span>{releaseYear}</span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span>
              {game.playtime ? formatHours(game.playtime) : "Never played"}
            </span>
            {lastPlayedLabel ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{lastPlayedLabel}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {!isIgnored && onAddToLibrary ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onAddToLibrary}
                    disabled={isPending}
                    aria-label={`Add ${title}`}
                  />
                }
              >
                <Plus />
              </TooltipTrigger>
              <TooltipContent>Add to library</TooltipContent>
            </Tooltip>
          ) : null}

          {isIgnored && onAddToLibrary ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddToLibrary}
              disabled={isPending}
              aria-label={`Restore ${title}`}
            >
              Restore
            </Button>
          ) : null}

          {!isIgnored && onDismiss ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    disabled={isPending}
                    aria-label={`Remove ${title}`}
                  />
                }
              >
                <X />
              </TooltipTrigger>
              <TooltipContent>Remove game</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
