import { auth } from "@/auth";
import { CustomImage } from "@/src/components/shared/custom-image";
import { List } from "@/src/components/shared/list";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { getUserList } from "@/src/queries/backlogs/get-user-list";
import { notFound, redirect } from "next/navigation";

export default async function Page(props: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
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
          return (
            <div className="flex flex-col" key={game.id}>
              <CustomImage
                alt={`${game.title}`}
                className="h-auto w-[150px] rounded-md md:w-[180px] xl:w-[300px] 2xl:w-[400px]"
                imageUrl={game.imageUrl}
                priority
                size="c-big"
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
