"use client";

import {
  type Game,
  type LibraryItem,
  type LibraryItemStatus,
} from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { cn, getGameUrl, LibraryStatusMapper, normalizeString } from "../lib";
import { IgdbImage } from "./igdb-image";
import { Heading } from "./typography";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader } from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type GameCardProps = {
  game: Game;
  platforms?: LibraryItem[];
  currentPlatform?: LibraryItem;
};

const statusColors: Record<LibraryItemStatus, string> = {
  CURIOUS_ABOUT: "bg-yellow-500 text-white",
  CURRENTLY_EXPLORING: "bg-green-500 text-white",
  TOOK_A_BREAK: "bg-orange-500 text-white",
  EXPERIENCED: "bg-purple-500 text-white",
  WISHLIST: "bg-pink-500 text-white",
  REVISITING: "bg-blue-500 text-white",
};

export function GameCard({ game, platforms, currentPlatform }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const primaryPlatform = currentPlatform ?? platforms?.[0];
  const status = primaryPlatform?.status ?? "CURIOUS_ABOUT";

  return (
    <Card
      className="group h-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <IgdbImage
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"c-big"}
          fill
          className={`object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
        />

        {/* Status Badge */}
        <div className="absolute left-2 top-2">
          <Badge
            variant="secondary"
            className={cn("text-xs font-medium", statusColors[status])}
          >
            {LibraryStatusMapper[status]}
          </Badge>
        </div>

        {/* Multiple Platforms Indicator */}
        {platforms && platforms.length > 1 && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="text-xs">
              +{platforms.length - 1}
            </Badge>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button variant="secondary" size="sm" asChild>
            <Link href={getGameUrl(game.id)}>View Details</Link>
          </Button>
        </div>
      </div>

      <CardHeader className="flex-1 p-3 pb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Heading
                level={3}
                size="sm"
                className="line-clamp-2 cursor-help text-sm font-medium leading-tight"
                title={game.title}
              >
                {game.title}
              </Heading>
            </TooltipTrigger>
            <TooltipContent>
              <p>{game.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Platform Info */}
        {primaryPlatform?.platform && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {normalizeString(primaryPlatform.platform)}
          </p>
        )}
      </CardHeader>

      {/* Footer only visible on non-hover for cleaner look */}
    </Card>
  );
}
