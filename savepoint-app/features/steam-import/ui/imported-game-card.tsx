"use client";

import type { ImportedGame } from "@prisma/client";
import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getStatusConfig } from "@/shared/lib/library-status";

import { useDismissGame } from "../hooks/use-dismiss-game";
import { calculateSmartStatus } from "../lib/calculate-smart-status";
import {
  formatLastPlayed,
  formatPlaytime,
  getSteamIconUrl,
} from "../lib/formatters";
import { ImportGameModal } from "./import-game-modal";

type ImportedGameCardProps = {
  game: ImportedGame;
};

export function ImportedGameCard({ game }: ImportedGameCardProps) {
  const dismissGame = useDismissGame();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const steamIconUrl = getSteamIconUrl(
    game.img_icon_url,
    game.storefrontGameId
  );

  const smartStatus = calculateSmartStatus(game);
  const statusConfig = getStatusConfig(smartStatus);

  const handleDismiss = () => {
    dismissGame.mutate({ importedGameId: game.id });
  };

  const handleImport = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Card variant="default" className="hover:bg-muted/20">
        <CardContent spacing="compact" className="flex items-center gap-3">
          {steamIconUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
              <Image
                src={steamIconUrl}
                alt={game.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded">
              <span className="text-muted-foreground text-xs font-medium">
                {game.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium">{game.name}</h3>
              <Badge
                variant={statusConfig.badgeVariant}
                role="status"
                aria-label={`Status: ${statusConfig.label}`}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <div className="text-muted-foreground flex gap-3 text-sm">
              <span>{formatPlaytime(game.playtime)}</span>
              <span>•</span>
              <span>Last played: {formatLastPlayed(game.lastPlayedAt)}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="default"
              size="icon"
              onClick={handleImport}
              disabled={dismissGame.isPending}
              aria-label="Import game to library"
              title="Import game to library"
            >
              <Plus />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={dismissGame.isPending}
              loading={dismissGame.isPending}
              aria-label="Dismiss game"
              title="Dismiss game"
            >
              <X />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ImportGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        game={game}
      />
    </>
  );
}
