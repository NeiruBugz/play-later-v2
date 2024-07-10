import { getGame } from "@/src/entities/game";
import { EditBacklogItemDialog } from "@/src/features/edit-backlog-item/ui/edit-backlog-item-dialog";
import igdbApi from "@/src/shared/api/igdb";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/shared/config/image.config";
import { cn } from "@/src/shared/lib";
import { platformToColorBadge } from "@/src/shared/lib/platform-to-color";
import { GenericPageProps } from "@/src/shared/types";
import { Badge } from "@/src/shared/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/shared/ui/breadcrumb";
import { GameStats } from "@/src/widgets/game-stats";
import { Header } from "@/src/widgets/header";
import { IgdbInfo } from "@/src/widgets/igdb-info";
import { CalendarIcon, ClockIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GamePage(props: GenericPageProps) {
  const gameResponse = await getGame(props.params.id);

  if (!gameResponse?.game) {
    return notFound();
  }

  const igdbData = await igdbApi.getGameById(gameResponse.game.igdbId);

  const { game, userId } = gameResponse;

  const uniquePlatforms =
    igdbData?.release_dates && igdbData?.release_dates.length
      ? igdbData?.release_dates.filter(
          (record, index, self) =>
            index ===
            self.findIndex((r) => r.platform.name === record.platform.name)
        )
      : [];

  return (
    <>
      <Header />
      <Breadcrumb className="container my-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Collection</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{game.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="container w-full pb-4">
        <div className="flex flex-col gap-4 border-b pb-4 md:flex-row">
          <div className="w-full h-full max-w-[264px]">
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
              alt={`${game.title} cover art`}
              width={NEXT_IMAGE_SIZES["c-big"].width}
              height={NEXT_IMAGE_SIZES["c-big"].height}
              className="self-center rounded-md border md:self-start flex-shrink-0"
            />
            <EditBacklogItemDialog gameId={game.id} igdbId={game.igdbId} gameTitle={game.title} />
          </div>
          <div>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
              {game.title}
            </h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <div>
                <p className="my-2 flex items-center">
                  <CalendarIcon className="mr-2 size-4 text-slate-500" />
                  <span className="font-medium">Released:&nbsp;</span>
                  {igdbData?.release_dates[0].human}
                </p>
                <p className="flex items-center">
                  <ClockIcon className="mr-2 size-4 text-slate-500" />
                  <span className="font-medium">
                    Average beating time:&nbsp;
                  </span>
                  {game.mainStory}h.
                </p>
              </div>
              <GameStats
                existingReviews={game.Review}
                gameId={game.id}
                igdbId={game.igdbId}
              />
            </div>
            <p className="my-2 leading-7 [&:not(:first-child)]:mt-6">
              {game.description}
            </p>
            <div className="mt-4 flex gap-2">
              <p className="w-24 font-medium">Genres: </p>
              <div className="flex flex-wrap gap-2">
                {igdbData?.genres.map((genre) => (
                  <Badge variant="outline" key={genre.id}>
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <p className="w-24 text-nowrap font-medium">Released on: </p>
              <div className="flex flex-wrap gap-2">
                {uniquePlatforms.map((date) => (
                  <Badge
                    key={date.id}
                    variant="outline"
                    className={cn(
                      "border bg-transparent text-primary shadow-none hover:bg-transparent hover:shadow-none",
                      platformToColorBadge(date.platform.name)
                    )}
                  >
                    {date.platform.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Suspense>
          <IgdbInfo gameName={game.title} igdbId={game.igdbId} />
        </Suspense>
      </section>
    </>
  );
}
