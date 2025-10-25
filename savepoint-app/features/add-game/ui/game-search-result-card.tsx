"use client";

import { Calendar, Gamepad2 } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { prepareGameCardResult } from "../lib/prepare-game-card-result";
import { GameSearchResultCardProps } from "../lib/types";

export function GameSearchResultCard({
  game,
  onSelect,
}: GameSearchResultCardProps) {
  const { coverUrl, releaseDate, gameTypeLabel, hasMorePlatforms, platforms } =
    prepareGameCardResult(game);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
        <div className="bg-muted flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${game.name} cover`}
              width={64}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <Gamepad2 className="text-muted-foreground h-8 w-8" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start gap-2">
            <CardTitle className="line-clamp-2 flex-1 text-base">
              {game.name}
            </CardTitle>
            {gameTypeLabel && (
              <Badge variant="secondary" className="shrink-0">
                {gameTypeLabel}
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
            {releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {releaseDate}
              </span>
            )}
            {platforms && (
              <span className="flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                {platforms}
                {hasMorePlatforms && ", ..."}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button onClick={onSelect} className="w-full" size="sm">
          Add to Library
        </Button>
      </CardContent>
    </Card>
  );
}
