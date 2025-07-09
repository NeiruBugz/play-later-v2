import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { getUsersBacklog } from "@/features/view-backlogs/server-actions/get-users-backlog";
import { Header } from "@/shared/components/header";
import { IgdbImage } from "@/shared/components/igdb-image";
import { BacklogStatusMapper, normalizeString } from "@/shared/lib";

export default async function UsersBacklogPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<URLSearchParams>;
}) {
  const awaitedParams = await props.params;
  const [{ data: userGamesList }, session] = await Promise.all([
    await getUsersBacklog({
      username: awaitedParams.username,
    }),
    auth(),
  ]);

  if (!session?.user) {
    redirect("/");
  }

  return (
    <>
      <Header authorized={session !== null} />
      <div className="container pt-[60px]">
        <h1 className="font-bold md:text-xl xl:text-2xl">
          {awaitedParams.username}&apos;s Backlog
        </h1>
        <ul className="mt-2 flex flex-wrap justify-evenly gap-2">
          {userGamesList?.map((backlogItem) => (
            <li
              key={backlogItem.id}
              className="group relative flex max-w-[160px] flex-col items-center gap-1.5 rounded border bg-background shadow"
            >
              <IgdbImage
                width={160}
                height={160}
                className="object-cover"
                gameTitle={backlogItem.game.title}
                coverImageId={backlogItem.game.coverImage}
                igdbSrcSize={"hd"}
                igdbImageSize={"hd"}
              />
              <div className="absolute hidden h-full w-40 flex-col items-center justify-center gap-2 rounded group-hover:flex">
                <span className="text-center text-sm font-medium text-white">
                  {backlogItem.game.title}
                </span>
                <span className="text-center text-sm font-medium text-foreground text-white">
                  {BacklogStatusMapper[backlogItem.status]} |{" "}
                  {normalizeString(backlogItem.platform)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
