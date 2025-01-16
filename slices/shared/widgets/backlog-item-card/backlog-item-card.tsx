import { CompleteActionButton } from "@/slices/shared/widgets/backlog-item-card/complete-action-button";
import { GamePlatform } from "@/slices/shared/widgets/backlog-item-card/game-platform";
import { MoveToBacklogActionButton } from "@/slices/shared/widgets/backlog-item-card/move-to-backlog-action-button";
import { StartPlayingActionButton } from "@/slices/shared/widgets/backlog-item-card/start-playing-action-button";
import { cn } from "@/src/shared/lib";
import { IgdbImage } from "@/src/shared/ui/igdb-image";
import { TooltipProvider } from "@/src/shared/ui/tooltip";
import type { BacklogItem } from "@prisma/client";
import Link from "next/link";

type GameCardProps = {
  game: {
    id: string;
    title: string;
    coverImage: string | null;
    igdbId: number;
  };
  backlogItems?: Omit<BacklogItem, "game">[];
  isFromSharedWishlist?: boolean;
  hasActions?: boolean;
  isExternalGame?: boolean;
  isUpcomingGame?: boolean;
};

const isNewCard = true;

function SharedWishlistCard({ game }: Pick<GameCardProps, "game">) {
  return (
    <div className="group relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded shadow-lg hover:border hover:shadow-xl">
      <div className="absolute top-0 z-10 hidden h-[208px] w-full flex-grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
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
  hasActions = true,
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-semibold text-white">{game.title}</h3>
            <GamePlatform backlogItems={backlogItems} />
          </div> */}
          <div
            className={cn(
              "absolute right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100",
              {}
            )}
            style={{ top: "10px" }}
          >
            <TooltipProvider>
              <StartPlayingActionButton
                game={game}
                backlogItems={backlogItems}
              />
              <CompleteActionButton game={game} backlogItems={backlogItems} />
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

  return (
    <Link href={`/game/${game.id}`}>
      <div className="group relative w-full cursor-pointer overflow-hidden rounded">
        <div className="absolute top-0 z-10 hidden h-full w-full flex-grow flex-col items-center justify-center rounded bg-slate-400 opacity-0 transition-opacity ease-in-out group-hover:flex group-hover:opacity-95">
          <p className="text-center font-medium text-white">{game.title}</p>
        </div>
        <IgdbImage
          width={120}
          height={200}
          className="object-cover"
          gameTitle={game.title}
          coverImageId={game.coverImage}
          igdbSrcSize={"hd"}
          igdbImageSize={"hd"}
        />
      </div>
    </Link>
  );
}
