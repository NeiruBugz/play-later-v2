import { LibraryItemStatus } from "@prisma/client";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";

import { createGameAction } from "@/features/add-game";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/tailwind-merge";

type AddGameFromExternalPageProps = {
  igdbId: number;
  isWishlistDisabled: boolean;
};

export function AddToWishlistFromExternalPage({
  igdbId,
  isWishlistDisabled,
}: AddGameFromExternalPageProps) {
  return (
    <form
      className="w-full"
      action={async () => {
        "use server";
        const result = await createGameAction({
          igdbId,
          libraryItemStatus: LibraryItemStatus.WISHLIST,
        });

        if (result.data) {
          redirect(`/game/${result.data.gameId}`);
        }
      }}
    >
      <Button
        variant="outline"
        className="flex w-full items-center gap-2"
        disabled={isWishlistDisabled}
      >
        <Heart
          className={cn("h-4 w-4", {
            "fill-foreground": isWishlistDisabled,
          })}
        />
        <span>Add to Wishlist</span>
      </Button>
    </form>
  );
}
