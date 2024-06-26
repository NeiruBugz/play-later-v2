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
  platformToBackgroundColor,
} from "@/src/shared/lib";
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
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function GamePage(props: GenericPageProps) {
  const game = await getGame(props.params.id);

  if (!game) {
    return notFound();
  }

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
        <section className="container mx-auto flex flex-col items-center gap-4 border-b px-4 pb-3 md:flex-row md:items-end md:px-6 lg:px-8">
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.coverImage}.png`}
            alt={`${game.title} cover art`}
            width={NEXT_IMAGE_SIZES["c-big"].width}
            height={NEXT_IMAGE_SIZES["c-big"].height}
            className="flex-shrink-0 rounded-md border"
          />
          <div>
            <h1 className="text-3xl font-bold">{game.title}</h1>
            <p className="text-pretty leading-7 [&:not(:first-child)]:mt-6">
              {game.description}
            </p>
          </div>
          <div className="self-start">
            <GameStats existingReviews={game.Review} gameId={game.id} />
          </div>
        </section>
        <section className="container mx-auto px-4 md:px-6 lg:px-8">
          <div>
            <h2>Entries</h2>
            <ul>
              {game.backlogItems.map((backlogItem) => (
                <li key={backlogItem.id}>
                  <Badge>{BacklogStatusMapper[backlogItem.status]}</Badge> –{" "}
                  <Badge
                    className={cn(
                      {},
                      `${platformToBackgroundColor(backlogItem.platform ?? "")}`
                    )}
                  >
                    {backlogItem.platform}
                  </Badge>{" "}
                  –
                  <span>
                    {AcquisitionStatusMapper[backlogItem.acquisitionType]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Backlog entries</h2>
            <p>
              {
                game.backlogItems.filter(
                  (backlogItem) => backlogItem.userId !== game.userId
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
