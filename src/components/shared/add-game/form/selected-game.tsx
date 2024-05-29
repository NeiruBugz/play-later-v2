import type { SearchResponse } from "@/src/packages/types/igdb";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { IMAGE_API, IMAGE_SIZES } from "@/src/packages/config/igdb.config";
import { cn } from "@/src/packages/utils";
import React from "react";

export const SelectedGame = ({
  selectedGame,
}: {
  selectedGame: SearchResponse | undefined;
}) => {
  return selectedGame ? (
    <div className={cn("rounded-md border px-2 py-1 shadow-sm")}>
      <div className="flex items-center gap-2 font-medium">
        <Avatar className="rounded-md">
          <AvatarImage
            alt={selectedGame.name}
            className="object-center"
            src={`${IMAGE_API}/${IMAGE_SIZES["thumb"]}/${selectedGame.cover.image_id}.png`}
          />
          <AvatarFallback>{selectedGame.name}</AvatarFallback>
        </Avatar>
        {selectedGame.name}
      </div>
    </div>
  ) : (
    <></>
  );
};
