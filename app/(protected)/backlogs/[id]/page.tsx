import { getUserList } from "@/app/(protected)/backlogs/actions/get-user-list";
import { List } from "@/app/(protected)/library/components/library/page/list";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { IMAGE_API, IMAGE_SIZES, NEXT_IMAGE_SIZES } from "@/lib/config/site";
import { isURL } from "@/lib/utils";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function Page(props: { params: { id: string } }) {
  const games = await getUserList({ name: props.params.id });
  if (!games) {
    notFound();
  }

  return (
    <div className="container">
      <header className="mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-xl" href="/backlogs">
                Backlogs
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xl">
                {props.params.id.replace("%20", " ")}&apos;&nbsp;Backlog
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <List viewMode="grid">
        {games.map((game) => {
          const imageUrl = isURL(game.imageUrl)
            ? game.imageUrl
            : `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${game.imageUrl}.png`;
          return (
            <div className="flex flex-col" key={game.id}>
              <Image
                alt={`${game.title}`}
                className="h-auto w-[150px] rounded-md md:w-[180px] xl:w-[300px] 2xl:w-[400px]"
                height={NEXT_IMAGE_SIZES["c-big"].height}
                priority
                src={imageUrl}
                width={NEXT_IMAGE_SIZES["c-big"].width}
              />
              <p className="h-auto w-[150px] whitespace-break-spaces text-pretty rounded-md text-center font-medium md:w-[180px] xl:w-[300px] 2xl:w-[400px]">
                {game.title}
              </p>
            </div>
          );
        })}
      </List>
    </div>
  );
}
