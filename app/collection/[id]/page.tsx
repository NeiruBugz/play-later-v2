import { getGame } from "@/src/entities/game";
import { GenericPageProps } from "@/src/shared/types";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/src/shared/ui/breadcrumb";
import { Header } from "@/src/widgets/header";
import { notFound } from "next/navigation";
import Image from "next/image"
import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/src/shared/config/image.config";

export default async function GamePage(props: GenericPageProps) {
  const game = await getGame(Number(props.params.id));
  if (!game) {
    return notFound();
  }

  return (
    <>
      <Header />
      <div className="container">
        <Breadcrumb className="my-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Collection</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
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
          <p>{game.description}</p>
        </div>
      </div>
    </>
  );
}
