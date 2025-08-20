"use client";

import { type BacklogItem, type Game } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { cn, getGameUrl } from "../lib";
import { IgdbImage } from "./igdb-image";
import { Caption } from "./typography";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type GameCardProps = {
  game: Game;
  platforms?: BacklogItem[];
  currentPlatform?: BacklogItem;
};

const statusColors = {
  TO_PLAY: "bg-yellow-500 text-white",
  PLAYING: "bg-green-500 text-white",
  PLAYED: "bg-blue-500 text-white",
  COMPLETED: "bg-purple-500 text-white",
  WISHLIST: "bg-pink-500 text-white",
};

const statusLabels = {
  TO_PLAY: "Backlog",
  PLAYING: "Playing",
  PLAYED: "Played",
  COMPLETED: "Completed",
  WISHLIST: "Wishlist",
};

export function GameCard({ game, platforms, currentPlatform }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const primaryPlatform = currentPlatform ?? platforms?.[0];
  const status = primaryPlatform?.status ?? "TO_PLAY";

  return (
    <Card
      className="group h-full overflow-hidden rounded-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
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

        <div className="absolute left-2 top-2">
          <Badge
            variant="secondary"
            className={cn("text-xs font-medium", statusColors[status])}
          >
            {statusLabels[status]}
          </Badge>
        </div>

        {platforms && platforms.length > 1 && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="text-xs">
              +{platforms.length - 1}
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 transition-opacity duration-300 group-hover:bg-slate-900/50 group-hover:opacity-100" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Caption
            variant="default"
            className="line-clamp-2 text-center text-sm font-medium leading-tight text-white"
            title={game.title}
          >
            {game.title}
          </Caption>
          <Link href={getGameUrl(game.id)}>
            <Button variant="secondary" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer only visible on non-hover for cleaner look */}
    </Card>
  );
}
