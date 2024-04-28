import Image from "next/image";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import { isURL } from "@/lib/utils";

import { getUserList } from "@/app/(protected)/backlogs/actions/get-user-list";
import { List } from "@/app/(protected)/library/components/library/page/list";

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
              <BreadcrumbLink href="/backlogs" className="text-xl">
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
            : `${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${game.imageUrl}.png`;
          return (
            <div key={game.id} className="flex flex-col">
              <Image
                width={264}
                height={374}
                src={imageUrl}
                alt={`${game.title}`}
                className="h-auto w-[150px] rounded-md md:w-[180px] xl:w-[300px] 2xl:w-[400px]"
                priority
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
