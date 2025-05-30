"use client";

import { BacklogItem, Game } from "@prisma/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BacklogStatusMapper, normalizeString } from "../lib";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { IgdbImage } from "./igdb-image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface GameCardProps {
  game: Game;
  platforms?: BacklogItem[];
  displayMode: "combined" | "separate";
  currentPlatform?: BacklogItem;
}

export function GameCard({
  game,
  platforms,
  displayMode,
  currentPlatform,
}: GameCardProps) {
  const params = useSearchParams();
  const cardViewMode = params.get("cardMode") || "combined";
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const platformsToShow =
    cardViewMode === "combined"
      ? platforms
      : currentPlatform
        ? [currentPlatform]
        : [];
  const primaryPlatform = currentPlatform || platforms?.[0];

  const getStatusColor = (status: string) => {
    return (
      {
        TO_PLAY: "bg-yellow-500",
        PLAYING: "bg-green-500",
        PLAYED: "bg-blue-500",
        COMPLETED: "bg-purple-500",
      }[status] || "bg-gray-500"
    );
  };
  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3
                  className="line-clamp-1 cursor-help font-semibold"
                  title={game.title}
                >
                  {game.title}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p>{game.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* <GameMenu game={game} displayMode={displayMode} currentPlatform={currentPlatform} /> */}
        </div>
      </CardHeader>

      <CardFooter className="p-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/game/${game.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
