"use client";

import { Storefront } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/shared/components/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/card";
import { Heading } from "@/shared/components/typography";
import { cn, getSteamGameImageUrl } from "@/shared/lib";

interface ImportedGame {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
}

const storefrontColors = {
  STEAM: "bg-blue-600 text-white",
  PLAYSTATION: "bg-blue-800 text-white",
  XBOX: "bg-green-600 text-white",
};

const storefrontLabels = {
  STEAM: "Steam",
  PLAYSTATION: "PlayStation",
  XBOX: "Xbox",
};

function getImageUrl(game: ImportedGame): string | null {
  // For Steam games, use high-quality store images (616x353) which work well with 16:9 aspect ratio
  if (game.storefront === "STEAM" && game.storefrontGameId) {
    return getSteamGameImageUrl(
      game.storefrontGameId,
      game.img_icon_url,
      game.img_logo_url,
      "CAPSULE_616" // 616x353 resolution - much better than 32x32 icons
    );
  }

  // For other storefronts, use the URLs directly (if they're already full URLs)
  return game.img_logo_url || game.img_icon_url;
}

function ImportedGameCard({ game }: { game: ImportedGame }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getImageUrl(game);

  return (
    <Card className="group h-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="mb-2 text-4xl">🎮</div>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}

        {/* Storefront Badge */}
        <div className="absolute left-2 top-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              storefrontColors[game.storefront]
            )}
          >
            {storefrontLabels[game.storefront]}
          </Badge>
        </div>

        {/* Playtime Badge */}
        {game.playtime && game.playtime > 0 && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="text-xs">
              {game.playtime} h.
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-3 pb-2">
        <Heading
          level={3}
          size="sm"
          className="line-clamp-2 text-sm font-medium leading-tight"
          title={game.name}
        >
          {game.name}
        </Heading>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{storefrontLabels[game.storefront]}</span>
          {game.storefrontGameId && <span>ID: {game.storefrontGameId}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export { ImportedGameCard };
