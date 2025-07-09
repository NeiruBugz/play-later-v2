"use client";

import { Storefront } from "@prisma/client";
import { minutesToHours } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useState, useTransition } from "react";
import { FaPlaystation, FaSteam, FaXbox } from "react-icons/fa";
import { toast } from "sonner";

import { importToApplication } from "@/features/view-imported-games/server-actions/import-to-application";
import { Heading } from "@/shared/components/typography";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
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

interface ImportedGameCardProps {
  game: ImportedGame;
  onImportSuccess?: (gameId: string) => void;
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

const storefrontIcons = {
  STEAM: <FaSteam />,
  PLAYSTATION: <FaPlaystation />,
  XBOX: <FaXbox />,
};

function getImageUrl(game: ImportedGame): string | null {
  if (game.storefront === "STEAM" && game.storefrontGameId) {
    return getSteamGameImageUrl(
      game.storefrontGameId,
      game.img_icon_url,
      game.img_logo_url,
      "CAPSULE_616"
    );
  }

  return game.img_logo_url || game.img_icon_url;
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
          const gameId = data.gameId;
          startTransition(() => {
            onImportSuccess(gameId);
          });
        }
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to import game to collection");
    },
  });

  const handleAddToCollection = () => {
    if (!game.storefrontGameId || imported) {
      return;
    }

    execute({
      steamAppId: game.storefrontGameId,
      playtime: game.playtime || undefined,
    });
  };

  const isDisabled = !game.storefrontGameId || imported || isExecuting;

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

        {game.playtime && game.playtime > 0 && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="text-xs">
              {minutesToHours(game.playtime)} h.
            </Badge>
          </div>
        )}

        {imported && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Added to Collection</span>
            </div>
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
          {storefrontIcons[game.storefront]}
          <Button
            size="sm"
            onClick={handleAddToCollection}
            disabled={isDisabled}
            className={cn(
              "transition-all duration-200",
              imported && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Adding...
              </>
            ) : imported ? (
              <>
                <Check className="mr-2 h-3 w-3" />
                Added
              </>
            ) : (
              "Add to collection"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { ImportedGameCard };
