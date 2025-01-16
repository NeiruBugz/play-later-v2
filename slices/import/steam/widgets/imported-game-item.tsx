"use client";

import { BacklogStatusMapper, cn } from "@/src/shared/lib";
import { SteamAppInfo } from "@/src/shared/types";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import { Card, CardDescription, CardTitle } from "@/src/shared/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/shared/ui/tooltip";
import { BacklogItemStatus } from "@prisma/client";
import { EyeOff, Save } from "lucide-react";
import { memo, useCallback, useTransition } from "react";
import { minToHours } from "../lib";

type ImportedGameItemProps = {
  game: SteamAppInfo & { status?: BacklogItemStatus };
  onGameStatusChange?: (appId: number, status: string) => void;
  onIgnoreClick?: (game: SteamAppInfo) => void;
  markGameForSave?: (game: SteamAppInfo) => void;
  onSaveGameClick: (game: SteamAppInfo) => Promise<void>;
  isIgnored?: boolean;
  isMarkedForSave?: boolean;
  isAdded?: boolean;
};

function ImportedGameCard({
  game,
  onIgnoreClick,
  onGameStatusChange,
  onSaveGameClick,
}: ImportedGameItemProps) {
  const [isPending, startTransition] = useTransition();

  const onSaveClick = useCallback(() => {
    if (onSaveGameClick) {
      startTransition(async () => {
        await onSaveGameClick(game);
      });
    }
  }, [game, onSaveGameClick]);

  const onIgnore = useCallback(() => {
    if (onIgnoreClick) {
      startTransition(() => {
        onIgnoreClick(game);
      });
    }
  }, [game, onIgnoreClick]);

  return (
    <Card
      className={cn("overflow-hidden", {
        "animate-pulse": isPending,
      })}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <CardTitle>{game.name}</CardTitle>
          <CardDescription>
            Playtime: {minToHours(game.playtime_forever)} hours
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={game.status}
            onValueChange={(value) => onGameStatusChange?.(game.appid, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(BacklogItemStatus).map((key) => {
                return (
                  <SelectItem value={key} key={key}>
                    {BacklogStatusMapper[key]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={onSaveClick}
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save to collection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={onIgnore}
                    disabled={isPending}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ignore game</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}

const ImportedGame = memo(ImportedGameCard);
ImportedGame.displayName = "ImportedGameCard";

export { ImportedGame as ImportedGameCard };
