"use client";

import { type BacklogItem, type Game } from "@prisma/client";
import Link from "next/link";

import { getGameUrl } from "../lib";
import { IgdbImage } from "./igdb-image";
import { Card } from "./ui/card";

type GameCardProps = {
  game: Game;
  backlogItem?: BacklogItem;
};

const statusStyles: Record<string, { dot: string; label: string }> = {
  PLAYING: { dot: "bg-green-500", label: "Playing" },
  COMPLETED: { dot: "bg-blue-500", label: "Completed" },
  TO_PLAY: { dot: "bg-yellow-500", label: "Backlog" },
  DROPPED: { dot: "bg-red-500", label: "Dropped" },
  WISHLIST: { dot: "bg-purple-500", label: "Wishlist" },
};

export function GameCard({ game, backlogItem }: GameCardProps) {
  const status = backlogItem?.status ?? "TO_PLAY";
  const style = statusStyles[status] || statusStyles.TO_PLAY;

  return (
    <Link href={getGameUrl(game.id)} className="group block">
      <Card className="relative aspect-[3/4] overflow-hidden rounded-md transition-all duration-200 ease-in-out group-hover:scale-105 group-hover:shadow-lg">
        <IgdbImage
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"c-big"}
          fill
          className="object-cover"
        />

        {/* Hover Content */}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          {/* Top-right actions placeholder */}
          <div className="p-2 text-right">{/* Future icon button here */}</div>

          {/* Bottom information */}
          <div className="p-3 text-white">
            <h3 className="truncate text-base font-semibold" title={game.title}>
              {game.title}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block size-2 rounded-full ${style.dot}`}
              />
              <span className="text-xs text-white/80">{style.label}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
