import { type BacklogItem } from "@prisma/client";
import Link from "next/link";

import { CompleteActionButton } from "@/features/manage-backlog-item/edit-backlog-item/components/complete-action-button";
import { MoveToBacklogActionButton } from "@/features/manage-backlog-item/edit-backlog-item/components/move-to-backlog-action-button";
import { StartPlayingActionButton } from "@/features/manage-backlog-item/edit-backlog-item/components/start-playing-action-button";
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
  backlogItems?: Array<Omit<BacklogItem, "game">>;
  isFromSharedWishlist?: boolean;
  hasActions?: boolean;
  isExternalGame?: boolean;
  isUpcomingGame?: boolean;
};

const isNewCard = true;

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

export function BacklogItemCard({
  game,
  backlogItems,
  isFromSharedWishlist,
  isExternalGame = false,
  isUpcomingGame = false,
}: GameCardProps) {
  console.log({ game });
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

  if (isNewCard) {
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
              <StartPlayingActionButton
                game={game}
                backlogItems={backlogItems}
              />
              <CompleteActionButton backlogItems={backlogItems} />
              <MoveToBacklogActionButton
                game={game}
                backlogItems={backlogItems}
              />
            </TooltipProvider>
          </div>
        </div>
      </Link>
    );
  }

  return null;
}
