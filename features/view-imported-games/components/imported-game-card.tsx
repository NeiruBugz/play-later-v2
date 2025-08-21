"use client";

import { type Storefront } from "@prisma/client";
import { Check, Loader2, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useState, useTransition } from "react";
import { FaPlaystation, FaSteam, FaXbox } from "react-icons/fa";
import { toast } from "sonner";

import { importToApplication } from "@/features/view-imported-games/server-actions/import-to-application";
import { Body, Caption } from "@/shared/components/typography";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn, getSteamGameImageUrl } from "@/shared/lib";

type ImportedGame = {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
};

type ImportedGameCardProps = {
  game: ImportedGame;
  onImportSuccess?: (gameId: string) => void;
};

const storefrontColors = {
  STEAM: "bg-blue-600 text-white border-blue-600",
  PLAYSTATION: "bg-indigo-600 text-white border-indigo-600",
  XBOX: "bg-green-600 text-white border-green-600",
};

const storefrontLabels = {
  STEAM: "Steam",
  PLAYSTATION: "PlayStation",
  XBOX: "Xbox",
};

const storefrontIcons = {
  STEAM: <FaSteam className="size-3" />,
  PLAYSTATION: <FaPlaystation className="size-3" />,
  XBOX: <FaXbox className="size-3" />,
};

function getImageUrl(game: ImportedGame): string | null {
  if (game.storefront === "STEAM" && game.storefrontGameId) {
    return getSteamGameImageUrl(
      game.storefrontGameId,
      game.img_icon_url,
      game.img_logo_url,
      "LIBRARY_600"
    );
  }

  return game.img_logo_url ?? game.img_icon_url;
}

function ImportedGameCard({ game, onImportSuccess }: ImportedGameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imported, setImported] = useState(false);
  const [, startTransition] = useTransition();
  const imageUrl = getImageUrl(game);

  const { execute, isExecuting } = useAction(importToApplication, {
    onSuccess: ({ data }) => {
      if (data) {
        setImported(true);
        toast.success(data.message);
        if (onImportSuccess && data.gameId) {
          const { gameId } = data;
          startTransition(() => {
            onImportSuccess(gameId);
          });
        }
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to import game to collection");
    },
  });

  const handleAddToCollection = () => {
    if (!game.storefrontGameId || imported) {
      return;
    }

    execute({
      steamAppId: game.storefrontGameId,
      playtime: game.playtime ?? undefined,
    });
  };

  const isDisabled = !game.storefrontGameId || imported || isExecuting;

  return (
    <div className="group relative overflow-hidden rounded-md border bg-card transition-all duration-200 hover:border-muted-foreground/20 hover:shadow-sm">
      {/* Game Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="mb-1 text-2xl">🎮</div>
              <Caption size="xs">No image</Caption>
            </div>
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute left-1.5 top-1.5">
          <Badge
            className={cn(
              "flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium",
              storefrontColors[game.storefront]
            )}
          >
            {storefrontIcons[game.storefront]}
            <span className="hidden sm:inline">
              {storefrontLabels[game.storefront]}
            </span>
          </Badge>
        </div>

        {/* Playtime Badge */}
        {game.playtime && game.playtime > 0 && (
          <div className="absolute right-1.5 top-1.5">
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {Math.round(game.playtime / 60)}h
            </Badge>
          </div>
        )}

        {/* Import Success Overlay */}
        {imported && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-md bg-green-600 px-2 py-1.5 text-white">
              <Check className="size-3" />
              <Caption size="xs" className="font-medium text-white">
                Added
              </Caption>
            </div>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex flex-col p-2">
        <div className="mb-2 h-8">
          <Body
            size="xs"
            className="line-clamp-2 font-medium leading-tight"
            title={game.name}
          >
            {game.name}
          </Body>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant={imported ? "secondary" : "default"}
          onClick={handleAddToCollection}
          disabled={isDisabled}
          className={cn(
            "h-7 w-full justify-center text-xs transition-all duration-200",
            imported &&
              "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-1 size-3 animate-spin" />
              Adding...
            </>
          ) : imported ? (
            <>
              <Check className="mr-1 size-3" />
              Added
            </>
          ) : (
            <>
              <Plus className="mr-1 size-3" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export { ImportedGameCard };
