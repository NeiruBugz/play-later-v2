import { getUsersBacklog } from "@/src/entities/backlog-item";
import { getUserInfo } from "@/src/entities/user";
import { IMAGE_API, IMAGE_SIZES } from "@/src/shared/config/image.config";
import { BacklogStatusMapper } from "@/src/shared/lib";
import { Header } from "@/src/widgets/header";
import Image from "next/image";

export default async function UsersBacklogPage(props: {
  params: Record<string, string>;
  searchParams: URLSearchParams;
}) {
  const userGamesList = await getUsersBacklog({
    backlogId: props.params.backlogId,
  });
  const user = await getUserInfo(props.params.backlogId);

  return (
    <>
      <Header />
      <div className="container">
        <h1 className="font-bold md:text-xl xl:text-2xl">
          {user?.username ?? user?.name}&apos;s Backlog
        </h1>
        <ul className="mt-2 flex flex-wrap gap-2">
          {userGamesList.map((backlogItem) => (
            <li
              key={backlogItem.id}
              className="group relative flex max-w-[160px] flex-col items-center gap-1.5 rounded border bg-background shadow"
            >
              <Image
                src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${backlogItem.game.coverImage}.png`}
                alt={`${backlogItem.game.title} cover art`}
                width={160}
                height={160}
                className="object-cover"
              />
              <div className="absolute hidden h-full w-40 flex-col items-center justify-center gap-2 rounded bg-slate-400/95 group-hover:flex">
                <span className="text-center text-sm font-medium text-white">
                  {backlogItem.game.title}
                </span>
                <span className="text-center text-sm font-medium text-foreground text-white">
                  {BacklogStatusMapper[backlogItem.status]} |{" "}
                  {backlogItem.platform}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
