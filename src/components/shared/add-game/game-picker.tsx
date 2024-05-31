import { Loader2 } from "lucide-react";
import React from "react";
import { IMAGE_API, IMAGE_SIZES } from "@/src/packages/config/igdb.config";
import { useSearch } from "@/src/packages/query";
import { cn } from "@/src/shared/lib/tailwind-merge";
import type { SearchResponse } from "@/src/shared/types/igdb";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/shared/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/shared/ui/command";
import { RenderWhen } from "@/src/shared/ui/render-when";

export function GamePicker({
  onGameSelect,
  selectedGame,
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
      <CommandInput autoFocus onValueChange={(value) => void search(value)} />
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
              data-disabled="true"
              key={result.id}
              onSelect={() => onGameSelect(result)}
              value={`${result.name}_${result.id}`}
            >
              <div className="flex items-center gap-2">
                <Avatar className="rounded-md">
                  <AvatarImage
                    alt={result.name}
                    className="object-cover"
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
