import { useIGDBSearch } from "@/src/features/search/api";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/shared/config/image.config";
import { cn } from "@/src/shared/lib";
import { SearchResponse } from "@/src/shared/types";
import { Button } from "@/src/shared/ui/button";
import { Input } from "@/src/shared/ui/input";
import { Label } from "@/src/shared/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

type GamePreviewItemProps = {
  game: SearchResponse;
  type: "listitem" | "block";
  repickGame?: () => void;
};

function GamePreviewItem({ game, type }: GamePreviewItemProps) {
  if (type === "listitem") {
    const firstReleaseDate = game.release_dates?.[0].human.slice(-4);
    return (
      <>
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.cover.image_id}.png`}
          width={NEXT_IMAGE_SIZES.micro.width}
          height={NEXT_IMAGE_SIZES.micro.height}
          alt={`${game.name} cover art`}
        />
        <div className="flex flex-col gap-1">
          <span className="font-medium">{game.name}</span>
          <span
            className={cn("text-slate-500", {
              hidden: firstReleaseDate === undefined,
            })}
          >
            ({firstReleaseDate})
          </span>
        </div>
      </>
    );
  }

  if (type === "block") {
    const firstReleaseDate = game.release_dates?.[0].human;
    return (
      <div className="flex gap-4">
        <Image
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.cover.image_id}.png`}
          width={NEXT_IMAGE_SIZES.micro.width}
          height={NEXT_IMAGE_SIZES.micro.height}
          alt={`${game.name} cover art`}
          className="shrink-0"
        />
        <div className="flex flex-col gap-1 text-[12px] md:text-[14px] xl:text-xl">
          <span className="font-bold">{game.name}</span>
          <span
            className={cn("text-[14px]", {
              hidden: firstReleaseDate === undefined,
            })}
          >
            Release date: {firstReleaseDate}
          </span>
        </div>
      </div>
    );
  }
}

type GamePickerProps = {
  onGameSelect: (game: SearchResponse) => void;
  clearSelection: () => void;
  selectedGame?: SearchResponse;
};

export function GamePicker({
  onGameSelect,
  selectedGame,
  clearSelection,
}: GamePickerProps) {
  const [searchValue, setSearchValue] = useState<string | undefined>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const { data, isFetching } = useIGDBSearch(searchValue);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!searchValue || searchValue?.length < 3) {
      return;
    }
  }, [searchValue]);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const {
        currentTarget: { value },
      } = event;
      queryClient.cancelQueries({ queryKey: ["search", searchValue] });
      setSearchValue(value);
    },
    [queryClient, searchValue]
  );

  const onListItemClick = useCallback(
    (game: SearchResponse) => {
      onGameSelect(game);
      setSearchValue("");
      queryClient.invalidateQueries({ queryKey: ["search", searchValue] });
    },
    [onGameSelect, queryClient, searchValue]
  );

  const isPopoverOpen = useMemo(() => {
    if (!data) {
      return false;
    }

    if (isFetching) {
      return true;
    }

    return data?.length !== 0;
  }, [isFetching, data]);

  if (selectedGame) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-md border p-2">
        <GamePreviewItem
          game={selectedGame}
          type="block"
          repickGame={clearSelection}
        />
        <Button variant="destructive" onClick={clearSelection}>
          Re-pick
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Label htmlFor="game-search">Search for a game</Label>
      <Input
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
        value={searchValue}
        placeholder="Start typing game name"
        onChange={onInputChange}
        className={cn("relative mt-1", {
          "rounded-b-none border-b-0": isPopoverOpen,
        })}
        id="game-search"
      />
      <div
        className={cn(
          "absolute top-[62px] z-10 max-h-[260px] w-full overflow-scroll rounded-md rounded-t-none border border-input border-t-transparent shadow-sm",
          {
            hidden: !isPopoverOpen,
            // "border-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring": isInputFocused
          }
        )}
      >
        {isFetching ? "Searching..." : null}
        {data?.length ? (
          <ul className="bg-background">
            {data.map((searchItem) => (
              <li
                key={searchItem.id}
                className="group flex cursor-pointer gap-2 p-2 hover:bg-slate-100"
                onClick={() => onListItemClick(searchItem)}
              >
                <GamePreviewItem type="listitem" game={searchItem} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
