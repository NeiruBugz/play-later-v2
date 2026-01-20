import type { ImportedGame } from "@prisma/client";
import Image from "next/image";

import { Card, CardContent } from "@/shared/components/ui/card";
import { formatRelativeDate } from "@/shared/lib/date";

type ImportedGameCardProps = {
  game: ImportedGame;
};

function formatPlaytime(minutes: number | null): string {
  if (minutes === null || minutes === 0) {
    return "Never played";
  }

  const hours = minutes / 60;

  if (hours < 1) {
    return `${minutes} min`;
  }

  return `${hours.toFixed(1)} hrs`;
}

function formatLastPlayed(date: Date | null): string {
  if (date === null) {
    return "Never";
  }

  return formatRelativeDate(date);
}

function getSteamIconUrl(
  iconHash: string | null,
  appId: string | null
): string | null {
  if (!iconHash || !appId) {
    return null;
  }

  return `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

export function ImportedGameCard({ game }: ImportedGameCardProps) {
  const steamIconUrl = getSteamIconUrl(
    game.img_icon_url,
    game.storefrontGameId
  );

  return (
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
          <h3 className="truncate font-medium">{game.name}</h3>
          <div className="text-muted-foreground flex gap-3 text-sm">
            <span>{formatPlaytime(game.playtime)}</span>
            <span>•</span>
            <span>Last played: {formatLastPlayed(game.lastPlayedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
