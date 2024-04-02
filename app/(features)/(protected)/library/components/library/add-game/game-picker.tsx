"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RenderWhen } from "@/components/render-when";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import { useSearch } from "@/lib/query";
import { SearchResponse } from "@/lib/types/igdb";
import { cn } from "@/lib/utils";

export function GamePicker({
  selectedGame,
  onGameSelect,
  width,
}: {
  onGameSelect: (game: SearchResponse) => void;
  selectedGame?: number;
  width?: number;
}) {
  const { data, isPending, mutateAsync: search, reset } = useSearch();

  React.useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <Command className="w-full" style={{ width: width }}>
      <CommandInput onValueChange={(value) => void search(value)} autoFocus />
      <CommandList>
        <RenderWhen condition={isPending}>
          <CommandEmpty className="flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </CommandEmpty>
        </RenderWhen>
        <RenderWhen condition={Boolean(data) && data?.length !== 0}>
          {data?.map((result) => (
            <CommandItem
              className={cn(
                "!pointer-events-auto cursor-pointer !opacity-100 last-of-type:rounded-sm",
                {
                  "font-bold": selectedGame === result.id,
                }
              )}
              key={result.id}
              value={`${result.name}_${result.id}`}
              onSelect={() => onGameSelect(result)}
              data-disabled="true"
            >
              <div className="flex items-center gap-2">
                <Avatar className="rounded-md">
                  <AvatarImage
                    className="object-cover"
                    alt={result.name}
                    src={`${IMAGE_API}/${IMAGE_SIZES["micro"]}/${result.cover.image_id}.png`}
                  />
                  <AvatarFallback>{result.name}</AvatarFallback>
                </Avatar>
                {result.name}&nbsp;
                {isNaN(new Date(result.first_release_date * 1000).getFullYear())
                  ? ""
                  : `(${new Date(result.first_release_date * 1000).getFullYear()})`}
              </div>
            </CommandItem>
          ))}
        </RenderWhen>
      </CommandList>
    </Command>
  );
}
