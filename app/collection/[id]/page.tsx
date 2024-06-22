import { getGame } from "@/src/entities/game";
import { GenericPageProps } from "@/src/shared/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/src/shared/ui/breadcrumb";
import { Header } from "@/src/widgets/header";
import { notFound } from "next/navigation";
import Image from "next/image"
import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/src/shared/config/image.config";
import { AcquisitionStatusMapper, BacklogStatusMapper } from "@/src/shared/lib";
import { Badge } from "@/src/shared/ui/badge";

export default async function GamePage(props: GenericPageProps) {
  const game = await getGame(Number(props.params.id));
  if (!game) {
    return notFound();
  }

  return (
    <>
      <Header/>
      <div className="container">
        <Breadcrumb className="my-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Collection</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbLink>{game.title}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <Image
            src={`${IMAGE_API}/${IMAGE_SIZES['hd']}/${game.coverImage}.png`}
            alt={`${game.title} cover art`}
            width={NEXT_IMAGE_SIZES['c-big'].width}
            height={NEXT_IMAGE_SIZES['c-big'].height}
            className="rounded-md border"
          />
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <p className="leading-7 [&:not(:first-child)]:mt-6">{game.description}</p>
        </div>
        <div>
          <h2>Entries</h2>
          <ul>
            {game.backlogItems.map((backlogItem) => (
              <li key={backlogItem.id}>
                <span>{backlogItem.platform}</span> – <Badge>{BacklogStatusMapper[backlogItem.status]}</Badge> – <span>{AcquisitionStatusMapper[backlogItem.acquisitionType]}</span>
              </li>
            ))}</ul>
        </div>
        <div>
          <h2>Backlog entries</h2>
          <p>{game.backlogItems.filter((backlogItem) => backlogItem.userId !== game.userId).length} times among all users</p>
        </div>
      </div>
    </>
  );
}
