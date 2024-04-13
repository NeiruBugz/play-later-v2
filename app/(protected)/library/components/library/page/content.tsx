import Image from "next/image";
import Link from "next/link";
import { Game } from "@prisma/client";
import { format } from "date-fns";
import { Calendar, Gamepad, Trash } from "lucide-react";

import { Badge, ColorVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import igdbApi from "@/lib/igdb-api";
import { FullGameInfoResponse } from "@/lib/types/igdb";
import { LibraryContentProps } from "@/lib/types/library";
import { cn, platformEnumToColor } from "@/lib/utils";

import { Card } from "@/app/(protected)/library/components/game/ui/card/card";
import { GameTimeBadge } from "@/app/(protected)/library/components/game/ui/card/time-badge";
import { List } from "@/app/(protected)/library/components/library/page/list";
import { deleteGame } from "@/app/(protected)/library/lib/actions/delete-game";
import { updateStatus } from "@/app/(protected)/library/lib/actions/update-game";

function EmptyBacklog() {
  return (
    <p className="text-lg font-bold">Congratulations! Your backlog is empty!</p>
  );
}

const QuickActions = ({
  currentStatus,
  id,
}: {
  currentStatus: string;
  id: Game["id"];
}) => {
  if (currentStatus === "BACKLOG") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "INPROGRESS");
          }}
        >
          <Button type="submit">Start playing</Button>
        </form>
        <Button variant="destructive" size="icon">
          <Trash className="size-4" />
        </Button>
      </div>
    );
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "FULL_COMPLETION");
          }}
        >
          <Button type="submit">Mastered</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await deleteGame(id);
          }}
        >
          <Button variant="destructive" size="icon">
            <Trash className="size-4" />
          </Button>
        </form>
      </div>
    );
  }

  if (currentStatus === "ABANDONED" || currentStatus === "SHELVED") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "INPROGRESS");
          }}
        >
          <Button type="submit">Start playing</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await deleteGame(id);
          }}
        >
          <Button variant="destructive" size="icon">
            <Trash className="size-4" />
          </Button>
        </form>
      </div>
    );
  }

  if (currentStatus === "INPROGRESS") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "COMPLETED");
          }}
        >
          <Button type="submit">Mark completed</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "FULL_COMPLETION");
          }}
        >
          <Button type="submit">Mastered</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "ABANDONED");
          }}
        >
          <Button type="submit">Abandon</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "SHELVED");
          }}
        >
          <Button type="submit">Return later</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await deleteGame(id);
          }}
        >
          <Button variant="destructive" size="icon">
            <Trash className="size-4" />
          </Button>
        </form>
      </div>
    );
  }
};

export const ListSkeleton = ({ viewMode }: { viewMode: string }) => (
  <List viewMode={viewMode as "list" | "grid"}>
    {Array.from({ length: 15 }, (_, index) => index + 1).map((index) =>
      viewMode === "grid" ? (
        <Skeleton className="h-[352px] w-[264px]" key={index} />
      ) : (
        <div
          key={index}
          className="flex w-full items-center justify-between gap-4"
        >
          <div className="flex gap-4">
            <Skeleton className="h-[120px] w-[90px]" />
            <div className="flex flex-col gap-1 self-center">
              <Skeleton className="h-8 w-[260px] md:w-[400px]" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-4 xl:gap-8">
            <div className="flex flex-col gap-2 self-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-40 " />
            </div>
            <div className="flex gap-2 self-center lg:flex">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      )
    )}
  </List>
);

export const ListItem = async ({
  game,
  currentStatus,
}: {
  game: Game;
  currentStatus: string;
}) => {
  let info: FullGameInfoResponse | null = null;
  const gameInfo = await igdbApi.getGameById(game.igdbId);
  if (gameInfo?.length) {
    info = gameInfo[0];
  }

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link href={`/library/${game.id}`}>
        <div className="flex gap-4">
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.imageUrl}.png`}
            alt={`${game.title} thumbnail`}
            width={90}
            height={90}
            className="rounded-md"
            priority
          />
          <div className="self-center justify-self-start md:min-w-[260px] lg:min-w-[400px] xl:min-w-[600px]">
            <h2 className="whitespace-pre-wrap text-2xl font-bold tracking-tight">
              {game.title}
            </h2>
            <div className="mt-1 flex flex-wrap gap-2">
              {info?.genres.map((genre) => (
                <Badge key={genre.id} className="max-h-fit rounded-full">
                  {genre.name}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Badge
                variant={
                  game.platform
                    ? (platformEnumToColor(game.platform) as ColorVariant)
                    : "default"
                }
                className="rounded-full"
              >
                <Gamepad className="mr-1 size-3 " />
                {game.platform}
              </Badge>
              <GameTimeBadge time={game.gameplayTime} />
            </div>
          </div>
        </div>
      </Link>
      <div className="flex gap-4 xl:gap-8">
        <div className="hidden self-center lg:block">
          <p className="mb-2 flex items-center gap-1 whitespace-nowrap text-xs leading-none text-foreground text-slate-600">
            <Calendar className="mr-1 size-4" />
            Added on&nbsp;
            {game.createdAt ? format(game.createdAt, "dd MMM, yyyy") : "-"}
          </p>
          <p className="flex items-center gap-1 whitespace-nowrap text-xs leading-none text-foreground text-slate-600">
            <Calendar className="mr-1 size-4" />
            Last update&nbsp;
            {game.updatedAt ? format(game.updatedAt, "dd MMM, yyyy") : "-"}
          </p>
        </div>
        <QuickActions currentStatus={currentStatus} id={game.id} />
      </div>
    </div>
  );
};

function BacklogList({
  count,
  backlogTime,
}: {
  count: number;
  backlogTime: number;
}) {
  if (count === 0) {
    return <EmptyBacklog />;
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">
        Total backlog time is {backlogTime} hours and includes {count} game(s)
      </p>
    </div>
  );
}

export async function LibraryContent({
  currentStatus,
  backloggedLength,
  totalBacklogTime,
  list,
  viewMode = "list",
}: LibraryContentProps & { viewMode?: string }) {
  return (
    <>
      {currentStatus === "BACKLOG" ? (
        <BacklogList count={backloggedLength} backlogTime={totalBacklogTime} />
      ) : null}
      <ScrollArea>
        <List viewMode={viewMode as "list" | "grid"}>
          {list.map((game) => {
            return viewMode === "list" ? (
              <ListItem
                game={game}
                key={game.id}
                currentStatus={currentStatus}
              />
            ) : (
              <Card game={game} key={game.id} />
            );
          })}
        </List>
      </ScrollArea>
    </>
  );
}
