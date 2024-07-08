import { getGame } from "@/src/entities/game";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/shared/config/image.config";
import {
  AcquisitionStatusMapper,
  BacklogStatusMapper,
  cn,
  normalizeString,
  platformToBackgroundColor,
} from "@/src/shared/lib";
import { GenericPageProps } from "@/src/shared/types";
import { Button } from "@/src/shared/ui";
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
import { LibraryEntries } from "@/src/widgets/library-entries";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function GamePage(props: GenericPageProps) {
  const gameResponse = await getGame(props.params.id);

  console.log({ gameResponse, id: props.params.id });

  if (!gameResponse?.game) {
    return notFound();
  }

  const { game, userId } = gameResponse;

  return (
    <>
      <Header />
      <div>
        <Breadcrumb className="container mx-auto my-2 px-4 md:px-6 lg:px-8">
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
        <section className="container mx-auto mt-4 flex flex-col items-stretch justify-between gap-4 border-b px-4 pb-3 md:flex-row md:items-end md:px-6 lg:px-8">
          <div className="flex-shrink-0 self-start">
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
              alt={`${game.title} cover art`}
              width={NEXT_IMAGE_SIZES["c-big"].width}
              height={NEXT_IMAGE_SIZES["c-big"].height}
              className="rounded-md border"
            />
            <Button disabled className="my-2 w-full">
              Edit backlog status
            </Button>
          </div>
          <div>
            <h1 className="ml-3 text-3xl font-bold">{game.title}</h1>
            <p className="mx-3 text-pretty leading-7 [&:not(:first-child)]:mt-6">
              {game.description}
            </p>
          </div>
          <div>
            <GameStats
              existingReviews={game.Review}
              gameId={game.id}
              igdbId={game.igdbId}
            />
          </div>
        </section>
        <section className="container mx-auto px-4 md:px-6 lg:px-8">
          <LibraryEntries
            backlogItems={game.backlogItems.filter(
              (backlogItem) => backlogItem.userId === userId
            )}
          />
          <div className="my-2">
            <h2>Community entries</h2>
            <p>
              {
                game.backlogItems.filter(
                  (backlogItem) => backlogItem.userId !== userId
                ).length
              }{" "}
              times among all users
            </p>
          </div>
          <div>
            <h2>Beating times</h2>
            <ul>
              <li>Main Story: {game.mainStory} h.</li>
              <li>Main Story + Extra: {game.mainExtra} h.</li>
              <li>Completionist: {game.completionist} h.</li>
            </ul>
          </div>
          <div>
            <IgdbInfo igdbId={game.igdbId} gameName={game.title} />
          </div>
        </section>
      </div>
    </>
  );
}
