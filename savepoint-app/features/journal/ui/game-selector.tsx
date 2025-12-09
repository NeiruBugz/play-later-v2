"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { LibraryItemWithGameDomain } from "@/shared/types";

interface GameSelectorProps {
  onGameSelect: (gameId: string) => void;
  onCancel?: () => void;
}

async function fetchUserLibraryGames(): Promise<LibraryItemWithGameDomain[]> {
  const response = await fetch("/api/library?distinctByGame=true");
  if (!response.ok) {
    throw new Error("Failed to fetch library games");
  }
  const json = await response.json();
  if ("error" in json) {
    throw new Error(json.error);
  }
  return json.data;
}

export function GameSelector({ onGameSelect, onCancel }: GameSelectorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: libraryItems, isLoading } = useQuery({
    queryKey: ["library-games-for-journal"],
    queryFn: fetchUserLibraryGames,
  });

  // Get unique games from library items
  const uniqueGames = libraryItems
    ? Array.from(
        new Map(libraryItems.map((item) => [item.game.id, item.game])).values()
      )
    : [];

  const filteredGames = uniqueGames.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGameSelect = (gameId: string) => {
    onGameSelect(gameId);
  };

  if (isLoading) {
    return (
      <div className="space-y-xl">
        <div className="space-y-md">
          <Label>Select a Game</Label>
          <p className="text-muted-foreground text-sm">
            Loading your library games...
          </p>
        </div>
      </div>
    );
  }

  if (!uniqueGames || uniqueGames.length === 0) {
    return (
      <div className="space-y-xl">
        <div className="space-y-md">
          <h2 className="heading-md">Select a Game</h2>
          <p className="text-muted-foreground text-sm">
            You don't have any games in your library yet. Add games to your
            library first.
          </p>
        </div>
        <div className="gap-md flex items-center justify-end">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={() => router.push("/library")}>
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="space-y-md">
        <Label htmlFor="game-search">Select a Game</Label>
        <Input
          id="game-search"
          type="search"
          placeholder="Search your library games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredGames.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No games found matching "{searchQuery}"
        </p>
      ) : (
        <div className="space-y-md">
          <ul className="space-y-sm">
            {filteredGames.map((game) => (
              <li key={game.id}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGameSelect(game.id)}
                >
                  <div className="gap-md flex items-center">
                    {game.coverImage && (
                      <Image
                        src={game.coverImage}
                        alt={game.title}
                        width={32}
                        height={48}
                        className="h-12 w-8 rounded object-cover"
                      />
                    )}
                    <span className="text-left">{game.title}</span>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onCancel && (
        <div className="flex items-center justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
