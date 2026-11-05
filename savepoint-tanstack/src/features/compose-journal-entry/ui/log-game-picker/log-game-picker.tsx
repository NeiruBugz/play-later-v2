import { useState } from "react";

import { getStatusLabel } from "@/entities/library-item/model";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Input } from "@/shared/ui/input";

import type { LogGamePickerProps } from "./log-game-picker.type";

export function LogGamePicker({ games, onSelect }: LogGamePickerProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visibleGames = needle
    ? games.filter((game) => game.title.toLowerCase().includes(needle))
    : games;

  return (
    <div className="flex flex-col gap-1">
      <Input
        type="search"
        aria-label="Search your library"
        placeholder="Search your library"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul
        data-testid="log-game-list"
        className="flex max-h-[min(40dvh,18rem)] flex-col gap-1 overflow-y-auto"
      >
        {visibleGames.map((game) => {
          const coverUrl = game.coverImage
            ? buildCoverImageUrl(game.coverImage, "t_cover_small")
            : null;
          return (
            <li key={game.gameId}>
              <button
                type="button"
                className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors"
                onClick={() => onSelect(game)}
              >
                <span className="bg-muted size-8 shrink-0 overflow-hidden rounded-sm">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{game.title}</span>
                <span className="text-muted-foreground text-xs">
                  {getStatusLabel(game.status)}
                </span>
              </button>
            </li>
          );
        })}
        {visibleGames.length === 0 ? (
          <li className="text-muted-foreground px-2 py-3 text-sm">
            No games match.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
