import { EditBacklogItemDialog } from "@/src/features/edit-backlog-item/ui/edit-backlog-item-dialog";
import { EditBacklogItemDrawer } from "@/src/features/edit-backlog-item/ui/edit-backlog-item-drawer";
import { GameStats, getGame, IgdbInfo, Reviews } from "@/src/page-slices/game";
import igdbApi from "@/src/shared/api/igdb";
import { cn, getUniquePlatforms } from "@/src/shared/lib";
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
import { IgdbImage } from "@/src/shared/ui/igdb-image";
import { Header } from "@/src/widgets/header";
import { CalendarIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GamePage(props: GenericPageProps) {
  const gameResponse = await getGame((await props.params).id);

  if (!gameResponse?.game) {
    return notFound();
  }

  const igdbData = await igdbApi.getGameById(gameResponse.game.igdbId);

  const { game } = gameResponse;

  const uniquePlatforms = getUniquePlatforms(igdbData?.release_dates);

  return (
    <>
      <Header />
      <div className="pt-[60px]">
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
            <div className="h-full w-full max-w-[264px] flex-shrink-0 self-center md:self-start">
              <IgdbImage
                className="flex-shrink-0 self-center rounded-md border md:self-start"
                gameTitle={game.title}
                coverImageId={game.coverImage}
                igdbSrcSize={"hd"}
                igdbImageSize={"c-big"}
              />
              <EditBacklogItemDialog
                gameId={game.id}
                igdbId={game.igdbId}
                gameTitle={game.title}
              />
              <EditBacklogItemDrawer
                gameId={game.id}
                igdbId={game.igdbId}
                gameTitle={game.title}
              />
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
                </div>
                <Suspense>
                  <GameStats
                    existingReviews={game.Review}
                    gameId={game.id}
                    igdbId={game.igdbId}
                  />
                </Suspense>
              </div>
              <p className="my-2 leading-7 [&:not(:first-child)]:mt-6">
                {game.description}
              </p>
              <div className="mt-4 flex gap-2">
                <p className="w-24 flex-shrink-0 font-medium">Genres: </p>
                <div className="flex flex-wrap gap-2">
                  {igdbData?.genres.map((genre) => (
                    <Badge variant="outline" key={genre.id}>
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <p className="w-24 flex-shrink-0 text-nowrap font-medium">
                  Released on:{" "}
                </p>
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
          <Reviews gameId={game.id} gameTitle={game.title} />
          <IgdbInfo gameName={game.title} igdbId={game.igdbId} />
        </section>
      </div>
    </>
  );
}
