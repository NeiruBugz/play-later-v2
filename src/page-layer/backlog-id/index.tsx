import { List } from "@/src/components/shared/list";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/src/shared/ui/breadcrumb";
import { CustomImage } from "@/src/shared/ui/custom-image";

type UsersBacklogProps = {
  id: string;
  games: {
    id: string;
    title: string;
    imageUrl: string;
  }[];
};

export function UsersBacklog({ id, games }: UsersBacklogProps) {
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
                {id.replace("%20", " ")}&apos;&nbsp;Backlog
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
