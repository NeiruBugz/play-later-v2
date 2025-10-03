import { type LibraryItem } from "@prisma/client";
import Link from "next/link";

import { CompleteActionButton } from "@/features/manage-library-item/edit-library-item/components/complete-action-button";
import { MoveToBacklogActionButton } from "@/features/manage-library-item/edit-library-item/components/move-to-backlog-action-button";
import { StartPlayingActionButton } from "@/features/manage-library-item/edit-library-item/components/start-playing-action-button";
import { IgdbImage } from "@/shared/components/igdb-image";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    igdbId: number;
  };
  libraryItems?: Array<Omit<LibraryItem, "game">>;
  isFromSharedWishlist?: boolean;
  hasActions?: boolean;
  isExternalGame?: boolean;
  isUpcomingGame?: boolean;
};

function SharedWishlistCard({ game }: Pick<GameCardProps, "game">) {
  return (
    <div className="group relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded shadow-lg hover:border hover:shadow-xl">
      <div className="absolute top-0 z-10 hidden h-[208px] w-full grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
        <p className="text-center text-[16px] font-bold text-white">
          {game.title}
        </p>
      </div>
      <IgdbImage
        width={156}
        height={220}
        className="object-cover"
        gameTitle={game.title}
        coverImageId={game.coverImage}
        igdbSrcSize={"hd"}
        igdbImageSize={"hd"}
      />
    </div>
  );
}

export function LibraryItemCard({
  game,
  libraryItems,
  isFromSharedWishlist,
  isExternalGame = false,
  isUpcomingGame = false,
}: GameCardProps) {
  if (isUpcomingGame) {
    return (
      <Link
        href={isExternalGame ? `/game/external/${game.id}` : `/game/${game.id}`}
        className="group relative block"
      >
        <div
          key={game.id}
          className="relative aspect-[4/5] w-fit overflow-hidden rounded-lg"
        >
          <IgdbImage
            gameTitle={game.title}
            coverImageId={game.coverImage}
            igdbSrcSize={"hd"}
            igdbImageSize={"hd"}
            width={200}
            height={300}
            className="object-cover transition-transform group-hover:scale-105"
          />

          <div className="absolute inset-0 to-transparent" />
        </div>
      </Link>
    );
  }
  if (isFromSharedWishlist) return <SharedWishlistCard game={game} />;

  return (
    <Link
      href={isExternalGame ? `/game/external/${game.id}` : `/game/${game.id}`}
      className="group relative block"
    >
      <div
        key={game.id}
        className="relative aspect-[4/5] w-fit overflow-hidden rounded-lg"
      >
        <IgdbImage
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"hd"}
          width={200}
          height={300}
          className="object-cover transition-transform group-hover:scale-105"
        />

        <div className="absolute inset-0 to-transparent" />

        <div
          className={cn(
            "absolute right-2 hidden gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex",
            {}
          )}
          style={{ top: "10px" }}
        >
          <TooltipProvider>
            <StartPlayingActionButton game={game} libraryItems={libraryItems} />
            <CompleteActionButton libraryItems={libraryItems} />
            <MoveToBacklogActionButton
              game={game}
              libraryItems={libraryItems}
            />
          </TooltipProvider>
        </div>
      </div>
    </Link>
  );
}
